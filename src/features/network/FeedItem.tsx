import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Heart, Loader2, MessageSquare, Pencil, Send, Share2, Trash2 } from "lucide-react";
import {
  addActivityComment,
  deleteActivityComment,
  deletePost,
  fetchActivityComments,
  toggleActivityLike,
  updatePost,
} from "../../api/network";
import { queryKeys } from "../../api/queryKeys";
import { FeedProjectStats } from "../../components/FeedProjectStats";
import type { ActivityComment, FeedActivity } from "../../types/network";
import { getApiErrorMessage } from "../../utils/apiError";
import { getTechStackChipClasses } from "../../utils/techStackChipStyle";

function formatTimeAgo(isoString: string): string {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (!Number.isFinite(mins)) return "";
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

const BADGES: Record<string, [string, string]> = {
  post: ["Shared an update", "bg-gray-50 text-gray-700 border-gray-200"],
  milestone: ["Milestone", "bg-emerald-50 text-emerald-700 border-emerald-200"],
  collab_call: ["Looking for collaborators", "bg-indigo-50 text-indigo-700 border-indigo-200"],
  project_update: ["Project update", "bg-blue-50 text-blue-700 border-blue-200"],
  project_added: ["Added new project", "bg-blue-50 text-blue-700 border-blue-200"],
  project_analyzed: ["Analyzed project", "bg-purple-50 text-purple-700 border-purple-200"],
  profile_updated: ["Updated profile", "bg-emerald-50 text-emerald-700 border-emerald-200"],
  wrap_up_published: ["Published monthly wrap-up", "bg-amber-50 text-amber-700 border-amber-200"],
  collaboration: ["Joined collaboration", "bg-indigo-50 text-indigo-700 border-indigo-200"],
};

function Avatar({ name, url, className }: { name: string; url?: string | null; className: string }) {
  return url ? (
    <img src={url} alt={name} className={`${className} object-cover`} />
  ) : (
    <div className={`${className} bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

/** One feed post. In the feed it shows the latest two comments; on its own page (`expanded`) every comment, paged. */
export function FeedItem({ activity, expanded = false, notify }: {
  activity: FeedActivity;
  expanded?: boolean;
  notify: (message: string) => void;
}) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.feed });
  const [like, setLike] = useState<{ isLiked: boolean; likesCount: number } | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(expanded);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const shown = like ?? activity;
  const [label, color] = BADGES[activity.activityType] ?? BADGES.post!;

  const allComments = useInfiniteQuery({
    queryKey: [...queryKeys.activity(activity.id), "comments"],
    queryFn: ({ pageParam }) => fetchActivityComments(activity.id, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextPage,
    enabled: expanded,
  });
  const comments: ActivityComment[] = expanded
    ? (allComments.data?.pages.flatMap((p) => p.items) ?? []).slice().reverse()
    : activity.comments;

  async function run(action: () => Promise<unknown>, failure: string) {
    setBusy(true);
    try {
      await action();
      await refresh();
    } catch (err) {
      notify(getApiErrorMessage(err) || failure);
    } finally {
      setBusy(false);
    }
  }

  async function toggleLike() {
    setLike({ isLiked: !shown.isLiked, likesCount: Math.max(0, shown.likesCount + (shown.isLiked ? -1 : 1)) });
    try {
      setLike(await toggleActivityLike(activity.id));
      await refresh();
    } catch {
      notify("Could not update like");
    }
    setLike(null);
  }

  function share() {
    const url = `${window.location.origin}/network/post/${activity.id}`;
    void navigator.clipboard?.writeText(url);
    notify("Link copied to clipboard!");
  }

  return (
    <article id={activity.id} className="rounded-3xl border border-gray-200/90 bg-white shadow-sm overflow-hidden hover:shadow-md transition duration-200">
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${activity.userId || activity.authorUsername}`} className="block shrink-0">
              <Avatar name={activity.authorName} url={activity.authorAvatar} className="w-12 h-12 rounded-2xl text-base" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/profile/${activity.userId || activity.authorUsername}`} className="font-bold text-gray-900 hover:text-blue-600 transition">
                  {activity.authorName}
                </Link>
                <span className="text-xs text-gray-400">@{activity.authorUsername}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${color}`}>{label}</span>
              </div>
              {activity.authorHeadline && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{activity.authorHeadline}</p>}
              <Link to={`/network/post/${activity.id}`} className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1 hover:underline">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(activity.createdAt)}</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {activity.canEdit && (
              <>
                <button type="button" title="Edit post" disabled={busy} onClick={() => setEditing(activity.content ?? "")}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" title="Delete post" disabled={busy}
                  onClick={() => window.confirm("Delete this post?") &&
                    void run(async () => { await deletePost(activity.id); if (expanded) navigate("/network"); }, "Could not delete post")}
                  className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-gray-100 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button type="button" onClick={share} title="Copy link" className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activity.title && <h3 className="text-lg font-bold text-gray-900 mb-2">{activity.title}</h3>}
        {editing !== null ? (
          <form className="mb-4 space-y-2" onSubmit={(e) => {
            e.preventDefault();
            void run(async () => { await updatePost(activity.id, { content: editing.trim() }); setEditing(null); }, "Could not save post");
          }}>
            <textarea value={editing} onChange={(e) => setEditing(e.target.value)} rows={3} aria-label="Edit post"
              className="w-full rounded-xl border border-gray-200 p-3 text-sm" />
            <div className="flex gap-2">
              <button type="submit" disabled={busy || !editing.trim()} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold">Cancel</button>
            </div>
          </form>
        ) : activity.content && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">{activity.content}</p>
        )}

        {activity.mediaUrl && !activity.project && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 mb-4 bg-gray-50 max-h-[360px]">
            <img src={activity.mediaUrl} alt="Activity attachment" className="w-full h-full object-cover" />
          </div>
        )}

        {activity.project && (
          <Link to={`/project/${activity.project.id}`}
            className="group block my-4 rounded-2xl border border-gray-200 bg-slate-900 text-white overflow-hidden hover:border-blue-500 transition shadow-sm">
            {activity.project.coverImageUrl && (
              <div className="aspect-[2.5/1] w-full overflow-hidden bg-slate-800">
                <img src={activity.project.coverImageUrl} alt={activity.project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
            )}
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(activity.project.techStacks || []).map((t) => (
                    <span key={t} className={getTechStackChipClasses(t, "onDark")}>{t}</span>
                  ))}
                </div>
                <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                  Open project <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition">{activity.project.title}</h4>
              {activity.project.shortDescription && (
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{activity.project.shortDescription}</p>
              )}
            </div>
          </Link>
        )}
        {activity.project && !activity.isDemo && <FeedProjectStats project={activity.project} />}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button type="button" onClick={() => void toggleLike()} aria-label="Like post"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                shown.isLiked ? "bg-rose-50 text-rose-600 border border-rose-200" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
              <Heart className={`w-4 h-4 ${shown.isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
              <span>{shown.likesCount}</span>
            </button>
            <button type="button" onClick={() => setCommentsOpen((o) => !o)} aria-label="Comments"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                commentsOpen ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
              <MessageSquare className="w-4 h-4" />
              <span>{activity.commentsCount}</span>
            </button>
          </div>
          <button type="button" onClick={() => navigate(`/messages?user=${activity.userId || activity.authorUsername}`)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition">
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Message</span>
          </button>
        </div>
      </div>

      {commentsOpen && (
        <div className="bg-gray-50/70 border-t border-gray-100 px-6 sm:px-8 py-5">
          <form className="flex items-center gap-3 mb-4" onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await addActivityComment(activity.id, draft.trim());
              setDraft("");
            }, "Failed to post comment");
          }}>
            <input type="text" placeholder="Write a constructive comment..." value={draft} aria-label="Write a comment"
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button type="submit" disabled={!draft.trim() || busy}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reply"}
            </button>
          </form>

          {expanded && allComments.hasNextPage && (
            <button type="button" className="mb-3 text-xs font-semibold text-blue-600" disabled={allComments.isFetchingNextPage}
              onClick={() => void allComments.fetchNextPage()}>
              Load older comments
            </button>
          )}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No comments yet. Start the conversation!</p>
            ) : comments.map((comment) => (
              <div key={comment.id} className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <Avatar name={comment.authorName} url={comment.authorAvatar} className="w-7 h-7 rounded-full text-[10px] shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900">{comment.authorName}</span>
                      <span className="text-[10px] text-gray-400">@{comment.authorUsername} · {formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-700 mt-0.5">{comment.commentText}</p>
                  </div>
                </div>
                {comment.canDelete && (
                  <button type="button" title="Delete comment" disabled={busy}
                    onClick={() => void run(() => deleteActivityComment(comment.id), "Could not delete comment")}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {!expanded && activity.commentsCount > comments.length && (
            <Link to={`/network/post/${activity.id}`} className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline">
              View all {activity.commentsCount} comments
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
