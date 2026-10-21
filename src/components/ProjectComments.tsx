import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Trash2 } from "lucide-react";
import { addProjectComment, deleteProjectComment, fetchProjectComments } from "../api/projects";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";

/** Comments on a project (not on Network posts). Newest first with "load older". */
export function ProjectComments({ projectId, enabled, signedIn }: { projectId: string; enabled: boolean; signedIn: boolean }) {
  const client = useQueryClient();
  const key = queryKeys.projectComments(projectId);
  const [body, setBody] = useState("");
  const comments = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchProjectComments(projectId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_page,
  });
  // The project's comments_count lives on the project, so refresh it alongside the list.
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.project(projectId) });
  const add = useMutation({
    mutationFn: () => addProjectComment(projectId, body.trim()),
    onSuccess: () => { setBody(""); void refresh(); },
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteProjectComment(projectId, id), onSuccess: refresh });

  const items = comments.data?.pages.flatMap((p) => p.items) ?? [];
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (body.trim()) add.mutate();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <MessageCircle className="w-5 h-5" /> Comments
      </h2>
      {!enabled ? (
        <p className="mb-4 text-sm text-slate-500">The owner has turned comments off for this project.</p>
      ) : signedIn ? (
        <form onSubmit={submit} className="mb-6 space-y-2">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3}
            placeholder="Share feedback on this project…" aria-label="Write a comment"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          {add.isError && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(add.error)}</p>}
          <button type="submit" disabled={!body.trim() || add.isPending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {add.isPending ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="mb-4 text-sm text-slate-500"><Link to="/login" className="font-semibold text-blue-600">Sign in</Link> to comment.</p>
      )}

      {comments.isLoading ? <p className="text-sm text-slate-400">Loading comments…</p>
        : items.length === 0 ? <p className="text-sm text-slate-400">No comments yet.</p>
        : (
          <ul className="space-y-4">
            {items.map((c) => (
              <li key={c.id} className="flex gap-3">
                <img src={c.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.author.username)}`}
                  alt="" className="h-8 w-8 shrink-0 rounded-full bg-slate-100" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Link to={`/profile/${c.author.id}`} className="font-semibold text-slate-900 hover:underline">{c.author.full_name}</Link>
                    <span className="text-slate-400">@{c.author.username} · {new Date(c.created_at).toLocaleDateString()}</span>
                    {c.can_delete && (
                      <button type="button" onClick={() => remove.mutate(c.id)} disabled={remove.isPending}
                        aria-label="Delete comment" className="ml-auto text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      {comments.hasNextPage && (
        <button type="button" onClick={() => void comments.fetchNextPage()} disabled={comments.isFetchingNextPage}
          className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
          {comments.isFetchingNextPage ? "Loading…" : "Load older comments"}
        </button>
      )}
    </section>
  );
}
