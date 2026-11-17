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
    <div className="min-h-screen bg-[#FDFBF7] text-[#2B2338] font-sans antialiased">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-white text-[#42356B] px-5 py-2.5 text-sm font-semibold font-sans shadow-xl flex items-center gap-2 border border-[#C9BEF0] animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-[#6B5B95]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP SECTION: Nectar Pastel Grid Hero + Gift Guide Typography ── */}
      <section
        className="relative pt-24 pb-8 border-b border-[#E8E0F5]"
        style={{
          backgroundColor: "#FDFBF7",
          backgroundImage:
            "linear-gradient(to right, rgba(212, 198, 236, 0.26) 1px, transparent 1px), linear-gradient(to bottom, rgba(212, 198, 236, 0.26) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <NetworkPlaces current="feed" />

          {/* Gift Guide Editorial Header */}
          <div className="mb-8 pt-2 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#721C2A]/75 block mb-2">
                (COMMUNITY DIRECTORY · LIVE)
              </span>

              {/* Gift Guide Style Outlined Sticker Title */}
              <div className="inline-flex flex-col items-start">
                <div className="inline-block rounded-3xl bg-[#FDFBF7] px-5 py-2 border-2 border-[#8B1E24] shadow-[0_0_0_4px_#FDFBF7,0_0_0_5.5px_#8B1E2480]">
                  <h1 className="font-gift text-5xl sm:text-6xl lg:text-7xl text-[#8B1E24] tracking-wide leading-[0.95] uppercase">
                    <span className="italic text-6xl sm:text-7xl lg:text-8xl mr-0.5">D</span>EVELOPER{" "}
                    <span className="italic text-6xl sm:text-7xl lg:text-8xl mr-0.5">N</span>ETWORK
                  </h1>
                </div>
                <div className="-mt-2.5 ml-6 sm:ml-12 inline-block rounded-2xl bg-[#FDFBF7] px-4 py-1 border border-[#8B1E24] shadow-2xs">
                  <span className="font-gift text-xl sm:text-2xl text-[#8B1E24] tracking-wide">
                    for Creators &amp; Builders
                  </span>
                </div>
              </div>
            </div>

            {/* Clean Search & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="inline-flex p-1 rounded-full bg-white/95 border border-[#DDD4F0] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("feed")}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full font-sans text-xs font-semibold transition ${
                    viewMode === "feed"
                      ? "bg-[#E5DFFA] text-[#42356B] border border-[#C9BEF0] shadow-2xs"
                      : "text-stone-600 hover:text-[#42356B]"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#6B5B95]" />
                  Feed
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("constellation")}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full font-sans text-xs font-semibold transition ${
                    viewMode === "constellation"
                      ? "bg-[#FAE5EB] text-[#721C2A] border border-[#EBCAD3] shadow-2xs"
                      : "text-stone-600 hover:text-[#721C2A]"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-[#721C2A]" />
                  Constellation
                </button>
              </div>

              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#6B5B95]" />
                <input
                  type="text"
                  placeholder="Search people or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-full bg-white/95 border border-[#DDD4F0] font-sans text-xs sm:text-sm text-[#2B2338] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C9BEF0] focus:border-[#8B1E24]/50 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Constellation View Mode */}
          {viewMode === "constellation" ? (
            <div className="mb-4">
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

          {/* 01. People you can reach (Top Directory Cards) */}
          {viewMode === "feed" && (
            <HangingCardsHeader
              creators={[
                ...connections.accepted.map((c) => c.partner),
                ...suggested.filter((s) => !connections.accepted.some((c) => c.partner.id === s.id)),
              ].filter((person) => person.id && person.id !== meId)}
              onSelectCreator={(username) => setSearchQuery(username)}
            />
          )}
        </div>
      </section>

      {/* ── Nectar-Inspired Checkered Pastel Trim Transition into Muted Lavender Scroll Section ── */}
      <div
        className="w-full h-4"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #721C2A 0px, #721C2A 18px, #F6DDE5 18px, #F6DDE5 36px)",
        }}
      />

      {/* ── SCROLL SECTION: Chic Muted Light Pastel Lavender Background (Nectar Aesthetic) ── */}
      <main className="bg-[#ECE7FA] pt-10 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto rounded-[2.5rem] bg-[#FDFBF7] border-2 border-white shadow-[0_12px_40px_rgba(107,91,149,0.08)] p-5 sm:p-8 lg:p-10">
          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* Main Social Feed Column */}
            <div className="space-y-6">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="font-gift text-3xl sm:text-4xl text-[#721C2A] tracking-wide leading-none">
                  02. Community Notes
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B5B95]">
                  LIVE FEED
                </span>
              </div>

              {/* Quick Post Composer: Chic Muted Pastel */}
              <div className="relative rounded-3xl border border-[#DDD4F0] bg-white p-5 sm:p-6 shadow-2xs">
                <div className="absolute -top-2.5 left-6 px-3 py-0.5 rounded-full bg-[#E5DFFA] text-[#42356B] text-[9px] font-bold font-sans tracking-widest uppercase border border-[#C9BEF0]">
                  SHARE A NOTE
                </div>

                <div className="flex gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EFEBF9] text-[#42356B] font-gift text-xl flex items-center justify-center shrink-0 border border-[#D4C9EC]">
                    {user?.username ? user.username.slice(0, 2).toUpperCase() : "ME"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-[#FAF8FE] p-3.5 rounded-2xl border border-[#E6E0F5]">
                      <textarea
                        rows={2}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Share a project milestone, question, or technology update..."
                        className="w-full font-sans text-sm text-[#2B2338] placeholder-stone-400 bg-transparent resize-none focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#F2EFFA] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans text-xs text-stone-500 font-semibold mr-1">Tag:</span>
                        {[
                          { id: "post", label: "Quick Note" },
                          { id: "milestone", label: "Milestone" },
                          { id: "collab_call", label: "Collab Call" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setPostType(t.id)}
                            className={`font-sans text-xs px-3 py-1 rounded-full transition font-medium ${
                              postType === t.id
                                ? "bg-[#E5DFFA] text-[#42356B] font-semibold border border-[#C9BEF0]"
                                : "text-stone-600 hover:bg-[#F5F2FC] border border-transparent"
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
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#721C2A] hover:bg-[#5E1522] text-[#FDFBF7] font-sans text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                      >
                        {posting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Post Note
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feed Items List */}
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2.5 bg-white/80 rounded-3xl border border-dashed border-[#C9BEF0]">
                  <Loader2 className="w-7 h-7 text-[#6B5B95] animate-spin" />
                  <p className="font-gift text-2xl text-[#721C2A]">Gathering notes from the community…</p>
                </div>
              ) : feed.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#C9BEF0] bg-white/80 py-14 text-center text-stone-500">
                  <Users className="w-10 h-10 mx-auto text-[#B8A9E0] mb-2" />
                  <p className="font-gift text-3xl text-[#721C2A] mb-1">No notes found here yet</p>
                  <p className="font-sans text-xs text-stone-600">
                    Be the first to share an update with the community!
                  </p>
                </div>
              ) : (
                <>
                  {feed.map((activity, idx) => <FeedItem key={activity.id} activity={activity} index={idx} notify={showToast} />)}
                  <div ref={moreRef} />
                  {feedQuery.hasNextPage && (
                    <button
                      type="button"
                      disabled={feedQuery.isFetchingNextPage}
                      onClick={() => void feedQuery.fetchNextPage()}
                      className="w-full rounded-full border border-[#DDD4F0] bg-white py-2.5 font-sans text-sm font-semibold text-[#42356B] hover:bg-[#F5F2FC]"
                    >
                      {feedQuery.isFetchingNextPage ? "Loading…" : "Load more notes"}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar: Gift Guide Numbered Club Sidebar */}
            <aside className="space-y-6">
              {/* 03. Your Connections Card */}
              <div className="rounded-3xl border border-[#DDD4F0] bg-white p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B5B95] block">
                      YOUR NETWORK
                    </span>
                    <h3 className="font-gift text-3xl text-[#721C2A] leading-tight">
                      03. Your Club
                    </h3>
                  </div>
                  <span className="p-2.5 rounded-2xl bg-[#EFEBF9] text-[#42356B] border border-[#D4C9EC]">
                    <Users className="w-4 h-4" />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Link
                    to="/network/connections"
                    className="p-3.5 rounded-2xl bg-[#F5F2FC] border border-[#DDD4F0] hover:border-[#B8A9E0] transition"
                  >
                    <p className="font-sans text-xs text-[#42356B] font-medium">Connections</p>
                    <p className="font-gift text-3xl text-[#42356B] mt-0.5 leading-none">
                      {connections?.accepted?.length || 0}
                    </p>
                  </Link>
                  <Link
                    to="/network/connections?tab=requests"
                    className="p-3.5 rounded-2xl bg-[#FDF5F7] border border-[#EBCAD3] hover:border-[#721C2A]/50 transition"
                  >
                    <p className="font-sans text-xs text-[#721C2A] font-medium">Pending</p>
                    <p className="font-gift text-3xl text-[#721C2A] mt-0.5 leading-none">
                      {connections?.pendingIncoming?.length || 0}
                    </p>
                  </Link>
                </div>

                <Link
                  to="/network/connections"
                  className="mb-2.5 w-full inline-flex items-center justify-center gap-2 rounded-full border border-[#DDD4F0] bg-white hover:bg-[#F5F2FC] text-[#42356B] px-4 py-2 font-sans text-xs font-semibold transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  View all people
                </Link>

                <Link
                  to="/messages"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#E5DFFA] hover:bg-[#D9D0F7] text-[#42356B] border border-[#C9BEF0] px-4 py-2 font-sans text-xs font-semibold transition shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#42356B]" />
                  Open Messages
                </Link>
              </div>

              {/* Pending Requests Box */}
              {(connections?.pendingIncoming?.length || 0) > 0 && (
                <div className="rounded-3xl border border-[#EBCAD3] bg-[#FDF6F8] p-5 shadow-2xs">
                  <div className="flex items-center gap-2 text-[#721C2A] font-sans text-xs font-bold uppercase tracking-wider mb-3">
                    <UserPlus className="w-4 h-4 text-[#721C2A]" />
                    Connection Requests ({connections?.pendingIncoming?.length || 0})
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto overscroll-contain pr-1">
                    {(connections?.pendingIncoming || []).map((conn) => (
                      <div
                        key={conn.id}
                        className="p-3.5 rounded-2xl bg-white border border-[#EBCAD3] shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 mb-2.5">
                          {conn.partner?.avatarUrl ? (
                            <img
                              src={conn.partner.avatarUrl}
                              alt={conn.partner.fullName || conn.partner.username}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-[#EBCAD3]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-[#FAE5EB] text-[#721C2A] font-gift text-lg flex items-center justify-center border border-[#EBCAD3]">
                              {(conn.partner?.username || "dev").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/profile/${conn.partner?.id || conn.partner?.username}`}
                              className="font-gift text-xl text-[#721C2A] hover:underline break-words block leading-tight"
                            >
                              {conn.partner.fullName || conn.partner.username}
                            </Link>
                            <p className="font-sans text-[11px] text-[#6B5B95] break-all">@{conn.partner.username}</p>
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
                            className="flex-1 py-1.5 rounded-full bg-[#E5DFFA] hover:bg-[#D9D0F7] text-[#42356B] border border-[#C9BEF0] font-sans text-xs font-semibold transition"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineConnection(conn.id)}
                            className="px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 font-sans text-xs font-medium hover:bg-stone-50 transition"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 04. Suggested Creators Box */}
              <div className="rounded-3xl border border-[#DDD4F0] bg-white p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-gift text-3xl text-[#721C2A] leading-none">
                    04. Suggested Creators
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B5B95] font-semibold">
                    discover
                  </span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto overscroll-contain pr-1">
                  {suggested.filter((dev) => dev.id !== meId).length === 0 && (
                    <p className="text-xs text-stone-500">No suggestions yet.</p>
                  )}
                  {suggested.filter((dev) => dev.id !== meId).map((dev) => {
                    const hasRequested = requestedUsers[dev.id];
                    return (
                      <div
                        key={dev.id}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-2xl hover:bg-[#FAF8FE] transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Link to={`/profile/${dev.id || dev.username}`}>
                            {dev.avatarUrl ? (
                              <img
                                src={dev.avatarUrl}
                                alt={dev.fullName || dev.username}
                                className="w-9 h-9 rounded-xl object-cover ring-1 ring-[#D4C9EC]"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-[#EFEBF9] text-[#42356B] font-gift text-lg flex items-center justify-center border border-[#D4C9EC]">
                                {dev.username.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/profile/${dev.id || dev.username}`}
                              className="font-gift text-xl text-[#721C2A] hover:text-[#42356B] break-words block leading-tight"
                            >
                              {dev.fullName || dev.username}
                            </Link>
                            <p className="font-sans text-[11px] text-[#6B5B95] break-all">@{dev.username}</p>
                            {dev.headline && (
                              <p className="font-sans text-[11px] text-stone-500 line-clamp-1">
                                {dev.headline}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={hasRequested}
                          onClick={() => handleSendConnect(dev.id)}
                          className={`p-2 rounded-full text-xs font-semibold transition shrink-0 ${
                            hasRequested
                              ? "bg-stone-100 text-stone-400 border border-stone-200"
                              : "bg-[#E5DFFA] text-[#42356B] hover:bg-[#D9D0F7] border border-[#C9BEF0]"
                          }`}
                          title="Connect with developer"
                        >
                          {hasRequested ? (
                            <Check className="w-3.5 h-3.5 text-[#42356B]" />
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
        </div>
      </main>
    </div>
  );
}
