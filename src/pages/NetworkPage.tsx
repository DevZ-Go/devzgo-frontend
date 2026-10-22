import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Search, Users, Send, Loader2, Check, UserPlus, Compass, LayoutGrid } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { NetworkPlaces } from "../components/network/NetworkPlaces";
import { createPost, fetchFeedPage } from "../api/network";
import {
  fetchConnections,
  acceptConnection,
  declineConnection,
  sendConnectionRequest,
  fetchSuggestedDevelopers,
} from "../api/connections";
import type { Connection, ConnectionUserSummary } from "../types/network";
import { useAuth } from "../auth/AuthContext";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";
import { FeedItem } from "../features/network/FeedItem";
import { HangingCardsHeader } from "../components/network/HangingCardsHeader";
import { ConstellationGraph } from "../components/network/ConstellationGraph";
import { CuteFlower, CurlyDoodleBanner } from "../components/network/DoodleDecorations";

export function NetworkPage() {
  const { user } = useAuth();

  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") ?? "all";
  const [searchQuery, setSearchQuery] = useState(params.get("q") ?? "");
  const debouncedSearch = params.get("q") ?? "";
  const [viewMode, setViewMode] = useState<"feed" | "constellation">("feed");

  useEffect(() => {
    const t = setTimeout(() => setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (searchQuery.trim()) next.set("q", searchQuery.trim());
      else next.delete("q");
      return next;
    }, { replace: true }), 300);
    return () => clearTimeout(t);
  }, [searchQuery, setParams]);

  function setFilter(id: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id === "all") next.delete("filter");
      else next.set("filter", id);
      return next;
    });
  }

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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
    }, { rootMargin: "400px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Quick post state
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<string>("post");
  const [posting, setPosting] = useState(false);

  // Connections sidebar state
  const [connections, setConnections] = useState<{
    accepted: Connection[];
    pendingIncoming: Connection[];
    pendingOutgoing: Connection[];
  }>({ accepted: [], pendingIncoming: [], pendingOutgoing: [] });
  const [suggested, setSuggested] = useState<ConnectionUserSummary[]>([]);
  const [requestedUsers, setRequestedUsers] = useState<Record<string, boolean>>({});

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSidebar = useCallback(async () => {
    try {
      const [connData, suggData] = await Promise.all([
        fetchConnections(),
        fetchSuggestedDevelopers(),
      ]);
      if (connData && Array.isArray(connData.accepted)) {
        setConnections(connData);
      }
      if (Array.isArray(suggData)) {
        setSuggested(suggData);
      }
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
      showToast("Posted");
      await client.invalidateQueries({ queryKey: queryKeys.feed });
    } catch (err) {
      showToast(getApiErrorMessage(err));
    } finally {
      setPosting(false);
    }
  }

  async function handleAcceptConnection(connId: string) {
    try {
      await acceptConnection(connId);
      showToast("Connection accepted");
      await loadSidebar();
    } catch {
      showToast("Failed to accept connection");
    }
  }

  async function handleDeclineConnection(connId: string) {
    try {
      await declineConnection(connId);
      showToast("Connection request declined");
      await loadSidebar();
    } catch {
      showToast("Failed to decline request");
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

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-[#1C1917] font-sans antialiased">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-white text-[#14532D] px-4 py-2.5 text-sm font-semibold font-sans shadow-xl flex items-center gap-2 border-2 border-[#15803D] animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-forest-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <NetworkPlaces current="feed" />
        {/* Whimsical Header Hero: Cursive Headings & Clean Straight Body */}
        <div className="mb-8 pt-2">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              {/* Clean Kicker */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] border border-[#15803D] font-sans text-xs font-bold uppercase tracking-wider mb-2.5 shadow-2xs">
                <CuteFlower className="w-4 h-4" />
                <span>Developer Network & Constellation</span>
              </div>

              {/* Main Title: Whimsical Cursive Accent ONLY */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] tracking-tight leading-tight">
                Developer{" "}
                <span className="font-cursive text-5xl sm:text-6xl lg:text-7xl text-crimson-600 font-bold ml-1">
                  Network
                </span>
              </h1>
              <p className="font-sans text-sm sm:text-base text-stone-600 mt-1 max-w-xl leading-relaxed">
                Posts, projects, and people from the live network.
              </p>
            </div>

            {/* View Mode Toggle & Search Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="inline-flex p-1 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("feed")}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg font-sans text-xs sm:text-sm font-semibold transition ${
                    viewMode === "feed"
                      ? "bg-[#DCFCE7] text-[#14532D] border border-[#15803D] shadow-xs"
                      : "text-stone-600 hover:text-black hover:bg-stone-50"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 text-[#15803D]" />
                  Scrapbook Feed
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("constellation")}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg font-sans text-xs sm:text-sm font-semibold transition ${
                    viewMode === "constellation"
                      ? "bg-[#FEE2E2] text-[#991B1B] border border-[#DC2626] shadow-xs"
                      : "text-stone-600 hover:text-black hover:bg-stone-50"
                  }`}
                >
                  <Compass className="w-4 h-4 text-[#DC2626]" />
                  Constellation Web
                </button>
              </div>

              {/* Clean Straight Search Input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-forest-700" />
                <input
                  type="text"
                  placeholder="Search creators, tech, sparks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-stone-200 font-sans text-xs sm:text-sm text-[#1C1917] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-forest-600 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Hand-Drawn Curly Banner Doodle */}
          <div className="mt-4 mb-2 opacity-80">
            <CurlyDoodleBanner className="w-full text-forest-700" />
          </div>

          {/* Filter Pills with Clean Straight Typography */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { id: "all", label: "All" },
              { id: "projects", label: "Projects" },
              { id: "developers", label: "People" },
              { id: "collaboration", label: "Collaboration" },
              { id: "following", label: "Connections" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full font-sans text-xs sm:text-sm font-semibold transition ${
                  filter === tab.id
                    ? "bg-[#DCFCE7] text-[#14532D] border border-[#15803D] shadow-xs"
                    : "bg-white text-stone-600 hover:text-black hover:bg-stone-50 border border-stone-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Constellation View Mode */}
        {viewMode === "constellation" ? (
          <div>
            <ConstellationGraph
              meId={meId}
              creators={suggested.filter((person) => person.id !== meId)}
              connections={connections.accepted.filter((c) => c.partner.id !== meId)}
              activities={feed.filter((item) => item.userId !== meId)}
              onConnect={handleSendConnect}
              requestedUsers={requestedUsers}
            />
          </div>
        ) : null}

        {/* Hanging Cards Gallery at the top of the Feed */}
        {viewMode === "feed" && (
          <HangingCardsHeader
            creators={[
              ...connections.accepted.map((c) => c.partner),
              ...suggested.filter((s) => !connections.accepted.some((c) => c.partner.id === s.id)),
            ].filter((person) => person.id && person.id !== meId)}
            onSelectCreator={(username) => setSearchQuery(username)}
          />
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Main Social Feed Column */}
          <div className="space-y-6">
            {/* Quick Post Composer: Clean & Straight */}
            <div className="relative rounded-2xl border-2 border-forest-600/40 bg-white p-5 sm:p-6 shadow-xs">
              {/* Red Washi Tape Sticker */}
              <div className="washi-tape-red absolute -top-2.5 left-6 w-24 h-4 rounded-xs rotate-[-1deg] flex items-center justify-center text-[10px] text-[#1C1917] font-bold font-sans tracking-wider border border-[#1C1917]/20">
                SKETCHPAD
              </div>

              <div className="flex gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#14532D] font-sans font-bold flex items-center justify-center shrink-0 shadow-xs text-base border border-[#15803D]">
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : "ME"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-[#FAF7EE] p-3 rounded-xl border border-forest-600/20">
                    <textarea
                      rows={2}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Share a project milestone, question, or technology update..."
                      className="w-full font-sans text-sm text-[#1C1917] placeholder-stone-400 bg-transparent resize-none focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-xs text-stone-500 font-semibold mr-1">Type:</span>
                      {[
                        { id: "post", label: "Quick Spark" },
                        { id: "milestone", label: "Milestone" },
                        { id: "collab_call", label: "Collab Call" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPostType(t.id)}
                          className={`font-sans text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                            postType === t.id
                              ? "bg-[#DCFCE7] text-[#14532D] font-semibold border border-[#15803D]"
                              : "text-stone-600 hover:bg-stone-100 border border-transparent"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!postContent.trim() || posting}
                      onClick={handleCreatePost}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] border border-[#DC2626] font-sans text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                    >
                      {posting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Drop Spark
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Items List */}
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2.5 bg-white/70 rounded-2xl border-2 border-dashed border-forest-300">
                <Loader2 className="w-7 h-7 text-forest-700 animate-spin" />
                <p className="font-cursive text-2xl text-forest-800 font-bold">Gathering sparks from the garden branches…</p>
              </div>
            ) : feed.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-forest-300 bg-white/80 py-14 text-center text-stone-500">
                <Users className="w-10 h-10 mx-auto text-forest-400 mb-2" />
                <p className="font-cursive text-2xl font-bold text-[#1C1917] mb-1">No sparks found here yet</p>
                <p className="font-sans text-xs text-stone-600">
                  Be the first to share an update on the network!
                </p>
              </div>
            ) : (
              <>
                {feed.map((activity, idx) => <FeedItem key={activity.id} activity={activity} index={idx} notify={showToast} />)}
                <div ref={moreRef} />
                {feedQuery.hasNextPage && (
                  <button type="button" disabled={feedQuery.isFetchingNextPage} onClick={() => void feedQuery.fetchNextPage()}
                    className="w-full rounded-xl border border-stone-200 bg-white py-2 font-sans text-sm font-semibold text-stone-700 hover:bg-stone-50">
                    {feedQuery.isFetchingNextPage ? "Loading…" : "Load more sparks"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar: Clean Straight Proportions */}
          <aside className="space-y-6">
            {/* Your Network Stats Card */}
            <div className="rounded-2xl border-2 border-forest-600/30 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h3 className="font-cursive text-2xl font-bold text-[#1C1917]">Your Constellation</h3>
                  <p className="font-sans text-xs text-stone-500">Connections & sparks</p>
                </div>
                <span className="p-2 rounded-xl bg-[#DCFCE7] text-[#14532D] border border-[#15803D]">
                  <Users className="w-4 h-4" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <Link to="/network/connections" className="p-3 rounded-xl bg-[#F0FDF4] border border-forest-300 hover:border-forest-600 transition">
                  <p className="font-sans text-xs text-[#14532D] font-medium">Connections</p>
                  <p className="font-sans text-2xl font-extrabold text-[#14532D] mt-0.5">
                    {connections?.accepted?.length || 0}
                  </p>
                </Link>
                <Link to="/network/connections?tab=incoming" className="p-3 rounded-xl bg-[#FEF2F2] border border-crimson-300 hover:border-crimson-600 transition">
                  <p className="font-sans text-xs text-[#991B1B] font-medium">Pending</p>
                  <p className="font-sans text-2xl font-extrabold text-[#991B1B] mt-0.5">
                    {connections?.pendingIncoming?.length || 0}
                  </p>
                </Link>
              </div>

              <Link
                to="/network/connections"
                className="mb-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-[#1C1917] px-4 py-2 font-sans text-xs font-semibold transition shadow-2xs"
              >
                <Users className="w-3.5 h-3.5" />
                Manage connections
              </Link>

              <Link
                to="/messages"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#14532D] border border-[#15803D] px-4 py-2 font-sans text-xs font-semibold transition shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#14532D]" />
                Open Messages
              </Link>
            </div>

            {/* Pending Requests Box */}
            {(connections?.pendingIncoming?.length || 0) > 0 && (
              <div className="rounded-2xl border border-crimson-300 bg-crimson-50/60 p-5 shadow-xs">
                <div className="flex items-center gap-2 text-crimson-900 font-sans text-xs font-bold uppercase tracking-wider mb-3">
                  <UserPlus className="w-4 h-4 text-crimson-600" />
                  Connection Requests ({(connections?.pendingIncoming?.length || 0)})
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto overscroll-contain pr-1">
                  {(connections?.pendingIncoming || []).map((conn) => (
                    <div
                      key={conn.id}
                      className="p-3 rounded-xl bg-white border border-crimson-200 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        {conn.partner?.avatarUrl ? (
                          <img
                            src={conn.partner.avatarUrl}
                            alt={conn.partner.fullName || conn.partner.username}
                            className="w-9 h-9 rounded-lg object-cover ring-1 ring-crimson-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#FEE2E2] text-[#991B1B] font-sans font-bold flex items-center justify-center text-xs border border-crimson-300">
                            {(conn.partner?.username || "dev").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/profile/${conn.partner?.id || conn.partner?.username}`}
                            className="font-cursive text-xl font-bold text-[#1C1917] hover:text-crimson-700 break-words block leading-tight"
                          >
                            {conn.partner.fullName || conn.partner.username}
                          </Link>
                          <p className="font-sans text-[11px] text-stone-500 break-all">@{conn.partner.username}</p>
                          {conn.partner.headline && (
                            <p className="font-sans text-[11px] text-stone-500 line-clamp-2">
                              {conn.partner.headline}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptConnection(conn.id)}
                          className="flex-1 py-1.5 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#14532D] border border-[#15803D] font-sans text-xs font-semibold transition"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineConnection(conn.id)}
                          className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 font-sans text-xs font-medium hover:bg-stone-50 transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Creators Box */}
            <div className="rounded-2xl border-2 border-forest-600/30 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="font-cursive text-2xl font-bold text-[#1C1917]">
                  Suggested Creators
                </h3>
                <span className="font-sans text-xs text-forest-700 font-semibold">explore</span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto overscroll-contain pr-1">
                {suggested.filter((dev) => dev.id !== meId).length === 0 && <p className="text-xs text-stone-500">No suggestions yet.</p>}
                {suggested.filter((dev) => dev.id !== meId).map((dev) => {
                  const hasRequested = requestedUsers[dev.id];
                  return (
                    <div
                      key={dev.id}
                      className="flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Link to={`/profile/${dev.id || dev.username}`}>
                          {dev.avatarUrl ? (
                            <img
                              src={dev.avatarUrl}
                              alt={dev.fullName || dev.username}
                              className="w-9 h-9 rounded-lg object-cover ring-1 ring-forest-300"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#DCFCE7] text-[#14532D] font-sans font-bold flex items-center justify-center text-xs border border-forest-300">
                              {dev.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/profile/${dev.id || dev.username}`}
                            className="font-cursive text-xl font-bold text-[#1C1917] hover:text-forest-700 break-words block leading-tight"
                          >
                            {dev.fullName || dev.username}
                          </Link>
                          <p className="font-sans text-[11px] text-stone-500 break-all">@{dev.username}</p>
                          {dev.headline && (
                            <p className="font-sans text-[11px] text-stone-500 line-clamp-2">
                              {dev.headline}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={hasRequested}
                        onClick={() => handleSendConnect(dev.id)}
                        className={`p-2 rounded-lg text-xs font-semibold transition shrink-0 ${
                          hasRequested
                            ? "bg-gray-100 text-gray-400 border border-gray-200"
                            : "bg-[#DCFCE7] text-[#14532D] hover:bg-[#BBF7D0] border border-[#15803D]"
                        }`}
                        title="Connect with developer"
                      >
                        {hasRequested ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
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
