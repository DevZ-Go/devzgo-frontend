import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Search, Users, Send, Loader2, Check, UserPlus, Compass, LayoutGrid } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { NetworkPlaces } from "../components/network/NetworkPlaces";
import { createPost, fetchFeedPage } from "../api/network";
import { fetchMyProfile } from "../api/profiles";
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
import { StickerBadge } from "../components/StickerBadge";
import snailSketch from "../assets/snail.jpg";

export function NetworkPage() {
  const { user } = useAuth();
  const me = useQuery({ queryKey: ["my-profile-photo", user?.id ?? ""], queryFn: fetchMyProfile, enabled: Boolean(user) });

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
  const [postType, setPostType] = useState<string>("spark");
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
    <div className="min-h-screen bg-[#FFF8CA] text-[#2D120D] font-sans antialiased">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[#CDE3E8] bg-[#2D120D] px-5 py-2.5 font-sans text-sm font-semibold text-[#FFF8CA] shadow-xl sm:left-auto sm:right-6 sm:max-w-sm">
          <Check className="w-4 h-4 text-[#CDE3E8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP SECTION: Powder Sky Blue & Mint Gingham Hero + Espresso Brown Typography + Stickers ── */}
      <section className="relative pt-16 pb-10 overflow-hidden pattern-sky-stars border-b-2 border-[#284E45]/20">
        {/* Top Striped Awning Trim in Forest Teal, Mint Sage & Lemon Chiffon */}
        <div
          className="w-full h-5 mb-6 shadow-2xs"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #284E45 0px, #284E45 16px, #E2F0CB 16px, #E2F0CB 32px, #FFF8CA 32px, #FFF8CA 48px)",
          }}
        />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <NetworkPlaces current="feed" />

            {/* Clean Search & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mb-6">
              <div className="inline-flex p-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#284E45]/25 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("feed")}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full font-sans text-xs font-semibold transition ${
                    viewMode === "feed"
                      ? "bg-[#284E45] text-[#FAF6EC] shadow-2xs"
                      : "text-[#3E2217] hover:bg-[#E2F0CB]"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Feed
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("constellation")}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full font-sans text-xs font-semibold transition ${
                    viewMode === "constellation"
                      ? "bg-[#3E2217] text-[#FFF8CA] shadow-2xs"
                      : "text-[#3E2217] hover:bg-[#E2F0CB]"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  Constellation
                </button>
              </div>

              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#3E2217]/70" />
                <input
                  type="text"
                  placeholder="Search people or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-full bg-white/95 backdrop-blur-xs border border-[#284E45]/25 font-sans text-xs sm:text-sm text-[#3E2217] placeholder-[#3E2217]/50 focus:outline-none focus:ring-2 focus:ring-[#284E45] focus:border-[#284E45] transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Holiday Market / Flipbook Inspired Header + Left Sticker + Right Snail Sketch */}
          <div className="relative pt-2 pb-10">
            {/* Left Side Decorative Stickers in the Open Space */}
            <div className="hidden lg:flex flex-col items-center gap-3 lg:absolute lg:left-2 xl:left-6 lg:top-1/2 lg:-translate-y-1/2 z-10">
              <StickerBadge
                name="daisyLadybug"
                size="lg"
                variant="polaroid"
                caption="sketchbook notes"
                className="-rotate-6 hover:rotate-0 transition-transform duration-300"
              />
              <StickerBadge
                name="maroonMiffy"
                size="sm"
                variant="circle"
                className="rotate-6 -mt-3 ml-16"
              />
            </div>

            {/* Center Scallop-Inspired Gingham Card (Holiday Market & Celebfest Reference) */}
            <div className="max-w-xl mx-auto text-center relative z-10 rounded-[2.2rem] pattern-blue-gingham border-2 border-[#3E2217]/25 px-6 py-8 sm:px-10 sm:py-9 shadow-[0_14px_35px_rgba(62,34,23,0.12)]">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#E2F0CB] border border-[#284E45]/30 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#284E45] mb-2">
                COMMUNITY SPACE
              </span>
              <h1 className="font-cake text-5xl sm:text-7xl md:text-8xl font-bold uppercase text-[#3E2217] tracking-tight leading-none break-words">
                DEV SOCIAL
              </h1>
              <p className="font-cursive text-3xl sm:text-4xl text-[#284E45] mt-1">
                Creators &amp; Connections
              </p>

              {/* Decorative Star Divider */}
              <div className="my-3.5 flex items-center justify-center gap-3 text-[#3E2217]">
                <span className="h-px w-12 bg-[#3E2217]/25" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#3E2217]/35" aria-hidden="true" />
                <span className="h-px w-12 bg-[#3E2217]/25" />
              </div>

              {/* Simple, Clean Description */}
              <p className="font-sans text-sm sm:text-base text-[#3E2217]/85 leading-relaxed max-w-md mx-auto font-medium">
                A cozy space to share project updates, discover fellow builders,
                and connect with creators across the community.
              </p>
            </div>

            {/* Right Side of Dev Social: Snail Sketch Card in the Open Space */}
            <div className="mt-6 lg:mt-0 lg:absolute lg:right-2 xl:right-6 lg:top-1/2 lg:-translate-y-1/2 flex justify-center z-10">
              <div className="relative w-44 sm:w-52 lg:w-52 xl:w-60 rotate-[3deg] hover:rotate-0 transition-transform duration-300 rounded-2xl bg-[#FFF8CA] p-2.5 pb-4 border-2 border-[#3E2217] shadow-[0_14px_32px_rgba(62,34,23,0.22)]">
                {/* Mint Sage Washi Tape Accent */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#E2F0CB] text-[#284E45] text-[9px] font-bold font-sans tracking-widest uppercase border border-[#284E45]/30 shadow-2xs whitespace-nowrap">
                  COZY PACE
                </div>
                <div className="rounded-xl overflow-hidden border border-[#3E2217]/20 bg-[#FAF6EC]">
                  <img
                    src={snailSketch}
                    alt="Cozy snail sketch"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-cursive text-base text-[#3E2217] text-center mt-2 leading-none">
                  slow &amp; thoughtful builds ~
                </p>
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

      {/* ── Checkered Gingham Border Transition (Forest Teal, Mint Sage & Lemon Chiffon) ── */}
      <div className="w-full overflow-hidden">
        <div
          className="w-full h-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #284E45 0px, #284E45 48px, #CBE4EE 48px, #CBE4EE 96px, #FFF8CA 96px, #FFF8CA 144px)",
          }}
        />
        <div
          className="w-full h-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #CBE4EE 0px, #CBE4EE 48px, #FFF8CA 48px, #FFF8CA 96px, #3E2217 96px, #3E2217 144px)",
          }}
        />
      </div>

      {/* ── SCROLL SECTION: Lemon Chiffon Network Section with Forest Teal, Espresso Brown & Powder Blue Accents ── */}
      <main className="bg-[#FFF8CA] pt-10 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <StickerBadge
          name="starrySnail"
          size="md"
          className="hidden xl:inline-flex absolute top-10 right-6 rotate-6 z-10"
        />
        <div className="max-w-[1280px] mx-auto rounded-[2.5rem] bg-[#FAF6EC] border-2 border-[#3E2217]/20 shadow-[0_12px_40px_rgba(62,34,23,0.08)] p-5 sm:p-8 lg:p-10 relative z-10">
          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* Main Social Feed Column */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                <h2 className="font-gift text-3xl sm:text-4xl text-[#284E45] font-bold tracking-wide leading-none">
                  02. Community Notes
                </h2>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#3E2217]/70">
                  LIVE FEED
                </span>
              </div>

              {/* Quick Post Composer */}
              <div id="note-composer" className="relative rounded-3xl border-2 border-[#284E45]/25 bg-white p-5 sm:p-6 shadow-2xs">
                <div className="absolute -top-2.5 left-6 px-3 py-0.5 rounded-full bg-[#E2F0CB] text-[#284E45] text-[9px] font-bold font-sans tracking-widest uppercase border border-[#284E45]/25">
                  SHARE A THOUGHT
                </div>

                <div className="flex gap-3.5">
                  {me.data?.avatarUrl ? (
                    <img src={me.data.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#CBE4EE]" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#284E45] text-[#FAF6EC] font-gift text-xl flex items-center justify-center shrink-0 border border-[#CBE4EE]">
                      {user?.username ? user.username.slice(0, 2).toUpperCase() : "ME"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="bg-[#F2F8FB] p-3.5 rounded-2xl border border-[#7D94B5]/30">
                      <textarea
                        rows={3}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value.slice(0, 5000))}
                        placeholder="Share a thought, a question, or anything you're working on…"
                        className="w-full min-h-[72px] font-sans text-sm text-[#3E2217] placeholder-[#3E2217]/50 bg-transparent resize-y focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#3E2217]/10 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-sans text-xs text-[#3E2217]/70 font-semibold mr-1">Share as:</span>
                        {[
                          { id: "spark", label: "Spark" },
                          { id: "post", label: "Note" },
                          { id: "milestone", label: "Milestone" },
                          { id: "collab_call", label: "Collab Call" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setPostType(t.id)}
                            className={`min-h-9 font-sans text-xs px-3 py-1.5 rounded-full transition font-medium ${
                              postType === t.id
                                ? "bg-[#E2F0CB] text-[#284E45] font-semibold border border-[#284E45]/30"
                                : "text-[#3E2217]/70 hover:bg-[#DAEBF2]/60 border border-transparent"
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
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 self-end px-4 py-2 rounded-full bg-[#284E45] hover:bg-[#3E2217] text-[#FAF6EC] font-sans text-xs font-semibold shadow-2xs transition disabled:opacity-50 sm:self-auto"
                      >
                        {posting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        {postType === "spark" ? "Post spark" : "Post"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feed Items List */}
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2.5 bg-white/80 rounded-3xl border border-dashed border-[#2D120D]/25">
                  <Loader2 className="w-7 h-7 text-[#6B0B0C] animate-spin" />
                  <p className="font-gift text-2xl text-[#2D120D]">Gathering notes from the community…</p>
                </div>
              ) : feed.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#2D120D]/25 bg-white/80 py-14 text-center text-[#2D120D]/70">
                  <Users className="w-10 h-10 mx-auto text-[#6B0B0C] mb-2" />
                  <p className="font-gift text-3xl text-[#2D120D] mb-1">No notes found here yet</p>
                  <p className="font-sans text-xs text-[#2D120D]/70">
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
                      className="w-full rounded-full border border-[#2D120D]/20 bg-white py-2.5 font-sans text-sm font-semibold text-[#2D120D] hover:bg-[#CDE3E8]/50"
                    >
                      {feedQuery.isFetchingNextPage ? "Loading…" : "Load more notes"}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar: Numbered Club Sidebar */}
            <aside className="space-y-6">
              {/* 03. Network People Card */}
              <div className="relative rounded-3xl border-2 border-[#284E45]/25 bg-white p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#284E45] block">
                      YOUR NETWORK
                    </span>
                    <h3 className="font-gift text-3xl text-[#3E2217] font-bold leading-tight">
                      03. Network People
                    </h3>
                  </div>
                  <StickerBadge
                    name="blueMiffy"
                    size="sm"
                    variant="circle"
                    className="rotate-3 hover:rotate-0 transition-transform !w-12 !h-12 shrink-0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Link
                    to="/network/connections"
                    className="p-3.5 rounded-2xl bg-[#DAEBF2] border border-[#7D94B5]/40 hover:border-[#284E45] transition"
                  >
                    <p className="font-sans text-xs text-[#26415E] font-semibold">Connections</p>
                    <p className="font-gift text-3xl text-[#26415E] font-bold mt-0.5 leading-none">
                      {connections?.accepted?.length || 0}
                    </p>
                  </Link>
                  <Link
                    to="/network/connections?tab=requests"
                    className="p-3.5 rounded-2xl bg-[#E2F0CB] border border-[#284E45]/35 hover:border-[#284E45] transition"
                  >
                    <p className="font-sans text-xs text-[#284E45] font-semibold">Pending</p>
                    <p className="font-gift text-3xl text-[#284E45] font-bold mt-0.5 leading-none">
                      {connections?.pendingIncoming?.length || 0}
                    </p>
                  </Link>
                </div>

                <Link
                  to="/network/connections"
                  className="mb-2.5 w-full inline-flex items-center justify-center gap-2 rounded-full border border-[#3E2217]/25 bg-[#FAF6EC] hover:bg-[#E2F0CB] text-[#3E2217] px-4 py-2 font-sans text-xs font-semibold transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  View all people
                </Link>

                <Link
                  to="/messages"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#284E45] hover:bg-[#3E2217] text-[#FAF6EC] px-4 py-2 font-sans text-xs font-semibold transition shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#E2F0CB]" />
                  Open Messages
                </Link>
              </div>

              {/* Pending Requests Box */}
              {(connections?.pendingIncoming?.length || 0) > 0 && (
                <div className="rounded-3xl border border-[#6B0B0C]/30 bg-[#FFF8CA] p-5 shadow-2xs">
                  <div className="flex items-center gap-2 text-[#6B0B0C] font-sans text-xs font-bold uppercase tracking-wider mb-3">
                    <UserPlus className="w-4 h-4 text-[#6B0B0C]" />
                    Connection Requests ({connections?.pendingIncoming?.length || 0})
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto overscroll-contain pr-1">
                    {(connections?.pendingIncoming || []).map((conn) => (
                      <div
                        key={conn.id}
                        className="p-3.5 rounded-2xl bg-white border border-[#2D120D]/15 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 mb-2.5">
                          {conn.partner?.avatarUrl ? (
                            <img
                              src={conn.partner.avatarUrl}
                              alt={conn.partner.fullName || conn.partner.username}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-[#2D120D]/20"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-[#6B0B0C] text-[#FFF8CA] font-gift text-lg flex items-center justify-center">
                              {(conn.partner?.username || "dev").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/profile/${conn.partner?.id || conn.partner?.username}`}
                              className="font-gift text-xl font-bold text-[#2D120D] hover:text-[#6B0B0C] break-words block leading-tight"
                            >
                              {conn.partner.fullName || conn.partner.username}
                            </Link>
                            <p className="font-sans text-[11px] text-[#6B0B0C] font-medium break-all">@{conn.partner.username}</p>
                            {conn.partner.headline && (
                              <p className="font-sans text-[11px] text-[#2D120D]/70 line-clamp-2">
                                {conn.partner.headline}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptConnection(conn.id)}
                            className="flex-1 py-1.5 rounded-full bg-[#6B0B0C] hover:bg-[#2D120D] text-[#FFF8CA] font-sans text-xs font-semibold transition"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineConnection(conn.id)}
                            className="px-3 py-1.5 rounded-full border border-[#2D120D]/20 text-[#2D120D] font-sans text-xs font-medium hover:bg-[#FFF8CA] transition"
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
              <div className="rounded-3xl border border-[#2D120D]/20 bg-white p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-gift text-3xl text-[#2D120D] font-bold leading-none">
                    04. Suggested Creators
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B0B0C] font-bold">
                    discover
                  </span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto overscroll-contain pr-1">
                  {suggested.filter((dev) => dev.id !== meId).length === 0 && (
                    <p className="text-xs text-[#2D120D]/60">No suggestions yet.</p>
                  )}
                  {suggested.filter((dev) => dev.id !== meId).map((dev) => {
                    const hasRequested = requestedUsers[dev.id];
                    return (
                      <div
                        key={dev.id}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-2xl hover:bg-[#FFF8CA]/50 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Link to={`/profile/${dev.id || dev.username}`}>
                            {dev.avatarUrl ? (
                              <img
                                src={dev.avatarUrl}
                                alt={dev.fullName || dev.username}
                                className="w-9 h-9 rounded-xl object-cover ring-1 ring-[#2D120D]/20"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-[#CDE3E8] text-[#2D120D] font-gift text-lg flex items-center justify-center border border-[#2D120D]/20">
                                {dev.username.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/profile/${dev.id || dev.username}`}
                              className="font-gift text-xl font-bold text-[#2D120D] hover:text-[#6B0B0C] break-words block leading-tight"
                            >
                              {dev.fullName || dev.username}
                            </Link>
                            <p className="font-sans text-[11px] text-[#6B0B0C] font-medium break-all">@{dev.username}</p>
                            {dev.headline && (
                              <p className="font-sans text-[11px] text-[#2D120D]/70 line-clamp-1">
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
                              : "bg-[#CDE3E8] text-[#2D120D] hover:bg-[#6B0B0C] hover:text-[#FFF8CA] border border-[#2D120D]/20"
                          }`}
                          title="Connect with developer"
                        >
                          {hasRequested ? (
                            <Check className="w-3.5 h-3.5 text-[#2D120D]" />
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
