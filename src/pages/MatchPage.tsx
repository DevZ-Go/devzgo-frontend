import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeftRight, ChevronDown, GitCommitHorizontal, Info, Loader2, Plus, Search, ScanText, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { MemberAvatar } from "../components/MemberAvatar";
import { WORK_ARRANGEMENTS, WORK_TYPES } from "../api/recruiting";
import {
  extractRequirements, matchDevelopers, type AmbiguousTerm, type MatchFilters, type MatchResult, type RequirementStatus,
  type SuggestedRequirement,
} from "../api/match";
import { ui } from "../styles/editorial";
import { getApiErrorMessage } from "../utils/apiError";
import { addRequirement, removeRequirement, toggleImportance, type Requirements } from "../utils/requirements";

const STATUS: Record<RequirementStatus, { label: string; tone: string }> = {
  evidenced: { label: "Detected in source", tone: "bg-[#DCFCE7] text-[#14532D] border-[#15803D]/40" },
  declared_project: { label: "Added to a project", tone: "bg-amber-50 text-amber-900 border-amber-300" },
  declared_profile: { label: "Profile skill only", tone: "bg-stone-100 text-stone-700 border-stone-200" },
  missing: { label: "No evidence", tone: "bg-white text-stone-400 border-dashed border-stone-300" },
};

const NO_FILTERS: MatchFilters = {
  open_to_work: false, work_type: "", arrangement: "", location: "", min_relevant_projects: 0, require_all_required: false,
};

