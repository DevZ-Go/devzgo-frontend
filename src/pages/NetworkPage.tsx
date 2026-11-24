import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  UsersRound,
  ChevronDown,
  UserPlus,
  Send,
  Heart,
  MessageSquare,
  Repeat,
  Bookmark,
  MoreHorizontal,
  ExternalLink,
  Check,
  Loader2,
  Cpu,
  Globe,
  Layers,
  Calendar,
  BarChart2,
  BarChart3,
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
import { useAuth } from "../auth/AuthContext";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";
import { FeedItem } from "../features/network/FeedItem";



/** TaskFlow v2 Mini Dashboard UI Mockup */
function TaskFlowMockup() {
  return (
    <div className="w-full sm:w-44 h-28 rounded-xl bg-gradient-to-br from-[#FFFDF9] to-[#F5ECE1] border border-[#DECDBA] p-2 flex flex-col justify-between shrink-0 shadow-inner overflow-hidden">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#DECDBA]/60">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E27A7A]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8C56A]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#82C785]" />
        </div>
        <span className="text-[8px] font-mono font-semibold text-[#8C7B70]">taskflow.app</span>
      </div>
      <div className="flex gap-2 flex-1 pt-1.5">
        <div className="flex-1 bg-white/90 rounded-lg p-1.5 border border-[#DECDBA]/50 flex flex-col gap-1">
          <div className="h-1.5 w-8 bg-[#8C7B70]/40 rounded-full" />
          <div className="h-4 bg-[#FFF8CA] rounded border border-[#E5D7C6] p-0.5">
            <div className="h-1 w-10 bg-[#780D18]/50 rounded-full" />
          </div>
          <div className="h-4 bg-white rounded border border-[#DECDBA] p-0.5">
            <div className="h-1 w-7 bg-[#8C7B70]/30 rounded-full" />
          </div>
        </div>
        <div className="flex-1 bg-white/90 rounded-lg p-1.5 border border-[#DECDBA]/50 flex flex-col gap-1">
          <div className="h-1.5 w-10 bg-[#284E45]/40 rounded-full" />
          <div className="h-5 bg-[#E2F0CB] rounded border border-[#CDE3E8] p-0.5">
            <div className="h-1 w-8 bg-[#284E45]/60 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Stack of Isometric Books Mockup */
function RagBooksMockup() {
  return (
    <div className="w-full sm:w-44 h-28 rounded-xl bg-gradient-to-br from-[#FFFDF9] to-[#F5ECE1] border border-[#DECDBA] flex items-center justify-center shrink-0 shadow-inner overflow-hidden p-2">
      <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-20 drop-shadow-sm">
        {/* Bottom Book (Coffee/Burgundy) */}
        <g>
          <path d="M22 68 L78 78 L104 62 L48 52 Z" fill="#FBF5E8" stroke="#D4C3B3" strokeWidth="0.8" />
          <path d="M20 62 L76 72 L76 77 L20 67 Z" fill="#5C1820" />
          <path d="M20 62 L46 48 L102 58 L76 72 Z" fill="#780D18" />
        </g>
        {/* Middle Book (Sage/Olive Green) */}
        <g>
          <path d="M26 50 L80 60 L102 46 L48 36 Z" fill="#FAF5E6" stroke="#D4C3B3" strokeWidth="0.8" />
          <path d="M24 45 L78 55 L78 59 L24 49 Z" fill="#1C3831" />
          <path d="M24 45 L46 32 L100 42 L78 55 Z" fill="#284E45" />
        </g>
        {/* Top Book (Ochre/Gold) */}
        <g>
          <path d="M30 34 L82 43 L98 31 L46 22 Z" fill="#FFFDF5" stroke="#DECDBA" strokeWidth="0.8" />
          <path d="M28 29 L80 38 L80 42 L28 33 Z" fill="#8C5C1B" />
          <path d="M28 29 L44 18 L96 27 L80 38 Z" fill="#C98B28" />
        </g>
        <path d="M80 38 Q86 48 88 56 L91 52 L94 56 Q88 44 82 39" fill="#780D18" />
      </svg>
    </div>
  );
}

export function NetworkPage() {
  const { user } = useAuth();
  const me = useQuery({
    queryKey: ["my-profile-photo", user?.id ?? ""],
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

  // Connection requests state
  const [requestedUsers, setRequestedUsers] = useState<Record<string, boolean>>({});

  // Interactive like / bookmark states for demo showcase posts
  const [chanLiked, setChanLiked] = useState(false);
  const [chanLikesCount, setChanLikesCount] = useState(94);
  const [chanBookmarked, setChanBookmarked] = useState(false);

  const [arjunLiked, setArjunLiked] = useState(false);
  const [arjunLikesCount, setArjunLikesCount] = useState(128);
  const [arjunBookmarked, setArjunBookmarked] = useState(false);

  const [miraLiked, setMiraLiked] = useState(false);
  const [miraLikesCount, setMiraLikesCount] = useState(86);
  const [miraBookmarked, setMiraBookmarked] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSidebar = useCallback(async () => {
    try {
      await Promise.all([
        fetchConnections(),
        fetchSuggestedDevelopers(),
      ]);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    void loadSidebar();
    const handleUpdate = () => void loadSidebar();
    const handleDemoFeed = () => void client.invalidateQueries({ queryKey: queryKeys.feed });
    window.addEventListener("devzgo:feed-updated", handleDemoFeed);
    window.addEventListener("devzgo:connections-updated", handleUpdate);
    return () => {
      window.removeEventListener("devzgo:feed-updated", handleDemoFeed);
      window.removeEventListener("devzgo:connections-updated", handleUpdate);
    };
  }, [loadSidebar, client]);

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

  const meId = user?.id ? String(user.id) : "";

  async function handleSendConnect(targetUserId: string) {
    if (!targetUserId || targetUserId === meId) return;
    setRequestedUsers((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await sendConnectionRequest(targetUserId);
      showToast("Connection request sent");
      await loadSidebar();
    } catch {
      setRequestedUsers((prev) => ({ ...prev, [targetUserId]: false }));
      showToast("Failed to send request");
    }
  }

  // Current logged in user info (or default to Janasi Rajput as shown in the design)
  const userDisplayName: string =
    me.data?.fullName ||
    (typeof user?.fullName === "string" ? user.fullName : "") ||
    (typeof user?.full_name === "string" ? user.full_name : "") ||
    "Janasi Rajput";
  const userDisplayRole: string =
    me.data?.headline ||
    (typeof user?.headline === "string" ? user.headline : "") ||
    "Frontend Developer";
  const userAvatarUrl: string =
    me.data?.avatarUrl ||
    (typeof user?.avatar_url === "string" ? user.avatar_url : "") ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces";

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

      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
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
                  <Link to="/profile" className="shrink-0 group block">
                    <img
                      src={userAvatarUrl}
                      alt={userDisplayName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm group-hover:scale-105 transition-transform bg-white"
                    />
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

            {/* Card 3: Build Streak 🔥 */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#2D120D] flex items-center gap-1.5">
                  <span>Build Streak</span>
                  <span>🔥</span>
                </h3>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-serif text-3xl font-bold text-[#2D120D]">12</span>
                  <span className="text-xs font-semibold text-[#6E5952]">days</span>
                </div>
              </div>

              <div className="w-20 h-14 relative flex items-center justify-center shrink-0">
                <svg viewBox="0 0 88 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect x="2" y="46" width="84" height="6" rx="2" fill="#8C5C1B" opacity="0.8" />
                  <rect x="0" y="44" width="88" height="4" rx="1.5" fill="#C98B28" />
                  <rect x="12" y="10" width="40" height="30" rx="3" fill="#2D120D" stroke="#780D18" strokeWidth="1.5" />
                  <rect x="15" y="13" width="34" height="22" rx="1.5" fill="#1A2D23" />
                  <path d="M19 20 L23 24 L19 28" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="26" y1="28" x2="33" y2="28" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="28" y="40" width="8" height="4" fill="#2D120D" />
                  <path d="M22 44 L42 44" stroke="#2D120D" strokeWidth="2" strokeLinecap="round" />
                  <g transform="translate(56, 18)">
                    <ellipse cx="14" cy="18" rx="11" ry="8" fill="#FACC15" />
                    <ellipse cx="12" cy="18" rx="8" ry="6" fill="#EAB308" />
                    <circle cx="8" cy="10" r="7" fill="#FACC15" />
                    <circle cx="6.5" cy="8.5" r="1.3" fill="#1C1917" />
                    <circle cx="6" cy="8" r="0.4" fill="#FFFFFF" />
                    <path d="M1 9 Q-2 11 1 13 L5 12 Z" fill="#F97316" />
                    <path d="M14 16 Q19 14 20 18 Q16 22 13 18 Z" fill="#F59E0B" />
                  </g>
                </svg>
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
                <img
                  src={userAvatarUrl}
                  alt={userDisplayName}
                  className="w-10 h-10 rounded-full object-cover border border-[#DECDBA] shrink-0"
                />
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

            {/* Post: Chan Li (Featured Module Post) */}
            <article className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/team/chan.jpg"
                    alt="Chan Li"
                    className="w-10 h-10 rounded-full object-cover border border-[#DECDBA]"
                  />
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm text-[#2D120D]">Chan Li</span>
                    </div>
                    <p className="text-xs text-[#6E5952] flex items-center gap-1">
                      <span>2h ago &middot; Software Developer</span>
                      <span aria-hidden>&middot;</span>
                      <Globe className="w-3 h-3 text-[#6E5952]" />
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="text-[#6E5952] hover:text-[#2D120D] p-1.5 rounded-full hover:bg-[#FAF7F2] transition"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#2D120D] leading-relaxed mb-3">
                Just shipped the Network &amp; Messages module for DevZ-Go! 💻 Added real-time messaging and project collaboration—would love feedback from the community.
              </p>

              <div className="rounded-2xl overflow-hidden border border-[#DECDBA] mb-3.5 bg-[#2D120D]">
                <img
                  src="/brand/chan_workspace.jpg"
                  alt="Workstations showing DevZ-Go"
                  className="w-full h-auto object-cover max-h-72"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#DECDBA]/40 text-xs text-[#6E5952]">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setChanLiked((l) => !l);
                      setChanLikesCount((c) => (chanLiked ? c - 1 : c + 1));
                    }}
                    className={`flex items-center gap-1.5 transition cursor-pointer ${
                      chanLiked ? "text-[#780D18] font-bold" : "hover:text-[#780D18]"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${chanLiked ? "fill-[#780D18]" : ""}`} />
                    <span>{chanLikesCount}</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 hover:text-[#780D18] transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>32</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 hover:text-[#780D18] transition cursor-pointer"
                  >
                    <Repeat className="w-4 h-4" />
                    <span>18</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setChanBookmarked((b) => !b)}
                  className={`hover:text-[#780D18] transition cursor-pointer ${
                    chanBookmarked ? "text-[#780D18]" : ""
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${chanBookmarked ? "fill-[#780D18]" : ""}`} />
                </button>
              </div>
            </article>

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

            {/* Post 1: Arjun Mehra (TaskFlow v2) */}
            <article className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces"
                    alt="Arjun Mehra"
                    className="w-10 h-10 rounded-full object-cover border border-[#DECDBA]"
                  />
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm text-[#2D120D]">Arjun Mehra</span>
                      <span className="text-xs text-[#6E5952]">@arjun</span>
                    </div>
                    <p className="text-xs text-[#6E5952]">Full Stack Developer · 4h ago</p>
                  </div>
                </div>
                <button type="button" className="text-[#6E5952] hover:text-[#2D120D] p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#2D120D] leading-relaxed mb-3.5">
                Just shipped v2 of my task manager! 🎉 Added team workspaces and real-time sync. Would love your feedback on the new flow.
              </p>

              {/* Embedded Project Card */}
              <div className="rounded-2xl border border-[#DECDBA] bg-[#FAF7F2] p-3 sm:p-3.5 flex flex-col sm:flex-row gap-4 items-center mb-4">
                <TaskFlowMockup />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm text-[#2D120D]">TaskFlow v2</h4>
                    <ExternalLink className="w-3.5 h-3.5 text-[#6E5952]" />
                  </div>
                  <p className="text-xs text-[#6E5952] leading-relaxed mb-2.5">
                    A simple, collaborative task manager for small teams.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      React
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      Node.js
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      Socket.IO
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#DECDBA]/40 text-xs text-[#6E5952]">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setArjunLiked(!arjunLiked);
                      setArjunLikesCount((c) => (arjunLiked ? c - 1 : c + 1));
                    }}
                    className={`inline-flex items-center gap-1.5 transition ${
                      arjunLiked ? "text-[#780D18] font-semibold" : "hover:text-[#780D18]"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${arjunLiked ? "fill-[#780D18]" : ""}`} />
                    <span>{arjunLikesCount}</span>
                  </button>
                  <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#2D120D] transition">
                    <MessageSquare className="w-4 h-4" />
                    <span>24</span>
                  </button>
                  <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#2D120D] transition">
                    <Repeat className="w-4 h-4" />
                    <span>12</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setArjunBookmarked(!arjunBookmarked)}
                  className={`p-1 transition ${arjunBookmarked ? "text-[#780D18]" : "hover:text-[#2D120D]"}`}
                >
                  <Bookmark className={`w-4 h-4 ${arjunBookmarked ? "fill-[#780D18]" : ""}`} />
                </button>
              </div>
            </article>

            {/* Post 2: Mira Joshi (Building a Local RAG Pipeline) */}
            <article className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&h=256&fit=crop&crop=faces"
                    alt="Mira Joshi"
                    className="w-10 h-10 rounded-full object-cover border border-[#DECDBA]"
                  />
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm text-[#2D120D]">Mira Joshi</span>
                      <span className="text-xs text-[#6E5952]">@mira</span>
                    </div>
                    <p className="text-xs text-[#6E5952]">ML Engineer · 1d ago</p>
                  </div>
                </div>
                <button type="button" className="text-[#6E5952] hover:text-[#2D120D] p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#2D120D] leading-relaxed mb-3.5">
                Wrote a beginner-friendly guide on setting up a local RAG pipeline. Hope it helps anyone exploring LLMs! 📚
              </p>

              {/* Embedded Resource Card */}
              <div className="rounded-2xl border border-[#DECDBA] bg-[#FAF7F2] p-3 sm:p-3.5 flex flex-col sm:flex-row gap-4 items-center mb-4">
                <RagBooksMockup />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm text-[#2D120D]">Building a Local RAG Pipeline</h4>
                    <ExternalLink className="w-3.5 h-3.5 text-[#6E5952]" />
                  </div>
                  <p className="text-xs text-[#6E5952] leading-relaxed mb-2.5">
                    A step-by-step guide with code and resources.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      Python
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      LLM
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      RAG
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#DECDBA]/40 text-xs text-[#6E5952]">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMiraLiked(!miraLiked);
                      setMiraLikesCount((c) => (miraLiked ? c - 1 : c + 1));
                    }}
                    className={`inline-flex items-center gap-1.5 transition ${
                      miraLiked ? "text-[#780D18] font-semibold" : "hover:text-[#780D18]"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${miraLiked ? "fill-[#780D18]" : ""}`} />
                    <span>{miraLikesCount}</span>
                  </button>
                  <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#2D120D] transition">
                    <MessageSquare className="w-4 h-4" />
                    <span>18</span>
                  </button>
                  <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#2D120D] transition">
                    <Repeat className="w-4 h-4" />
                    <span>9</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMiraBookmarked(!miraBookmarked)}
                  className={`p-1 transition ${miraBookmarked ? "text-[#780D18]" : "hover:text-[#2D120D]"}`}
                >
                  <Bookmark className={`w-4 h-4 ${miraBookmarked ? "fill-[#780D18]" : ""}`} />
                </button>
              </div>
            </article>

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
            ) : null}
          </div>

          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* COLUMN 3 (RIGHT): Your Progress, Suggested Connections, Communities     */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <aside className="space-y-6">
            {/* Card 1: Your Progress */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#2D120D] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#780D18]" />
                  <span>Your Progress</span>
                </h3>
                <span className="text-xs text-[#6E5952]">This month</span>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-2.5 rounded-full bg-[#FAF3E8] border border-[#DECDBA] overflow-hidden">
                  <div className="h-full w-3/5 rounded-full bg-[#780D18]" />
                </div>
                <span className="text-xs font-bold text-[#2D120D] shrink-0">3 / 5 builds</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF3E8] border border-[#DECDBA] text-[11px] font-semibold text-[#780D18] shadow-2xs">
                <span>Keep Building!</span>
                <span>✨</span>
              </div>
            </div>

            {/* Card 2: Suggested Connections */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#2D120D]">
                  Suggested Connections
                </h3>
                <Link
                  to="/explore/developers"
                  className="text-xs font-semibold text-[#780D18] hover:underline"
                >
                  See All
                </Link>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    id: "sugg-1",
                    name: "Manasi Rajput",
                    role: "Full-Stack Developer",
                    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces",
                  },
                  {
                    id: "sugg-2",
                    name: "Khushbu Patel",
                    role: "Frontend Developer",
                    avatarUrl: "/team/khushbu.jpeg",
                  },
                  {
                    id: "sugg-3",
                    name: "Janasi Reddy",
                    role: "DevOps Enthusiast",
                    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
                  },
                ].map((creator) => {
                  const isRequested = requestedUsers[creator.id];
                  return (
                    <div key={creator.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={creator.avatarUrl}
                          alt={creator.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#DECDBA] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-[#2D120D] truncate">
                            {creator.name}
                          </p>
                          <p className="text-[11px] text-[#6E5952] truncate">
                            {creator.role}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isRequested}
                        onClick={() => handleSendConnect(creator.id)}
                        className={`w-8 h-8 rounded-xl border border-[#DECDBA] flex items-center justify-center transition cursor-pointer shrink-0 ${
                          isRequested
                            ? "bg-stone-100 text-stone-400 cursor-default"
                            : "bg-white hover:bg-[#FAF7F2] text-[#2D120D] hover:text-[#780D18] shadow-2xs"
                        }`}
                        title={isRequested ? "Request sent" : "Connect"}
                      >
                        {isRequested ? (
                          <Check className="w-4 h-4 text-[#780D18]" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
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
                {[
                  {
                    name: "Sheridan Developers",
                    members: "1.2K members",
                    link: "/network/groups",
                    bg: "bg-[#780D18]",
                    icon: Cpu,
                  },
                  {
                    name: "Women in Tech",
                    members: "3.4K members",
                    link: "/network/groups",
                    bg: "bg-[#2D120D]",
                    icon: Globe,
                  },
                  {
                    name: "Hackathon Hub",
                    members: "2.1K members",
                    link: "/network/groups",
                    bg: "bg-[#8C5C1B]",
                    icon: Boxes,
                  },
                ].map((club) => {
                  const Icon = club.icon;
                  return (
                    <Link
                      key={club.name}
                      to={club.link}
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-[#FAF7F2] transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${club.bg} text-white flex items-center justify-center shrink-0 shadow-2xs`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-[#2D120D] group-hover:text-[#780D18] truncate">
                            {club.name}
                          </p>
                          <p className="text-[11px] text-[#6E5952]">{club.members}</p>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full border border-[#DECDBA] flex items-center justify-center text-[#2D120D] group-hover:bg-[#FAF7F2] group-hover:border-[#780D18] group-hover:text-[#780D18] transition shrink-0">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
