import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Compass, Handshake, Inbox, Loader2, Search, Users, type LucideIcon } from "lucide-react";
import { Navbar } from "../components/Navbar";
import {
  acceptConnection,
  declineConnection,
  fetchConnectionPage,
  fetchConnections,
  fetchSuggestedDevelopers,
  removeConnection,
  sendConnectionRequest,
  type ConnectionList,
} from "../api/connections";
import {
  acceptCollaborationRequest,
  answerInvitation,
  declineCollaborationRequest,
  fetchIncomingCollabRequests,
  fetchMyCollabRequests,
  fetchMyInvitations,
  withdrawCollabRequest,
} from "../api/collaborations";
import { assetUrlOrNull } from "../api/config";
import { queryKeys } from "../api/queryKeys";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../utils/apiError";
import type { Connection, ConnectionUserSummary } from "../types/network";
import { NetworkPlaces } from "../components/network/NetworkPlaces";
import { ui } from "../styles/editorial";

type Tab = "connections" | "requests" | "collaboration" | "suggestions";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "connections", label: "Connections", icon: Users },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "collaboration", label: "Collaboration", icon: Handshake },
  { id: "suggestions", label: "People", icon: Compass },
];
const OLD_TABS: Record<string, Tab> = { accepted: "connections", incoming: "requests", outgoing: "requests" };

const accept = `${ui.btn} bg-maroon-800 text-amber-50 hover:bg-maroon-900`;
const quiet = `${ui.btn} ${ui.neutral}`;

