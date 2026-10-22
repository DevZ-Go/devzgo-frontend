import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Building2, CalendarClock, ExternalLink, Loader2, Lock } from "lucide-react";
import { Navbar } from "../components/Navbar";
import {
  answerInvitation, fetchAssessments, fetchChallenge, setSharing, submitWork, withdrawSubmission,
  type ChallengeSummary, type DeveloperSubmission,
} from "../api/challenges";
import { fetchUserCollaborations } from "../api/collaborations";
import { fetchMyProjects } from "../api/projects";
import { queryKeys } from "../api/queryKeys";
import { useAuth } from "../auth/AuthContext";
import { ui } from "../styles/editorial";
import { getApiErrorMessage } from "../utils/apiError";
import { deadlineText, difficultyLabel, minutesText, ratingLabel, typeLabel } from "../utils/challenges";
import { shortDate } from "../utils/evidence";

const ASSESSMENTS = [...queryKeys.challenges, "assessments"];

const SUBMISSION_STATUS: Record<string, string> = {
  submitted: "Submitted, awaiting review",
  in_review: "In review",
  reviewed: "Feedback released",
  withdrawn: "Withdrawn",
};

function from(c: ChallengeSummary) {
  return c.company || c.recruiter.full_name || c.recruiter.username;
}

function Summary({ challenge }: { challenge: ChallengeSummary }) {
  return (
    <>
      <p className="font-serif text-xl text-stone-900">{challenge.title}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {from(challenge)}</span>
        <span>{[typeLabel(challenge.challenge_type), difficultyLabel(challenge.difficulty), minutesText(challenge.estimated_minutes)].filter(Boolean).join(" · ")}</span>
        <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {challenge.accepting ? deadlineText(challenge.deadline_at) : "Not accepting submissions"}</span>
      </p>
      {challenge.technologies.length > 0 && (
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-stone-500">{challenge.technologies.join(" · ")}</p>
      )}
    </>
  );
}

function SharingControls({ submission }: { submission: DeveloperSubmission }) {
  const client = useQueryClient();
  const share = useMutation({
    mutationFn: ({ ratings, feedback }: { ratings: boolean; feedback: boolean }) => setSharing(submission.id, ratings, feedback),
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.challenges }),
  });
  const { share_ratings: ratings, share_feedback: feedback } = submission;
  return (
    <div className="mt-3 rounded-2xl border border-stone-200 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">On your portfolio</p>
      <label className="mt-2 flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" checked={ratings} disabled={share.isPending}
          onChange={(e) => share.mutate({ ratings: e.target.checked, feedback: e.target.checked && feedback })} className="accent-maroon-800" />
        Show the rubric ratings
      </label>
      <label className={`mt-1 flex items-center gap-2 text-sm ${ratings ? "text-stone-700" : "text-stone-400"}`}>
        <input type="checkbox" checked={feedback} disabled={!ratings || share.isPending}
          onChange={(e) => share.mutate({ ratings, feedback: e.target.checked })} className="accent-maroon-800" />
        Also show the written feedback
      </label>
      {share.isError && <p className={`${ui.error} mt-1`}>{getApiErrorMessage(share.error)}</p>}
      <p className="mt-1 text-[11px] text-stone-400">Shared results appear wherever your profile is visible. Turn them off at any time.</p>
    </div>
  );
}

function SubmissionCard({ submission }: { submission: DeveloperSubmission }) {
  const review = submission.review;
  return (
    <li className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><Summary challenge={submission.challenge} /></div>
        <Link to={`/assessments/${submission.challenge_id}`} className={`${ui.btn} ${ui.neutral}`}>Open <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
      <p className="mt-2 text-xs text-stone-600">
        {SUBMISSION_STATUS[submission.status] ?? submission.status} · {shortDate(submission.submitted_at)}
        {submission.revision > 1 ? ` · revision ${submission.revision}` : ""}
      </p>
      {review?.status === "released" && (
        <div className="mt-3 rounded-2xl bg-[#f7f5ed] p-4">
          <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {submission.challenge.criteria.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-2 text-sm">
                <dt className="text-stone-700">{c.label}</dt>
                <dd className="font-semibold text-maroon-800">{review.ratings[c.key] ? ratingLabel(review.ratings[c.key]!) : "Not rated"}</dd>
              </div>
            ))}
          </dl>
          {review.feedback && <p className="mt-3 whitespace-pre-line border-t border-stone-200 pt-3 text-sm text-stone-700">{review.feedback}</p>}
        </div>
      )}
      {submission.status === "reviewed" && <SharingControls submission={submission} />}
    </li>
  );
}

