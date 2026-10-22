import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Check, Loader2, Send, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { MemberAvatar } from "../components/MemberAvatar";
import { answerRequest, fetchIncomingRequests } from "../api/recruiting";
import { fetchMyProfile } from "../api/profiles";
import { ui } from "../styles/editorial";

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** Recruiter contact requests a developer received. Accepting opens Messages; declining is private to the recruiter. */
export function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const incoming = useQuery({ queryKey: ["requests-incoming"], queryFn: fetchIncomingRequests });
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: fetchMyProfile });
  const answer = useMutation({
    mutationFn: ({ id, choice }: { id: string; choice: "accept" | "decline"; recruiterId: string }) => answerRequest(id, choice),
    onSuccess: (_data, { choice, recruiterId }) => {
      void queryClient.invalidateQueries({ queryKey: ["requests-incoming"] });
      if (choice === "accept") navigate(`/messages?user=${recruiterId}`);
    },
  });

  const rows = incoming.data ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const answered = rows.filter((r) => r.status !== "pending");

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-3xl`}>
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">Opportunities</p>
          <h1 className="mt-1 font-serif text-4xl text-stone-900 sm:text-5xl">Recruiter requests</h1>
          <p className="mt-2 text-sm text-stone-600">
            Recruiters who would like to talk about a role. Accept to open Messages with them; decline and they cannot ask again for 30 days.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
          <p className="flex items-center gap-2 text-stone-700">
            <Briefcase className="h-4 w-4 text-maroon-800" />
            {profile.data?.openToWork ? "You are marked open to work." : "You are not marked open to work."}
          </p>
          <Link to="/settings?section=availability" className={ui.link}>Change availability</Link>
        </div>

        {incoming.isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
        ) : rows.length === 0 ? (
          <p className={ui.empty}>No recruiter requests yet.</p>
        ) : (
          <div className="space-y-8">
            {[["Waiting for you", pending], ["Answered", answered]].map(([title, list]) =>
              (list as typeof rows).length === 0 ? null : (
                <section key={title as string}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">{title as string}</h2>
                  <ul className="space-y-3">
                    {(list as typeof rows).map((r) => {
                      const name = r.recruiter.full_name || r.recruiter.username;
                      return (
                        <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-3">
                            <MemberAvatar name={name} src={r.recruiter.avatar_url} size="md" />
                            <div className="min-w-0 flex-1">
                              <Link to={`/profile/${r.recruiter.id}`} className="block truncate font-semibold text-stone-900 hover:text-maroon-800">{name}</Link>
                              <p className="truncate text-xs text-stone-500">Recruiter{r.recruiter_company ? ` · ${r.recruiter_company}` : ""} · {when(r.created_at)}</p>
                            </div>
                            {r.status !== "pending" && (
                              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-stone-600">{r.status}</span>
                            )}
                          </div>
                          <p className="mt-3 font-semibold text-stone-900">{r.role_title}{r.work_type ? <span className="font-normal text-stone-500"> · {r.work_type}</span> : null}</p>
                          <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{r.message}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {r.status === "pending" ? (
                              <>
                                <button type="button" disabled={answer.isPending} onClick={() => answer.mutate({ id: r.id, choice: "accept", recruiterId: r.recruiter.id })} className={`${ui.btn} ${ui.positive}`}>
                                  <Check className="h-3.5 w-3.5" /> Accept and open Messages
                                </button>
                                <button type="button" disabled={answer.isPending} onClick={() => answer.mutate({ id: r.id, choice: "decline", recruiterId: r.recruiter.id })} className={`${ui.btn} ${ui.neutral}`}>
                                  <X className="h-3.5 w-3.5" /> Decline
                                </button>
                              </>
                            ) : r.status === "accepted" ? (
                              <Link to={`/messages?user=${r.recruiter.id}`} className={`${ui.btn} ${ui.primary}`}><Send className="h-3.5 w-3.5" /> Message {name.split(" ")[0]}</Link>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ),
            )}
          </div>
        )}
      </main>
    </div>
  );
}
