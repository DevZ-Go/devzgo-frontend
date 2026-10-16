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
      showToast("Spark pinned to the network! 🌿");
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
        return { label: "NEW PROJECT", color: "bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]" };
      case "project_analyzed":
        return { label: "CODE SPARK", color: "bg-[#FEF3C7] text-[#78350F] border border-[#D97706]" };
      case "profile_updated":
        return { label: "PROFILE GLOW", color: "bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]" };
      case "wrap_up_published":
        return { label: "MONTHLY WRAP", color: "bg-[#FEE2E2] text-[#991B1B] border border-[#DC2626]" };
      case "collaboration":
        return { label: "COLLAB CALL", color: "bg-[#DCFCE7] text-[#14532D] border border-[#15803D]" };
      default:
        return { label: "SHARED SPARK", color: "bg-stone-100 text-stone-700 border border-stone-300" };
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-[#1C1917] font-sans antialiased">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-white text-[#14532D] px-4 py-2.5 text-sm font-semibold font-sans shadow-xl flex items-center gap-2 border-2 border-[#15803D] animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
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
                A cozy community feed where student builders share milestones, sparks, and code.{" "}
                <span className="font-cursive text-xl text-forest-700 font-bold ml-0.5">
                  “grow and connect together” 🌿
                </span>
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
                  Constellation Web ✦
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
              creators={suggested}
              activities={feed}
              onConnect={handleSendConnect}
              requestedUsers={requestedUsers}
            />
          </div>
        ) : null}

        {/* Hanging Cards Gallery at the top of the Feed */}
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
            {/* Quick Post Composer: Clean & Straight */}
            <div className="relative rounded-2xl border-2 border-forest-600/40 bg-white p-5 sm:p-6 shadow-xs">
              {/* Red Washi Tape Sticker */}
              <div className="washi-tape-red absolute -top-2.5 left-6 w-24 h-4 rounded-xs rotate-[-1deg] flex items-center justify-center text-[10px] text-[#1C1917] font-bold font-sans tracking-wider border border-[#1C1917]/20">
                SKETCHPAD
              </div>

              <div className="flex gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#14532D] font-sans font-bold flex items-center justify-center shrink-0 shadow-xs text-base border border-[#15803D]">
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : "🌱"}
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
                        { id: "project_added", label: "Milestone" },
                        { id: "collaboration", label: "Collab Call" },
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
                      Drop Spark ✦
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
              feed.map((activity, idx) => {
                const badge = getActivityBadge(activity.activityType);
                const isCommentsOpen = Boolean(openComments[activity.id]);
                const isGreen = idx % 2 === 0;

                return (
                  <article
                    key={activity.id}
                    id={activity.id}
                    className="relative rounded-2xl border-2 border-[#1c1917]/20 bg-white shadow-xs overflow-hidden hover:shadow-sm transition-all duration-200"
                  >
                    {/* Washi tape on top right */}
                    <div
                      className={`${
                        isGreen ? "washi-tape-green" : "washi-tape-red"
                      } absolute -top-2.5 right-6 w-18 h-3.5 rounded-xs rotate-[1.5deg] z-10 flex items-center justify-center text-[10px] text-[#1C1917] font-bold font-sans tracking-wider border border-[#1C1917]/20`}
                    >
                      {isGreen ? "GARDEN" : "SPARK"}
                    </div>

                    <div className="p-5 sm:p-6">
                      {/* Author Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Link
                            to={`/profile/${activity.userId || activity.authorUsername}`}
                            className="group block shrink-0"
                          >
                            {activity.authorAvatar ? (
                              <img
                                src={activity.authorAvatar}
                                alt={activity.authorName}
                                className="w-11 h-11 rounded-xl object-cover ring-2 ring-forest-600/40 group-hover:ring-crimson-500 transition"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#14532D] font-cursive font-bold flex items-center justify-center text-lg shadow-xs border border-forest-600">
                                {activity.authorName?.slice(0, 2).toUpperCase() || "DV"}
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Whimsical Cursive ONLY for author heading */}
                              <Link
                                to={`/profile/${activity.userId || activity.authorUsername}`}
                                className="font-cursive text-2xl font-bold text-[#1C1917] hover:text-crimson-600 transition"
                              >
                                {activity.authorName}
                              </Link>
                              <span className="font-sans text-xs text-stone-500 font-medium">
                                @{activity.authorUsername}
                              </span>
                              <span
                                className={`font-sans text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                            {activity.authorHeadline && (
                              <p className="font-sans text-xs text-stone-600 mt-0.5 truncate font-normal">
                                {activity.authorHeadline}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5 font-sans">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Share Button */}
                        <button
                          type="button"
                          onClick={() => handleShare(activity.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition"
                          title="Share / Copy Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Post Title: Whimsical Cursive ONLY */}
                      {activity.title && (
                        <h3 className="font-cursive text-2xl sm:text-3xl font-bold text-[#1C1917] mb-2 leading-tight">
                          {activity.title}
                        </h3>
                      )}

                      {/* Post Content: Clean Straight Body Text */}
                      {activity.content && (
                        <p className="font-sans text-sm text-stone-800 whitespace-pre-wrap leading-relaxed mb-3.5">
                          {activity.content}
                        </p>
                      )}

                      {/* Media Image Attachment */}
                      {activity.mediaUrl && !activity.project && (
                        <div className="rounded-xl overflow-hidden border border-stone-200 mb-3.5 bg-gray-50 max-h-[340px]">
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
                          className="group block my-3 rounded-xl border border-forest-600/40 bg-[#FDFBF7] text-[#1C1917] overflow-hidden hover:border-crimson-600 transition shadow-2xs"
                        >
                          {activity.project.coverImageUrl && (
                            <div className="aspect-[2.6/1] w-full overflow-hidden bg-gray-100">
                              <img
                                src={activity.project.coverImageUrl}
                                alt={activity.project.title}
                                className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {(activity.project.techStacks || []).map((t) => (
                                  <span
                                    key={t}
                                    className="px-2 py-0.5 rounded-md font-sans text-[10px] font-semibold bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]"
                                  >
                                    {t}
                                  </span>
                                ))}
                                {activity.project.complexity && (
                                  <span className="font-sans text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#FEE2E2] text-[#991B1B] border border-[#DC2626]">
                                    {activity.project.complexity}
                                  </span>
                                )}
                              </div>
                              <span className="font-sans text-xs text-forest-700 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                                Open spark <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>

                            <h4 className="font-cursive text-xl sm:text-2xl font-bold text-[#1C1917] group-hover:text-forest-700 transition">
                              {activity.project.title}
                            </h4>
                            {activity.project.shortDescription && (
                              <p className="font-sans text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                                {activity.project.shortDescription}
                              </p>
                            )}
                          </div>
                        </Link>
                      )}

                      {/* Action Bar: Straight, Clean, Neatly Positioned */}
                      <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {/* Heart Button */}
                          <button
                            type="button"
                            onClick={() => handleLikeToggle(activity.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold transition ${
                              activity.isLiked
                                ? "bg-[#FEE2E2] text-[#991B1B] border border-[#DC2626]"
                                : "text-stone-700 hover:bg-stone-50 border border-stone-200"
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
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
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold transition ${
                              isCommentsOpen
                                ? "bg-[#DCFCE7] text-[#14532D] border border-[#15803D]"
                                : "text-stone-700 hover:bg-stone-50 border border-stone-200"
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{activity.commentsCount} notes</span>
                          </button>
                        </div>

                        {/* Direct Say Hi Button */}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/messages?user=${activity.userId || activity.authorUsername}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-[#14532D] px-3.5 py-1.5 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#15803D] shadow-2xs transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Say Hi 💌</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Accordion Section */}
                    {isCommentsOpen && (
                      <div className="bg-[#FAF7EE] border-t border-stone-100 px-5 sm:px-6 py-4">
                        <form
                          onSubmit={(e) => handleAddComment(activity.id, e)}
                          className="flex items-center gap-2.5 mb-3"
                        >
                          <input
                            type="text"
                            placeholder="Write a constructive note on this spark..."
                            value={commentInputs[activity.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [activity.id]: e.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-sans text-xs text-[#1C1917] shadow-2xs focus:border-forest-600 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={
                              !commentInputs[activity.id]?.trim() ||
                              commentSubmitting[activity.id]
                            }
                            className="px-3.5 py-1.5 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#14532D] border border-[#15803D] font-sans text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {commentSubmitting[activity.id] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Reply"
                            )}
                          </button>
                        </form>

                        <div className="space-y-2.5 max-h-[240px] overflow-y-auto">
                          {(activity.comments || []).length === 0 ? (
                            <p className="font-cursive text-xl text-forest-800 font-semibold py-1">
                              No notes yet. Leave a sweet word of encouragement ~
                            </p>
                          ) : (
                            (activity.comments || []).map((comment) => (
                              <div
                                key={comment.id}
                                className="group flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  {comment.authorAvatar ? (
                                    <img
                                      src={comment.authorAvatar}
                                      alt={comment.authorName}
                                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#14532D] font-sans font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px] border border-forest-600">
                                      {comment.authorName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-cursive text-lg font-bold text-[#1C1917]">
                                        {comment.authorName}
                                      </span>
                                      <span className="text-[11px] text-stone-400 font-sans">
                                        @{comment.authorUsername} ·{" "}
                                        {formatTimeAgo(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="font-sans text-xs text-stone-700 mt-0.5 leading-relaxed">
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
                <div className="p-3 rounded-xl bg-[#F0FDF4] border border-forest-300">
                  <p className="font-sans text-xs text-[#14532D] font-medium">Connections</p>
                  <p className="font-sans text-2xl font-extrabold text-[#14532D] mt-0.5">
                    {connections?.accepted?.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#FEF2F2] border border-crimson-300">
                  <p className="font-sans text-xs text-[#991B1B] font-medium">Pending</p>
                  <p className="font-sans text-2xl font-extrabold text-[#991B1B] mt-0.5">
                    {connections?.pendingIncoming?.length || 0}
                  </p>
                </div>
              </div>

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
                  <Sparkles className="w-4 h-4 text-crimson-600" />
                  Connection Requests ({(connections?.pendingIncoming?.length || 0)})
                </div>

                <div className="space-y-3">
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
                            className="font-cursive text-xl font-bold text-[#1C1917] hover:text-crimson-700 truncate block leading-tight"
                          >
                            {conn.partner.fullName || conn.partner.username}
                          </Link>
                          {conn.partner.headline && (
                            <p className="font-sans text-[11px] text-stone-500 truncate">
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
                <span className="font-sans text-xs text-forest-700 font-semibold">explore ✦</span>
              </div>

              <div className="space-y-3">
                {suggested.map((dev) => {
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
                            className="font-cursive text-xl font-bold text-[#1C1917] hover:text-forest-700 truncate block leading-tight"
                          >
                            {dev.fullName || dev.username}
                          </Link>
                          {dev.headline && (
                            <p className="font-sans text-[11px] text-stone-500 truncate">
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
