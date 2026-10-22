import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleHelp, Compass, Inbox, ListChecks, Loader2, Search, ShieldCheck } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { MemberAvatar } from "../components/MemberAvatar";
import { openRecruiterTour } from "../components/tour/events";
import { fetchMyProfile } from "../api/profiles";
import { ENTRY_STATUSES, fetchDashboard, statusLabel } from "../api/recruiting";
import { ui } from "../styles/editorial";

const ACTIONS = [
  { to: "/recruit/talent", label: "Find talent", body: "Search by tech and evidence", icon: Search },
  { to: "/explore", label: "Explore projects", body: "Browse public work", icon: Compass },
  { to: "/recruit/shortlists", label: "Shortlists", body: "Private lists and notes", icon: ListChecks },
  { to: "/recruit/inbox", label: "Inbox", body: "Contact requests and replies", icon: Inbox },
];

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="font-serif text-3xl tabular-nums text-stone-900">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
    </div>
  );
}

const requestTone: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  accepted: "bg-[#DCFCE7] text-[#14532D] border-[#15803D]/40",
  declined: "bg-stone-100 text-stone-600 border-stone-200",
  withdrawn: "bg-stone-100 text-stone-500 border-stone-200",
};

/** Where a recruiter lands: what is in progress, and the way into each recruiting tool. */
export function RecruiterDashboardPage() {
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: fetchMyProfile });
  const dashboard = useQuery({ queryKey: ["recruiting-dashboard"], queryFn: fetchDashboard });
  const data = dashboard.data;
  const pipelineTotal = data ? Object.values(data.statuses).reduce((a, b) => a + b, 0) : 0;
  const name = profile.data?.fullName || profile.data?.username;

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-6xl`}>
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">
              Recruiting{profile.data?.company ? ` · ${profile.data.company}` : ""}
            </p>
            <h1 className="mt-1 font-serif text-4xl text-stone-900 sm:text-5xl">{name ? `Welcome, ${name.split(" ")[0]}` : "Your dashboard"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">Review real project evidence, keep private shortlists, and reach out when someone fits.</p>
          </div>
          <button type="button" onClick={openRecruiterTour} className={`${ui.btn} ${ui.neutral}`}>
            <CircleHelp className="h-3.5 w-3.5" /> Take the tour
          </button>
        </header>

        <section data-tour="dash-summary" aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {dashboard.isLoading ? (
            <div className="col-span-full flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
          ) : dashboard.error || !data ? (
            <p className={`${ui.error} col-span-full`}>Your dashboard could not load. Refresh to try again.</p>
          ) : (
            <>
              <Figure value={data.candidates} label="Candidates shortlisted" />
              <Figure value={data.shortlists} label="Shortlists" />
              <Figure value={data.requests.pending ?? 0} label="Requests waiting" />
              <Figure value={data.requests.accepted ?? 0} label="Requests accepted" />
            </>
          )}
        </section>

        <section aria-label="Recruiting tools" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIONS.map(({ to, label, body, icon: Icon }) => (
            <Link key={to} to={to}
              className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-maroon-300 hover:shadow-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-stone-900">{label}</span>
                <span className="block text-xs text-stone-500">{body}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-maroon-700" />
            </Link>
          ))}
        </section>

        {data && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="pipeline-title">
              <div className="flex items-center justify-between gap-2">
                <h2 id="pipeline-title" className="font-serif text-2xl text-stone-900">Pipeline</h2>
                <Link to="/recruit/shortlists" className="text-xs font-semibold text-maroon-800 hover:underline">Open shortlists</Link>
              </div>
              {pipelineTotal === 0 ? (
                <p className="mt-4 text-sm text-stone-500">
                  No one shortlisted yet. Start in <Link to="/recruit/talent" className="font-semibold text-maroon-800 hover:underline">Find talent</Link>.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {ENTRY_STATUSES.map(([id, label]) => {
                    const count = data.statuses[id] ?? 0;
                    return (
                      <li key={id} className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-sm">
                        <span className="text-stone-600">{label}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-stone-100">
                          <span className="block h-full rounded-full bg-maroon-700" style={{ width: `${(count / pipelineTotal) * 100}%` }} />
                        </span>
                        <span className="text-right tabular-nums text-stone-800">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {data.recent_entries.length > 0 && (
                <>
                  <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-stone-500">Recently updated</h3>
                  <ul className="mt-2 divide-y divide-stone-100">
                    {data.recent_entries.map((entry) => (
                      <li key={entry.id} className="flex items-center gap-3 py-2">
                        <MemberAvatar name={entry.candidate.full_name || entry.candidate.username} src={entry.candidate.avatar_url} />
                        <Link to={`/recruit/candidates/${entry.candidate.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-900 hover:text-maroon-800">
                          {entry.candidate.full_name || entry.candidate.username}
                        </Link>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">{statusLabel(entry.status)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="requests-title">
              <div className="flex items-center justify-between gap-2">
                <h2 id="requests-title" className="font-serif text-2xl text-stone-900">Contact requests</h2>
                <Link to="/recruit/inbox" className="text-xs font-semibold text-maroon-800 hover:underline">Inbox</Link>
              </div>
              {data.recent_requests.length === 0 ? (
                <p className="mt-4 text-sm text-stone-500">Send one from a candidate's evaluation page.</p>
              ) : (
                <ul className="mt-3 divide-y divide-stone-100">
                  {data.recent_requests.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2.5">
                      <MemberAvatar name={r.candidate.full_name || r.candidate.username} src={r.candidate.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-900">{r.candidate.full_name || r.candidate.username}</p>
                        <p className="truncate text-xs text-stone-500">{r.role_title}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${requestTone[r.status]}`}>{r.status}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-5 flex items-start gap-2 rounded-xl bg-[#FAF7EE] p-3 text-xs leading-relaxed text-stone-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
                Shortlists and notes are only visible to you. Candidates see a request only when you send one, and they decide whether to reply.
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
