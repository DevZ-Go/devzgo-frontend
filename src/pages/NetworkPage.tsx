import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Search, Users, Send, Loader2, Sparkles, Check, UserPlus } from "lucide-react";
import { Navbar } from "../components/Navbar";
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

export function NetworkPage() {
  const { user } = useAuth();

  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") ?? "all";
  const [searchQuery, setSearchQuery] = useState(params.get("q") ?? "");
  const debouncedSearch = params.get("q") ?? "";

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
  const feed = feedQuery.data?.pages.flatMap((p) => p.items) ?? [];
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
      showToast("Post shared to network!");
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
      showToast("Connection accepted!");
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

  async function handleSendConnect(targetUserId: string) {
    setRequestedUsers((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await sendConnectionRequest(targetUserId);
      showToast("Connection request sent!");
      await loadSidebar();
    } catch {
      setRequestedUsers((prev) => ({ ...prev, [targetUserId]: false }));
      showToast("Failed to send request");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-gray-900 text-white px-5 py-3 text-sm font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-28 pb-20">
        {/* Top Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-blue-600 mb-2 font-semibold uppercase tracking-wider text-xs">
                <Users className="w-4 h-4" />
                Developer Network
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Network
              </h1>
              <p className="text-gray-600 mt-1 max-w-xl">
                Connect with developers, share your work, and collaborate.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search developers, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200/80 pb-4">
            {[
              { id: "all", label: "All Activity" },
              { id: "projects", label: "Projects" },
              { id: "developers", label: "Developers" },
              { id: "collaboration", label: "Collaboration" },
              { id: "following", label: "Following & Connections" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  filter === tab.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border border-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Main Feed Column */}
          <div className="space-y-6">
            {/* Quick Post Composer */}
            <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    rows={2}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share a project milestone, question, or technology update..."
                    className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent resize-none focus:outline-none"
                  />
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 mr-1">Type:</span>
                      {[
                        { id: "post", label: "Post" },
                        { id: "milestone", label: "Milestone" },
                        { id: "collab_call", label: "Collab Call" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPostType(t.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                            postType === t.id
                              ? "bg-blue-100 text-blue-700 font-semibold"
                              : "text-gray-500 hover:bg-gray-100"
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
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-xs font-semibold text-white shadow-sm hover:shadow transition disabled:opacity-50"
                    >
                      {posting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Post update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Items List */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm">Loading network feed…</p>
              </div>
            ) : feed.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 py-16 text-center text-gray-500">
                <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-gray-700 mb-1">No activities found</p>
                <p className="text-xs text-gray-500">
                  Try adjusting your filter or search query.
                </p>
              </div>
            ) : (
              <>
                {feed.map((activity) => <FeedItem key={activity.id} activity={activity} notify={showToast} />)}
                <div ref={moreRef} />
                {feedQuery.hasNextPage && (
                  <button type="button" disabled={feedQuery.isFetchingNextPage} onClick={() => void feedQuery.fetchNextPage()}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 text-sm font-semibold text-gray-700">
                    {feedQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {/* Your Network Stats Card */}
            <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm">Your Network</h3>
                <span className="p-1 rounded-lg bg-blue-50 text-blue-600">
                  <Users className="w-4 h-4" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <Link to="/network/connections" className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition">
                  <p className="text-xs text-gray-500 font-medium">Connections</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">
                    {connections?.accepted?.length || 0}
                  </p>
                </Link>
                <Link to="/network/connections?tab=incoming" className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition">
                  <p className="text-xs text-gray-500 font-medium">Pending</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">
                    {connections?.pendingIncoming?.length || 0}
                  </p>
                </Link>
              </div>

              <Link
                to="/network/connections"
                className="mb-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition"
              >
                <Users className="w-3.5 h-3.5" />
                Manage connections
              </Link>
              <Link
                to="/messages"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-xs font-semibold hover:bg-gray-800 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Open Messages
              </Link>
            </div>

            {/* Pending Requests Box */}
            {(connections?.pendingIncoming?.length || 0) > 0 && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Connection Requests ({(connections?.pendingIncoming?.length || 0)})
                </div>

                <div className="space-y-3">
                  {(connections?.pendingIncoming || []).map((conn) => (
                    <div
                      key={conn.id}
                      className="p-3.5 rounded-2xl bg-white border border-amber-200/80 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {conn.partner?.avatarUrl ? (
                          <img
                            src={conn.partner.avatarUrl}
                            alt={conn.partner.fullName || conn.partner.username}
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center text-xs">
                            {(conn.partner?.username || "dev").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/profile/${conn.partner?.id || conn.partner?.username}`}
                            className="text-xs font-bold text-gray-900 hover:text-blue-600 truncate block"
                          >
                            {conn.partner.fullName || conn.partner.username}
                          </Link>
                          {conn.partner.headline && (
                            <p className="text-[11px] text-gray-500 truncate">
                              {conn.partner.headline}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptConnection(conn.id)}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineConnection(conn.id)}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Developers Box */}
            <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-4">
                Suggested Developers
              </h3>

              <div className="space-y-4">
                {suggested.map((dev) => {
                  const hasRequested = requestedUsers[dev.id];
                  return (
                    <div
                      key={dev.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Link to={`/profile/${dev.id || dev.username}`}>
                          {dev.avatarUrl ? (
                            <img
                              src={dev.avatarUrl}
                              alt={dev.fullName || dev.username}
                              className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                              {dev.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/profile/${dev.id || dev.username}`}
                            className="text-xs font-bold text-gray-900 hover:text-blue-600 truncate block"
                          >
                            {dev.fullName || dev.username}
                          </Link>
                          {dev.headline && (
                            <p className="text-[11px] text-gray-500 truncate">
                              {dev.headline}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={hasRequested}
                        onClick={() => handleSendConnect(dev.id)}
                        className={`p-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                          hasRequested
                            ? "bg-gray-100 text-gray-400"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                        title="Connect with developer"
                      >
                        {hasRequested ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
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