function RequirementList({ title, hint, names, onToggle, onRemove }: {
  title: string; hint: string; names: string[]; onToggle: (n: string) => void; onRemove: (n: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">{title} <span className="font-mono text-stone-400">{names.length}</span></p>
      <p className="text-xs text-stone-400">{hint}</p>
      {names.length === 0 ? (
        <p className="mt-2 text-sm text-stone-400">None yet.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {names.map((n) => (
            <li key={n} className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white py-0.5 pl-3 pr-1 text-sm text-stone-800">
              {n}
              <button type="button" onClick={() => onToggle(n)} title={`Move ${n} to ${title === "Required" ? "preferred" : "required"}`}
                aria-label={`Move ${n} to ${title === "Required" ? "preferred" : "required"}`} className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-maroon-800">
                <ArrowLeftRight className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => onRemove(n)} aria-label={`Remove ${n}`} className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-crimson-700">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: MatchResult }) {
  const [open, setOpen] = useState(false);
  const name = result.full_name || result.username;
  return (
    <li className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-4">
        <MemberAvatar name={name} src={result.avatar_url} size="md" className="rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/recruit/candidates/${result.id}`} className="font-serif text-xl text-stone-900 hover:text-maroon-800">{name}</Link>
            {result.open_to_work && <span className="rounded-full bg-[#fced96] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-800">Open to work</span>}
          </div>
          <p className="text-xs text-stone-500">@{result.username}{result.location ? ` · ${result.location}` : ""}</p>
          {result.headline && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{result.headline}</p>}
        </div>
        <div className="text-right">
          <p className="font-serif text-4xl tabular-nums text-maroon-800">{result.percent}%</p>
          <p className="text-[11px] text-stone-500">{result.points} of {result.max_points} points</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-stone-600">
        {result.required_total > 0 && `${result.required_met} of ${result.required_total} required evidenced`}
        {result.required_total > 0 && result.preferred_total > 0 && " · "}
        {result.preferred_total > 0 && `${result.preferred_met} of ${result.preferred_total} preferred evidenced`}
        {` · ${result.relevant_projects} relevant project${result.relevant_projects === 1 ? "" : "s"}`}
      </p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {result.requirements.map((r) => (
          <li key={`${r.importance}-${r.name}`} title={STATUS[r.status].label}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS[r.status].tone}`}>
            {r.importance === "required" && <span className="text-[9px] font-bold uppercase opacity-70">Req</span>}
            {r.name}
            {r.contribution_linked && <GitCommitHorizontal className="h-3 w-3" aria-label="with credited commits" />}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-maroon-800">
        Why this score <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="mt-2 space-y-2 border-t border-stone-100 pt-3">
          {result.requirements.map((r) => (
            <li key={`${r.importance}-${r.name}`} className="text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-stone-900">{r.name}</span>
                <span className="text-xs text-stone-400">{r.importance === "required" ? "required, counts twice" : "preferred"}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS[r.status].tone}`}>{STATUS[r.status].label}</span>
                <span className="ml-auto font-mono text-xs text-stone-500">+{r.weight * (r.importance === "required" ? 2 : 1)}</span>
              </div>
              {r.projects.length > 0 && (
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-600">
                  {r.projects.map((p) => (
                    <li key={p.project_id}>
                      <Link to={`/project/${p.project_id}`} className="font-semibold hover:text-maroon-800">{p.title}</Link>
                      {" "}({p.relation === "owner" ? "owner" : p.role}{p.detected ? ", detected" : ", added by the team"}
                      {p.commits ? `, ${p.commits} commits credited` : ""})
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Recruiters paste a job description, confirm the technologies, and see who has evidence for them. Nothing is stored. */
export function MatchPage() {
  const [text, setText] = useState("");
  const [lists, setLists] = useState<Requirements>({ required: [], preferred: [] });
  const [why, setWhy] = useState<SuggestedRequirement[]>([]);
  const [ambiguous, setAmbiguous] = useState<AmbiguousTerm[]>([]);
  const [draft, setDraft] = useState("");
  const [filters, setFilters] = useState<MatchFilters>(NO_FILTERS);

  const extract = useMutation({
    mutationFn: () => extractRequirements(text),
    onSuccess: (data) => {
      setLists({ required: data.required.map((r) => r.name), preferred: data.preferred.map((r) => r.name) });
      setWhy([...data.required, ...data.preferred]);
      setAmbiguous(data.ambiguous);
    },
  });
  const run = useMutation({ mutationFn: () => matchDevelopers({ ...lists, ...filters }) });
  const total = lists.required.length + lists.preferred.length;
  const data = run.data;

  const add = (to: keyof Requirements) => {
    setLists((l) => addRequirement(l, draft, to));
    setDraft("");
  };
  const setFilter = <K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-6xl`}>
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">Recruiting</p>
          <h1 className="mt-1 font-serif text-4xl text-stone-900 sm:text-5xl">Match a role</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Paste a job description and DevZ-Go suggests the technologies it names. You decide what is required, then see which
            developers have project evidence for them. The description is read once and never saved.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="jd-title">
            <h2 id="jd-title" className="font-serif text-2xl text-stone-900">1. Job description</h2>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} maxLength={20000}
              placeholder={"Paste the role here, for example:\n\nRequirements\n- React and TypeScript\n- Experience with PostgreSQL\n\nNice to have\n- Docker"}
              className={`${ui.input} mt-3 resize-y font-mono text-xs leading-relaxed`} aria-label="Job description" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => extract.mutate()} disabled={!text.trim() || extract.isPending} className={`${ui.btn} ${ui.primary} px-4 py-2`}>
                {extract.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanText className="h-3.5 w-3.5" />} Suggest requirements
              </button>
              {text && <button type="button" onClick={() => setText("")} className={`${ui.btn} ${ui.neutral} px-4 py-2`}>Clear text</button>}
              <span className="ml-auto text-[11px] text-stone-400">{text.length.toLocaleString()}/20,000</span>
            </div>
            {extract.isError && <p className={`${ui.error} mt-2`}>{getApiErrorMessage(extract.error)}</p>}
            {extract.isSuccess && why.length === 0 && ambiguous.length === 0 && (
              <p className="mt-3 text-sm text-stone-500">No known technologies were found. Add them yourself on the right.</p>
            )}
            {why.length > 0 && (
              <details className="mt-4 text-xs text-stone-600">
                <summary className="cursor-pointer font-semibold">Why these were suggested</summary>
                <ul className="mt-2 space-y-1.5">
                  {why.map((r) => (
                    <li key={r.name}><span className="font-semibold text-stone-800">{r.name}</span>: {r.reason}
                      {r.excerpt && <span className="block truncate font-mono text-[11px] text-stone-400">“{r.excerpt}”</span>}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="req-title">
            <h2 id="req-title" className="font-serif text-2xl text-stone-900">2. Requirements</h2>
            <div className="mt-3 space-y-4">
              <RequirementList title="Required" hint="Counts twice in the score." names={lists.required}
                onToggle={(n) => setLists((l) => toggleImportance(l, n))} onRemove={(n) => setLists((l) => removeRequirement(l, n))} />
              <RequirementList title="Preferred" hint="Counts once." names={lists.preferred}
                onToggle={(n) => setLists((l) => toggleImportance(l, n))} onRemove={(n) => setLists((l) => removeRequirement(l, n))} />
              {ambiguous.length > 0 && (
                <div className="rounded-2xl bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-900">These words might be technologies. Add them only if the role means them that way.</p>
                  <ul className="mt-2 space-y-2">
                    {ambiguous.map((a) => (
                      <li key={a.name} className="text-xs text-stone-700">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{a.name}</span>
                          <button type="button" className={`${ui.btn} ${ui.neutral}`}
                            onClick={() => { setLists((l) => addRequirement(l, a.name, "required")); setAmbiguous((x) => x.filter((y) => y.name !== a.name)); }}>
                            <Plus className="h-3 w-3" /> Required
                          </button>
                          <button type="button" className={`${ui.btn} ${ui.neutral}`}
                            onClick={() => { setLists((l) => addRequirement(l, a.name, "preferred")); setAmbiguous((x) => x.filter((y) => y.name !== a.name)); }}>
                            <Plus className="h-3 w-3" /> Preferred
                          </button>
                          <button type="button" className="text-stone-400 hover:text-stone-700" onClick={() => setAmbiguous((x) => x.filter((y) => y.name !== a.name))}>Ignore</button>
                        </div>
                        {a.excerpt && <span className="block truncate font-mono text-[11px] text-stone-500">“{a.excerpt}”</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); add("required"); }}>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={60} placeholder="Add a technology, e.g. Django"
                  className={`${ui.input} min-w-[12rem] flex-1`} aria-label="Technology to add" />
                <button type="submit" disabled={!draft.trim()} className={`${ui.btn} ${ui.neutral} px-3`}><Plus className="h-3.5 w-3.5" /> Required</button>
                <button type="button" disabled={!draft.trim()} onClick={() => add("preferred")} className={`${ui.btn} ${ui.neutral} px-3`}><Plus className="h-3.5 w-3.5" /> Preferred</button>
              </form>
            </div>

            <fieldset className="mt-5 border-t border-stone-100 pt-4">
              <legend className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Filters</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-stone-600">Work type
                  <select value={filters.work_type} onChange={(e) => setFilter("work_type", e.target.value)} className={`${ui.input} mt-1`}>
                    <option value="">Any</option>{WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-stone-600">Arrangement
                  <select value={filters.arrangement} onChange={(e) => setFilter("arrangement", e.target.value)} className={`${ui.input} mt-1`}>
                    <option value="">Any</option>{WORK_ARRANGEMENTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-stone-600">Location contains
                  <input value={filters.location} onChange={(e) => setFilter("location", e.target.value)} maxLength={80} className={`${ui.input} mt-1`} placeholder="e.g. Toronto" />
                </label>
                <label className="text-xs font-semibold text-stone-600">Relevant projects, at least
                  <input type="number" min={0} max={20} value={filters.min_relevant_projects}
                    onChange={(e) => setFilter("min_relevant_projects", Math.max(0, Math.min(20, Number(e.target.value) || 0)))} className={`${ui.input} mt-1`} />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-700">
                <label className="flex items-center gap-2"><input type="checkbox" checked={filters.open_to_work} onChange={(e) => setFilter("open_to_work", e.target.checked)} className="accent-maroon-800" /> Open to work only</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={filters.require_all_required} onChange={(e) => setFilter("require_all_required", e.target.checked)} className="accent-maroon-800" /> Must have evidence for every required item</label>
              </div>
            </fieldset>

            <button type="button" onClick={() => run.mutate()} disabled={total === 0 || run.isPending} className={`${ui.btn} ${ui.primary} mt-5 w-full py-2.5 text-sm`}>
              {run.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Find matching developers
            </button>
            {run.isError && <p className={`${ui.error} mt-2`}>{getApiErrorMessage(run.error)}</p>}
          </section>
        </div>

        {data && (
          <section className="mt-8" aria-labelledby="results-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="results-title" className="font-serif text-3xl text-stone-900">
                  {data.results.length} developer{data.results.length === 1 ? "" : "s"} with evidence
                </h2>
                <p className="text-xs text-stone-500">
                  {data.considered} profile{data.considered === 1 ? "" : "s"} checked
                  {data.restricted ? ` · ${data.restricted} shared with connections only, so not scored` : ""}
                </p>
              </div>
            </div>
            <p className="mt-3 flex gap-2 rounded-2xl bg-[#f7f5ed] p-3 text-xs leading-relaxed text-stone-600">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-maroon-800" /> {data.formula}
            </p>
            {data.results.length === 0 ? (
              <p className={`${ui.empty} mt-4`}>No one has evidence for these requirements yet. Try fewer required items or loosen the filters.</p>
            ) : (
              <ul className="mt-4 space-y-4">{data.results.map((r) => <ResultCard key={r.id} result={r} />)}</ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
