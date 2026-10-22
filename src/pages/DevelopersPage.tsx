import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2, MapPin, Search, Send, UserPlus, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { fetchMyProfile, fetchTalent, TALENT_SORTS, type TalentCard } from "../api/profiles";
import { fetchTechStacks } from "../api/projects";
import { sendConnectionRequest } from "../api/connections";
import { useAuth } from "../auth/AuthContext";
import { ui } from "../styles/editorial";

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="min-w-0">
      <p className="font-serif text-lg tabular-nums text-stone-900">{value == null ? "—" : value}</p>
      <p className="text-[10px] uppercase tracking-wide text-stone-400">{value == null ? "Hidden" : label}</p>
    </div>
  );
}

/** Search discoverable people by tech and rank them by the work a viewer is allowed to see. */
export function DevelopersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const meId = user?.id ? String(user.id) : "";
  const [people, setPeople] = useState<TalentCard[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("projects");
  const [selected, setSelected] = useState<string[]>([]);
  const [stacks, setStacks] = useState<string[]>([]);
  const [techQuery, setTechQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [recruiter, setRecruiter] = useState(false);
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTechStacks().then((items) => setStacks(items.map((item) => item.name))).catch(() => undefined);
    fetchMyProfile().then((profile) => setRecruiter(profile.role === "Recruiter")).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const rows = await fetchTalent({ q: query, tech: selected, sort });
        if (!cancelled) setPeople(rows.filter((person) => person.id !== meId));
      } catch {
        if (!cancelled) setPeople([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, selected, sort, meId]);

  const suggestions = useMemo(() => {
    const term = techQuery.trim().toLowerCase();
    return stacks.filter((name) => !selected.includes(name) && (!term || name.toLowerCase().includes(term))).slice(0, 8);
  }, [stacks, selected, techQuery]);

  function addTech(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setTechQuery("");
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
            <h1 className="mt-1 font-serif text-4xl text-stone-900 sm:text-5xl">Find developers</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Filter by the tech you need, then rank by projects, commits, pushes, connections, or overall activity.
            </p>
          </div>
          {recruiter && (
            <button type="button" onClick={() => window.dispatchEvent(new Event("devzgo:recruiting-guide"))}
              className={`${ui.btn} ${ui.neutral}`}>
              Recruiting guide
            </button>
          )}
        </header>

        <div className="mb-6 space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, skill, or company"
                aria-label="Search people" className={`${ui.input} pl-9`} />
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort people" className={`${ui.input} sm:w-56`}>
              {TALENT_SORTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Needed tech
              <input value={techQuery} onChange={(e) => setTechQuery(e.target.value)} placeholder="Python, React…"
                className={`${ui.input} mt-1`} />
            </label>
            {suggestions.length > 0 && techQuery.trim() && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((name) => (
                  <button key={name} type="button" onClick={() => addTech(name)} className={`${ui.btn} ${ui.neutral}`}>{name}</button>
                ))}
              </div>
            )}
            {selected.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {selected.map((name) => (
                  <li key={name}>
                    <button type="button" onClick={() => setSelected((prev) => prev.filter((item) => item !== name))}
                      className="inline-flex items-center gap-1 rounded-full bg-[#fced96] px-3 py-1 text-xs font-semibold text-stone-800">
                      {name} <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs leading-relaxed text-stone-500">
            A person must match every technology. Commits and pushes come from imported GitHub repositories.
            Connections and activity that someone has set to private are left out of the ranking.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
        ) : people.length === 0 ? (
          <p className={ui.empty}>No one matches that search.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {people.map((person) => (
              <li key={person.id} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Link to={`/profile/${person.id}`} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-maroon-800 font-serif text-lg text-amber-50">
                    {person.avatar_url ? (
                      <img src={person.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                    ) : person.username.slice(0, 2).toUpperCase()}
                  </Link>
                  <div className="min-w-0">
                    <Link to={`/profile/${person.id}`} className="block truncate font-semibold text-stone-900 hover:text-maroon-800">
                      {person.full_name || person.username}
                    </Link>
                    <p className="text-xs text-stone-500">@{person.username}</p>
                    {person.role === "Recruiter" ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-maroon-800">
                        Recruiter{person.company ? ` · ${person.company}` : ""}
                      </p>
                    ) : person.headline ? (
                      <p className="mt-1 line-clamp-1 text-xs text-stone-600">{person.headline}</p>
                    ) : null}
                    {person.location && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-400"><MapPin className="h-3 w-3" /> {person.location}</p>
                    )}
                  </div>
                </div>
                {person.tech.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {person.tech.slice(0, 5).map((name) => (
                      <li key={name} className="rounded-full border border-stone-200 px-2 py-0.5 text-[11px] text-stone-600">{name}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-3 border-t border-stone-100 pt-3 sm:grid-cols-5">
                  <Stat label="Projects" value={person.projects} />
                  <Stat label="Commits" value={person.commits} />
                  <Stat label="Pushes" value={person.pushes} />
                  <Stat label="Connections" value={person.connections} />
                  <Stat label="Activity" value={person.activity} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link to={`/profile/${person.id}?tab=portfolio&view=graphic`} className={`${ui.btn} ${ui.primary}`}>Graphic portfolio</Link>
                  <Link to={`/profile/${person.id}`} className={`${ui.btn} ${ui.neutral}`}>Profile</Link>
                  <button type="button" onClick={() => navigate(`/messages?user=${person.id}`)} className={`${ui.btn} ${ui.neutral}`} aria-label={`Message ${person.username}`}>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" disabled={requested[person.id]} onClick={() => void connect(person.id)}
                    className={`${ui.btn} ${requested[person.id] ? ui.neutral : ui.positive}`}>
                    {requested[person.id] ? <><Check className="h-3.5 w-3.5" /> Pending</> : <><UserPlus className="h-3.5 w-3.5" /> Connect</>}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
