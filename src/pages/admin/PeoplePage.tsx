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
        <label className="sr-only" htmlFor="people-search">
          Search people
        </label>
        <input
          id="people-search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Name, @handle, email"
          className={ui.input}
        />
        <button type="submit" className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`}>
          Search
        </button>
      </form>
      {people.isLoading && <Loading />}
      {people.data && (
        <>
          <p className="text-xs text-stone-500">{people.data.total} accounts</p>
          <div className="grid gap-2">
            {people.data.people.map((person) => (
              <Link
                key={person.id}
                to={`/admin/people/${person.id}`}
                className="rounded-xl border border-[#DECDBA] bg-white px-4 py-3 hover:border-[#6B0B0C] transition"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#2D120D]">@{person.username}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(person.status)}`}>
                    {person.status}
                  </span>
                  {person.admin_role && (
                    <span className="rounded-full bg-[#6B0B0C] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#FFF8CA]">
                      {person.admin_role}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-stone-600">
                  {person.full_name || "—"} · {person.email}
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-stone-400">
                  {person.account_type} · {when(person.created_at)}
                </p>
              </Link>
            ))}
            {people.data.people.length === 0 && <p className={ui.empty}>No matches.</p>}
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
    <div className="flex items-center justify-between gap-3 text-xs">
      <p className="text-stone-500">
        {from}–{to} / {total}
      </p>
      <div className="flex gap-2">
        <button type="button" className={`${ui.btn} ${ui.neutral} px-3 py-1.5`} disabled={offset === 0} onClick={() => onPage(Math.max(0, offset - 25))}>
          Prev
        </button>
        <button type="button" className={`${ui.btn} ${ui.neutral} px-3 py-1.5`} disabled={offset + 25 >= total} onClick={() => onPage(offset + 25)}>
          Next
        </button>
      </div>
    </div>
  );
}
