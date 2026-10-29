import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Code2, ListChecks, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { MemberAvatar } from "../components/MemberAvatar";
import { Select } from "../components/ui/Select";
import {
  ENTRY_STATUSES, createShortlist, deleteShortlist, fetchShortlist, fetchShortlists, removeEntry, statusLabel, updateEntry,
  type EntryStatus, type ShortlistEntry,
} from "../api/recruiting";
import { ui } from "../styles/editorial";

function EntryRow({ entry, listId }: { entry: ShortlistEntry; listId: string }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState(entry.note ?? "");
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["shortlist", listId] });
    void queryClient.invalidateQueries({ queryKey: ["shortlists"] });
    void queryClient.invalidateQueries({ queryKey: ["recruiting-dashboard"] });
  };
  const save = useMutation({ mutationFn: (change: { status?: EntryStatus; note?: string | null }) => updateEntry(listId, entry.id, change), onSuccess: refresh });
  const remove = useMutation({ mutationFn: () => removeEntry(listId, entry.id), onSuccess: refresh });
  const name = entry.candidate.full_name || entry.candidate.username;

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <MemberAvatar name={name} src={entry.candidate.avatar_url} size="md" />
        <div className="min-w-0 flex-1">
          <Link to={`/recruit/candidates/${entry.candidate.id}`} className="block truncate font-semibold text-stone-900 hover:text-maroon-800">{name}</Link>
          <p className="truncate text-xs text-stone-500">@{entry.candidate.username}{entry.candidate.headline ? ` · ${entry.candidate.headline}` : ""}</p>
        </div>
        <Select
          value={entry.status} aria-label={`Status for ${name}`} onChange={(v) => save.mutate({ status: v as EntryStatus })}
          options={ENTRY_STATUSES}
          className="w-36 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-semibold"
        />
        <Link to={`/recruit/candidates/${entry.candidate.id}`} className={`${ui.btn} ${ui.neutral}`}><Code2 className="h-3.5 w-3.5" /> Evaluate</Link>
        <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending} aria-label={`Remove ${name} from this list`}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <label className="mt-3 block">
        <span className="sr-only">Private note about {name}</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000}
          onBlur={() => note !== (entry.note ?? "") && save.mutate({ note })}
          placeholder="Private note: only you can see this" className={ui.input} />
      </label>
    </li>
  );
}

/** Private shortlists. Nobody else, including the candidates, can see these lists, statuses, or notes. */
export function ShortlistsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const lists = useQuery({ queryKey: ["shortlists"], queryFn: fetchShortlists });
  const activeId = id ?? lists.data?.[0]?.id;
  const detail = useQuery({ queryKey: ["shortlist", activeId], queryFn: () => fetchShortlist(activeId!), enabled: Boolean(activeId) });

  const create = useMutation({
    mutationFn: () => createShortlist(name.trim()),
    onSuccess: (list) => {
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["shortlists"] });
      navigate(`/recruit/shortlists/${list.id}`);
    },
  });
  const remove = useMutation({
    mutationFn: (listId: string) => deleteShortlist(listId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shortlists"] });
      void queryClient.invalidateQueries({ queryKey: ["recruiting-dashboard"] });
      navigate("/recruit/shortlists");
    },
  });

  const entries = (detail.data?.entries ?? []).filter((e) => filter === "all" || e.status === filter);

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-6xl`}>
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">Recruiting</p>
          <h1 className="mt-1 font-serif text-4xl text-stone-900 sm:text-5xl">Shortlists</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-600"><Lock className="h-3.5 w-3.5" /> Private to you, including statuses and notes.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-3">
            <form data-tour="shortlist-create" onSubmit={(e) => { e.preventDefault(); if (name.trim()) create.mutate(); }}
              className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500" htmlFor="new-list">New shortlist</label>
              <div className="mt-1 flex gap-2">
                <input id="new-list" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Summer co-op, backend"
                  className={ui.input} />
                <button type="submit" disabled={!name.trim() || create.isPending} aria-label="Create shortlist"
                  className="rounded-xl bg-maroon-800 px-3 text-white disabled:opacity-50"><Plus className="h-4 w-4" /></button>
              </div>
            </form>
            {lists.isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-maroon-700" />
            ) : (lists.data ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">No shortlists yet. Name one above, or add people from Find talent.</p>
            ) : (
              <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Your shortlists">
                {(lists.data ?? []).map((list) => (
                  <li key={list.id} className="shrink-0">
                    <Link to={`/recruit/shortlists/${list.id}`} aria-current={list.id === activeId ? "page" : undefined}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                        list.id === activeId ? "border-maroon-300 bg-maroon-50 font-semibold text-maroon-900" : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50"
                      }`}>
                      <span className="flex min-w-0 items-center gap-2"><ListChecks className="h-4 w-4 shrink-0" /> <span className="truncate">{list.name}</span></span>
                      <span className="text-xs tabular-nums text-stone-500">{list.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section aria-live="polite">
            {!activeId ? (
              <p className={ui.empty}>Create a shortlist to start tracking candidates.</p>
            ) : detail.isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
            ) : detail.error || !detail.data ? (
              <p className={ui.empty}>This shortlist could not be found. <Link to="/recruit/shortlists" className={ui.link}>Back to your lists</Link></p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    {id && <Link to="/recruit/shortlists" className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-stone-500 lg:hidden"><ArrowLeft className="h-3 w-3" /> All lists</Link>}
                    <h2 className="truncate font-serif text-3xl text-stone-900">{detail.data.name}</h2>
                    <p className="text-xs text-stone-500">{detail.data.count} {detail.data.count === 1 ? "candidate" : "candidates"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={filter} onChange={setFilter} aria-label="Show status"
                      options={[
                        ["all", "All statuses"],
                        ...ENTRY_STATUSES.map(([sid, label]) => [sid, `${label} (${detail.data.statuses[sid] ?? 0})`] as const),
                      ]}
                      className="w-44 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs"
                    />
                    <button type="button" onClick={() => { if (window.confirm(`Delete "${detail.data.name}" and its notes?`)) remove.mutate(detail.data.id); }}
                      className={`${ui.btn} ${ui.danger}`}><Trash2 className="h-3.5 w-3.5" /> Delete list</button>
                  </div>
                </div>
                {entries.length === 0 ? (
                  <p className={ui.empty}>
                    {detail.data.count === 0 ? <>No one on this list yet. Add people from <Link to="/recruit/talent" className={ui.link}>Find talent</Link>.</> : `No one is marked ${statusLabel(filter)}.`}
                  </p>
                ) : (
                  <ul className="space-y-3">{entries.map((entry) => <EntryRow key={entry.id} entry={entry} listId={detail.data.id} />)}</ul>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
