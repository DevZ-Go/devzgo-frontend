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
import { CuteFlower, WavyDoodleLine } from "../components/network/DoodleDecorations";

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
      showToast("Post shared to network! ✨");
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
      showToast("Connection accepted! 🎉");
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
        return { label: "New Project", color: "bg-amber-50 text-amber-800 border-amber-200" };
      case "project_analyzed":
        return { label: "Code Spark", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "profile_updated":
        return { label: "Profile Glow", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "wrap_up_published":
        return { label: "Monthly Wrap ✦", color: "bg-pink-50 text-pink-700 border-pink-200" };
      case "collaboration":
        return { label: "Collab Call", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      default:
        return { label: "Shared Spark", color: "bg-cream-100 text-gray-700 border-amber-200/80" };
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-gray-900 font-sans">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-gray-900/95 text-white px-5 py-3 text-sm font-medium shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 border border-gray-700/50">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-[1360px] mx-auto px-4 sm:px-8 pt-24 pb-20">
        {/* Whimsical Header Hero Section */}
        <div className="mb-8 pt-2">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              {/* Cute badge with flower */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-100 text-purple-800 border border-purple-200/80 text-xs font-semibold uppercase tracking-wider mb-2.5 shadow-2xs">
                <CuteFlower className="w-4 h-4 text-purple-500" />
                <span>The Community Constellation</span>
              </div>

              {/* Main Whimsical Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Developer <span className="font-hand text-4xl sm:text-5xl md:text-6xl text-purple-700 font-semibold">Network</span>
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1.5 max-w-xl leading-relaxed">
                Connect with student builders, share project sparks, and find collaborators in our cozy developer garden.
              </p>
            </div>

            {/* View Mode Toggle & Search Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Trendy Mode Toggle Switcher */}
              <div className="inline-flex p-1 rounded-2xl bg-cream-100 border border-amber-200/90 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("feed")}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    viewMode === "feed"
                      ? "bg-white text-gray-900 shadow-xs border border-amber-200/70"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
                  Scrapbook Feed
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("constellation")}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    viewMode === "constellation"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  Constellation Web ✦
                </button>
              </div>

              {/* Clean Search Input */}
              <div className="relative flex-1 sm:w-64 md:w-72">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search creators, tech, sparks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-amber-200/90 text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-500 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Whimsical Wavy Accent Line */}
          <div className="mt-4 mb-2 opacity-60">
            <WavyDoodleLine className="w-full text-amber-200/90" />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {[
              { id: "all", label: "✨ All Activity" },
              { id: "projects", label: "🚀 Projects & Milestones" },
              { id: "developers", label: "👩‍💻 Creators" },
              { id: "collaboration", label: "🤝 Collab Calls" },
              { id: "following", label: "🌱 My Connections" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filter === tab.id
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-white text-gray-600 hover:text-gray-900 hover:bg-cream-100 border border-amber-200/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Constellation View Mode (Inspired by reference images 3 & 4) */}
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

        {/* Hanging Cards Gallery at the top of the Feed (Inspired by reference image 1) */}
        {viewMode === "feed" && (
          <HangingCardsHeader
            creators={suggested}
            onSelectCreator={(username) => setSearchQuery(username)}
          />
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Main Social Feed Column */}
          <div className="space-y-6">
            {/* Quick Post Composer: Cutesy & Clean */}
            <div className="relative rounded-3xl border border-amber-200/80 bg-white p-5 sm:p-6 shadow-soft">
              {/* Cute washi tape sticker accent */}
              <div className="washi-tape-mint absolute -top-2 left-8 w-16 h-3.5 rounded-xs rotate-[-1deg]" />

              <div className="flex gap-3.5 sm:gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-amber-400 text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-sm">
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : "✨"}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    rows={2}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share a little spark, milestone, question, or late-night idea..."
                    className="w-full text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-transparent resize-none focus:outline-none leading-relaxed"
                  />

                  <div className="mt-3 pt-3 border-t border-amber-100/80 flex flex-wrap items-center justify-between gap-3">
                    {/* Activity Type Selection */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-400 mr-1 font-medium">Spark type:</span>
                      {[
                        { id: "post", label: "💬 Quick Spark" },
                        { id: "project_added", label: "🚀 Milestone" },
                        { id: "collaboration", label: "🤝 Collab" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPostType(t.id)}
                          className={`text-xs px-2.5 py-1 rounded-xl transition font-medium ${
                            postType === t.id
                              ? "bg-purple-100 text-purple-700 font-semibold border border-purple-200/80"
                              : "text-gray-500 hover:bg-cream-100"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Sensible Post Button */}
                    <button
                      type="button"
                      disabled={!postContent.trim() || posting}
                      onClick={handleCreatePost}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white shadow-xs hover:shadow transition disabled:opacity-50"
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
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500 bg-white/60 rounded-3xl border border-dashed border-amber-200">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                <p className="font-hand text-lg text-gray-600">Gathering sparks from the garden…</p>
              </div>
            ) : feed.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-amber-200 bg-white/70 py-16 text-center text-gray-500">
                <Users className="w-10 h-10 mx-auto text-amber-300 mb-3" />
                <p className="font-bold text-gray-700 mb-1 text-sm">No sparks found here yet</p>
                <p className="font-hand text-base text-gray-500">
                  Try adjusting your filter or be the first to post a spark!
                </p>
              </div>
            ) : (
              feed.map((activity, idx) => {
                const badge = getActivityBadge(activity.activityType);
                const isCommentsOpen = Boolean(openComments[activity.id]);

                // Cycle cute tape styles
                const tapeStyles = [
                  "washi-tape-peach",
                  "washi-tape-lavender",
                  "washi-tape-mint",
                  "washi-tape-coral",
                ];
                const tapeStyle = tapeStyles[idx % tapeStyles.length];

                return (
                  <article
                    key={activity.id}
                    id={activity.id}
                    className="relative rounded-3xl border border-amber-200/70 bg-white shadow-soft overflow-hidden hover:shadow-soft-lg transition-all duration-300"
                  >
                    {/* Cute corner washi tape */}
                    <div
                      className={`${tapeStyle} absolute -top-2 right-8 w-14 h-3.5 rounded-xs rotate-[1.5deg] z-10`}
                    />

                    {/* Activity Body */}
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
                                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-amber-100 group-hover:ring-purple-400 transition"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-amber-400 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                                {activity.authorName?.slice(0, 2).toUpperCase() || "DV"}
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/profile/${activity.userId || activity.authorUsername}`}
                                className="font-bold text-gray-900 hover:text-purple-700 transition text-sm"
                              >
                                {activity.authorName}
                              </Link>
                              <span className="text-xs text-gray-400 font-medium">
                                @{activity.authorUsername}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                            {activity.authorHeadline && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {activity.authorHeadline}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{formatTimeAgo(activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Share Button */}
                        <button
                          type="button"
                          onClick={() => handleShare(activity.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-cream-100 transition"
                          title="Share / Copy Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Post Title */}
                      {activity.title && (
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 leading-snug">
                          {activity.title}
                        </h3>
                      )}

                      {/* Post Content */}
                      {activity.content && (
                        <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
                          {activity.content}
                        </p>
                      )}

                      {/* Media Image Attachment */}
                      {activity.mediaUrl && !activity.project && (
                        <div className="rounded-2xl overflow-hidden border border-amber-100 mb-4 bg-gray-50 max-h-[340px]">
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
                          className="group block my-4 rounded-2xl border border-amber-200/90 bg-cream-50 text-gray-900 overflow-hidden hover:border-purple-400 transition shadow-xs"
                        >
                          {activity.project.coverImageUrl && (
                            <div className="aspect-[2.4/1] w-full overflow-hidden bg-gray-100">
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
                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-purple-700 border border-purple-200"
                                  >
                                    {t}
                                  </span>
                                ))}
                                {activity.project.complexity && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    {activity.project.complexity}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-purple-600 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                                Open spark <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>

                            <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-purple-700 transition">
                              {activity.project.title}
                            </h4>
                            {activity.project.shortDescription && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                {activity.project.shortDescription}
                              </p>
                            )}
                          </div>
                        </Link>
                      )}

                      {/* Clean & Sensible Action Bar: No overlapping, generous spacing */}
                      <div className="mt-4 pt-3.5 border-t border-amber-100/80 flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Cute Heart Like Button */}
                          <button
                            type="button"
                            onClick={() => handleLikeToggle(activity.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                              activity.isLiked
                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                : "text-gray-600 hover:bg-cream-100 hover:text-gray-900"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                activity.isLiked ? "fill-rose-500 text-rose-500" : ""
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
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                              isCommentsOpen
                                ? "bg-purple-50 text-purple-700 border border-purple-200/70"
                                : "text-gray-600 hover:bg-cream-100 hover:text-gray-900"
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{activity.commentsCount}</span>
                          </button>
                        </div>

                        {/* Direct Collaboration Message Button */}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/messages?user=${activity.userId || activity.authorUsername}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Say Hi</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Accordion Section */}
                    {isCommentsOpen && (
                      <div className="bg-cream-50/80 border-t border-amber-100 px-6 sm:px-7 py-4">
                        {/* New Comment Input */}
                        <form
                          onSubmit={(e) => handleAddComment(activity.id, e)}
                          className="flex items-center gap-2.5 mb-3.5"
                        >
                          <input
                            type="text"
                            placeholder="Write a sweet constructive note..."
                            value={commentInputs[activity.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [activity.id]: e.target.value,
                              }))
                            }
                            className="flex-1 rounded-xl border border-amber-200 bg-white px-3.5 py-2 text-xs text-gray-900 shadow-2xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                          />
                          <button
                            type="submit"
                            disabled={
                              !commentInputs[activity.id]?.trim() ||
                              commentSubmitting[activity.id]
                            }
                            className="px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {commentSubmitting[activity.id] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Reply"
                            )}
                          </button>
                        </form>

                        {/* Comments Stream */}
                        <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
                          {(activity.comments || []).length === 0 ? (
                            <p className="font-hand text-base text-gray-500 italic py-1">
                              No comments yet. Leave a little note of encouragement ~
                            </p>
                          ) : (
                            (activity.comments || []).map((comment) => (
                              <div
                                key={comment.id}
                                className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-amber-100 shadow-2xs"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  {comment.authorAvatar ? (
                                    <img
                                      src={comment.authorAvatar}
                                      alt={comment.authorName}
                                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                      {comment.authorName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-gray-900">
                                        {comment.authorName}
                                      </span>
                                      <span className="text-[10px] text-gray-400">
                                        @{comment.authorUsername} ·{" "}
                                        {formatTimeAgo(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">
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
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition shrink-0"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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

          {/* Right Sidebar: The Cozy Corner */}
          <aside className="space-y-6">
            {/* Your Network Stats Card: Cute & Clean */}
            <div className="rounded-3xl border border-amber-200/80 bg-white p-5 sm:p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Your Constellation</h3>
                  <p className="font-hand text-sm text-gray-500">connections & sparks</p>
                </div>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Users className="w-4 h-4" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-2xl bg-cream-50 border border-amber-100">
                  <p className="text-[11px] text-gray-500 font-medium">Connections</p>
                  <p className="text-2xl font-black text-gray-900 mt-0.5">
                    {connections?.accepted?.length || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100">
                  <p className="text-[11px] text-purple-700 font-medium">Pending</p>
                  <p className="text-2xl font-black text-purple-700 mt-0.5">
                    {connections?.pendingIncoming?.length || 0}
                  </p>
                </div>
              </div>

              <Link
                to="/messages"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-xs font-semibold hover:bg-gray-800 transition shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Open Messages
              </Link>
            </div>

            {/* Pending Requests Box */}
            {(connections?.pendingIncoming?.length || 0) > 0 && (
              <div className="rounded-3xl border border-amber-300 bg-amber-50/60 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Connection Requests ({(connections?.pendingIncoming?.length || 0)})
                </div>

                <div className="space-y-3">
                  {(connections?.pendingIncoming || []).map((conn) => (
                    <div
                      key={conn.id}
                      className="p-3 rounded-2xl bg-white border border-amber-200/80 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
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
                            className="text-xs font-bold text-gray-900 hover:text-purple-700 truncate block"
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
                          className="flex-1 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition"
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

            {/* Suggested Creators Box: Cutesy polaroid tiles */}
            <div className="rounded-3xl border border-amber-200/80 bg-white p-5 sm:p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm">
                  Suggested Creators
                </h3>
                <span className="font-hand text-sm text-purple-600 font-semibold">explore ✦</span>
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
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-amber-100"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-amber-400 text-white font-bold flex items-center justify-center text-xs">
                              {dev.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/profile/${dev.id || dev.username}`}
                            className="text-xs font-bold text-gray-900 hover:text-purple-700 truncate block"
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
                            : "bg-purple-50 text-purple-700 hover:bg-purple-100"
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
