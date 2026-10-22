import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Check, ListPlus, Loader2, Plus } from "lucide-react";
import { addToShortlist, createShortlist, fetchShortlists } from "../../api/recruiting";

/** Add one candidate to any of the recruiter's private shortlists, or start a new list. */
export function ShortlistPicker({ candidateId, onAdded, className = "" }: {
  candidateId: string;
  onAdded?: () => void;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lists = useQuery({ queryKey: ["shortlists"], queryFn: fetchShortlists, enabled: open });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const add = useMutation({
    mutationFn: async (shortlistId: string) => addToShortlist(shortlistId, candidateId),
    onSuccess: (_entry, shortlistId) => {
      setAdded((prev) => ({ ...prev, [shortlistId]: true }));
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["shortlists"] });
      void queryClient.invalidateQueries({ queryKey: ["recruiting-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["candidate", candidateId] });
      onAdded?.();
    },
    onError: (err, shortlistId) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setAdded((prev) => ({ ...prev, [shortlistId]: true }));
      } else setError("Could not add to that list");
    },
  });

  const create = useMutation({
    mutationFn: async () => createShortlist(name.trim()),
    onSuccess: (list) => {
      setName("");
      add.mutate(list.id);
    },
    onError: () => setError("Could not create the list"),
  });

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="dialog"
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">
        <ListPlus className="h-3.5 w-3.5" /> Shortlist
      </button>
      {open && (
        <div role="dialog" aria-label="Add to a shortlist"
          className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-stone-200 bg-white p-3 text-left shadow-xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Your private lists</p>
          {lists.isLoading ? (
            <Loader2 className="mx-auto my-3 h-4 w-4 animate-spin text-maroon-700" />
          ) : (lists.data ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-stone-500">No lists yet. Name one below.</p>
          ) : (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {(lists.data ?? []).map((list) => (
                <li key={list.id}>
                  <button type="button" disabled={added[list.id] || add.isPending} onClick={() => add.mutate(list.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-stone-800 hover:bg-stone-100 disabled:opacity-70">
                    <span className="truncate">{list.name}</span>
                    {added[list.id] ? <Check className="h-4 w-4 text-forest-700" /> : <span className="text-xs text-stone-400">{list.count}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form className="mt-3 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (name.trim()) create.mutate(); }}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="New list, e.g. Spring interns"
              aria-label="New shortlist name"
              className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-maroon-300" />
            <button type="submit" disabled={!name.trim() || create.isPending} aria-label="Create list and add"
              className="rounded-lg bg-maroon-800 px-2 text-white disabled:opacity-50">
              <Plus className="h-4 w-4" />
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-crimson-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
