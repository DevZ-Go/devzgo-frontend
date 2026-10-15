import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { InvitationsInbox } from "../components/InvitationsInbox";
import {
  acceptConnection,
  declineConnection,
  fetchConnectionPage,
  removeConnection,
  type ConnectionList,
} from "../api/connections";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";
import type { Connection } from "../types/network";

const TABS: [ConnectionList, string][] = [
  ["accepted", "Connections"],
  ["incoming", "Received"],
  ["outgoing", "Sent"],
];
const btn = "rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60";

export function ConnectionsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find(([k]) => k === params.get("tab"))?.[0] ?? "accepted") as ConnectionList;
  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(typed.trim()), 300);
    return () => clearTimeout(t);
  }, [typed]);

  const client = useQueryClient();
  const list = useInfiniteQuery({
    queryKey: [...queryKeys.connections, "list", tab, tab === "accepted" ? search : ""],
    queryFn: ({ pageParam }) => fetchConnectionPage(tab, search, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextPage,
  });
  const [error, setError] = useState<string | null>(null);
  const act = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onMutate: () => setError(null),
    onError: (err) => setError(getApiErrorMessage(err)),
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.connections }),
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  function actions(c: Connection) {
    if (tab === "incoming")
      return (
        <>
          <button className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`} disabled={act.isPending}
            onClick={() => act.mutate(() => acceptConnection(c.id))}>Accept</button>
          <button className={`${btn} border border-gray-200 text-gray-700 hover:bg-gray-50`} disabled={act.isPending}
            onClick={() => act.mutate(() => declineConnection(c.id))}>Decline</button>
        </>
      );
    const label = tab === "outgoing" ? "Withdraw" : "Remove";
    return (
      <button className={`${btn} border border-gray-200 text-gray-700 hover:bg-gray-50`} disabled={act.isPending}
        onClick={() => (tab === "outgoing" || window.confirm(`Remove ${c.partner.fullName} from your connections?`)) &&
          act.mutate(() => removeConnection(c.id))}>
        {label}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My network</h1>
          <Link to="/network" className="text-sm text-blue-600 hover:underline">Back to feed</Link>
        </div>
        <InvitationsInbox />
        <div role="tablist" className="mb-4 flex gap-2">
          {TABS.map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key}
              onClick={() => setParams(key === "accepted" ? {} : { tab: key })}
              className={`${btn} ${tab === key ? "bg-gray-900 text-white" : "bg-white text-gray-700 border border-gray-200"}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === "accepted" && (
          <label className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Search by name or username"
              aria-label="Search connections" className="w-full text-sm outline-none" />
          </label>
        )}
        {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
        {list.isPending ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
        ) : list.isError ? (
          <p className="text-sm text-red-600">{getApiErrorMessage(list.error)}</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            {tab === "accepted" ? (search ? "No connections match that search." : "No connections yet.")
              : tab === "incoming" ? "No requests waiting for you." : "No requests waiting on others."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {items.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-4">
                <Link to={`/profile/${c.partner.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {c.partner.avatarUrl ? (
                    <img src={c.partner.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {(c.partner.fullName || c.partner.username).slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900">{c.partner.fullName}</span>
                    <span className="block truncate text-xs text-gray-500">
                      @{c.partner.username}
                      {c.partner.headline ? ` · ${c.partner.headline}` : ""}
                      {tab === "accepted" && c.mutualCount ? ` · ${c.mutualCount} mutual` : ""}
                    </span>
                  </span>
                </Link>
                <div className="flex gap-2">{actions(c)}</div>
              </li>
            ))}
          </ul>
        )}
        {list.hasNextPage && (
          <button className={`${btn} mt-4 w-full border border-gray-200 bg-white text-gray-700`}
            disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            {list.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        )}
      </main>
    </div>
  );
}
