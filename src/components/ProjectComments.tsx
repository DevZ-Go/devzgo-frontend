import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Reply, Trash2 } from "lucide-react";
import {
  addProjectComment,
  deleteProjectComment,
  fetchProjectComments,
  toggleProjectCommentLike,
  type ProjectComment,
} from "../api/projects";
import { MemberAvatar } from "./MemberAvatar";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";

/** Comments on a project (not on Network posts). Newest first with replies + likes. */
export function ProjectComments({
  projectId,
  enabled,
  signedIn,
  readOnly = false,
}: {
  projectId: string;
  enabled: boolean;
  signedIn: boolean;
  readOnly?: boolean;
}) {
  const client = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusCommentId = searchParams.get("comment");
  const key = queryKeys.projectComments(projectId);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<ProjectComment | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(focusCommentId);

  const comments = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchProjectComments(projectId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_page,
  });

  const refresh = () => {
    void client.invalidateQueries({ queryKey: key });
    void client.invalidateQueries({ queryKey: queryKeys.project(projectId) });
  };

  const add = useMutation({
    mutationFn: () => addProjectComment(projectId, body.trim()),
    onSuccess: () => {
      setBody("");
      refresh();
    },
  });
  const reply = useMutation({
    mutationFn: () => addProjectComment(projectId, replyBody.trim(), replyTo?.id),
    onSuccess: () => {
      setReplyBody("");
      setReplyTo(null);
      refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteProjectComment(projectId, id),
    onSuccess: refresh,
  });
  const like = useMutation({
    mutationFn: (id: string) => toggleProjectCommentLike(projectId, id),
    onSuccess: refresh,
  });

  const items = comments.data?.pages.flatMap((p) => p.items) ?? [];
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (body.trim()) add.mutate();
  };

  useEffect(() => {
    if (!focusCommentId || comments.isLoading) return;
    const el = document.getElementById(`project-comment-${focusCommentId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(focusCommentId);
      const clear = window.setTimeout(() => {
        setHighlightId(null);
        setSearchParams(
          (params) => {
            params.delete("comment");
            if (params.get("focus") === "comment") params.delete("focus");
            return params;
          },
          { replace: true },
        );
      }, 3500);
      return () => window.clearTimeout(clear);
    }
    if (comments.hasNextPage && !comments.isFetchingNextPage) {
      void comments.fetchNextPage();
    }
  }, [
    focusCommentId,
    comments.isLoading,
    comments.data,
    comments.hasNextPage,
    comments.isFetchingNextPage,
    setSearchParams,
  ]);

  function CommentRow({ c, nested = false }: { c: ProjectComment; nested?: boolean }) {
    return (
      <li
        id={`project-comment-${c.id}`}
        className={`flex gap-3 scroll-mt-28 rounded-xl p-2 transition ${
          highlightId === c.id ? "bg-amber-50 ring-2 ring-maroon-700/40" : ""
        } ${nested ? "ml-8 border-l border-stone-200 pl-3" : ""}`}
      >
        <MemberAvatar
          name={c.author.full_name || c.author.username}
          src={c.author.avatar_url}
          size="sm"
          className="!h-8 !w-8"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              to={`/profile/${c.author.id}`}
              className="font-cursive text-lg font-bold text-[#1C1917] hover:text-crimson-600"
            >
              {c.author.full_name}
            </Link>
            <span className="text-stone-400">
              @{c.author.username} · {new Date(c.created_at).toLocaleDateString()}
            </span>
            {c.can_delete && (
              <button
                type="button"
                onClick={() => remove.mutate(c.id)}
                disabled={remove.isPending}
                aria-label="Delete comment"
                className="ml-auto text-stone-400 hover:text-crimson-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-stone-700">{c.body}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {signedIn && !readOnly && (
              <button
                type="button"
                onClick={() => like.mutate(c.id)}
                disabled={like.isPending}
                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  c.is_liked ? "text-maroon-800" : "text-stone-500 hover:text-maroon-800"
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${c.is_liked ? "fill-current" : ""}`} />
                {c.likes_count ?? 0}
              </button>
            )}
            {!signedIn && (c.likes_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                <Heart className="h-3.5 w-3.5" /> {c.likes_count}
              </span>
            )}
            {signedIn && !readOnly && !nested && (
              <button
                type="button"
                onClick={() => {
                  setReplyTo(c);
                  setReplyBody("");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-maroon-800"
              >
                <Reply className="h-3.5 w-3.5" /> Reply
              </button>
            )}
          </div>

          {replyTo?.id === c.id && (
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (replyBody.trim()) reply.mutate();
              }}
            >
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                maxLength={2000}
                rows={2}
                placeholder={`Reply to @${c.author.username}…`}
                className="w-full rounded-xl border border-stone-200 bg-[#FAF7EE] px-3 py-2 text-sm focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-400"
              />
              {reply.isError && (
                <p role="alert" className="text-sm text-crimson-700">
                  {getApiErrorMessage(reply.error)}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!replyBody.trim() || reply.isPending}
                  className="rounded-lg bg-maroon-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {reply.isPending ? "Posting…" : "Post reply"}
                </button>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {c.replies && c.replies.length > 0 && (
            <ul className="mt-3 space-y-3">
              {c.replies.map((r) => (
                <CommentRow key={r.id} c={r} nested />
              ))}
            </ul>
          )}
        </div>
      </li>
    );
  }

  return (
    <section
      id="project-comments"
      className="scroll-mt-24 rounded-2xl border border-stone-200/90 bg-white shadow-sm p-6 sm:p-8 font-sans"
    >
      <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl text-stone-900">
        <MessageCircle className="w-5 h-5 text-forest-700" /> Comments
      </h2>
      {!enabled ? (
        <p className="mb-4 text-sm text-stone-500">The owner has turned comments off for this project.</p>
      ) : signedIn && readOnly ? (
        <p className="mb-4 text-sm text-stone-500">
          You&apos;re on this team as a Viewer, so comments are read-only for you.
        </p>
      ) : signedIn ? (
        <form onSubmit={submit} className="mb-6 space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Share feedback on this project…"
            aria-label="Write a comment"
            className="w-full rounded-xl border border-stone-200 bg-[#FAF7EE] px-3 py-2 text-sm focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          {add.isError && (
            <p role="alert" className="text-sm text-crimson-700">
              {getApiErrorMessage(add.error)}
            </p>
          )}
          <button
            type="submit"
            disabled={!body.trim() || add.isPending}
            className="rounded-lg bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust px-4 py-2 text-sm font-semibold text-white shadow-md shadow-maroon-800/20 disabled:opacity-50"
          >
            {add.isPending ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="mb-4 text-sm text-stone-500">
          <Link to="/login" className="font-semibold text-forest-700">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}

      {comments.isLoading ? (
        <p className="text-sm text-stone-400">Loading comments…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-stone-400">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((c) => (
            <CommentRow key={c.id} c={c} />
          ))}
        </ul>
      )}
      {comments.hasNextPage && (
        <button
          type="button"
          onClick={() => void comments.fetchNextPage()}
          disabled={comments.isFetchingNextPage}
          className="mt-4 text-sm font-semibold text-forest-700 hover:text-forest-800"
        >
          {comments.isFetchingNextPage ? "Loading…" : "Load older comments"}
        </button>
      )}
    </section>
  );
}
