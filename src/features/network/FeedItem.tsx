import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Clock,
  Heart,
  Loader2,
  MessageSquare,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import {
  addActivityComment,
  deleteActivityComment,
  deletePost,
  fetchActivityComments,
  shareActivity,
  toggleActivityLike,
  toggleActivitySave,
  updatePost,
} from "../../api/network";
import { queryKeys } from "../../api/queryKeys";
import { FeedProjectStats } from "../../components/FeedProjectStats";
import { ShareProjectDialog } from "../../components/ShareProjectDialog";
import type { ActivityComment, FeedActivity } from "../../types/network";
import { getApiErrorMessage } from "../../utils/apiError";
import { LinkPreviewCard, extractFirstUrl } from "./LinkPreviewCard";

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

function profilePath(userId?: string, username?: string) {
  if (username) return `/profile/${username}`;
  if (userId) return `/profile/${userId}`;
  return "/network";
}

/** One feed post. In the feed it shows the latest two comments; on its own page (`expanded`) every comment, paged. */
export function FeedItem({ activity, expanded = false, notify, focusCommentId = null }: {
  activity: FeedActivity;
  expanded?: boolean;
  notify: (message: string) => void;
  index?: number;
  focusCommentId?: string | null;
}) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.feed });
  const [like, setLike] = useState<{ isLiked: boolean; likesCount: number } | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(expanded || Boolean(focusCommentId));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [shareProject, setShareProject] = useState(false);
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(focusCommentId);
  const shown = like ?? activity;
  const isSaved = saved ?? Boolean(activity.isSaved);
  const [label, color] = BADGES[activity.activityType] ?? BADGES.post!;
  const spark = activity.activityType === "spark";
  const profile = profilePath(activity.userId, activity.authorUsername);
  const firstUrl = !activity.project ? extractFirstUrl(activity.content || "") : null;

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

  useEffect(() => {
    if (!focusCommentId || !expanded) return;
    setCommentsOpen(true);
    const el = document.getElementById(`activity-comment-${focusCommentId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightCommentId(focusCommentId);
      const clear = window.setTimeout(() => setHighlightCommentId(null), 3500);
      return () => window.clearTimeout(clear);
    }
    if (allComments.hasNextPage && !allComments.isFetchingNextPage) {
      void allComments.fetchNextPage();
    }
  }, [focusCommentId, expanded, allComments.data, allComments.hasNextPage, allComments.isFetchingNextPage]);

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

  async function toggleSave() {
    setSaved(!isSaved);
    try {
      const res = await toggleActivitySave(activity.id);
      setSaved(res.isSaved);
      await refresh();
    } catch {
      setSaved(null);
      notify("Could not update save");
    }
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

  const iconAction =
    "inline-flex items-center gap-1.5 text-[#6E5952] hover:text-[#780D18] transition disabled:opacity-50";

  return (
    <article id={activity.id} className="relative rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
      <div className={`${spark ? "bg-[#6B0B0C] text-[#FFF8CA] border-[#6B0B0C]" : "bg-[#CDE3E8] text-[#2D120D] border-[#2D120D]/20"} absolute -top-2.5 right-4 sm:right-6 px-3 py-0.5 rounded-full z-10 flex items-center justify-center text-[9px] font-bold font-sans tracking-widest uppercase border shadow-2xs`}>
        {spark ? "SPARK" : activity.activityType === "post" ? "NOTE" : label}
      </div>

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={profile} className="group block shrink-0" aria-label={`${activity.authorName} profile`}>
            <Avatar name={activity.authorName || "DV"} url={activity.authorAvatar} className="w-10 h-10 rounded-full font-gift text-sm" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <Link to={profile} className="font-bold text-sm text-[#2D120D] hover:text-[#780D18] transition">
                {activity.authorName}
              </Link>
              <Link to={profile} className="text-xs text-[#6E5952] hover:text-[#780D18] hover:underline">
                @{activity.authorUsername}
              </Link>
              <span className={`font-sans text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${color}`}>{label}</span>
            </div>
            {activity.authorHeadline && (
              <p className="text-xs text-[#6E5952] mt-0.5 truncate">{activity.authorHeadline}</p>
            )}
            <Link to={`/network/post/${activity.id}`} className="flex items-center gap-1.5 text-[11px] text-[#6E5952] mt-0.5 font-sans hover:underline">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(activity.createdAt)}</span>
            </Link>
          </div>
        </div>
        {activity.canEdit && (
          <div className="flex items-center gap-1">
            <button type="button" title="Edit post" disabled={busy} onClick={() => setEditing(activity.content ?? "")} className="p-1 text-[#6E5952] hover:text-[#2D120D]">
              <Pencil className="w-4 h-4" />
            </button>
            <button type="button" title="Delete post" disabled={busy} className="p-1 text-[#6E5952] hover:text-crimson-600"
              onClick={() => window.confirm("Delete this post?") &&
                void run(async () => { await deletePost(activity.id); if (expanded) navigate("/network"); }, "Could not delete post")}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {activity.title && (
        <h3 className="font-bold text-base text-[#2D120D] mb-2 leading-tight">{activity.title}</h3>
      )}
      {editing !== null ? (
        <form className="mb-3.5 space-y-2" onSubmit={(e) => {
          e.preventDefault();
          void run(async () => { await updatePost(activity.id, { content: editing.trim() }); setEditing(null); }, "Could not save post");
        }}>
          <textarea value={editing} onChange={(e) => setEditing(e.target.value)} rows={3} aria-label="Edit post"
            className="w-full rounded-xl border border-[#DECDBA] bg-[#FAF7F2] p-3 font-sans text-sm text-[#2D120D]" />
          <div className="flex gap-2">
            <button type="submit" disabled={busy || !editing.trim()}
              className="rounded-lg bg-[#780D18] px-3 py-1.5 font-sans text-xs font-semibold text-white disabled:opacity-50">Save</button>
            <button type="button" onClick={() => setEditing(null)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 font-sans text-xs font-semibold">Cancel</button>
          </div>
        </form>
      ) : activity.content && (
        <p className="text-xs sm:text-sm text-[#2D120D] whitespace-pre-wrap leading-relaxed mb-3.5">{activity.content}</p>
      )}

      {activity.mediaUrl && !activity.project && (
        <div className="rounded-xl overflow-hidden border border-[#DECDBA] mb-3.5 bg-gray-50 max-h-[340px]">
          <img src={activity.mediaUrl} alt="Activity attachment" className="w-full h-full object-cover" />
        </div>
      )}

      {activity.project && (
        <Link to={`/project/${activity.project.id}`}
          className="group block my-3 rounded-2xl border border-[#DECDBA] bg-[#FAF7F2] text-[#2D120D] overflow-hidden hover:border-[#780D18] transition">
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
              </div>
              <span className="font-sans text-xs text-[#780D18] font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                Open project <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h4 className="font-bold text-sm sm:text-base text-[#2D120D] group-hover:text-[#780D18] transition">{activity.project.title}</h4>
            {activity.project.shortDescription && (
              <p className="text-xs text-[#6E5952] mt-1 line-clamp-2 leading-relaxed">{activity.project.shortDescription}</p>
            )}
          </div>
        </Link>
      )}
      {activity.project && !activity.isDemo && <FeedProjectStats project={activity.project} />}
      {firstUrl && <LinkPreviewCard url={firstUrl} className="mb-3.5" />}

      {/* Compact icon-only actions (mock-style) */}
      <div className="flex items-center justify-between pt-2 border-t border-[#DECDBA]/40 text-xs text-[#6E5952]">
        <div className="flex items-center gap-5 sm:gap-6">
          <button type="button" onClick={() => void toggleLike()} aria-label={shown.isLiked ? "Unlike" : "Like"} title="Like"
            className={`${iconAction} ${shown.isLiked ? "text-[#780D18] font-semibold" : ""}`}>
            <Heart className={`w-4 h-4 ${shown.isLiked ? "fill-[#780D18]" : ""}`} />
            <span>{shown.likesCount}</span>
          </button>
          <button type="button" onClick={() => setCommentsOpen((o) => !o)} aria-label="Comments" title="Comments" className={iconAction}>
            <MessageSquare className="w-4 h-4" />
            <span>{activity.commentsCount}</span>
          </button>
          <button type="button" onClick={share} aria-label="Share" title="Share / copy link" className={iconAction}>
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        <button type="button" onClick={() => void toggleSave()} aria-label={isSaved ? "Unsave" : "Save"} title="Save"
          className={`p-1 transition ${isSaved ? "text-[#780D18]" : "hover:text-[#2D120D]"}`}>
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-[#780D18]" : ""}`} />
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-4 bg-[#FFF8CA]/55 border-t border-[#DECDBA]/40 pt-4 rounded-b-3xl">
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
              className="min-h-[44px] w-full flex-1 resize-y rounded-2xl border border-[#DECDBA] bg-white px-4 py-2 font-sans text-sm text-[#2D120D] focus:border-[#780D18] focus:outline-none" />
            <button type="submit" disabled={!draft.trim() || busy}
              className="inline-flex min-h-10 items-center justify-center gap-1 self-end rounded-full bg-[#780D18] px-4 py-2 font-sans text-xs font-semibold text-white transition hover:bg-[#5C0A12] disabled:opacity-50">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reply"}
            </button>
          </form>

          {expanded && allComments.hasNextPage && (
            <button type="button" className="mb-3 font-sans text-xs font-semibold text-[#780D18]" disabled={allComments.isFetchingNextPage}
              onClick={() => void allComments.fetchNextPage()}>
              Load older notes
            </button>
          )}
          <div className={`space-y-2.5 ${expanded ? "" : "max-h-[240px] overflow-y-auto"}`}>
            {comments.length === 0 ? (
              <p className="text-sm text-[#6E5952] py-1">No comments yet.</p>
            ) : comments.map((comment) => (
              <div
                key={comment.id}
                id={`activity-comment-${comment.id}`}
                className={`group flex items-start justify-between gap-3 p-3 rounded-2xl border scroll-mt-28 transition ${
                  highlightCommentId === comment.id
                    ? "bg-amber-50 border-maroon-700/40 ring-2 ring-maroon-700/30"
                    : "bg-white border-[#DECDBA]/60"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <Link to={profilePath(comment.authorId, comment.authorUsername)} className="shrink-0">
                    <Avatar name={comment.authorName} url={comment.authorAvatar} className="w-7 h-7 rounded-full text-[10px]" />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={profilePath(comment.authorId, comment.authorUsername)} className="font-bold text-sm text-[#2D120D] hover:text-[#780D18]">
                        {comment.authorName}
                      </Link>
                      <Link to={profilePath(comment.authorId, comment.authorUsername)} className="text-[11px] text-[#6E5952] hover:underline">
                        @{comment.authorUsername}
                      </Link>
                      <span className="text-[11px] text-[#6E5952]">· {formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="font-sans text-xs text-[#2D120D] mt-0.5 leading-relaxed">{comment.commentText}</p>
                  </div>
                </div>
                {comment.canDelete && (
                  <button type="button" className="text-[#6E5952] hover:text-crimson-600 opacity-0 group-hover:opacity-100"
                    onClick={() => void run(() => deleteActivityComment(comment.id), "Could not delete comment")}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {shareProject && activity.project && (
        <ShareProjectDialog
          projectId={activity.project.id}
          title={activity.project.title}
          open={shareProject}
          onClose={() => setShareProject(false)}
          coverUrl={activity.project.coverImageUrl}
          blurb={activity.project.shortDescription}
          techStacks={activity.project.techStacks}
        />
      )}
    </article>
  );
}
