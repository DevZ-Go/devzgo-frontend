import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ExternalLink, Loader2, Pencil, Plus, Send, Trash2, Users } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { MemberAvatar } from "../components/MemberAvatar";
import {
  deleteChallenge, fetchInvitations, fetchMyChallenges, fetchSubmissions, saveReview, setChallengeState, withdrawInvitation,
  type Rating, type RecruiterChallenge, type Submission,
} from "../api/challenges";
import { queryKeys } from "../api/queryKeys";
import { ui } from "../styles/editorial";
import { getApiErrorMessage } from "../utils/apiError";
import { RATINGS, deadlineText, difficultyLabel, minutesText, typeLabel } from "../utils/challenges";
import { shortDate } from "../utils/evidence";

const MINE = [...queryKeys.challenges, "mine"];

const STATUS_TONE: Record<string, string> = {
  draft: "bg-stone-100 text-stone-600 border-stone-200",
  open: "bg-[#DCFCE7] text-[#14532D] border-[#15803D]/40",
  closed: "bg-white text-stone-500 border-stone-300",
  pending: "bg-amber-50 text-amber-900 border-amber-300",
  accepted: "bg-[#DCFCE7] text-[#14532D] border-[#15803D]/40",
  declined: "bg-stone-100 text-stone-500 border-stone-200",
  submitted: "bg-amber-50 text-amber-900 border-amber-300",
  in_review: "bg-[#fced96] text-stone-800 border-amber-300",
  reviewed: "bg-maroon-800 text-amber-50 border-maroon-800",
};
const STATUS_TEXT: Record<string, string> = { in_review: "Review drafted", reviewed: "Feedback released" };

function Chip({ status }: { status: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_TONE[status] ?? STATUS_TONE.draft}`}>
      {STATUS_TEXT[status] ?? status}
    </span>
  );
}

function meta(c: RecruiterChallenge) {
  return [typeLabel(c.challenge_type), difficultyLabel(c.difficulty), minutesText(c.estimated_minutes),
    c.visibility === "public" ? "Open to all developers" : "Invitation only"].filter(Boolean).join(" · ");
}

/** A recruiter's technical challenges. */
export function RecruiterChallengesPage() {
  const mine = useQuery({ queryKey: MINE, queryFn: fetchMyChallenges });
  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-5xl`}>
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">Recruiting</p>
            <h1 className="mt-1 font-serif text-4xl text-stone-900 sm:text-5xl">Technical challenges</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Set a focused task, invite developers or open it to everyone, and review submissions against a rubric.
              Results reach a portfolio only if the developer chooses to share them.
            </p>
          </div>
          <Link to="/recruit/challenges/new" className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`}><Plus className="h-4 w-4" /> New challenge</Link>
        </header>
        {mine.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
        ) : mine.isError ? (
          <p className={ui.error}>{getApiErrorMessage(mine.error)}</p>
        ) : !mine.data?.length ? (
          <p className={ui.empty}>No challenges yet. Create one, publish it, then invite developers from their candidate page.</p>
        ) : (
          <ul className="space-y-3">
            {mine.data.map((c) => (
              <li key={c.id}>
                <Link to={`/recruit/challenges/${c.id}`} className="block rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-maroon-300">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-xl text-stone-900">{c.title}</span>
                    <Chip status={c.status} />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{meta(c)}{c.status === "open" ? ` · ${deadlineText(c.deadline_at)}` : ""}</p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
                    <span>{c.counts.invited} invited</span><span>{c.counts.accepted} accepted</span>
                    <span>{c.counts.submitted} awaiting review</span><span>{c.counts.in_review} review drafted</span><span>{c.counts.reviewed} released</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function ReviewPanel({ challenge, submission }: { challenge: RecruiterChallenge; submission: Submission }) {
  const client = useQueryClient();
  const released = submission.review?.status === "released";
  const [ratings, setRatings] = useState<Record<string, Rating>>(submission.review?.ratings ?? {});
  const [feedback, setFeedback] = useState(submission.review?.feedback ?? "");
  const complete = challenge.criteria.every((c) => ratings[c.key]) && feedback.trim().length > 0;
  const save = useMutation({
    mutationFn: (release: boolean) => saveReview(challenge.id, submission.id, { ratings, feedback: feedback.trim(), release }),
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.challenges }),
  });

  return (
    <div className="mt-4 space-y-4 border-t border-stone-100 pt-4">
      <div className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-2">
          {submission.repo_url && (
            <a href={submission.repo_url} target="_blank" rel="noopener noreferrer" className={`${ui.btn} ${ui.neutral}`}>
              <ExternalLink className="h-3.5 w-3.5" /> Repository
            </a>
          )}
          {submission.project && <Link to={`/project/${submission.project.id}`} className={`${ui.btn} ${ui.neutral}`}>Project: {submission.project.title}</Link>}
        </div>
        <p className="whitespace-pre-line rounded-2xl bg-[#f7f5ed] p-3 text-stone-700">{submission.explanation}</p>
      </div>
      <fieldset disabled={released || save.isPending} className="space-y-3">
        <legend className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Rubric</legend>
        {challenge.criteria.map((c) => (
          <div key={c.key} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-sm font-semibold text-stone-900">{c.label}</p>
              {c.description && <p className="text-xs text-stone-500">{c.description}</p>}
            </div>
            <div role="radiogroup" aria-label={c.label} className="flex flex-wrap gap-1">
              {RATINGS.map(([id, text]) => (
                <button key={id} type="button" role="radio" aria-checked={ratings[c.key] === id}
                  onClick={() => setRatings((r) => ({ ...r, [c.key]: id }))}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    ratings[c.key] === id ? "border-maroon-800 bg-maroon-800 text-amber-50" : "border-stone-200 bg-white text-stone-600 hover:border-maroon-700"}`}>
                  {text}
                </button>
              ))}
            </div>
          </div>
        ))}
        <label className="block text-xs font-semibold text-stone-600">Written feedback
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={5} maxLength={5000} className={`${ui.input} mt-1`}
            placeholder="What worked, what to improve, and why. The developer sees this once you release it." />
        </label>
      </fieldset>
      {save.isError && <p className={ui.error}>{getApiErrorMessage(save.error)}</p>}
      {released ? (
        <p className="text-xs text-stone-500">Released {shortDate(submission.review?.released_at ?? null)}. Released reviews cannot change.</p>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => save.mutate(false)} disabled={save.isPending} className={`${ui.btn} ${ui.neutral} px-4 py-2`}>Save draft</button>
          <button type="button" onClick={() => save.mutate(true)} disabled={save.isPending || !complete} className={`${ui.btn} ${ui.primary} px-4 py-2`}
            title={complete ? undefined : "Rate every criterion and write feedback first"}>
            {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Release to developer
          </button>
        </div>
      )}
    </div>
  );
}

