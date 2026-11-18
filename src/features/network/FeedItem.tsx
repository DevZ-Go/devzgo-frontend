import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Heart, Loader2, MessageSquare, Pencil, Send, Share2, Trash2 } from "lucide-react";
import {
  addActivityComment,
  deleteActivityComment,
  deletePost,
  fetchActivityComments,
  shareActivity,
  toggleActivityLike,
  updatePost,
} from "../../api/network";
import { queryKeys } from "../../api/queryKeys";
import { FeedProjectStats } from "../../components/FeedProjectStats";
import { ShareProjectDialog } from "../../components/ShareProjectDialog";
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

const LAVENDER = "bg-[#CDE3E8] text-[#2D120D] border border-[#2D120D]/20";
const PEACH = "bg-[#FFF8CA] text-[#2D120D] border border-[#2D120D]/25";
const BLUSH = "bg-[#6B0B0C] text-[#FFF8CA] border border-[#6B0B0C]";
const BADGES: Record<string, [string, string]> = {
  post: ["NOTE", "bg-[#CDE3E8] text-[#2D120D] border border-[#2D120D]/20"],
  spark: ["SPARK", "bg-[#6B0B0C] text-[#FFF8CA] border border-[#6B0B0C]"],
  milestone: ["MILESTONE", PEACH],
  collab_call: ["COLLAB CALL", LAVENDER],
  project_update: ["PROJECT UPDATE", PEACH],
  project_added: ["NEW PROJECT", LAVENDER],
  project_analyzed: ["CODE SPARK", PEACH],
  profile_updated: ["PROFILE GLOW", LAVENDER],
  wrap_up_published: ["MONTHLY WRAP", BLUSH],
  collaboration: ["JOINED A TEAM", LAVENDER],
};

