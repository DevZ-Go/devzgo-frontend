import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPeople } from "../../api/admin";
import { ui } from "../../styles/editorial";
import { Loading, statusClass, when } from "./bits";

export function PeoplePage() {
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const people = useQuery({ queryKey: ["admin", "people", q, offset], queryFn: () => fetchPeople(q, offset) });

  function search(event: FormEvent) {
    event.preventDefault();
    setOffset(0);
    setQ(draft.trim());
  }

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="people-search">Search people</label>
        <input
          id="people-search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Name, username or email"
          className={ui.input}
        />
        <button type="submit" className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`}>Search</button>
      </form>
      {people.isLoading && <Loading />}
      {people.data && (
        <>
          <p className="text-sm text-stone-600">{people.data.total} account{people.data.total === 1 ? "" : "s"}</p>
          <div className="grid gap-3">
            {people.data.people.map((person) => (
              <Link key={person.id} to={`/admin/people/${person.id}`} className="rounded-2xl border-2 border-forest-600/30 bg-white p-4 hover:border-[#6B0B0C]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#2D120D]">@{person.username}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(person.status)}`}>{person.status}</span>
                  {person.admin_role && <span className="rounded-full bg-[#6B0B0C] px-2 py-0.5 text-xs font-semibold uppercase text-[#FFF8CA]">{person.admin_role}</span>}
                </div>
                <p className="mt-1 text-sm text-stone-600">{person.full_name || "No name"} · {person.email}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">{person.account_type} · joined {when(person.created_at)}</p>
              </Link>
            ))}
            {people.data.people.length === 0 && <p className={ui.empty}>No accounts match that search.</p>}
          </div>
          <Pager offset={offset} total={people.data.total} onPage={setOffset} />
        </>
      )}
    </div>
  );
}

export function Pager({ offset, total, onPage }: { offset: number; total: number; onPage: (next: number) => void }) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + 25, total);
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className="text-stone-600">{from}–{to} of {total}</p>
      <div className="flex gap-2">
        <button type="button" className={`${ui.btn} ${ui.neutral} px-3 py-2`} disabled={offset === 0} onClick={() => onPage(Math.max(0, offset - 25))}>Previous</button>
        <button type="button" className={`${ui.btn} ${ui.neutral} px-3 py-2`} disabled={offset + 25 >= total} onClick={() => onPage(offset + 25)}>Next</button>
      </div>
    </div>
  );
}
