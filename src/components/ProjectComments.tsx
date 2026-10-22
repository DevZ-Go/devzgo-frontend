import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Trash2 } from "lucide-react";
import { addProjectComment, deleteProjectComment, fetchProjectComments } from "../api/projects";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";

/** Comments on a project (not on Network posts). Newest first with "load older". */
export function ProjectComments({ projectId, enabled, signedIn, readOnly = false }: {
  projectId: string; enabled: boolean; signedIn: boolean; readOnly?: boolean;
}) {
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
    <section id="project-comments" className="scroll-mt-24 rounded-2xl border border-stone-200/90 bg-white shadow-sm p-6 sm:p-8 font-sans">
      <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl text-stone-900">
        <MessageCircle className="w-5 h-5 text-forest-700" /> Comments
      </h2>
      {!enabled ? (
        <p className="mb-4 text-sm text-stone-500">The owner has turned comments off for this project.</p>
      ) : signedIn && readOnly ? (
        <p className="mb-4 text-sm text-stone-500">You're on this team as a Viewer, so comments are read-only for you.</p>
      ) : signedIn ? (
        <form onSubmit={submit} className="mb-6 space-y-2">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3}
            placeholder="Share feedback on this project…" aria-label="Write a comment"
            className="w-full rounded-xl border border-stone-200 bg-[#FAF7EE] px-3 py-2 text-sm focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-400" />
          {add.isError && <p role="alert" className="text-sm text-crimson-700">{getApiErrorMessage(add.error)}</p>}
          <button type="submit" disabled={!body.trim() || add.isPending}
            className="rounded-lg bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust px-4 py-2 text-sm font-semibold text-white shadow-md shadow-maroon-800/20 disabled:opacity-50">
            {add.isPending ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="mb-4 text-sm text-stone-500"><Link to="/login" className="font-semibold text-forest-700">Sign in</Link> to comment.</p>
      )}

      {comments.isLoading ? <p className="text-sm text-stone-400">Loading comments…</p>
        : items.length === 0 ? <p className="text-sm text-stone-400">No comments yet.</p>
        : (
          <ul className="space-y-4">
            {items.map((c) => (
              <li key={c.id} className="flex gap-3">
                <img src={c.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.author.username)}`}
                  alt="" className="h-8 w-8 shrink-0 rounded-full bg-[#DCFCE7] ring-1 ring-forest-600/40" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Link to={`/profile/${c.author.id}`} className="font-cursive text-lg font-bold text-[#1C1917] hover:text-crimson-600">{c.author.full_name}</Link>
                    <span className="text-stone-400">@{c.author.username} · {new Date(c.created_at).toLocaleDateString()}</span>
                    {c.can_delete && (
                      <button type="button" onClick={() => remove.mutate(c.id)} disabled={remove.isPending}
                        aria-label="Delete comment" className="ml-auto text-stone-400 hover:text-crimson-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-stone-700">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      {comments.hasNextPage && (
        <button type="button" onClick={() => void comments.fetchNextPage()} disabled={comments.isFetchingNextPage}
          className="mt-4 text-sm font-semibold text-forest-700 hover:text-forest-800">
          {comments.isFetchingNextPage ? "Loading…" : "Load older comments"}
        </button>
      )}
    </section>
  );
}
