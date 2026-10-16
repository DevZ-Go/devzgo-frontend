import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  Share2,
  Search,
  Users,
  Send,
  Loader2,
  Trash2,
  Sparkles,
  Check,
  UserPlus,
  Clock,
  ArrowRight,
  Compass,
  LayoutGrid,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import {
  fetchFeed,
  createPost,
  toggleActivityLike,
  addActivityComment,
  deleteActivityComment,
} from "../api/network";
import {
  fetchConnections,
  acceptConnection,
  declineConnection,
  sendConnectionRequest,
  fetchSuggestedDevelopers,
} from "../api/connections";
import type { FeedActivity, Connection, ConnectionUserSummary } from "../types/network";
import { useAuth } from "../auth/AuthContext";
import { HangingCardsHeader } from "../components/network/HangingCardsHeader";
import { ConstellationGraph } from "../components/network/ConstellationGraph";
import { CuteFlower, CurlyDoodleBanner } from "../components/network/DoodleDecorations";

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

export function NetworkPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [feed, setFeed] = useState<FeedActivity[]>([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"feed" | "constellation">("feed");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);
  const [loading, setLoading] = useState(true);

  // Quick post state
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<string>("post");
  const [posting, setPosting] = useState(false);

  // Active comments open accordion
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

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

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFeed(filter, debouncedSearch);
      setFeed(data);
    } catch {
      showToast("Could not load the feed");
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch]);

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
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    void loadSidebar();
    const handleUpdate = () => {
      void loadFeed();
      void loadSidebar();
    };
    window.addEventListener("devzgo:feed-updated", handleUpdate);
    window.addEventListener("devzgo:connections-updated", handleUpdate);
    return () => {
      window.removeEventListener("devzgo:feed-updated", handleUpdate);
      window.removeEventListener("devzgo:connections-updated", handleUpdate);
    };
  }, [loadFeed, loadSidebar]);

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
      showToast("Spark pinned to the garden! 🌿");
      await loadFeed();
    } catch {
      showToast("Failed to share post");
    } finally {
      setPosting(false);
    }
  }

  async function handleLikeToggle(activityId: string) {
    setFeed((prev) =>
      prev.map((act) => {
        if (act.id === activityId) {
          const isLiked = !act.isLiked;
          const likesCount = isLiked ? act.likesCount + 1 : Math.max(0, act.likesCount - 1);
          return { ...act, isLiked, likesCount };
        }
        return act;
      })
    );

    try {
      const res = await toggleActivityLike(activityId);
      setFeed((prev) =>
        prev.map((act) =>
          act.id === activityId
            ? { ...act, isLiked: res.isLiked, likesCount: res.likesCount }
            : act
        )
      );
    } catch {
      showToast("Could not update like");
      void loadFeed();
    }
  }

  async function handleAddComment(activityId: string, e: React.FormEvent) {
    e.preventDefault();
    const text = commentInputs[activityId]?.trim();
    if (!text) return;

    setCommentSubmitting((prev) => ({ ...prev, [activityId]: true }));
    try {
      const newComment = await addActivityComment(activityId, text);
      setFeed((prev) =>
        prev.map((act) =>
          act.id === activityId
            ? {
                ...act,
                commentsCount: act.commentsCount + 1,
                comments: [...act.comments, newComment],
              }
            : act
        )
      );
      setCommentInputs((prev) => ({ ...prev, [activityId]: "" }));
    } catch {
      showToast("Failed to post comment");
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [activityId]: false }));
    }
  }

  async function handleDeleteComment(activityId: string, commentId: string) {
    try {
      await deleteActivityComment(commentId);
      setFeed((prev) =>
        prev.map((act) =>
          act.id === activityId
            ? {
                ...act,
                commentsCount: Math.max(0, act.commentsCount - 1),
                comments: act.comments.filter((c) => c.id !== commentId),
              }
            : act
        )
      );
      showToast("Comment deleted");
    } catch {
      showToast("Could not delete comment");
    }
  }

  function handleShare(activityId: string) {
    const url = `${window.location.origin}/network#${activityId}`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard! ✦");
    } else {
      showToast("Copied link: " + url);
    }
  }

  async function handleAcceptConnection(connId: string) {
    try {
      await acceptConnection(connId);
      showToast("Connection accepted! 🌿");
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
      showToast("Connection request sent! 💌");
      await loadSidebar();
    } catch {
      setRequestedUsers((prev) => ({ ...prev, [targetUserId]: false }));
      showToast("Failed to send request");
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "project_added":
        return { label: "🚀 NEW PROJECT", color: "bg-forest-100 text-forest-800 border-2 border-forest-600" };
      case "project_analyzed":
        return { label: "💡 CODE SPARK", color: "bg-amber-100 text-amber-900 border-2 border-amber-600" };
      case "profile_updated":
        return { label: "🌿 PROFILE GLOW", color: "bg-emerald-100 text-emerald-800 border-2 border-emerald-600" };
      case "wrap_up_published":
        return { label: "🍎 MONTHLY WRAP", color: "bg-crimson-100 text-crimson-800 border-2 border-crimson-600" };
      case "collaboration":
        return { label: "🤝 COLLAB CALL", color: "bg-forest-100 text-forest-800 border-2 border-forest-600" };
      default:
        return { label: "✧ SHARED SPARK", color: "bg-cream-100 text-gray-800 border-2 border-gray-400" };
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-gray-900 font-sans">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-forest-900 text-white px-5 py-3 text-sm font-doodle font-bold shadow-2xl flex items-center gap-2.5 border-2 border-forest-500 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="text-base">{toastMessage}</span>
        </div>
      )}

      <main className="max-w-[1360px] mx-auto px-4 sm:px-8 pt-24 pb-20">
        {/* Whimsical Hero Header with BIG Doodle Typography */}
        <div className="mb-8 pt-2">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              {/* Cute Kicker with Floral Doodle */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-700 text-white font-doodle text-base font-bold uppercase tracking-wider mb-3 shadow-xs">
                <CuteFlower className="w-5 h-5" />
                <span>The Community Constellation & Garden</span>
              </div>

              {/* Big, Expressive Doodle Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#1c1917] tracking-tight leading-none">
                Developer{" "}
                <span className="font-doodle text-5xl sm:text-6xl md:text-7xl text-crimson-600 font-extrabold">
                  Network
                </span>
              </h1>
              <p className="font-hand text-2xl sm:text-3xl text-forest-700 font-bold mt-2 leading-relaxed">
                “a living sketchbook where student builders share sparks, late-night commits, and grow together” 🌿
              </p>
            </div>

            {/* View Mode Toggle & Search Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Chunky Doodle View Switcher in Rich Red & Green */}
              <div className="inline-flex p-1.5 rounded-2xl bg-white border-2 border-[#166534] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("feed")}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-doodle text-sm sm:text-base font-bold transition ${
                    viewMode === "feed"
                      ? "bg-forest-700 text-white shadow-xs"
                      : "text-gray-700 hover:text-black hover:bg-cream-100"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 text-amber-300" />
                  Scrapbook Feed
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("constellation")}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-doodle text-sm sm:text-base font-bold transition ${
                    viewMode === "constellation"
                      ? "bg-crimson-600 text-white shadow-xs"
                      : "text-gray-700 hover:text-black hover:bg-cream-100"
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Constellation Web ✦
                </button>
              </div>

              {/* Clean & Spacious Search Input */}
              <div className="relative flex-1 sm:w-68">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-forest-700" />
                <input
                  type="text"
                  placeholder="Search creators, tech, sparks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border-2 border-forest-600/70 font-doodle text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-forest-700 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Hand-Drawn Curly Banner Doodle */}
          <div className="mt-4 mb-3 opacity-80">
            <CurlyDoodleBanner className="w-full text-forest-700" />
          </div>

          {/* Filter Pills with Doodle Border */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { id: "all", label: "🌿 All Activity" },
              { id: "projects", label: "🚀 Projects & Milestones" },
              { id: "developers", label: "👩‍💻 Creators" },
              { id: "collaboration", label: "🤝 Collab Calls" },
              { id: "following", label: "🌱 My Connections" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-1.5 rounded-full font-doodle text-sm sm:text-base font-bold transition ${
                  filter === tab.id
                    ? "bg-forest-700 text-white shadow-xs border-2 border-forest-800"
                    : "bg-white text-gray-700 hover:text-black hover:bg-cream-100 border-2 border-forest-600/40"
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
              creators={suggested}
              activities={feed}
              onConnect={handleSendConnect}
              requestedUsers={requestedUsers}
            />
          </div>
        ) : null}

        {/* Hanging Cards Gallery at the top of the Feed (Inspired by Image 1) */}
        {viewMode === "feed" && (
          <HangingCardsHeader
            creators={suggested}
            onSelectCreator={(username) => setSearchQuery(username)}
          />
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Main Social Feed Column */}
          <div className="space-y-6">
            {/* Quick Post Composer: Rich Green & Red Washi Style */}
            <div className="relative rounded-3xl border-3 border-forest-600/50 bg-white p-5 sm:p-6 shadow-soft">
              {/* Rich Red Washi Tape Sticker */}
              <div className="washi-tape-red absolute -top-3 left-8 w-24 h-4.5 rounded-xs rotate-[-1deg] flex items-center justify-center text-[10px] text-white font-bold tracking-widest">
                SKETCHPAD
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-forest-600 to-crimson-600 text-white font-doodle font-bold flex items-center justify-center shrink-0 shadow-xs text-xl border-2 border-[#1c1917]/20">
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : "🌱"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-[#FAF7EE] p-3.5 rounded-2xl border-2 border-forest-600/30 shadow-inner">
                    <textarea
                      rows={3}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Sketch or write a spark, milestone, question, or late-night idea... 🍎"
                      className="w-full font-doodle text-base sm:text-lg text-gray-900 placeholder-gray-400 bg-transparent resize-none focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t-2 border-forest-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-doodle text-sm text-forest-700 font-bold mr-1">type:</span>
                      {[
                        { id: "post", label: "💬 Quick Spark" },
                        { id: "project_added", label: "🚀 Milestone" },
                        { id: "collaboration", label: "🤝 Collab" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPostType(t.id)}
                          className={`font-doodle text-sm px-3 py-1 rounded-full transition font-bold ${
                            postType === t.id
                              ? "bg-forest-100 text-forest-800 border-2 border-forest-600"
                              : "text-gray-600 hover:bg-cream-100 border border-transparent"
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white font-doodle text-base font-bold shadow-xs hover:shadow transition disabled:opacity-50"
                    >
                      {posting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Drop Spark ✦
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Items List */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white/70 rounded-3xl border-3 border-dashed border-forest-300">
                <Loader2 className="w-8 h-8 text-forest-700 animate-spin" />
                <p className="font-doodle text-2xl text-forest-800 font-bold">Gathering sparks from the garden branches…</p>
              </div>
            ) : feed.length === 0 ? (
              <div className="rounded-3xl border-3 border-dashed border-forest-300 bg-white/80 py-16 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto text-forest-400 mb-3" />
                <p className="font-doodle text-2xl font-bold text-gray-800 mb-1">No sparks found here yet</p>
                <p className="font-hand text-xl text-forest-700">
                  Be the first to hang a spark on the branches!
                </p>
              </div>
            ) : (
              feed.map((activity, idx) => {
                const badge = getActivityBadge(activity.activityType);
                const isCommentsOpen = Boolean(openComments[activity.id]);

                // Alternate rich red and rich green washi tapes
                const isGreen = idx % 2 === 0;

                return (
                  <article
                    key={activity.id}
                    id={activity.id}
                    className="relative rounded-3xl border-3 border-[#1c1917]/20 bg-white shadow-soft-lg overflow-hidden hover:shadow-soft-xl transition-all duration-300"
                  >
                    {/* Washi tape on top right */}
                    <div
                      className={`${
                        isGreen ? "washi-tape-green" : "washi-tape-red"
                      } absolute -top-3 right-8 w-18 h-4 rounded-xs rotate-[1.5deg] z-10 flex items-center justify-center text-[10px] text-white font-bold tracking-widest`}
                    >
                      {isGreen ? "GARDEN" : "SPARK"}
                    </div>

                    <div className="p-6 sm:p-7">
                      {/* Author Header */}
                      <div className="flex items-start justify-between gap-4 mb-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Link
                            to={`/profile/${activity.userId || activity.authorUsername}`}
                            className="group block shrink-0"
                          >
                            {activity.authorAvatar ? (
                              <img
                                src={activity.authorAvatar}
                                alt={activity.authorName}
                                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-forest-600/50 group-hover:ring-crimson-500 transition"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-forest-600 to-crimson-600 text-white font-doodle font-bold flex items-center justify-center text-lg shadow-xs">
                                {activity.authorName?.slice(0, 2).toUpperCase() || "DV"}
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/profile/${activity.userId || activity.authorUsername}`}
                                className="font-doodle text-xl sm:text-2xl font-bold text-gray-900 hover:text-crimson-600 transition"
                              >
                                {activity.authorName}
                              </Link>
                              <span className="font-sans text-xs text-gray-500 font-semibold">
                                @{activity.authorUsername}
                              </span>
                              <span
                                className={`font-doodle text-xs font-bold px-2.5 py-0.5 rounded-full ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                            {activity.authorHeadline && (
                              <p className="font-sans text-xs text-gray-600 mt-0.5 truncate">
                                {activity.authorHeadline}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5 font-sans">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatTimeAgo(activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Share Button */}
                        <button
                          type="button"
                          onClick={() => handleShare(activity.id)}
                          className="p-2 rounded-xl text-gray-500 hover:text-black hover:bg-cream-100 transition"
                          title="Share / Copy Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Post Title with BIG expressive typography */}
                      {activity.title && (
                        <h3 className="font-doodle text-2xl sm:text-3xl font-extrabold text-[#1c1917] mb-2 leading-tight">
                          {activity.title}
                        </h3>
                      )}

                      {/* Post Content */}
                      {activity.content && (
                        <p className="font-sans text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">
                          {activity.content}
                        </p>
                      )}

                      {/* Media Image Attachment */}
                      {activity.mediaUrl && !activity.project && (
                        <div className="rounded-2xl overflow-hidden border-2 border-[#1c1917]/20 mb-4 bg-gray-50 max-h-[360px]">
                          <img
                            src={activity.mediaUrl}
                            alt="Activity attachment"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Attached Project Card */}
                      {activity.project && (
                        <Link
                          to={`/project/${activity.project.id}`}
                          className="group block my-4 rounded-2xl border-3 border-forest-600/60 bg-[#FDFBF7] text-gray-900 overflow-hidden hover:border-crimson-600 transition shadow-xs"
                        >
                          {activity.project.coverImageUrl && (
                            <div className="aspect-[2.5/1] w-full overflow-hidden bg-gray-100">
                              <img
                                src={activity.project.coverImageUrl}
                                alt={activity.project.title}
                                className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                              />
                            </div>
                          )}
                          <div className="p-4 sm:p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {(activity.project.techStacks || []).map((t) => (
                                  <span
                                    key={t}
                                    className="px-2.5 py-0.5 rounded-full font-doodle text-xs font-bold bg-forest-100 text-forest-800 border border-forest-400"
                                  >
                                    {t}
                                  </span>
                                ))}
                                {activity.project.complexity && (
                                  <span className="font-doodle text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-crimson-100 text-crimson-800 border border-crimson-400">
                                    {activity.project.complexity}
                                  </span>
                                )}
                              </div>
                              <span className="font-doodle text-sm text-forest-700 font-bold group-hover:translate-x-1 transition flex items-center gap-1">
                                Open spark <ArrowRight className="w-4 h-4" />
                              </span>
                            </div>

                            <h4 className="font-doodle text-2xl font-bold text-gray-900 group-hover:text-forest-700 transition">
                              {activity.project.title}
                            </h4>
                            {activity.project.shortDescription && (
                              <p className="font-sans text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                {activity.project.shortDescription}
                              </p>
                            )}
                          </div>
                        </Link>
                      )}

                      {/* Action Bar */}
                      <div className="mt-4 pt-3.5 border-t-2 border-forest-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Heart Button */}
                          <button
                            type="button"
                            onClick={() => handleLikeToggle(activity.id)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-doodle text-base font-bold transition ${
                              activity.isLiked
                                ? "bg-crimson-100 text-crimson-700 border-2 border-crimson-400"
                                : "text-gray-700 hover:bg-cream-100 border border-gray-200"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                activity.isLiked ? "fill-crimson-600 text-crimson-600" : ""
                              }`}
                            />
                            <span>{activity.likesCount}</span>
                          </button>

                          {/* Comment Toggle Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setOpenComments((prev) => ({
                                ...prev,
                                [activity.id]: !prev[activity.id],
                              }))
                            }
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-doodle text-base font-bold transition ${
                              isCommentsOpen
                                ? "bg-forest-100 text-forest-800 border-2 border-forest-600"
                                : "text-gray-700 hover:bg-cream-100 border border-gray-200"
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{activity.commentsCount} notes</span>
                          </button>
                        </div>

                        {/* Direct Say Hi Button in Rich Forest Green */}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/messages?user=${activity.userId || activity.authorUsername}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 font-doodle text-base font-bold text-white px-4 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 shadow-xs transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Say Hi 💌</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Accordion Section */}
                    {isCommentsOpen && (
                      <div className="bg-[#FAF7EE] border-t-2 border-forest-100 px-6 sm:px-7 py-4">
                        <form
                          onSubmit={(e) => handleAddComment(activity.id, e)}
                          className="flex items-center gap-2.5 mb-3.5"
                        >
                          <input
                            type="text"
                            placeholder="Write a sweet note on this spark..."
                            value={commentInputs[activity.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [activity.id]: e.target.value,
                              }))
                            }
                            className="flex-1 rounded-xl border-2 border-forest-400 bg-white px-3.5 py-2 font-doodle text-sm text-gray-900 shadow-2xs focus:border-forest-700 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={
                              !commentInputs[activity.id]?.trim() ||
                              commentSubmitting[activity.id]
                            }
                            className="px-4 py-2 rounded-xl bg-forest-700 text-white font-doodle text-sm font-bold hover:bg-forest-800 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {commentSubmitting[activity.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Reply ✦"
                            )}
                          </button>
                        </form>

                        <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
                          {(activity.comments || []).length === 0 ? (
                            <p className="font-hand text-xl text-forest-800 font-bold py-1">
                              No notes yet. Leave a sweet word of encouragement ~
                            </p>
                          ) : (
                            (activity.comments || []).map((comment) => (
                              <div
                                key={comment.id}
                                className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border-2 border-forest-200 shadow-2xs"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  {comment.authorAvatar ? (
                                    <img
                                      src={comment.authorAvatar}
                                      alt={comment.authorName}
                                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-forest-700 text-white font-doodle font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                                      {comment.authorName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-doodle text-base font-bold text-gray-900">
                                        {comment.authorName}
                                      </span>
                                      <span className="text-xs text-gray-400 font-sans">
                                        @{comment.authorUsername} ·{" "}
                                        {formatTimeAgo(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="font-sans text-xs text-gray-700 mt-0.5 leading-relaxed">
                                      {comment.commentText}
                                    </p>
                                  </div>
                                </div>

                                {user?.id != null && String(user.id) === comment.authorId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteComment(activity.id, comment.id)
                                    }
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-crimson-600 transition shrink-0"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* Right Sidebar: The Cozy Corner in Rich Red and Green */}
          <aside className="space-y-6">
            {/* Your Network Stats Card */}
            <div className="rounded-3xl border-3 border-forest-600/40 bg-white p-5 sm:p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-doodle text-2xl font-bold text-gray-900">Your Constellation</h3>
                  <p className="font-hand text-lg text-forest-700 font-bold">garden connections & sparks</p>
                </div>
                <span className="p-2.5 rounded-2xl bg-forest-100 text-forest-800 border-2 border-forest-400">
                  <Users className="w-5 h-5" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border-2 border-forest-400">
                  <p className="font-doodle text-sm text-forest-800 font-bold">Connections</p>
                  <p className="font-doodle text-3xl font-extrabold text-forest-900 mt-0.5">
                    {connections?.accepted?.length || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border-2 border-crimson-400">
                  <p className="font-doodle text-sm text-crimson-800 font-bold">Pending</p>
                  <p className="font-doodle text-3xl font-extrabold text-crimson-700 mt-0.5">
                    {connections?.pendingIncoming?.length || 0}
                  </p>
                </div>
              </div>

              <Link
                to="/messages"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-forest-800 text-white px-4 py-2.5 font-doodle text-base font-bold hover:bg-forest-900 transition shadow-xs"
              >
                <MessageSquare className="w-4 h-4 text-amber-300" />
                Open Messages 💬
              </Link>
            </div>

            {/* Pending Requests Box */}
            {(connections?.pendingIncoming?.length || 0) > 0 && (
              <div className="rounded-3xl border-3 border-crimson-400 bg-crimson-50/70 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-crimson-900 font-doodle text-base font-bold uppercase tracking-wider mb-3.5">
                  <Sparkles className="w-4 h-4 text-crimson-600" />
                  Connection Requests ({(connections?.pendingIncoming?.length || 0)})
                </div>

                <div className="space-y-3">
                  {(connections?.pendingIncoming || []).map((conn) => (
                    <div
                      key={conn.id}
                      className="p-3 rounded-2xl bg-white border-2 border-crimson-300 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        {conn.partner?.avatarUrl ? (
                          <img
                            src={conn.partner.avatarUrl}
                            alt={conn.partner.fullName || conn.partner.username}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-crimson-300"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-forest-600 to-crimson-600 text-white font-doodle font-bold flex items-center justify-center text-sm">
                            {(conn.partner?.username || "dev").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/profile/${conn.partner?.id || conn.partner?.username}`}
                            className="font-doodle text-lg font-bold text-gray-900 hover:text-crimson-700 truncate block"
                          >
                            {conn.partner.fullName || conn.partner.username}
                          </Link>
                          {conn.partner.headline && (
                            <p className="font-sans text-xs text-gray-600 truncate">
                              {conn.partner.headline}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptConnection(conn.id)}
                          className="flex-1 py-1.5 rounded-xl bg-forest-700 text-white font-doodle text-sm font-bold hover:bg-forest-800 transition"
                        >
                          Accept 🌿
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineConnection(conn.id)}
                          className="px-3 py-1.5 rounded-xl border-2 border-gray-300 text-gray-600 font-doodle text-sm font-bold hover:bg-cream-100 transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Creators Box in Polaroid Tiles */}
            <div className="rounded-3xl border-3 border-forest-600/40 bg-white p-5 sm:p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-doodle text-2xl font-bold text-gray-900">
                  Suggested Creators
                </h3>
                <span className="font-hand text-lg text-crimson-700 font-bold">explore ✦</span>
              </div>

              <div className="space-y-3.5">
                {suggested.map((dev) => {
                  const hasRequested = requestedUsers[dev.id];
                  return (
                    <div
                      key={dev.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Link to={`/profile/${dev.id || dev.username}`}>
                          {dev.avatarUrl ? (
                            <img
                              src={dev.avatarUrl}
                              alt={dev.fullName || dev.username}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-forest-400"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-forest-600 to-crimson-600 text-white font-doodle font-bold flex items-center justify-center text-sm">
                              {dev.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/profile/${dev.id || dev.username}`}
                            className="font-doodle text-lg font-bold text-gray-900 hover:text-forest-700 truncate block"
                          >
                            {dev.fullName || dev.username}
                          </Link>
                          {dev.headline && (
                            <p className="font-sans text-xs text-gray-600 truncate">
                              {dev.headline}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={hasRequested}
                        onClick={() => handleSendConnect(dev.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition shrink-0 ${
                          hasRequested
                            ? "bg-gray-100 text-gray-400 border border-gray-300"
                            : "bg-forest-100 text-forest-800 hover:bg-forest-200 border-2 border-forest-600"
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
