import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UsersRound,
  ChevronDown,
  UserPlus,
  Send,
  Bookmark,
  Check,
  Loader2,
  Layers,
  Calendar,
  BarChart2,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { createPost, fetchFeedPage } from "../api/network";
import { fetchMyProfile } from "../api/profiles";
import {
  fetchConnections,
  sendConnectionRequest,
  fetchSuggestedDevelopers,
} from "../api/connections";
import { fetchGroups, fetchMyClubs } from "../api/groups";
import { useAuth } from "../auth/AuthContext";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";
import { FeedItem } from "../features/network/FeedItem";



export function NetworkPage() {
  const { user } = useAuth();
  const meId = user?.id ? String(user.id) : "";
  const me = useQuery({
    queryKey: ["my-profile-photo", meId],
    queryFn: fetchMyProfile,
    enabled: Boolean(user),
  });

  const [params] = useSearchParams();
  const filter = params.get("filter") ?? "all";
  const [feedFilterTab, setFeedFilterTab] = useState<"for-you" | "following" | "latest" | "projects">("for-you");
  const [feedFilterOpen, setFeedFilterOpen] = useState(false);
  const feedFilterRef = useRef<HTMLDivElement>(null);

  const feedFilterLabels: Record<"for-you" | "following" | "latest" | "projects", string> = {
    "for-you": "For You",
    following: "Following",
    latest: "Latest",
    projects: "Projects",
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (feedFilterRef.current && !feedFilterRef.current.contains(event.target as Node)) {
        setFeedFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const debouncedSearch = params.get("q") ?? "";

  const client = useQueryClient();
  const feedQuery = useInfiniteQuery({
    queryKey: [...queryKeys.feed, "list", filter, debouncedSearch],
    queryFn: ({ pageParam }) => fetchFeedPage(filter, debouncedSearch, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextPage,
  });

  const feed = (feedQuery.data?.pages.flatMap((p) => p.items) ?? []).filter((item) => !item.isDemo);
  const loading = feedQuery.isPending;
  const moreRef = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feedQuery;

  useEffect(() => {
    const el = moreRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Quick composer state
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<string>("spark");
  const [posting, setPosting] = useState(false);

  // Connection requests state (optimistic pending)
  const [requestedUsers, setRequestedUsers] = useState<Record<string, boolean>>({});

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const connectionsQuery = useQuery({
    queryKey: [...queryKeys.connections, "network-sidebar"],
    queryFn: fetchConnections,
    enabled: Boolean(user),
  });

  const suggestionsQuery = useQuery({
    queryKey: [...queryKeys.connections, "suggested", "network"],
    queryFn: () => fetchSuggestedDevelopers(8),
    enabled: Boolean(user),
  });

  const clubsQuery = useQuery({
    queryKey: ["groups", "network-sidebar"],
    queryFn: async () => {
      const mine = await fetchMyClubs().catch(() => []);
      if (mine.length > 0) return mine.slice(0, 5);
      return (await fetchGroups()).slice(0, 5);
    },
    enabled: Boolean(user),
  });
  const sidebarClubs = clubsQuery.data ?? [];

  const connectedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of connectionsQuery.data?.accepted ?? []) {
      if (c.partner?.id) ids.add(String(c.partner.id));
    }
    return ids;
  }, [connectionsQuery.data?.accepted]);

  const pendingOutgoingIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of connectionsQuery.data?.pendingOutgoing ?? []) {
      if (c.partner?.id) ids.add(String(c.partner.id));
    }
    return ids;
  }, [connectionsQuery.data?.pendingOutgoing]);

  const suggestedPeople = useMemo(() => {
    const rows = suggestionsQuery.data ?? [];
    return rows.filter((u) => {
      const id = String(u.id);
      if (!id || id === meId) return false;
      // Never suggest people you are already connected with.
      if (connectedIds.has(id)) return false;
      return true;
    }).slice(0, 5);
  }, [suggestionsQuery.data, connectedIds, meId]);

  useEffect(() => {
    const refreshConnections = () => {
      void client.invalidateQueries({ queryKey: queryKeys.connections });
    };
    const handleDemoFeed = () => void client.invalidateQueries({ queryKey: queryKeys.feed });
    window.addEventListener("devzgo:feed-updated", handleDemoFeed);
    window.addEventListener("devzgo:connections-updated", refreshConnections);
    return () => {
      window.removeEventListener("devzgo:feed-updated", handleDemoFeed);
      window.removeEventListener("devzgo:connections-updated", refreshConnections);
    };
  }, [client]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postContent.trim() || posting) return;
    setPosting(true);
    try {
      await createPost({
        content: postContent.trim(),
        activity_type: postType,
      });
      setPostContent("");
      showToast("Post shared with the community!");
      await client.invalidateQueries({ queryKey: queryKeys.feed });
    } catch (err) {
      showToast(getApiErrorMessage(err));
    } finally {
      setPosting(false);
    }
  }

  async function handleSendConnect(targetUserId: string) {
    if (!targetUserId || targetUserId === meId) return;
    if (connectedIds.has(targetUserId)) return;
    setRequestedUsers((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await sendConnectionRequest(targetUserId);
      showToast("Connection request sent");
      await client.invalidateQueries({ queryKey: queryKeys.connections });
    } catch {
      setRequestedUsers((prev) => {
        const next = { ...prev };
        delete next[targetUserId];
        return next;
      });
      showToast("Failed to send request");
    }
  }

  function profileHref(person: { id: string; username?: string | null }) {
    if (person.username?.trim()) return `/profile/${person.username.trim()}`;
    return `/profile/${person.id}`;
  }

  const userDisplayName: string =
    me.data?.fullName ||
    (typeof user?.fullName === "string" ? user.fullName : "") ||
    (typeof user?.full_name === "string" ? user.full_name : "") ||
    user?.username ||
    "Developer";
  const userDisplayRole: string =
    me.data?.headline ||
    (typeof user?.headline === "string" ? user.headline : "") ||
    "Developer";
  const userAvatarUrl: string =
    me.data?.avatarUrl ||
    (typeof user?.avatar_url === "string" ? user.avatar_url : "") ||
    "";

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#2D120D] font-sans antialiased">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[#DECDBA] bg-[#2D120D] px-5 py-2.5 font-sans text-sm font-semibold text-[#FFF8CA] shadow-xl sm:left-auto sm:right-6 sm:max-w-sm">
          <Check className="w-4 h-4 text-[#CDE3E8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main data-tour="network-places" className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* ========================================================================= */}
        {/* THREE-COLUMN RESPONSIVE LAYOUT (Picture format)                           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] xl:grid-cols-[290px_1fr_340px] gap-6 items-start">
          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* COLUMN 1 (LEFT): User Card, YOUR NETWORK, COMMUNITIES & CLUBS           */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <aside className="space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-none">
            {/* Card 1: User Profile Card with Sunset Cover */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white overflow-hidden shadow-xs">
              <div className="h-28 w-full relative overflow-hidden bg-[#2D120D]">
                <img
                  src="/brand/profile_cover.jpg"
                  alt=""
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="px-5 pb-5 pt-0 relative">
                <div className="-mt-10 mb-3 flex items-end justify-between">
                  <Link to="/profile" className="shrink-0 group block" aria-label="Your profile">
                    {userAvatarUrl ? (
                      <img
                        src={userAvatarUrl}
                        alt={userDisplayName}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm group-hover:scale-105 transition-transform bg-white"
                      />
                    ) : (
                      <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#FAF3E8] font-serif text-2xl font-bold text-[#780D18] shadow-sm group-hover:scale-105 transition-transform">
                        {userDisplayName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </Link>
                </div>

                <Link
                  to="/profile"
                  className="font-serif font-bold text-xl text-[#2D120D] hover:text-[#780D18] transition block leading-tight"
                >
                  {userDisplayName}
                </Link>
                <p className="text-xs text-[#6E5952] font-medium mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono text-[#780D18]">&lt;/&gt;</span>
                  <span>{userDisplayRole}</span>
                </p>

                <Link
                  to="/profile"
                  className="mt-4 w-full py-2 px-4 rounded-full border border-[#DECDBA] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-[#2D120D] transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>View Profile</span>
                  <span aria-hidden>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Card 2: My Space */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <h3 className="font-serif font-bold text-lg text-[#2D120D] mb-4">
                My Space
              </h3>

              <div className="space-y-3.5">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 text-xs sm:text-sm font-medium text-[#2D120D] hover:text-[#780D18] transition group"
                >
                  <Layers className="w-4 h-4 text-[#780D18]" />
                  <span>My Projects</span>
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-3 text-xs sm:text-sm font-medium text-[#2D120D] hover:text-[#780D18] transition group"
                >
                  <Bookmark className="w-4 h-4 text-[#780D18]" />
                  <span>Saved</span>
                </Link>

                <Link
                  to="/network/groups"
                  className="flex items-center gap-3 text-xs sm:text-sm font-medium text-[#2D120D] hover:text-[#780D18] transition group"
                >
                  <UsersRound className="w-4 h-4 text-[#780D18]" />
                  <span>My Communities</span>
                </Link>

                <Link
                  to="/network"
                  className="flex items-center gap-3 text-xs sm:text-sm font-medium text-[#2D120D] hover:text-[#780D18] transition group"
                >
                  <Calendar className="w-4 h-4 text-[#780D18]" />
                  <span>Events</span>
                </Link>
              </div>
            </div>

          </aside>

          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* COLUMN 2 (CENTER): Share Composer, Community Feed & Posts               */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Post Composer Card */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <Link to="/profile" className="shrink-0" aria-label="Your profile">
                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt={userDisplayName}
                      className="h-10 w-10 rounded-full object-cover border border-[#DECDBA]"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DECDBA] bg-[#FAF3E8] text-xs font-bold text-[#780D18]">
                      {userDisplayName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </Link>
                <input
                  type="text"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share a thought, project update, or ask the community..."
                  className="w-full rounded-2xl bg-[#FAF7F2] border border-[#DECDBA] px-4 py-2.5 text-xs sm:text-sm text-[#2D120D] placeholder-[#6E5952]/60 focus:outline-none focus:border-[#780D18] focus:ring-1 focus:ring-[#780D18] transition"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleCreatePost(e);
                    }
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DECDBA]/40">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setPostType("project")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      postType === "project"
                        ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#780D18]"
                        : "text-[#6E5952] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#780D18]" />
                    <span>Project</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostType("media")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      postType === "media"
                        ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#780D18]"
                        : "text-[#6E5952] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#780D18]" />
                    <span>Media</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostType("poll")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      postType === "poll"
                        ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#780D18]"
                        : "text-[#6E5952] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-[#780D18]" />
                    <span>Poll</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostType("event")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      postType === "event"
                        ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#780D18]"
                        : "text-[#6E5952] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#780D18]" />
                    <span>Event</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!postContent.trim() || posting}
                  onClick={handleCreatePost}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#780D18] hover:bg-[#5C0A12] text-white font-sans text-xs font-semibold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {posting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </div>

            {/* Feed Filter Dropdown (aligned right, Community Feed text removed as per design) */}
            <div className="flex justify-end pt-1">
              <div className="relative" ref={feedFilterRef}>
                <button
                  type="button"
                  onClick={() => setFeedFilterOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FAF3E8] border border-[#DECDBA] text-[#2D120D] hover:bg-white transition shadow-2xs cursor-pointer"
                  aria-expanded={feedFilterOpen}
                >
                  <span>{feedFilterLabels[feedFilterTab]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#6E5952] transition-transform duration-200 ${feedFilterOpen ? "rotate-180" : ""}`} />
                </button>

                {feedFilterOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white border border-[#DECDBA] shadow-md py-1.5 z-20 font-sans">
                    {(["for-you", "following", "latest", "projects"] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setFeedFilterTab(key);
                          setFeedFilterOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition text-left cursor-pointer ${
                          feedFilterTab === key
                            ? "bg-[#FAF7F2] text-[#780D18] font-bold"
                            : "text-[#3E2217] hover:bg-[#FAF7F2]"
                        }`}
                      >
                        <span>{feedFilterLabels[key]}</span>
                        {feedFilterTab === key && <Check className="w-3.5 h-3.5 text-[#780D18]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Community Feed from API */}
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-dashed border-[#DECDBA]">
                <Loader2 className="w-6 h-6 text-[#780D18] animate-spin" />
                <p className="text-xs text-[#6E5952]">Gathering community posts…</p>
              </div>
            ) : feed.length > 0 ? (
              <div className="space-y-6">
                {feed.map((activity, idx) => (
                  <FeedItem key={activity.id} activity={activity} index={idx} notify={showToast} />
                ))}
                <div ref={moreRef} />
                {hasNextPage && (
                  <button
                    type="button"
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                    className="w-full rounded-full border border-[#DECDBA] bg-white py-2.5 font-sans text-xs font-semibold text-[#2D120D] hover:bg-[#FAF7F2] transition"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more updates"}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#DECDBA] bg-white px-6 py-12 text-center">
                <p className="font-serif text-lg font-bold text-[#2D120D]">No posts yet</p>
                <p className="mt-1 text-sm text-[#6E5952]">Share an update above to get the feed started.</p>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* COLUMN 3 (RIGHT): Suggested Connections, Communities     */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <aside className="space-y-6">
            {/* Card 2: Suggested Connections */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#2D120D]">
                  Suggested Connections
                </h3>
                <Link
                  to="/network/connections?tab=suggestions"
                  className="text-xs font-semibold text-[#780D18] hover:underline"
                >
                  See All
                </Link>
              </div>

              <div className="space-y-3.5">
                {suggestionsQuery.isLoading ? (
                  <p className="text-xs text-[#6E5952]">Finding people…</p>
                ) : suggestedPeople.length === 0 ? (
                  <p className="text-xs text-[#6E5952]">
                    No new suggestions right now. Check back after more people join.
                  </p>
                ) : (
                  suggestedPeople.map((creator) => {
                    const id = String(creator.id);
                    const isConnected = connectedIds.has(id);
                    const isRequested = Boolean(requestedUsers[id]) || pendingOutgoingIds.has(id);
                    const href = profileHref(creator);
                    return (
                      <div key={id} className="flex items-center justify-between gap-3">
                        <Link to={href} className="flex min-w-0 flex-1 items-center gap-2.5 group">
                          {creator.avatarUrl ? (
                            <img
                              src={creator.avatarUrl}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-full object-cover border border-[#DECDBA]"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DECDBA] bg-[#FAF3E8] text-xs font-bold text-[#780D18]">
                              {(creator.fullName || creator.username || "?").slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-[#2D120D] group-hover:text-[#780D18] sm:text-sm">
                              {creator.fullName || creator.username}
                            </p>
                            <p className="truncate text-[11px] text-[#6E5952]">
                              {creator.headline || `@${creator.username}`}
                            </p>
                          </div>
                        </Link>

                        {isConnected ? (
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700"
                            title="Connected"
                            aria-label="Connected"
                          >
                            <Check className="h-4 w-4" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isRequested}
                            onClick={() => void handleSendConnect(id)}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#DECDBA] transition ${
                              isRequested
                                ? "cursor-default bg-stone-100 text-[#780D18]"
                                : "cursor-pointer bg-white text-[#2D120D] shadow-2xs hover:bg-[#FAF7F2] hover:text-[#780D18]"
                            }`}
                            title={isRequested ? "Request sent" : "Connect"}
                            aria-label={isRequested ? "Request sent" : "Connect"}
                          >
                            {isRequested ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Card 3: Communities & Clubs */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#2D120D]">
                  Communities &amp; Clubs
                </h3>
                <Link
                  to="/network/groups"
                  className="text-xs font-semibold text-[#780D18] hover:underline"
                >
                  See All
                </Link>
              </div>

              <div className="space-y-3">
                {clubsQuery.isLoading ? (
                  <p className="text-xs text-[#6E5952]">Loading clubs…</p>
                ) : sidebarClubs.length === 0 ? (
                  <p className="text-xs text-[#6E5952]">
                    No clubs yet.{" "}
                    <Link to="/network/groups" className="font-semibold text-[#780D18] hover:underline">
                      Browse communities
                    </Link>
                  </p>
                ) : (
                  sidebarClubs.map((club) => {
                    const href = `/network/groups/${club.slug || club.id}`;
                    const initial = (club.name || "?").slice(0, 1).toUpperCase();
                    return (
                      <Link
                        key={club.id}
                        to={href}
                        className="flex items-center justify-between p-2 rounded-2xl hover:bg-[#FAF7F2] transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {club.avatarUrl ? (
                            <img
                              src={club.avatarUrl}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-xl object-cover border border-[#DECDBA]"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#780D18] text-sm font-bold text-white shadow-2xs">
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-[#2D120D] group-hover:text-[#780D18] truncate">
                              {club.name}
                            </p>
                            <p className="text-[11px] text-[#6E5952]">
                              {club.memberCount ?? 0} member{(club.memberCount ?? 0) === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-full border border-[#DECDBA] flex items-center justify-center text-[#2D120D] group-hover:bg-[#FAF7F2] group-hover:border-[#780D18] group-hover:text-[#780D18] transition shrink-0">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
