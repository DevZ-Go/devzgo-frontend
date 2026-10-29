import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Select } from "../components/ui/Select";
import {
  createChallenge, fetchMyChallenges, updateChallenge, type ChallengeInput, type ChallengeType, type Criterion, type Difficulty,
  type RecruiterChallenge,
} from "../api/challenges";
import { queryKeys } from "../api/queryKeys";
import { ui } from "../styles/editorial";
import { getApiErrorMessage } from "../utils/apiError";
import { CHALLENGE_TYPES, DEFAULT_CRITERIA, DIFFICULTIES, criterionKey, fromLocalInput, toLocalInput } from "../utils/challenges";

const label = "block text-xs font-semibold text-stone-600";

function ChallengeForm({ existing }: { existing: RecruiterChallenge | null }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [type, setType] = useState<ChallengeType>(existing?.challenge_type ?? "frontend");
  const [difficulty, setDifficulty] = useState<Difficulty>(existing?.difficulty ?? "intermediate");
  const [tech, setTech] = useState((existing?.technologies ?? []).join(", "));
  const [minutes, setMinutes] = useState(existing?.estimated_minutes ? String(existing.estimated_minutes) : "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [instructions, setInstructions] = useState(existing?.instructions ?? "");
  const [deadline, setDeadline] = useState(toLocalInput(existing?.deadline_at ?? null));
  const [visibility, setVisibility] = useState(existing?.visibility ?? "invitation");
  const [criteria, setCriteria] = useState<Criterion[]>(existing?.criteria ?? DEFAULT_CRITERIA);
  const rubricLocked = Boolean(existing?.has_reviews);
  const visibilityLocked = existing?.status === "open";
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const save = useMutation({
    mutationFn: (body: ChallengeInput) => (existing ? updateChallenge(existing.id, body) : createChallenge(body)),
    onSuccess: (saved) => {
      void client.invalidateQueries({ queryKey: queryKeys.challenges });
      navigate(`/recruit/challenges/${saved.id}`, { replace: Boolean(existing) });
    },
  });

  const editCriterion = (i: number, change: Partial<Criterion>) =>
    setCriteria((rows) => rows.map((row, j) => (j === i ? { ...row, ...change } : row)));

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate({
      title: title.trim(),
      challenge_type: type,
      technologies: tech.split(",").map((t) => t.trim()).filter(Boolean),
      difficulty,
      estimated_minutes: minutes ? Number(minutes) : null,
      description: description.trim(),
      instructions: instructions.trim(),
      criteria: criteria.map((c) => ({ ...c, label: c.label.trim(), description: c.description.trim() })),
      deadline_at: fromLocalInput(deadline),
      visibility,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-serif text-2xl text-stone-900">The task</h2>
        <label className={label}>Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={120} className={`${ui.input} mt-1`}
            placeholder="Build a paginated product list" />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={label}>Type
            <Select
              aria-label="Type" value={type} onChange={(v) => setType(v as ChallengeType)} options={CHALLENGE_TYPES}
              className={`${ui.input} mt-1 font-normal`}
            />
          </label>
          <label className={label}>Difficulty
            <Select
              aria-label="Difficulty" value={difficulty} onChange={(v) => setDifficulty(v as Difficulty)} options={DIFFICULTIES}
              className={`${ui.input} mt-1 font-normal`}
            />
          </label>
          <label className={label}>Estimated minutes <span className="font-normal text-stone-400">(optional)</span>
            <input type="number" min={15} max={2400} value={minutes} onChange={(e) => setMinutes(e.target.value)} className={`${ui.input} mt-1`} placeholder="120" />
          </label>
        </div>
        <label className={label}>Technologies <span className="font-normal text-stone-400">(comma separated, up to 12)</span>
          <input value={tech} onChange={(e) => setTech(e.target.value)} className={`${ui.input} mt-1`} placeholder="React, TypeScript" />
        </label>
        <label className={label}>Short description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required minLength={10} maxLength={2000} rows={3}
            className={`${ui.input} mt-1`} placeholder="What the developer will build and why" />
        </label>
        <label className={label}>Instructions
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} required minLength={10} maxLength={10000} rows={10}
            className={`${ui.input} mt-1 font-mono text-xs leading-relaxed`}
            placeholder={"Requirements, constraints, what to submit (a repository link or a DevZ-Go project), and anything they should explain."} />
        </label>
      </section>

      <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-serif text-2xl text-stone-900">Who and when</h2>
        <label className={label}>Deadline <span className="font-normal text-stone-400">(optional, your time zone: {zone})</span>
          <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${ui.input} mt-1 sm:max-w-xs`} />
          <span className="mt-1 block font-normal text-stone-400">Stored in UTC; each developer sees it in their own time zone.</span>
        </label>
        <fieldset disabled={visibilityLocked}>
          <legend className={label}>Visibility{visibilityLocked ? " (fixed once published)" : ""}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {([["invitation", "Invitation only", "Only developers you invite can see and submit."],
              ["public", "Open to all developers", "Listed under Assessments for every developer."]] as const).map(([id, name, body]) => (
              <label key={id} className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm ${visibility === id ? "border-maroon-800 bg-maroon-50" : "border-stone-200"}`}>
                <input type="radio" name="visibility" checked={visibility === id} onChange={() => setVisibility(id)} className="mt-1 accent-maroon-800" />
                <span><span className="block font-semibold text-stone-900">{name}</span><span className="text-xs text-stone-500">{body}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="space-y-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="font-serif text-2xl text-stone-900">Rubric</h2>
          <p className="text-xs text-stone-500">
            Each criterion is rated Needs improvement, Meets expectations or Strong. {rubricLocked ? "Locked because a review has started." : "There are no numeric scores."}
          </p>
        </div>
        <fieldset disabled={rubricLocked} className="space-y-2">
          {criteria.map((c, i) => (
            <div key={c.key} className="grid gap-2 rounded-2xl bg-[#f7f5ed] p-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-center">
              <input value={c.label} onChange={(e) => editCriterion(i, { label: e.target.value })} required maxLength={60} aria-label="Criterion name" className={ui.input} />
              <input value={c.description} onChange={(e) => editCriterion(i, { description: e.target.value })} maxLength={200} aria-label="What it means"
                placeholder="What it means" className={ui.input} />
              <button type="button" onClick={() => setCriteria((rows) => rows.filter((_, j) => j !== i))} disabled={criteria.length <= 1}
                aria-label={`Remove ${c.label}`} className={`${ui.btn} ${ui.neutral} justify-self-end`}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <button type="button" disabled={criteria.length >= 10}
            onClick={() => setCriteria((rows) => [...rows, { key: criterionKey(`criterion ${rows.length + 1}`, rows.map((r) => r.key)), label: "", description: "" }])}
            className={`${ui.btn} ${ui.neutral}`}><Plus className="h-3.5 w-3.5" /> Add criterion</button>
        </fieldset>
      </section>

      {save.isError && <p className={ui.error}>{getApiErrorMessage(save.error)}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Link to={existing ? `/recruit/challenges/${existing.id}` : "/recruit/challenges"} className={`${ui.btn} ${ui.neutral} px-4 py-2 text-sm`}>Cancel</Link>
        <button type="submit" disabled={save.isPending} className={`${ui.btn} ${ui.primary} px-5 py-2 text-sm`}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {existing ? "Save changes" : "Save as draft"}
        </button>
      </div>
    </form>
  );
}

/** Create a challenge (saved as a draft) or edit one the recruiter owns. */
export function ChallengeEditorPage() {
  const { id } = useParams();
  const mine = useQuery({ queryKey: [...queryKeys.challenges, "mine"], queryFn: fetchMyChallenges, enabled: Boolean(id) });
  const existing = id ? mine.data?.find((c) => c.id === id) ?? null : null;

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-4xl`}>
        <Link to={id ? `/recruit/challenges/${id}` : "/recruit/challenges"} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-maroon-800">
          <ArrowLeft className="h-4 w-4" /> {id ? "Back to the challenge" : "Challenges"}
        </Link>
        <h1 className="mb-6 font-serif text-4xl text-stone-900">{id ? "Edit challenge" : "New technical challenge"}</h1>
        {id && mine.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
        ) : id && !existing ? (
          <p className={ui.empty}>This challenge could not be found.</p>
        ) : existing?.status === "closed" ? (
          <p className={ui.empty}>Closed challenges cannot be edited.</p>
        ) : (
          <ChallengeForm key={id ?? "new"} existing={existing} />
        )}
      </main>
    </div>
  );
}