/** A developer's technical challenges: invitations, open challenges, and their own submissions and results. */
export function AssessmentsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ASSESSMENTS, queryFn: fetchAssessments });
  const answer = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: "accept" | "decline" }) => answerInvitation(id, reply),
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.challenges }),
  });
  const data = query.data;
  const invitations = (data?.invitations ?? []).filter((i) => i.status !== "declined");

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-5xl`}>
        <header className="mb-6">
          <h1 className="font-serif text-4xl text-stone-900 sm:text-5xl">Assessments</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Technical challenges from recruiters. Your results are private: they reach your portfolio only if you choose to share them.
          </p>
        </header>
        {query.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
        ) : query.isError || !data ? (
          <p className={ui.error}>{getApiErrorMessage(query.error)}</p>
        ) : (
          <div className="space-y-8">
            <section aria-labelledby="inv-title">
              <h2 id="inv-title" className="mb-3 font-serif text-2xl text-stone-900">Invitations</h2>
              {answer.isError && <p className={`${ui.error} mb-2`}>{getApiErrorMessage(answer.error)}</p>}
              {invitations.length === 0 ? (
                <p className="text-sm text-stone-500">No invitations right now.</p>
              ) : (
                <ul className="space-y-3">
                  {invitations.map((inv) => (
                    <li key={inv.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                      <Summary challenge={inv.challenge} />
                      {inv.message && <p className="mt-2 whitespace-pre-line border-l-2 border-maroon-800/30 pl-3 text-sm text-stone-700">{inv.message}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {inv.status === "pending" ? (
                          <>
                            <button type="button" onClick={() => answer.mutate({ id: inv.id, reply: "accept" })} disabled={answer.isPending} className={`${ui.btn} ${ui.primary}`}>Accept</button>
                            <button type="button" onClick={() => answer.mutate({ id: inv.id, reply: "decline" })} disabled={answer.isPending} className={`${ui.btn} ${ui.neutral}`}>Decline</button>
                            <Link to={`/assessments/${inv.challenge.id}`} className={`${ui.btn} ${ui.neutral}`}>Read the task</Link>
                          </>
                        ) : (
                          <Link to={`/assessments/${inv.challenge.id}`} className={`${ui.btn} ${ui.primary}`}>Open challenge <ArrowRight className="h-3.5 w-3.5" /></Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="subs-title">
              <h2 id="subs-title" className="mb-3 font-serif text-2xl text-stone-900">Your submissions</h2>
              {data.submissions.length === 0 ? (
                <p className="text-sm text-stone-500">You have not submitted any work yet.</p>
              ) : (
                <ul className="space-y-3">{data.submissions.map((s) => <SubmissionCard key={s.id} submission={s} />)}</ul>
              )}
            </section>

            <section aria-labelledby="open-title">
              <h2 id="open-title" className="mb-3 font-serif text-2xl text-stone-900">Open challenges</h2>
              {data.open_challenges.length === 0 ? (
                <p className="text-sm text-stone-500">No public challenges are open right now.</p>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {data.open_challenges.map((c) => (
                    <li key={c.id}>
                      <Link to={`/assessments/${c.id}`} className="block h-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-maroon-300">
                        <Summary challenge={c} />
                        <span className={`${ui.btn} ${ui.primary} mt-3`}>Submit your work</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function SubmitForm({ challengeId, current }: { challengeId: string; current: DeveloperSubmission | undefined }) {
  const client = useQueryClient();
  const { user } = useAuth();
  const userId = String(user?.id ?? "");
  const owned = useQuery({ queryKey: [...queryKeys.projects, "mine"], queryFn: () => fetchMyProjects() });
  const joined = useQuery({ queryKey: [...queryKeys.collab, "user", userId], queryFn: () => fetchUserCollaborations(userId), enabled: Boolean(userId) });
  const live = current && current.status !== "withdrawn" ? current : undefined;
  const [repo, setRepo] = useState(live?.repo_url ?? "");
  const [projectId, setProjectId] = useState(live?.project?.id ?? "");
  const [explanation, setExplanation] = useState(live?.explanation ?? "");
  const projects = [
    ...(owned.data ?? []).map((p) => ({ id: String(p.id), title: p.title, note: p.visibility === "Private" ? " (private)" : "" })),
    ...(joined.data ?? []).map((p) => ({ id: String(p.id), title: p.title, note: " (team)" })),
  ];
  const submit = useMutation({
    mutationFn: () => submitWork(challengeId, { repo_url: repo.trim() || null, project_id: projectId || null, explanation: explanation.trim() }),
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.challenges }),
  });
  const withdraw = useMutation({
    mutationFn: () => withdrawSubmission(challengeId),
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.challenges }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-xs font-semibold text-stone-600">Repository link
        <input type="url" value={repo} onChange={(e) => setRepo(e.target.value)} maxLength={500} placeholder="https://github.com/you/solution"
          className={`${ui.input} mt-1`} />
      </label>
      <label className="block text-xs font-semibold text-stone-600">Or one of your DevZ-Go projects
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={`${ui.input} mt-1`}>
          <option value="">None</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}{p.note}</option>)}
        </select>
        <span className="mt-1 block font-normal text-stone-400">The recruiter must be able to open the project, so private projects only work with a repository link.</span>
      </label>
      <label className="block text-xs font-semibold text-stone-600">Explanation
        <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} required minLength={10} maxLength={5000} rows={6}
          className={`${ui.input} mt-1`} placeholder="Your approach, trade-offs, what you would do with more time, and how to run it." />
      </label>
      {(submit.isError || withdraw.isError) && <p className={ui.error}>{getApiErrorMessage(submit.error ?? withdraw.error)}</p>}
      {submit.isSuccess && <p className="text-sm text-forest-700">Submitted. You can update it until the review starts or the deadline passes.</p>}
      <div className="flex flex-wrap justify-end gap-2">
        {live && (
          <button type="button" onClick={() => window.confirm("Withdraw your submission?") && withdraw.mutate()} disabled={withdraw.isPending}
            className={`${ui.btn} ${ui.neutral} px-4 py-2`}>Withdraw</button>
        )}
        <button type="submit" disabled={submit.isPending || (!repo.trim() && !projectId) || explanation.trim().length < 10}
          className={`${ui.btn} ${ui.primary} px-5 py-2 text-sm`}>
          {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {live ? "Update submission" : "Submit work"}
        </button>
      </div>
    </form>
  );
}

/** One challenge as a developer sees it, with the submission form while it is accepting work. */
export function AssessmentChallengePage() {
  const { id = "" } = useParams();
  const challenge = useQuery({ queryKey: [...queryKeys.challenges, id], queryFn: () => fetchChallenge(id), enabled: Boolean(id) });
  const mine = useQuery({ queryKey: ASSESSMENTS, queryFn: fetchAssessments });
  const c = challenge.data;
  const invitation = mine.data?.invitations.find((i) => i.challenge.id === id);
  const submission = mine.data?.submissions.find((s) => s.challenge_id === id);
  const locked = submission && (submission.status === "in_review" || submission.status === "reviewed");
  const needsAccept = c?.visibility === "invitation" && invitation?.status !== "accepted";

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-4xl`}>
        <Link to="/assessments" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-maroon-800">
          <ArrowLeft className="h-4 w-4" /> Assessments
        </Link>
        {challenge.isLoading || mine.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
        ) : !c ? (
          <p className={ui.empty}>This challenge is not available.</p>
        ) : (
          <div className="space-y-6">
            <header className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
              <Summary challenge={c} />
              {c.deadline_at && (
                <p className="mt-2 text-sm text-stone-600">
                  Deadline {new Date(c.deadline_at).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })} in your time zone
                </p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-stone-700">{c.description}</p>
            </header>
            <section id="submit" className="scroll-mt-24 rounded-3xl border border-maroon-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-serif text-2xl text-stone-900">Submit your work</h2>
              <p className="mt-1 text-sm text-stone-500">Use a GitHub repository link or one of your DevZ-Go projects, and explain the approach.</p>
              {submission && submission.status !== "withdrawn" && (
                <p className="mt-1 text-xs text-stone-500">
                  {SUBMISSION_STATUS[submission.status]} · last sent {shortDate(submission.updated_at ?? submission.submitted_at)}
                  {submission.repo_url && <> · <a href={submission.repo_url} target="_blank" rel="noopener noreferrer" className={ui.link}>repository <ExternalLink className="inline h-3 w-3" /></a></>}
                </p>
              )}
              <div className="mt-4">
                {locked ? (
                  <p className="flex items-center gap-2 text-sm text-stone-600"><Lock className="h-4 w-4" /> The review has started, so this submission can no longer change.
                    {submission.status === "reviewed" && <Link to="/assessments" className={ui.link}>See your feedback</Link>}</p>
                ) : !c.accepting ? (
                  <p className="text-sm text-stone-600">This challenge is not accepting submissions.</p>
                ) : needsAccept ? (
                  <p className="text-sm text-stone-600">Accept the invitation on the <Link to="/assessments" className={ui.link}>Assessments</Link> page before submitting.</p>
                ) : (
                  <SubmitForm key={`${submission?.id ?? "new"}-${submission?.status ?? ""}`} challengeId={id} current={submission} />
                )}
              </div>
            </section>
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-serif text-2xl text-stone-900">Instructions</h2>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700">{c.instructions}</pre>
              <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-stone-500">How it is reviewed</h3>
              <ul className="mt-2 space-y-1 text-sm text-stone-700">
                {c.criteria.map((k) => <li key={k.key}><span className="font-semibold">{k.label}</span>{k.description ? `: ${k.description}` : ""}</li>)}
              </ul>
              <p className="mt-2 text-xs text-stone-500">Each criterion is rated Needs improvement, Meets expectations or Strong, with written feedback.</p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