function SubmissionRow({ challenge, submission }: { challenge: RecruiterChallenge; submission: Submission }) {
  const [open, setOpen] = useState(false);
  const name = submission.developer.full_name || submission.developer.username;
  return (
    <li className="rounded-2xl border border-stone-200 p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-3 text-left">
        <MemberAvatar name={name} src={submission.developer.avatar_url} size="sm" className="rounded-lg" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-stone-900">{name}</span>
          <span className="block text-xs text-stone-500">
            Submitted {shortDate(submission.submitted_at)}{submission.revision > 1 ? ` · revision ${submission.revision}` : ""}
          </span>
        </span>
        <Chip status={submission.status} />
        <ChevronDown className={`h-4 w-4 text-stone-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <Link to={`/recruit/candidates/${submission.developer.id}`} className={`${ui.link} mt-2 inline-block text-xs`}>Open candidate page</Link>
          <ReviewPanel key={submission.revision} challenge={challenge} submission={submission} />
        </>
      )}
    </li>
  );
}

/** One challenge: state changes, who was invited, and the submissions to review. */
export function RecruiterChallengePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const mine = useQuery({ queryKey: MINE, queryFn: fetchMyChallenges });
  const challenge = mine.data?.find((c) => c.id === id);
  const invitations = useQuery({ queryKey: [...queryKeys.challenges, id, "invitations"], queryFn: () => fetchInvitations(id), enabled: Boolean(challenge) });
  const submissions = useQuery({ queryKey: [...queryKeys.challenges, id, "submissions"], queryFn: () => fetchSubmissions(id), enabled: Boolean(challenge) });
  const refresh = () => void client.invalidateQueries({ queryKey: queryKeys.challenges });
  const state = useMutation({ mutationFn: (action: "publish" | "close") => setChallengeState(id, action), onSuccess: refresh });
  const remove = useMutation({ mutationFn: () => deleteChallenge(id), onSuccess: () => { refresh(); navigate("/recruit/challenges", { replace: true }); } });
  const withdraw = useMutation({ mutationFn: (invitationId: string) => withdrawInvitation(id, invitationId), onSuccess: refresh });
  const error = state.error ?? remove.error ?? withdraw.error;

  if (mine.isLoading) {
    return <div className={ui.page}><Navbar /><div className="flex justify-center pt-40"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div></div>;
  }
  if (!challenge) {
    return (
      <div className={ui.page}><Navbar />
        <main className={`${ui.main} max-w-3xl`}><p className={ui.empty}>This challenge could not be found. <Link to="/recruit/challenges" className={ui.link}>All challenges</Link></p></main>
      </div>
    );
  }
  const received = challenge.counts.submitted + challenge.counts.in_review + challenge.counts.reviewed;

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-5xl`}>
        <Link to="/recruit/challenges" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-maroon-800">
          <ArrowLeft className="h-4 w-4" /> Challenges
        </Link>
        <header className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-3xl text-stone-900 sm:text-4xl">{challenge.title}</h1>
                <Chip status={challenge.status} />
              </div>
              <p className="mt-1 text-sm text-stone-500">{meta(challenge)}</p>
              <p className="mt-1 text-sm text-stone-600">
                {challenge.deadline_at
                  ? `Deadline ${new Date(challenge.deadline_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} (your time) · ${deadlineText(challenge.deadline_at)}`
                  : "No deadline"}
              </p>
              {challenge.technologies.length > 0 && (
                <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-stone-500">{challenge.technologies.join(" · ")}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {challenge.status !== "closed" && <Link to={`/recruit/challenges/${id}/edit`} className={`${ui.btn} ${ui.neutral}`}><Pencil className="h-3.5 w-3.5" /> Edit</Link>}
              {challenge.status !== "open" && (
                <button type="button" onClick={() => state.mutate("publish")} disabled={state.isPending} className={`${ui.btn} ${ui.primary}`}>
                  {challenge.status === "closed" ? "Reopen" : "Publish"}
                </button>
              )}
              {challenge.status === "open" && (
                <button type="button" onClick={() => state.mutate("close")} disabled={state.isPending} className={`${ui.btn} ${ui.neutral}`}>Close submissions</button>
              )}
              {received === 0 && (
                <button type="button" onClick={() => window.confirm("Delete this challenge? This cannot be undone.") && remove.mutate()}
                  disabled={remove.isPending} className={`${ui.btn} ${ui.danger}`}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              )}
            </div>
          </div>
          {error && <p className={`${ui.error} mt-3`}>{getApiErrorMessage(error)}</p>}
          <details className="mt-4 border-t border-stone-100 pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-stone-700">Description, instructions and rubric</summary>
            <p className="mt-3 text-sm text-stone-700">{challenge.description}</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#f7f5ed] p-3 font-sans text-sm text-stone-700">{challenge.instructions}</pre>
            <ul className="mt-3 space-y-1 text-sm">
              {challenge.criteria.map((c) => <li key={c.key}><span className="font-semibold">{c.label}</span>{c.description ? `: ${c.description}` : ""}</li>)}
            </ul>
          </details>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="subs-title">
            <h2 id="subs-title" className="font-serif text-2xl text-stone-900">Submissions</h2>
            <p className="text-xs text-stone-500">Ratings use {RATINGS.map(([, t]) => t).join(", ")}. A review stays private until you release it.</p>
            {submissions.isLoading ? <Loader2 className="mt-4 h-5 w-5 animate-spin text-maroon-700" /> : !submissions.data?.length ? (
              <p className="mt-4 text-sm text-stone-500">No submissions yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {submissions.data.map((s) => <SubmissionRow key={s.id} challenge={challenge} submission={s} />)}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:self-start" aria-labelledby="inv-title">
            <h2 id="inv-title" className="flex items-center gap-2 font-serif text-xl text-stone-900"><Users className="h-4 w-4 text-maroon-800" /> Invitations</h2>
            <p className="mt-1 text-xs text-stone-500">
              {challenge.accepting
                ? <>Invite people from their <Link to="/recruit/talent" className={ui.link}>candidate page</Link> or from <Link to="/recruit/match" className={ui.link}>Match a role</Link>.</>
                : "Publish the challenge with a future deadline (or none) to invite people."}
            </p>
            {!invitations.data?.length ? (
              <p className="mt-3 text-sm text-stone-500">No one invited yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-stone-100">
                {invitations.data.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-2 py-2.5">
                    <Link to={`/recruit/candidates/${inv.developer.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-900 hover:text-maroon-800">
                      {inv.developer.full_name || inv.developer.username}
                    </Link>
                    <Chip status={inv.status} />
                    {inv.status === "pending" && (
                      <button type="button" onClick={() => withdraw.mutate(inv.id)} disabled={withdraw.isPending} className="text-xs text-stone-400 hover:text-crimson-700">Withdraw</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
