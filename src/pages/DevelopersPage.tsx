import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, Check, CircleHelp, Code2, GitCommitHorizontal, Loader2, Lock, MapPin, Search, Send, UserPlus, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Select } from "../components/ui/Select";
import { fetchTalent, TALENT_SORTS, type TalentCard } from "../api/profiles";
import { fetchTechStacks } from "../api/projects";
import { sendConnectionRequest } from "../api/connections";
import { WORK_ARRANGEMENTS, WORK_TYPES } from "../api/recruiting";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../auth/account";
import { ShortlistPicker } from "../components/recruiting/ShortlistPicker";
import { openRecruiterTour } from "../components/tour/events";
import { ui } from "../styles/editorial";

function Stat({ label, value, hint }: { label: string; value: number | string | null; hint?: string }) {
  return (
    <div className="min-w-0" title={hint}>
      <p className="font-serif text-lg tabular-nums text-stone-900">{value == null ? "—" : value}</p>
      <p className="text-[10px] uppercase tracking-wide text-stone-400">{value == null ? "Hidden" : label}</p>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        checked ? "border-maroon-700 bg-maroon-800 text-white" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
      }`}>
      {checked && <Check className="h-3 w-3" />} {label}
    </button>
  );
}

const SORT_HELP = Object.fromEntries(TALENT_SORTS.map(([id, , help]) => [id, help]));

/** Search discoverable developers by tech and evidence. Recruiters evaluate and shortlist from here. */
export function DevelopersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recruiter } = useAccount();
  const meId = user?.id ? String(user.id) : "";
  const [people, setPeople] = useState<TalentCard[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("relevance");
  const [selected, setSelected] = useState<string[]>([]);
  const [stacks, setStacks] = useState<string[]>([]);
  const [techQuery, setTechQuery] = useState("");
  const [projectsOnly, setProjectsOnly] = useState(false);
  const [source, setSource] = useState(false);
  const [github, setGithub] = useState(false);
  const [openToWork, setOpenToWork] = useState(false);
  const [minProjects, setMinProjects] = useState(0);
  const [workType, setWorkType] = useState("");
  const [arrangement, setArrangement] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTechStacks().then((items) => setStacks(items.map((item) => item.name))).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await fetchTalent({
          q: query, tech: selected, sort, evidence: projectsOnly ? "projects" : "any", minProjects, github, source,
          openToWork: openToWork || Boolean(workType || arrangement), workType, arrangement,
        });
        if (!cancelled) {
          setPeople(rows.filter((person) => person.id !== meId));
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setPeople([]);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, selected, sort, projectsOnly, minProjects, github, source, openToWork, workType, arrangement, meId]);

  const suggestions = useMemo(() => {
    const term = techQuery.trim().toLowerCase();
    return stacks.filter((name) => !selected.includes(name) && (!term || name.toLowerCase().includes(term))).slice(0, 8);
  }, [stacks, selected, techQuery]);

  const activeFilters = [projectsOnly, source, github, openToWork, minProjects > 0, workType, arrangement].filter(Boolean).length;

  function addTech(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setTechQuery("");
  }

  function clearFilters() {
    setProjectsOnly(false);
    setSource(false);
    setGithub(false);
    setOpenToWork(false);
    setMinProjects(0);
    setWorkType("");
    setArrangement("");
  }

  async function connect(id: string) {
    setRequested((prev) => ({ ...prev, [id]: true }));
    try {
      await sendConnectionRequest(id);
    } catch {
      setRequested((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-6xl`}>
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">Talent</p>
            <h1 className="mt-1 font-serif text-4xl text-stone-900 sm:text-5xl">{recruiter ? "Find talent" : "Find developers"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Filter by the tech a role needs and the evidence behind it. Every result says why it matched.
            </p>
          </div>
          {recruiter && (
            <button type="button" onClick={openRecruiterTour} className={`${ui.btn} ${ui.neutral}`}>
              <CircleHelp className="h-3.5 w-3.5" /> Tour
            </button>
          )}
        </header>

        <section className="mb-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Search and filters">
          <div data-tour="talent-search" className="space-y-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, headline, skill, or location"
                aria-label="Search people" className={`${ui.input} pl-9`} />
            </label>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Needed tech
                <input value={techQuery} onChange={(e) => setTechQuery(e.target.value)} placeholder="Python, React…"
                  onKeyDown={(e) => { if (e.key === "Enter" && suggestions[0]) { e.preventDefault(); addTech(suggestions[0]); } }}
                  className={`${ui.input} mt-1 normal-case tracking-normal`} />
              </label>
              {suggestions.length > 0 && techQuery.trim() && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((name) => (
                    <button key={name} type="button" onClick={() => addTech(name)} className={`${ui.btn} ${ui.neutral}`}>{name}</button>
                  ))}
                </div>
              )}
              {selected.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2" aria-label="Selected tech">
                  {selected.map((name) => (
                    <li key={name}>
                      <button type="button" onClick={() => setSelected((prev) => prev.filter((item) => item !== name))}
                        aria-label={`Remove ${name}`}
                        className="inline-flex items-center gap-1 rounded-full bg-[#fced96] px-3 py-1 text-xs font-semibold text-stone-800">
                        {name} <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div data-tour="talent-filters" className="space-y-3 border-t border-stone-100 pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Evidence</p>
              {activeFilters > 0 && (
                <button type="button" onClick={clearFilters} className="text-xs font-semibold text-maroon-800 hover:underline">
                  Clear {activeFilters} filter{activeFilters === 1 ? "" : "s"}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Toggle label="Tech shown in a public project" checked={projectsOnly} onChange={setProjectsOnly} />
              <Toggle label="Has source code to review" checked={source} onChange={setSource} />
              <Toggle label="Has imported GitHub commits" checked={github} onChange={setGithub} />
              <Toggle label="Open to work" checked={openToWork} onChange={setOpenToWork} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold text-stone-600">
                Relevant projects, at least
                <Select
                  aria-label="Relevant projects, at least" value={String(minProjects)} onChange={(v) => setMinProjects(Number(v))}
                  options={[0, 1, 2, 3, 5].map((n) => [String(n), n === 0 ? "Any" : String(n)] as const)}
                  className={`${ui.input} mt-1 font-normal`}
                />
              </label>
              <label className="text-xs font-semibold text-stone-600">
                Work type
                <Select
                  aria-label="Work type" value={workType} onChange={setWorkType}
                  options={[["", "Any"], ...WORK_TYPES.map((t) => [t, t] as const)]}
                  className={`${ui.input} mt-1 font-normal`}
                />
              </label>
              <label className="text-xs font-semibold text-stone-600">
                Arrangement
                <Select
                  aria-label="Arrangement" value={arrangement} onChange={setArrangement}
                  options={[["", "Any"], ...WORK_ARRANGEMENTS.map((t) => [t, t] as const)]}
                  className={`${ui.input} mt-1 font-normal`}
                />
              </label>
            </div>
            <p className="text-xs leading-relaxed text-stone-500">
              Work type and arrangement only match people who opted in as open to work. Commits and pushes come from
              repositories imported from GitHub; someone without an import is shown as “not imported”, never as inactive.
            </p>
          </div>

          <div data-tour="talent-sort" className="flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 sm:w-24" htmlFor="talent-sort">Order by</label>
            <Select id="talent-sort" aria-label="Order by" value={sort} onChange={setSort} options={TALENT_SORTS} className={`${ui.input} sm:w-72`} />
            <p className="text-xs text-stone-500 sm:flex-1">{SORT_HELP[sort]} There is no overall score.</p>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
        ) : failed ? (
          <p className={ui.empty}>Search is unavailable right now. Try again in a moment.</p>
        ) : people.length === 0 ? (
          <p className={ui.empty}>No one matches that search. Try fewer filters.</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-stone-500">{people.length} {people.length === 1 ? "person" : "people"}</p>
            <ul className="grid gap-4 md:grid-cols-2">
              {people.map((person) => (
                <li key={person.id} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Link to={recruiter ? `/recruit/candidates/${person.id}` : `/profile/${person.id}`}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-maroon-800 font-serif text-lg text-amber-50">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                      ) : person.username.slice(0, 2).toUpperCase()}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={recruiter ? `/recruit/candidates/${person.id}` : `/profile/${person.id}`}
                          className="truncate font-semibold text-stone-900 hover:text-maroon-800">
                          {person.full_name || person.username}
                        </Link>
                        {person.open_to_work && (
                          <span className="rounded-full bg-[#fced96] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-800">
                            Open to work
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">@{person.username}</p>
                      {person.restricted ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-stone-500"><Lock className="h-3 w-3" /> Profile shared with connections only</p>
                      ) : person.headline ? (
                        <p className="mt-1 line-clamp-1 text-xs text-stone-600">{person.headline}</p>
                      ) : null}
                      {person.location && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-400"><MapPin className="h-3 w-3" /> {person.location}</p>
                      )}
                    </div>
                  </div>
                  {person.match.length > 0 && (
                    <ul className="mt-3 space-y-1 rounded-xl bg-[#FAF7EE] p-3" aria-label="Why this person matched">
                      {person.match.slice(0, 4).map((reason) => (
                        <li key={reason} className="flex items-start gap-1.5 text-xs text-stone-700">
                          <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-700" /> {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                  {person.tech.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {person.tech.slice(0, 6).map((name) => (
                        <li key={name} className={`rounded-full border px-2 py-0.5 text-[11px] ${
                          selected.some((s) => s.toLowerCase() === name.toLowerCase())
                            ? "border-maroon-300 bg-maroon-50 text-maroon-900" : "border-stone-200 text-stone-600"}`}>{name}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-3 border-t border-stone-100 pt-3 sm:grid-cols-5">
                    <Stat label="Projects" value={person.projects} />
                    <Stat label="Relevant" value={person.relevant_projects} hint="Projects using the tech you picked" />
                    <Stat label="With source" value={person.source_projects} />
                    <Stat label="Commits" value={person.github_history ? person.commits : "—"}
                      hint={person.github_history ? "From imported GitHub repositories" : "No GitHub history imported"} />
                    <Stat label="Connections" value={person.connections} />
                  </div>
                  {!person.github_history && !person.restricted && (
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-stone-400">
                      <GitCommitHorizontal className="h-3 w-3" /> GitHub not imported
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {recruiter ? (
                      <>
                        <Link to={`/recruit/candidates/${person.id}`} className={`${ui.btn} ${ui.primary}`}>
                          <Code2 className="h-3.5 w-3.5" /> Evaluate
                        </Link>
                        <ShortlistPicker candidateId={person.id} />
                        <Link to={`/profile/${person.id}`} className={`${ui.btn} ${ui.neutral}`}>Profile</Link>
                      </>
                    ) : (
                      <>
                        <Link to={`/profile/${person.id}?tab=portfolio&view=graphic`} className={`${ui.btn} ${ui.primary}`}>Graphic portfolio</Link>
                        <Link to={`/profile/${person.id}`} className={`${ui.btn} ${ui.neutral}`}>Profile</Link>
                        <button type="button" onClick={() => navigate(`/messages?user=${person.id}`)} className={`${ui.btn} ${ui.neutral}`} aria-label={`Message ${person.username}`}>
                          <Send className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" disabled={requested[person.id]} onClick={() => void connect(person.id)}
                          className={`${ui.btn} ${requested[person.id] ? ui.neutral : ui.positive}`}>
                          {requested[person.id] ? <><Check className="h-3.5 w-3.5" /> Pending</> : <><UserPlus className="h-3.5 w-3.5" /> Connect</>}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
