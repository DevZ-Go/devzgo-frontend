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

function formatTimeAgo(isoString: string): string {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (!Number.isFinite(mins)) return "";
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

const GREEN = "bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]";
const AMBER = "bg-[#FEF3C7] text-[#78350F] border border-[#D97706]";
const RED = "bg-[#FEE2E2] text-[#991B1B] border border-[#DC2626]";
const BADGES: Record<string, [string, string]> = {
  post: ["SHARED SPARK", "bg-stone-100 text-stone-700 border border-stone-300"],
  milestone: ["MILESTONE", AMBER],
  collab_call: ["COLLAB CALL", GREEN],
  project_update: ["PROJECT UPDATE", AMBER],
  project_added: ["NEW PROJECT", GREEN],
  project_analyzed: ["CODE SPARK", AMBER],
  profile_updated: ["PROFILE GLOW", GREEN],
  wrap_up_published: ["MONTHLY WRAP", RED],
  collaboration: ["JOINED A TEAM", GREEN],
};

function Avatar({ name, url, className }: { name: string; url?: string | null; className: string }) {
  return url ? (
    <img src={url} alt={name} className={`${className} object-cover`} />
  ) : (
    <div className={`${className} bg-[#DCFCE7] text-[#14532D] font-bold flex items-center justify-center border border-forest-600`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

/** One feed post. In the feed it shows the latest two comments; on its own page (`expanded`) every comment, paged. */
export function FeedItem({ activity, expanded = false, notify, index = 0 }: {
  activity: FeedActivity;
  expanded?: boolean;
  notify: (message: string) => void;
  index?: number;
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
  const green = index % 2 === 0;
  const profile = `/profile/${activity.userId || activity.authorUsername}`;

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
    void navigator.clipboard?.writeText(`${window.location.origin}/network/post/${activity.id}`);
    notify("Link copied to clipboard");
  }

  const iconButton = "p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition";

  return (
    <article id={activity.id} className="relative rounded-2xl border-2 border-[#1c1917]/20 bg-white shadow-xs hover:shadow-sm transition-all duration-200">
      <div className={`${green ? "washi-tape-green" : "washi-tape-red"} absolute -top-2.5 right-6 w-18 h-3.5 rounded-xs rotate-[1.5deg] z-10 flex items-center justify-center text-[10px] text-[#1C1917] font-bold font-sans tracking-wider border border-[#1C1917]/20`}>
        {green ? "GARDEN" : "SPARK"}
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={profile} className="group block shrink-0">
              <Avatar name={activity.authorName || "DV"} url={activity.authorAvatar} className="w-11 h-11 rounded-xl font-cursive text-lg" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={profile} className="font-cursive text-2xl font-bold text-[#1C1917] hover:text-crimson-600 transition">
                  {activity.authorName}
                </Link>
                <span className="font-sans text-xs text-stone-500 font-medium">@{activity.authorUsername}</span>
                <span className={`font-sans text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${color}`}>{label}</span>
              </div>
              {activity.authorHeadline && (
                <p className="font-sans text-xs text-stone-600 mt-0.5 truncate font-normal">{activity.authorHeadline}</p>
              )}
              <Link to={`/network/post/${activity.id}`} className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5 font-sans hover:underline">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(activity.createdAt)}</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {activity.canEdit && (
              <>
                <button type="button" title="Edit post" disabled={busy} onClick={() => setEditing(activity.content ?? "")} className={iconButton}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" title="Delete post" disabled={busy} className={`${iconButton} hover:text-crimson-600`}
                  onClick={() => window.confirm("Delete this post?") &&
                    void run(async () => { await deletePost(activity.id); if (expanded) navigate("/network"); }, "Could not delete post")}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button type="button" onClick={share} title="Share / Copy Link" className={iconButton}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activity.title && (
          <h3 className="font-cursive text-2xl sm:text-3xl font-bold text-[#1C1917] mb-2 leading-tight">{activity.title}</h3>
        )}
        {editing !== null ? (
          <form className="mb-3.5 space-y-2" onSubmit={(e) => {
            e.preventDefault();
            void run(async () => { await updatePost(activity.id, { content: editing.trim() }); setEditing(null); }, "Could not save post");
          }}>
            <textarea value={editing} onChange={(e) => setEditing(e.target.value)} rows={3} aria-label="Edit post"
              className="w-full rounded-xl border border-stone-300 bg-[#FAF7EE] p-3 font-sans text-sm" />
            <div className="flex gap-2">
              <button type="submit" disabled={busy || !editing.trim()}
                className="rounded-lg bg-[#DCFCE7] border border-[#15803D] px-3 py-1.5 font-sans text-xs font-semibold text-[#14532D] disabled:opacity-50">Save</button>
              <button type="button" onClick={() => setEditing(null)}
                className="rounded-lg border border-stone-300 px-3 py-1.5 font-sans text-xs font-semibold">Cancel</button>
            </div>
          </form>
        ) : activity.content && (
          <p className="font-sans text-sm text-stone-800 whitespace-pre-wrap leading-relaxed mb-3.5">{activity.content}</p>
        )}

        {activity.mediaUrl && !activity.project && (
          <div className="rounded-xl overflow-hidden border border-stone-200 mb-3.5 bg-gray-50 max-h-[340px]">
            <img src={activity.mediaUrl} alt="Activity attachment" className="w-full h-full object-cover" />
          </div>
        )}

        {activity.project && (
          <Link to={`/project/${activity.project.id}`}
            className="group block my-3 rounded-xl border border-forest-600/40 bg-[#FDFBF7] text-[#1C1917] overflow-hidden hover:border-crimson-600 transition shadow-2xs">
            {activity.project.coverImageUrl && (
              <div className="aspect-[2.6/1] w-full overflow-hidden bg-gray-100">
                <img src={activity.project.coverImageUrl} alt={activity.project.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition duration-300" />
              </div>
            )}
            <div className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(activity.project.techStacks || []).map((t) => (
                    <span key={t} className={`px-2 py-0.5 rounded-md font-sans text-[10px] font-semibold ${GREEN}`}>{t}</span>
                  ))}
                  {activity.project.complexity && (
                    <span className={`font-sans text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${RED}`}>
                      {activity.project.complexity}
                    </span>
                  )}
                </div>
                <span className="font-sans text-xs text-forest-700 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                  Open spark <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="font-cursive text-xl sm:text-2xl font-bold text-[#1C1917] group-hover:text-forest-700 transition">{activity.project.title}</h4>
              {activity.project.shortDescription && (
                <p className="font-sans text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">{activity.project.shortDescription}</p>
              )}
            </div>
          </Link>
        )}
        {activity.project && !activity.isDemo && <FeedProjectStats project={activity.project} />}

        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => void toggleLike()} aria-label="Like post"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold transition ${
                shown.isLiked ? RED : "text-stone-700 hover:bg-stone-50 border border-stone-200"}`}>
              <Heart className={`w-3.5 h-3.5 ${shown.isLiked ? "fill-crimson-600 text-crimson-600" : ""}`} />
              <span>{shown.likesCount}</span>
            </button>
            <button type="button" onClick={() => setCommentsOpen((o) => !o)} aria-label="Comments"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold transition ${
                commentsOpen ? "bg-[#DCFCE7] text-[#14532D] border border-[#15803D]" : "text-stone-700 hover:bg-stone-50 border border-stone-200"}`}>
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{activity.commentsCount} notes</span>
            </button>
          </div>
          <button type="button" onClick={() => navigate(`/messages?user=${activity.userId || activity.authorUsername}`)}
            className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-[#14532D] px-3.5 py-1.5 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#15803D] shadow-2xs transition">
            <Send className="w-3 h-3" />
            <span>Say Hi 💌</span>
          </button>
        </div>
      </div>

      {commentsOpen && (
        <div className="bg-[#FAF7EE] border-t border-stone-100 px-5 sm:px-6 py-4 rounded-b-2xl">
          <form className="flex items-center gap-2.5 mb-3" onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await addActivityComment(activity.id, draft.trim());
              setDraft("");
            }, "Failed to post comment");
          }}>
            <input type="text" placeholder="Write a constructive note on this spark..." value={draft} aria-label="Write a comment"
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-sans text-xs text-[#1C1917] shadow-2xs focus:border-forest-600 focus:outline-none" />
            <button type="submit" disabled={!draft.trim() || busy}
              className="px-3.5 py-1.5 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#14532D] border border-[#15803D] font-sans text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reply"}
            </button>
          </form>

          {expanded && allComments.hasNextPage && (
            <button type="button" className="mb-3 font-sans text-xs font-semibold text-forest-700" disabled={allComments.isFetchingNextPage}
              onClick={() => void allComments.fetchNextPage()}>
              Load older notes
            </button>
          )}
          <div className={`space-y-2.5 ${expanded ? "" : "max-h-[240px] overflow-y-auto"}`}>
            {comments.length === 0 ? (
              <p className="font-cursive text-xl text-forest-800 font-semibold py-1">No notes yet. Leave a sweet word of encouragement ~</p>
            ) : comments.map((comment) => (
              <div key={comment.id} className="group flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Avatar name={comment.authorName} url={comment.authorAvatar} className="w-7 h-7 rounded-full shrink-0 mt-0.5 text-[10px]" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-cursive text-lg font-bold text-[#1C1917]">{comment.authorName}</span>
                      <span className="text-[11px] text-stone-400 font-sans">@{comment.authorUsername} · {formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="font-sans text-xs text-stone-700 mt-0.5 leading-relaxed">{comment.commentText}</p>
                  </div>
                </div>
                {comment.canDelete && (
                  <button type="button" title="Delete comment" disabled={busy}
                    onClick={() => void run(() => deleteActivityComment(comment.id), "Could not delete comment")}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-gray-400 hover:text-crimson-600 transition shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {!expanded && activity.commentsCount > comments.length && (
            <Link to={`/network/post/${activity.id}`} className="mt-3 inline-block font-sans text-xs font-semibold text-forest-700 hover:underline">
              View all {activity.commentsCount} notes
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
