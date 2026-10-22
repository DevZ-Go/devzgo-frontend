import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { searchDevelopers } from "../api/profiles";
import type { AccessLevel } from "../types/network";
import { AccessSelect } from "./AccessSelect";
import { ui } from "../styles/editorial";

export type Teammate = { userId: string; username: string; fullName: string; role: string; access: AccessLevel };

/** Pick people by username for a new project; each one gets an invitation once the project exists. */
export function TeammatePicker({ value, onChange }: { value: Teammate[]; onChange: (next: Teammate[]) => void }) {
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim().replace(/^@/, "")), 300);
    return () => clearTimeout(t);
  }, [query]);
  const found = useQuery({
    queryKey: ["teammate-search", term],
    queryFn: () => searchDevelopers(term),
    enabled: term.length > 0,
  });
  const chosen = new Set(value.map((mate) => mate.userId));
  const results = (found.data ?? []).filter((person) => !chosen.has(person.userId)).slice(0, 6);

  const update = (userId: string, patch: Partial<Teammate>) =>
    onChange(value.map((mate) => (mate.userId === userId ? { ...mate, ...patch } : mate)));

  return (
    <div className="space-y-3">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by username, e.g. @alex"
        aria-label="Search teammates by username" className={ui.input} />
      {term && results.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {results.map((person) => (
            <li key={person.userId}>
              <button type="button" className={`${ui.btn} ${ui.neutral}`}
                onClick={() => {
                  onChange([...value, {
                    userId: person.userId, username: person.username, fullName: person.fullName || person.username,
                    role: "Collaborator", access: "commenter",
                  }]);
                  setQuery("");
                }}>
                <UserPlus className="h-3.5 w-3.5" /> @{person.username}
              </button>
            </li>
          ))}
        </ul>
      )}
      {term && found.isSuccess && results.length === 0 && (
        <p className={ui.muted}>Nobody new matches “{term}”.</p>
      )}
      {value.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-[#FAF7EE]">
          {value.map((mate) => (
            <li key={mate.userId} className="flex flex-wrap items-center gap-2 p-3">
              <span className="min-w-[8rem] flex-1">
                <span className="block truncate font-sans text-sm font-semibold text-[#1C1917]">{mate.fullName}</span>
                <span className="block truncate font-sans text-xs text-stone-500">@{mate.username}</span>
              </span>
              <input value={mate.role} onChange={(e) => update(mate.userId, { role: e.target.value })} maxLength={100}
                aria-label={`Role for ${mate.username}`} placeholder="Role, e.g. Frontend" className={`!w-36 ${ui.input} py-1.5`} />
              <AccessSelect value={mate.access} label={`Access for ${mate.username}`}
                onChange={(access) => update(mate.userId, { access })} />
              <button type="button" aria-label={`Remove ${mate.username}`} className={`${ui.btn} ${ui.neutral}`}
                onClick={() => onChange(value.filter((other) => other.userId !== mate.userId))}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
