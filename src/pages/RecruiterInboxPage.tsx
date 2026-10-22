import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { MemberAvatar } from "../components/MemberAvatar";
import { fetchSentRequests, withdrawRequest, type RecruitmentRequest } from "../api/recruiting";
import { ui } from "../styles/editorial";

const GROUPS: { status: RecruitmentRequest["status"]; title: string; empty: string }[] = [
  { status: "accepted", title: "Accepted", empty: "No accepted requests yet." },
  { status: "pending", title: "Waiting for an answer", empty: "Nothing waiting." },
  { status: "declined", title: "Declined", empty: "None declined." },
  { status: "withdrawn", title: "Withdrawn", empty: "None withdrawn." },
];

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** Contact requests a recruiter has sent, and the conversations they opened. */
export function RecruiterInboxPage() {
  const queryClient = useQueryClient();
  const sent = useQuery({ queryKey: ["requests-sent"], queryFn: fetchSentRequests });
  const withdraw = useMutation({
    mutationFn: withdrawRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["requests-sent"] });
      void queryClient.invalidateQueries({ queryKey: ["recruiting-dashboard"] });
    },
  });

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-4xl`}>
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">Recruiting</p>
            <h1 className="mt-1 font-serif text-4xl text-stone-900 sm:text-5xl">Inbox</h1>
            <p className="mt-2 text-sm text-stone-600">Requests you sent. When someone accepts, the conversation continues in Messages.</p>
          </div>
          <Link to="/messages" className={`${ui.btn} ${ui.primary}`}><MessageSquare className="h-3.5 w-3.5" /> All messages</Link>
        </header>

        <div data-tour="inbox-requests" className="space-y-6">
          {sent.isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
          ) : sent.error ? (
            <p className={ui.error}>Your requests could not load.</p>
          ) : (sent.data ?? []).length === 0 ? (
            <p className={ui.empty}>
              No contact requests yet. Open a candidate from <Link to="/recruit/talent" className={ui.link}>Find talent</Link> and use Contact.
            </p>
          ) : (
            GROUPS.map((group) => {
              const rows = (sent.data ?? []).filter((r) => r.status === group.status);
              if (rows.length === 0 && group.status !== "pending" && group.status !== "accepted") return null;
              return (
                <section key={group.status} aria-labelledby={`group-${group.status}`}>
                  <h2 id={`group-${group.status}`} className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    {group.title} · {rows.length}
                  </h2>
                  {rows.length === 0 ? (
                    <p className="text-sm text-stone-500">{group.empty}</p>
                  ) : (
                    <ul className="space-y-2">
                      {rows.map((r) => {
                        const name = r.candidate.full_name || r.candidate.username;
                        return (
                          <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-center gap-3">
                              <MemberAvatar name={name} src={r.candidate.avatar_url} size="md" />
                              <div className="min-w-0 flex-1">
                                <Link to={`/recruit/candidates/${r.candidate.id}`} className="block truncate font-semibold text-stone-900 hover:text-maroon-800">{name}</Link>
                                <p className="truncate text-xs text-stone-500">{r.role_title}{r.work_type ? ` · ${r.work_type}` : ""} · sent {when(r.created_at)}</p>
                              </div>
                              {r.status === "accepted" && (
                                <Link to={`/messages?user=${r.candidate.id}`} className={`${ui.btn} ${ui.primary}`}><Send className="h-3.5 w-3.5" /> Message</Link>
                              )}
                              {r.status === "pending" && (
                                <button type="button" disabled={withdraw.isPending} onClick={() => withdraw.mutate(r.id)} className={`${ui.btn} ${ui.neutral}`}>Withdraw</button>
                              )}
                            </div>
                            <p className="mt-2 line-clamp-2 text-sm text-stone-600">{r.message}</p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
