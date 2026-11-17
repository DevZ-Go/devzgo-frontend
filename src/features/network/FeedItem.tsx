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

const LAVENDER = "bg-[#EFEBF9] text-[#42356B] border border-[#D4C9EC]";
const PEACH = "bg-[#FFF3E8] text-[#7C3E1D] border border-[#F0D3BA]";
const BLUSH = "bg-[#FBE9EE] text-[#721C2A] border border-[#EBCAD3]";
const BADGES: Record<string, [string, string]> = {
  post: ["SHARED SPARK", "bg-[#F5F2FC] text-[#4A3E70] border border-[#DDD4F0]"],
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
    <div className={`${className} bg-[#EFEBF9] text-[#42356B] font-bold flex items-center justify-center border border-[#D4C9EC]`}>
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
    void run(async () => {
      await shareActivity(activity.id);
      await navigator.clipboard?.writeText(`${window.location.origin}/network/post/${activity.id}`);
      notify("Shared. Link copied.");
    }, "Could not share post");
  }

  const iconButton = "p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition";

  return (
    <article id={activity.id} className="relative rounded-3xl border border-[#E2DAF5] bg-white shadow-2xs hover:shadow-md transition-all duration-200">
      <div className={`${green ? "bg-[#E8E2FA] text-[#42356B] border-[#D0C4EE]" : "bg-[#FAE5EB] text-[#721C2A] border-[#EBCAD3]"} absolute -top-2.5 right-6 px-3 py-0.5 rounded-full z-10 flex items-center justify-center text-[9px] font-bold font-sans tracking-widest uppercase border shadow-2xs`}>
        {green ? "01 · NOTE" : "02 · SPARK"}
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={profile} className="group block shrink-0">
              <Avatar name={activity.authorName || "DV"} url={activity.authorAvatar} className="w-11 h-11 rounded-xl font-gift text-xl" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={profile} className="font-gift text-2xl sm:text-[26px] text-[#721C2A] hover:text-[#42356B] transition leading-none">
                  {activity.authorName}
                </Link>
                <span className="font-sans text-xs text-[#6B5B95] font-medium">@{activity.authorUsername}</span>
                <span className={`font-sans text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full ${color}`}>{label}</span>
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
          <h3 className="font-gift text-2xl sm:text-3xl text-[#721C2A] mb-2 leading-tight">{activity.title}</h3>
        )}
        {editing !== null ? (
          <form className="mb-3.5 space-y-2" onSubmit={(e) => {
            e.preventDefault();
            void run(async () => { await updatePost(activity.id, { content: editing.trim() }); setEditing(null); }, "Could not save post");
          }}>
            <textarea value={editing} onChange={(e) => setEditing(e.target.value)} rows={3} aria-label="Edit post"
              className="w-full rounded-xl border border-[#D8CFE8] bg-[#FAF8FE] p-3 font-sans text-sm" />
            <div className="flex gap-2">
              <button type="submit" disabled={busy || !editing.trim()}
                className="rounded-lg bg-[#E5DFFA] border border-[#C9BEF0] px-3 py-1.5 font-sans text-xs font-semibold text-[#42356B] disabled:opacity-50">Save</button>
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
            className="group block my-3 rounded-2xl border border-[#DFD7F2] bg-[#FAF8FE] text-[#1C1917] overflow-hidden hover:border-[#721C2A]/50 transition shadow-2xs">
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
                <span className="font-sans text-xs text-[#721C2A] font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                  Open project <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="font-gift text-2xl text-[#721C2A] group-hover:text-[#42356B] transition">{activity.project.title}</h4>
              {activity.project.shortDescription && (
                <p className="font-sans text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">{activity.project.shortDescription}</p>
              )}
            </div>
          </Link>
        )}
        {activity.project && !activity.isDemo && <FeedProjectStats project={activity.project} />}

        <div className="mt-3.5 pt-3 border-t border-[#EFEBF7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => void toggleLike()} aria-label="Like post"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-semibold transition ${
                shown.isLiked ? BLUSH : "text-stone-700 hover:bg-[#FAF8FE] border border-[#E2DAF5]"}`}>
              <Heart className={`w-3.5 h-3.5 ${shown.isLiked ? "fill-[#721C2A] text-[#721C2A]" : ""}`} />
              <span>{shown.likesCount}</span>
            </button>
            <button type="button" onClick={() => setCommentsOpen((o) => !o)} aria-label="Comments"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-semibold transition ${
                commentsOpen ? LAVENDER : "text-stone-700 hover:bg-[#FAF8FE] border border-[#E2DAF5]"}`}>
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{activity.commentsCount} notes</span>
            </button>
          </div>
          <button type="button" onClick={() => navigate(`/messages?user=${activity.userId || activity.authorUsername}`)}
            className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-[#42356B] px-4 py-1.5 rounded-full bg-[#E5DFFA] hover:bg-[#D9D0F7] border border-[#C9BEF0] shadow-2xs transition">
            <Send className="w-3 h-3" />
            <span>Message</span>
          </button>
        </div>
      </div>

      {commentsOpen && (
        <div className="bg-[#FAF8FE] border-t border-[#E8E2F5] px-5 sm:px-6 py-4 rounded-b-3xl">
          <form className="flex items-center gap-2.5 mb-3" onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await addActivityComment(activity.id, draft.trim());
              setDraft("");
            }, "Failed to post comment");
          }}>
            <input type="text" placeholder="Write a constructive note..." value={draft} aria-label="Write a comment"
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-full border border-[#D8CFE8] bg-white px-4 py-1.5 font-sans text-xs text-[#1C1917] shadow-2xs focus:border-[#721C2A] focus:outline-none" />
            <button type="submit" disabled={!draft.trim() || busy}
              className="px-4 py-1.5 rounded-full bg-[#E5DFFA] hover:bg-[#D9D0F7] text-[#42356B] border border-[#C9BEF0] font-sans text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reply"}
            </button>
          </form>

          {expanded && allComments.hasNextPage && (
            <button type="button" className="mb-3 font-sans text-xs font-semibold text-[#721C2A]" disabled={allComments.isFetchingNextPage}
              onClick={() => void allComments.fetchNextPage()}>
              Load older notes
            </button>
          )}
          <div className={`space-y-2.5 ${expanded ? "" : "max-h-[240px] overflow-y-auto"}`}>
            {comments.length === 0 ? (
              <p className="font-gift italic text-lg text-[#6B5B95] py-1">No notes yet. Leave a kind word ~</p>
            ) : comments.map((comment) => (
              <div key={comment.id} className="group flex items-start justify-between gap-3 p-3 rounded-2xl bg-white border border-[#E8E2F5] shadow-2xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Avatar name={comment.authorName} url={comment.authorAvatar} className="w-7 h-7 rounded-full shrink-0 mt-0.5 text-[10px]" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-gift text-lg text-[#721C2A]">{comment.authorName}</span>
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
