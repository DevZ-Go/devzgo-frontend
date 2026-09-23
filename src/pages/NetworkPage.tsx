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
import { getTechStackChipClasses } from "../utils/techStackChipStyle";
import { useAuth } from "../auth/AuthContext";

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
      const data = await fetchFeed(filter, searchQuery);
      setFeed(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

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
      showToast("Post shared to network!");
      await loadFeed();
    } catch {
      showToast("Failed to share post");
    } finally {
      setPosting(false);
    }
  }

  async function handleLikeToggle(activityId: string) {
    // Optimistic UI update
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
      // rollback on error
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
      showToast("Link copied to clipboard!");
    } else {
      showToast("Copied link: " + url);
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
      showToast("Failed to send request");
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "project_added":
        return { label: "Added new project", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "project_analyzed":
        return { label: "Analyzed project", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "profile_updated":
        return { label: "Updated profile", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "wrap_up_published":
        return { label: "Published monthly wrap-up", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "collaboration":
        return { label: "Joined collaboration", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      default:
        return { label: "Shared an update", color: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

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
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : "JR"}
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
                        { id: "project_added", label: "Milestone" },
                        { id: "collaboration", label: "Collab Call" },
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
              feed.map((activity) => {
                const badge = getActivityBadge(activity.activityType);
                const isCommentsOpen = Boolean(openComments[activity.id]);

                return (
                  <article
                    key={activity.id}
                    id={activity.id}
                    className="rounded-3xl border border-gray-200/90 bg-white shadow-sm overflow-hidden hover:shadow-md transition duration-200"
                  >
                    {/* Activity Header */}
                    <div className="p-6 sm:p-7">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/profile/${activity.userId || activity.authorUsername}`}
                            className="group block shrink-0"
                          >
                            {activity.authorAvatar ? (
                              <img
                                src={activity.authorAvatar}
                                alt={activity.authorName}
                                className="w-12 h-12 rounded-2xl object-cover ring-1 ring-gray-200 group-hover:ring-blue-500 transition"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
                                {activity.authorName?.slice(0, 2).toUpperCase() || "DV"}
                              </div>
                            )}
                          </Link>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/profile/${activity.userId || activity.authorUsername}`}
                                className="font-bold text-gray-900 hover:text-blue-600 transition"
                              >
                                {activity.authorName}
                              </Link>
                              <span className="text-xs text-gray-400">
                                @{activity.authorUsername}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                            {activity.authorHeadline && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                {activity.authorHeadline}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleShare(activity.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                          title="Share / Copy Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Post Content */}
                      {activity.title && (
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {activity.title}
                        </h3>
                      )}
                      {activity.content && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
                          {activity.content}
                        </p>
                      )}

                      {/* Attached Media */}
                      {activity.mediaUrl && !activity.project && (
                        <div className="rounded-2xl overflow-hidden border border-gray-100 mb-4 bg-gray-50 max-h-[360px]">
                          <img
                            src={activity.mediaUrl}
                            alt="Activity attachment"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Project Preview Card */}
                      {activity.project && (
                        <Link
                          to={`/project/${activity.project.id}`}
                          className="group block my-4 rounded-2xl border border-gray-200 bg-slate-900 text-white overflow-hidden hover:border-blue-500 transition shadow-sm"
                        >
                          {activity.project.coverImageUrl && (
                            <div className="aspect-[2.5/1] w-full overflow-hidden bg-slate-800">
                              <img
                                src={activity.project.coverImageUrl}
                                alt={activity.project.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {(activity.project.techStacks || []).map((t) => (
                                  <span
                                    key={t}
                                    className={getTechStackChipClasses(t, "onDark")}
                                  >
                                    {t}
                                  </span>
                                ))}
                                {activity.project.complexity && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                    {activity.project.complexity}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-blue-400 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                                Open project <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>

                            <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition">
                              {activity.project.title}
                            </h4>
                            {activity.project.shortDescription && (
                              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                {activity.project.shortDescription}
                              </p>
                            )}
                          </div>
                        </Link>
                      )}

                      {/* Interactive Action Bar */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-4">
                          {/* Like Button */}
                          <button
                            type="button"
                            onClick={() => handleLikeToggle(activity.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                              activity.isLiked
                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{activity.commentsCount}</span>
                          </button>
                        </div>

                        {/* Direct Collaboration / Message button */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/messages?user=${activity.userId || activity.authorUsername}`
                              )
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Message</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comments Accordion Section */}
                    {isCommentsOpen && (
                      <div className="bg-gray-50/70 border-t border-gray-100 px-6 sm:px-8 py-5">
                        {/* New Comment Input */}
                        <form
                          onSubmit={(e) => handleAddComment(activity.id, e)}
                          className="flex items-center gap-3 mb-4"
                        >
                          <input
                            type="text"
                            placeholder="Write a constructive comment..."
                            value={commentInputs[activity.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [activity.id]: e.target.value,
                              }))
                            }
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="submit"
                            disabled={
                              !commentInputs[activity.id]?.trim() ||
                              commentSubmitting[activity.id]
                            }
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {commentSubmitting[activity.id] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Reply"
                            )}
                          </button>
                        </form>

                        {/* Comments Stream */}
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {(activity.comments || []).length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2">
                              No comments yet. Start the conversation!
                            </p>
                          ) : (
                            (activity.comments || []).map((comment) => (
                              <div
                                key={comment.id}
                                className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-2xs"
                              >
                                <div className="flex items-start gap-2.5">
                                  {comment.authorAvatar ? (
                                    <img
                                      src={comment.authorAvatar}
                                      alt={comment.authorName}
                                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                      {comment.authorName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-gray-900">
                                        {comment.authorName}
                                      </span>
                                      <span className="text-[10px] text-gray-400">
                                        @{comment.authorUsername} ·{" "}
                                        {formatTimeAgo(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-700 mt-0.5">
                                      {comment.commentText}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteComment(activity.id, comment.id)
                                  }
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">Connections</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">
                    {connections?.accepted?.length || 0}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">Pending</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">
                    {connections?.pendingIncoming?.length || 0}
                  </p>
                </div>
              </div>

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