function Avatar({ name, url, className }: { name: string; url?: string | null; className: string }) {
  return url ? (
    <img src={url} alt={name} className={`${className} object-cover`} />
  ) : (
    <div className={`${className} bg-[#CDE3E8] text-[#2D120D] font-bold flex items-center justify-center border border-[#2D120D]/25`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

/** One feed post. In the feed it shows the latest two comments; on its own page (`expanded`) every comment, paged. */
export function FeedItem({ activity, expanded = false, notify }: {
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
  const [shareProject, setShareProject] = useState(false);
  const shown = like ?? activity;
  const [label, color] = BADGES[activity.activityType] ?? BADGES.post!;
  const spark = activity.activityType === "spark";
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
    if (activity.project && /^[0-9a-f-]{36}$/i.test(activity.project.id)) {
      setShareProject(true);
      return;
    }
    void run(async () => {
      await shareActivity(activity.id);
      await navigator.clipboard?.writeText(`${window.location.origin}/network/post/${activity.id}`);
      notify("Shared. Link copied.");
    }, "Could not share post");
  }

  const iconButton = "p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition";

  return (
    <article id={activity.id} className="relative rounded-3xl border border-[#2D120D]/15 bg-white shadow-2xs hover:shadow-md transition-all duration-200">
      <div className={`${spark ? "bg-[#6B0B0C] text-[#FFF8CA] border-[#6B0B0C]" : "bg-[#CDE3E8] text-[#2D120D] border-[#2D120D]/20"} absolute -top-2.5 right-4 sm:right-6 px-3 py-0.5 rounded-full z-10 flex items-center justify-center text-[9px] font-bold font-sans tracking-widest uppercase border shadow-2xs`}>
        {spark ? "SPARK" : activity.activityType === "post" ? "NOTE" : label}
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={profile} className="group block shrink-0">
              <Avatar name={activity.authorName || "DV"} url={activity.authorAvatar} className="w-11 h-11 rounded-xl font-gift text-xl" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={profile} className="font-gift text-xl sm:text-2xl text-[#2D120D] font-bold hover:text-[#6B0B0C] transition leading-none">
                  {activity.authorName}
                </Link>
                <span className="font-sans text-xs text-[#6B0B0C] font-semibold">@{activity.authorUsername}</span>
                <span className={`font-sans text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full ${color}`}>{label}</span>
              </div>
              {activity.authorHeadline && (
                <p className="font-sans text-xs text-[#2D120D]/70 mt-0.5 truncate font-normal">{activity.authorHeadline}</p>
              )}
              <Link to={`/network/post/${activity.id}`} className="flex items-center gap-1.5 text-[11px] text-[#2D120D]/55 mt-0.5 font-sans hover:underline">
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
          <h3 className="font-gift text-2xl sm:text-3xl text-[#2D120D] font-bold mb-2 leading-tight">{activity.title}</h3>
        )}
        {editing !== null ? (
          <form className="mb-3.5 space-y-2" onSubmit={(e) => {
            e.preventDefault();
            void run(async () => { await updatePost(activity.id, { content: editing.trim() }); setEditing(null); }, "Could not save post");
          }}>
            <textarea value={editing} onChange={(e) => setEditing(e.target.value)} rows={3} aria-label="Edit post"
              className="w-full rounded-xl border border-[#2D120D]/20 bg-[#FFF8CA]/40 p-3 font-sans text-sm text-[#2D120D]" />
            <div className="flex gap-2">
              <button type="submit" disabled={busy || !editing.trim()}
                className="rounded-lg bg-[#6B0B0C] px-3 py-1.5 font-sans text-xs font-semibold text-[#FFF8CA] disabled:opacity-50">Save</button>
              <button type="button" onClick={() => setEditing(null)}
                className="rounded-lg border border-stone-300 px-3 py-1.5 font-sans text-xs font-semibold">Cancel</button>
            </div>
          </form>
        ) : activity.content && (
          <p className="font-sans text-sm text-[#2D120D] whitespace-pre-wrap leading-relaxed mb-3.5">{activity.content}</p>
        )}

        {activity.mediaUrl && !activity.project && (
          <div className="rounded-xl overflow-hidden border border-stone-200 mb-3.5 bg-gray-50 max-h-[340px]">
            <img src={activity.mediaUrl} alt="Activity attachment" className="w-full h-full object-cover" />
          </div>
        )}

        {activity.project && (
          <Link to={`/project/${activity.project.id}`}
            className="group block my-3 rounded-2xl border border-[#2D120D]/15 bg-[#FFF8CA]/45 text-[#2D120D] overflow-hidden hover:border-[#6B0B0C] transition shadow-2xs">
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
                    <span key={t} className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-semibold ${LAVENDER}`}>{t}</span>
                  ))}
                  {activity.project.complexity && (
                    <span className={`font-sans text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${BLUSH}`}>
                      {activity.project.complexity}
                    </span>
                  )}
                </div>
                <span className="font-sans text-xs text-[#6B0B0C] font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                  Open project <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="font-gift text-2xl font-bold text-[#2D120D] group-hover:text-[#6B0B0C] transition">{activity.project.title}</h4>
              {activity.project.shortDescription && (
                <p className="font-sans text-xs text-[#2D120D]/75 mt-1 line-clamp-2 leading-relaxed">{activity.project.shortDescription}</p>
              )}
            </div>
          </Link>
        )}
        {activity.project && !activity.isDemo && <FeedProjectStats project={activity.project} />}

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#2D120D]/10 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void toggleLike()} aria-label="Like post"
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-xs font-semibold transition ${
                shown.isLiked ? BLUSH : "text-[#2D120D] hover:bg-[#FFF8CA]/60 border border-[#2D120D]/20"}`}>
              <Heart className={`w-3.5 h-3.5 ${shown.isLiked ? "fill-[#FFF8CA] text-[#FFF8CA]" : ""}`} />
              <span>{shown.likesCount}</span>
            </button>
            <button type="button" onClick={() => setCommentsOpen((o) => !o)} aria-label="Comments"
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-xs font-semibold transition ${
                commentsOpen ? LAVENDER : "text-[#2D120D] hover:bg-[#FFF8CA]/60 border border-[#2D120D]/20"}`}>
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{activity.commentsCount} notes</span>
            </button>
          </div>
          <button type="button" onClick={() => navigate(`/messages?user=${activity.userId || activity.authorUsername}`)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#2D120D]/20 bg-[#CDE3E8] px-4 py-1.5 font-sans text-xs font-semibold text-[#2D120D] shadow-2xs transition hover:bg-[#FFF8CA]">
            <Send className="w-3 h-3" />
            <span>Message</span>
          </button>
        </div>
      </div>

      {commentsOpen && (
        <div className="bg-[#FFF8CA]/55 border-t border-[#2D120D]/10 px-5 sm:px-6 py-4 rounded-b-3xl">
          <form className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim().slice(0, 2000);
            if (!text) return;
            void run(async () => {
              await addActivityComment(activity.id, text);
              setDraft("");
            }, "Failed to post comment");
          }}>
            <textarea rows={2} placeholder="Share a thought…" value={draft} aria-label="Write a comment"
              onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
              className="min-h-[44px] w-full flex-1 resize-y rounded-2xl border border-[#2D120D]/20 bg-white px-4 py-2 font-sans text-sm text-[#2D120D] shadow-2xs focus:border-[#6B0B0C] focus:outline-none" />
            <button type="submit" disabled={!draft.trim() || busy}
              className="inline-flex min-h-10 items-center justify-center gap-1 self-end rounded-full bg-[#6B0B0C] px-4 py-2 font-sans text-xs font-semibold text-[#FFF8CA] transition hover:bg-[#2D120D] disabled:opacity-50">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reply"}
            </button>
          </form>

          {expanded && allComments.hasNextPage && (
            <button type="button" className="mb-3 font-sans text-xs font-semibold text-[#6B0B0C]" disabled={allComments.isFetchingNextPage}
              onClick={() => void allComments.fetchNextPage()}>
              Load older notes
            </button>
          )}
          <div className={`space-y-2.5 ${expanded ? "" : "max-h-[240px] overflow-y-auto"}`}>
            {comments.length === 0 ? (
              <p className="font-cursive italic text-lg text-[#6B0B0C] py-1">No notes yet. Leave a kind word ~</p>
            ) : comments.map((comment) => (
              <div key={comment.id} className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-[#2D120D]/15 shadow-2xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Avatar name={comment.authorName} url={comment.authorAvatar} className="w-7 h-7 rounded-full shrink-0 mt-0.5 text-[10px]" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-gift text-lg font-bold text-[#2D120D]">{comment.authorName}</span>
                      <span className="text-[11px] text-[#2D120D]/60 font-sans">@{comment.authorUsername} · {formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="font-sans text-xs text-[#2D120D] mt-0.5 leading-relaxed">{comment.commentText}</p>
                  </div>
                </div>
                {comment.canDelete && (
                  <button type="button" title="Delete comment" disabled={busy}
                    onClick={() => void run(() => deleteActivityComment(comment.id), "Could not delete comment")}
                    className="p-1 text-gray-400 hover:text-crimson-600 transition shrink-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus:opacity-100">
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
      {activity.project && (
        <ShareProjectDialog
          projectId={activity.project.id}
          title={activity.project.title}
          open={shareProject}
          onClose={() => setShareProject(false)}
        />
      )}
    </article>
  );
}