function readTab(value: string | null): Tab {
  if (TABS.some((t) => t.id === value)) return value as Tab;
  return (value && OLD_TABS[value]) || "connections";
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function rawPerson(u: { id: string; username: string; full_name?: string | null; headline?: string | null; avatar_url?: string | null }): ConnectionUserSummary {
  return { id: u.id, username: u.username, fullName: u.full_name, headline: u.headline, avatarUrl: assetUrlOrNull(u.avatar_url) };
}

function PersonRow({ person, detail, children }: { person: ConnectionUserSummary; detail?: ReactNode; children?: ReactNode }) {
  const name = person.fullName || person.username || "Developer";
  const href = `/profile/${person.id}`;
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Link to={href} className="shrink-0">
          {person.avatarUrl ? (
            <img src={person.avatarUrl} alt="" className="h-11 w-11 rounded-xl object-cover ring-1 ring-stone-200" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-maroon-800 font-serif text-lg text-amber-50">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </Link>
        <div className="min-w-0">
          <Link to={href} className="block truncate font-serif text-lg leading-tight text-stone-900 hover:text-maroon-800">
            {name}
          </Link>
          <p className="truncate text-xs text-stone-500">
            @{person.username}
            {person.headline ? ` · ${person.headline}` : ""}
          </p>
          {detail && <div className="mt-1.5 text-sm text-stone-700">{detail}</div>}
        </div>
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2 pl-14 sm:pl-0">{children}</div>}
    </li>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <header className="border-b border-stone-100 px-5 py-3.5">
        <h2 className="font-serif text-xl text-stone-900">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-stone-500">{children}</p>;
}

function Loading() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-5 w-5 animate-spin text-maroon-700" />
    </div>
  );
}

function Rows<T>({ query, items, empty, children }: {
  query: { isPending: boolean; isError: boolean; error: unknown };
  items: T[];
  empty: string;
  children: (item: T) => ReactNode;
}) {
  if (query.isPending) return <Loading />;
  if (query.isError) return <p className={`px-5 py-6 ${ui.error}`}>{getApiErrorMessage(query.error)}</p>;
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return <ul className="divide-y divide-stone-100">{items.map(children)}</ul>;
}

function ConnectionSection({ kind, search = "", title, hint, empty, actions }: {
  kind: ConnectionList;
  search?: string;
  title: string;
  hint?: string;
  empty: string;
  actions: (c: Connection) => ReactNode;
}) {
  const list = useInfiniteQuery({
    queryKey: [...queryKeys.connections, "list", kind, search],
    queryFn: ({ pageParam }) => fetchConnectionPage(kind, search, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextPage,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <Section title={title} hint={hint}>
      <Rows query={list} items={items} empty={empty}>
        {(c) => (
          <PersonRow key={c.id} person={c.partner}
            detail={kind === "accepted" ? (c.mutualCount ? `${c.mutualCount} mutual` : null) : `Sent ${shortDate(c.createdAt)}`}>
            {actions(c)}
          </PersonRow>
        )}
      </Rows>
      {list.hasNextPage && (
        <div className="border-t border-stone-100 p-3">
          <button className={`${quiet} w-full py-2`} disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
            {list.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </Section>
  );
}

export function ConnectionsPage() {
  const [params, setParams] = useSearchParams();
  const tab = readTab(params.get("tab"));
  const navigate = useNavigate();
  const { user } = useAuth();
  const meId = user?.id ? String(user.id) : "";
  const client = useQueryClient();

  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(typed.trim()), 300);
    return () => clearTimeout(t);
  }, [typed]);

  const summary = useQuery({ queryKey: [...queryKeys.connections, "summary"], queryFn: fetchConnections });
  const suggestions = useQuery({ queryKey: [...queryKeys.connections, "suggested", 20], queryFn: () => fetchSuggestedDevelopers(20) });
  const invitations = useQuery({ queryKey: [...queryKeys.collab, "invitations", "mine"], queryFn: fetchMyInvitations });
  const joinRequests = useQuery({ queryKey: [...queryKeys.collab, "requests", "incoming"], queryFn: fetchIncomingCollabRequests });
  const myRequests = useQuery({ queryKey: [...queryKeys.collab, "requests", "mine"], queryFn: fetchMyCollabRequests });

  const [asked, setAsked] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const act = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onMutate: () => setError(null),
    onError: (err) => setError(getApiErrorMessage(err)),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: queryKeys.connections });
      void client.invalidateQueries({ queryKey: queryKeys.collab });
    },
  });
  const busy = act.isPending;

  const people = (suggestions.data ?? []).filter((p) => p.id !== meId);
  const accepted = summary.data?.accepted.length ?? 0;
  const counts: Record<Tab, { value: number; alert?: boolean }> = {
    connections: { value: accepted },
    requests: { value: summary.data?.pendingIncoming.length ?? 0, alert: true },
    collaboration: { value: (invitations.data?.length ?? 0) + (joinRequests.data?.length ?? 0), alert: true },
    suggestions: { value: people.length },
  };

  function choose(next: Tab) {
    setError(null);
    setParams(next === "connections" ? {} : { tab: next });
  }

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-4xl`}>
        <NetworkPlaces current={tab === "suggestions" ? "people" : tab === "requests" ? "requests" : "connections"} />
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">Your network</p>
            <h1 className="mt-1 font-serif text-4xl text-stone-900 sm:text-5xl">People and projects</h1>
            <p className="mt-2 max-w-xl text-sm text-stone-600">
              Connections, requests, collaboration invites, and people you may know.
            </p>
          </div>
          <Link to="/network" className="text-sm font-semibold text-maroon-800 hover:underline">Back to feed</Link>
        </header>

        <div role="tablist" aria-label="Network sections" className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:gap-1 sm:border-b sm:border-stone-200">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            const { value, alert } = counts[id];
            return (
              <button key={id} type="button" role="tab" aria-selected={active} onClick={() => choose(id)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition sm:-mb-px sm:justify-start sm:rounded-none sm:border-0 sm:border-b-2 sm:bg-transparent sm:py-2.5 ${
                  active
                    ? "border-maroon-800 bg-maroon-800 text-amber-50 sm:text-maroon-800"
                    : "border-stone-200 bg-white text-stone-600 hover:text-stone-900 sm:border-transparent sm:text-stone-500"
                }`}>
                <Icon className="h-4 w-4" />
                {label}
                {value > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${alert ? "bg-[#fced96] text-stone-900" : "bg-stone-100 text-stone-600"}`}>
                    {value >= 50 && !alert ? "50+" : value}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && <p role="alert" className={`mb-4 ${ui.error}`}>{error}</p>}

        {tab === "connections" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-amber-200">
              <Search className="h-4 w-4 text-maroon-800" />
              <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Search by name or username"
                aria-label="Search connections" className="w-full bg-transparent text-sm text-stone-900 outline-none" />
            </label>
            <ConnectionSection kind="accepted" search={search} title="Your connections"
              empty={search ? "No connections match that search." : "No connections yet. Suggestions is a good place to start."}
              actions={(c) => (
                <>
                  <Link to={`/messages?user=${c.partner.id}`} className={quiet}>Message</Link>
                  <button type="button" className={quiet} disabled={busy}
                    onClick={() => window.confirm(`Remove ${c.partner.fullName || c.partner.username} from your connections?`) &&
                      act.mutate(() => removeConnection(c.id))}>
                    Remove
                  </button>
                </>
              )} />
          </div>
        )}

        {tab === "requests" && (
          <div className="space-y-4">
            <ConnectionSection kind="incoming" title="Received" hint="People who want to connect with you"
              empty="No one is waiting on you."
              actions={(c) => (
                <>
                  <button type="button" className={accept} disabled={busy} onClick={() => act.mutate(() => acceptConnection(c.id))}>Accept</button>
                  <button type="button" className={quiet} disabled={busy} onClick={() => act.mutate(() => declineConnection(c.id))}>Decline</button>
                </>
              )} />
            <ConnectionSection kind="outgoing" title="Sent" hint="Requests you sent that have not been answered yet"
              empty="No requests waiting on others."
              actions={(c) => (
                <button type="button" className={quiet} disabled={busy} onClick={() => act.mutate(() => removeConnection(c.id))}>Withdraw</button>
              )} />
          </div>
        )}

        {tab === "collaboration" && (
          <div className="space-y-4">
            <Section title="Invitations" hint="Project owners who asked you to join their team">
              <Rows query={invitations} items={invitations.data ?? []} empty="No invitations right now.">
                {(i) => (
                  <PersonRow key={i.id} person={rawPerson(i.inviter)}
                    detail={<>Invited you to <Link to={`/project/${i.project_id}`} className="font-semibold text-maroon-800 hover:underline">{i.project_title}</Link> as {i.role} · expires {shortDate(i.expires_at)}</>}>
                    <button type="button" className={accept} disabled={busy}
                      onClick={() => act.mutate(async () => { await answerInvitation(i.id, "accept"); navigate(`/project/${i.project_id}`); })}>
                      Accept
                    </button>
                    <button type="button" className={quiet} disabled={busy} onClick={() => act.mutate(() => answerInvitation(i.id, "decline"))}>Decline</button>
                  </PersonRow>
                )}
              </Rows>
            </Section>

            <Section title="Join requests" hint="People asking to work on your projects">
              <Rows query={joinRequests} items={joinRequests.data ?? []} empty="No one has asked to join your projects.">
                {(r) => (
                  <PersonRow key={r.id} person={r.requester}
                    detail={
                      <>
                        Wants to join <Link to={`/project/${r.projectId}`} className="font-semibold text-maroon-800 hover:underline">{r.projectTitle}</Link> as {r.role}
                        {r.message && <span className="mt-1 block text-xs italic text-stone-500">"{r.message}"</span>}
                      </>
                    }>
                    <button type="button" className={accept} disabled={busy} onClick={() => act.mutate(() => acceptCollaborationRequest(r.id, r.projectId))}>Accept</button>
                    <button type="button" className={quiet} disabled={busy} onClick={() => act.mutate(() => declineCollaborationRequest(r.id))}>Decline</button>
                  </PersonRow>
                )}
              </Rows>
            </Section>

            <Section title="Your requests" hint="Projects you asked to join">
              <Rows query={myRequests} items={myRequests.data ?? []} empty="You have no pending requests.">
                {(r) => (
                  <li key={r.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                    <div className="min-w-0 flex-1">
                      <Link to={`/project/${r.projectId}`} className="block truncate font-serif text-lg text-stone-900 hover:text-maroon-800">{r.projectTitle}</Link>
                      <p className="text-xs text-stone-500">As {r.role} · sent {shortDate(r.createdAt)}</p>
                    </div>
                    <button type="button" className={`${quiet} self-start sm:self-auto`} disabled={busy}
                      onClick={() => act.mutate(() => withdrawCollabRequest(r.id))}>
                      Withdraw
                    </button>
                  </li>
                )}
              </Rows>
            </Section>
          </div>
        )}

        {tab === "suggestions" && (
          <Section title="People you may know" hint="Most shared connections first, then newer members">
            <Rows query={suggestions} items={people} empty="No suggestions right now.">
              {(person) => (
                <PersonRow key={person.id} person={person}>
                  <button type="button" disabled={busy || asked[person.id]}
                    onClick={() => act.mutate(async () => {
                      await sendConnectionRequest(person.id);
                      setAsked((prev) => ({ ...prev, [person.id]: true }));
                    })}
                    className={`${ui.btn} bg-[#fced96] text-stone-900 hover:bg-[#f8e46a]`}>
                    {asked[person.id] ? "Request sent" : "Connect"}
                  </button>
                </PersonRow>
              )}
            </Rows>
          </Section>
        )}
      </main>
    </div>
  );
}
