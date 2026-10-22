import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  GitFork,
  Github,
  Globe,
  Loader2,
  Lock,
  Search,
  Star,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import {
  closeGitHubImportSession,
  importGitHubRepo,
  openGitHubImportSession,
  startGitHubImport,
  type GitHubRepo,
} from "../api/githubImport";
import { REFRESH_KEY, refreshGitHubHistory } from "../api/githubHistory";
import { queryClient, queryKeys } from "../api/queryKeys";
import { ui } from "../styles/editorial";
import { getApiErrorMessage } from "../utils/apiError";

type RowStatus =
  | { state: "waiting" }
  | { state: "working" }
  | { state: "done"; projectId: string; note: string }
  | { state: "error"; note: string; projectId?: string };

function readFragment() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return { code: params.get("code") ?? "", state: params.get("state") ?? "" };
}

function updated(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
}

function VisibilityBadge({ repo }: { repo: GitHubRepo }) {
  return repo.private ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fced96] px-2 py-0.5 text-[11px] font-semibold text-stone-800">
      <Lock className="h-3 w-3" /> Private
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-stone-600">
      <Globe className="h-3 w-3" /> Public
    </span>
  );
}

function Intro({ error }: { error: string | null }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(error);

  async function connect() {
    setBusy(true);
    setProblem(null);
    try {
      window.location.assign(await startGitHubImport());
    } catch (err) {
      setProblem(getApiErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-800 text-amber-50">
        <Github className="h-6 w-6" />
      </div>
      <h2 className="mt-5 font-serif text-2xl text-stone-900">Bring your repositories in</h2>
      <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-stone-600">
        <li>You choose which repositories become projects.</li>
        <li>Each project keeps its GitHub visibility: private repositories stay private here, and public ones are public.</li>
        <li>The code is read the same way as a ZIP upload, so languages and tech are filled in for you.</li>
        <li>GitHub asks for access to your repositories, including private ones. That access is used for this import only and released when you finish.</li>
      </ul>
      {problem && <p role="alert" className={`mt-4 ${ui.error}`}>{problem}</p>}
      <button type="button" onClick={connect} disabled={busy}
        className={`${ui.btn} ${ui.primary} mt-6 px-5 py-2.5 text-sm`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
        Connect GitHub
      </button>
    </section>
  );
}

function RepoRow({ repo, login, checked, onToggle }: {
  repo: GitHubRepo; login: string; checked: boolean; onToggle: () => void;
}) {
  const imported = Boolean(repo.imported_project_id);
  return (
    <li>
      <label className={`flex gap-3 px-4 py-3.5 sm:px-5 ${imported ? "opacity-60" : "cursor-pointer hover:bg-stone-50"}`}>
        <input type="checkbox" checked={checked} disabled={imported} onChange={onToggle}
          className="mt-1 h-4 w-4 shrink-0 accent-maroon-800" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-semibold text-stone-900">
              {repo.owner && repo.owner !== login && <span className="font-normal text-stone-500">{repo.owner}/</span>}
              {repo.name}
            </span>
            <VisibilityBadge repo={repo} />
            {repo.fork && (
              <span className="inline-flex items-center gap-1 text-[11px] text-stone-500"><GitFork className="h-3 w-3" /> Fork</span>
            )}
            {imported && (
              <Link to={`/project/${repo.imported_project_id}`} className="text-[11px] font-semibold text-forest-700 hover:underline">
                Imported
              </Link>
            )}
          </span>
          {repo.description && <span className="mt-0.5 line-clamp-2 block text-sm text-stone-600">{repo.description}</span>}
          <span className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-stone-500">
            {repo.language && <span>{repo.language}</span>}
            {repo.stars > 0 && <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" /> {repo.stars}</span>}
            {repo.updated_at && <span>Updated {updated(repo.updated_at)}</span>}
          </span>
        </span>
      </label>
    </li>
  );
}

function ProgressRow({ repo, status }: { repo: GitHubRepo; status: RowStatus }) {
  const icon = {
    waiting: <Circle className="h-4 w-4 text-stone-300" />,
    working: <Loader2 className="h-4 w-4 animate-spin text-maroon-700" />,
    done: <CheckCircle2 className="h-4 w-4 text-forest-700" />,
    error: <AlertCircle className="h-4 w-4 text-crimson-700" />,
  }[status.state];
  const projectId = status.state === "done" || status.state === "error" ? status.projectId : undefined;
  return (
    <li className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-stone-900">{repo.name}</span>
          <VisibilityBadge repo={repo} />
        </span>
        {(status.state === "done" || status.state === "error") && (
          <span className={`mt-0.5 block text-xs ${status.state === "error" ? "text-crimson-700" : "text-stone-500"}`}>{status.note}</span>
        )}
      </span>
      {projectId && (
        <Link to={`/project/${projectId}`} className={`${ui.link} shrink-0 text-xs`}>Open</Link>
      )}
    </li>
  );
}

/** Pick GitHub repositories and turn each into a project, with its code analysed. */
export function GitHubImportPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [fragment] = useState(readFragment);
  const [refreshing] = useState(() => sessionStorage.getItem(REFRESH_KEY));
  useEffect(() => sessionStorage.removeItem(REFRESH_KEY), []);
  const exchanged = useRef(false);
  const sessionRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(Boolean(fragment.code));
  const [error, setError] = useState<string | null>(
    params.get("error") === "denied"
      ? refreshing ? "GitHub access was not granted, so the history was not refreshed." : "GitHub access was not granted, so nothing was imported."
      : null,
  );
  const [login, setLogin] = useState("");
  const [repos, setRepos] = useState<GitHubRepo[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Map<number, RowStatus> | null>(null);
  const [running, setRunning] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
    if (!fragment.code || exchanged.current) return;
    exchanged.current = true;
    if (refreshing) {
      let session: string | null = null;
      openGitHubImportSession(fragment.code, fragment.state)
        .then((data) => {
          session = data.session;
          return refreshGitHubHistory(refreshing, data.session);
        })
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ["github-insights", refreshing] });
          void queryClient.invalidateQueries({ queryKey: ["github-history", refreshing] });
          navigate(`/project/${refreshing}`, { replace: true });
        })
        .catch((err) => {
          setError(getApiErrorMessage(err));
          setLoading(false);
        })
        .finally(() => {
          if (session) void closeGitHubImportSession(session).catch(() => undefined);
        });
      return;
    }
    openGitHubImportSession(fragment.code, fragment.state)
      .then((data) => {
        sessionRef.current = data.session;
        setLogin(data.login);
        setRepos(data.repos);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [fragment, refreshing, navigate]);

  useEffect(() => () => {
    if (sessionRef.current) void closeGitHubImportSession(sessionRef.current).catch(() => undefined);
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (repos ?? []).filter((r) =>
      !term || r.full_name.toLowerCase().includes(term) || (r.description ?? "").toLowerCase().includes(term),
    );
  }, [repos, search]);

  const importable = visible.filter((r) => !r.imported_project_id);
  const allChosen = importable.length > 0 && importable.every((r) => selected.has(r.id));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of importable) {
        if (allChosen) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });
  }

  async function runImport() {
    const session = sessionRef.current;
    if (!session || !repos) return;
    const queue = repos.filter((r) => selected.has(r.id));
    const next = new Map<number, RowStatus>(queue.map((r) => [r.id, { state: "waiting" }]));
    setStatuses(new Map(next));
    setRunning(true);
    const set = (id: number, status: RowStatus) => {
      next.set(id, status);
      setStatuses(new Map(next));
    };

    for (const repo of queue) {
      set(repo.id, { state: "working" });
      try {
        const result = await importGitHubRepo(session, repo.id);
        const note = result.code === "analysed"
          ? `${result.visibility} project, ${result.total_files} files analysed`
          : `${result.visibility} project. ${result.detail ?? ""}`.trim();
        set(repo.id, { state: result.code === "failed" ? "error" : "done", projectId: result.project_id, note });
        setRepos((list) => list?.map((r) => (r.id === repo.id ? { ...r, imported_project_id: result.project_id } : r)) ?? list);
      } catch (err) {
        const expired = axios.isAxiosError(err) && err.response?.status === 410;
        set(repo.id, { state: "error", note: getApiErrorMessage(err) });
        if (expired) {
          for (const rest of queue.filter((r) => next.get(r.id)?.state === "waiting")) {
            set(rest.id, { state: "error", note: "Skipped because the GitHub connection expired." });
          }
          sessionRef.current = null;
          setExpired(true);
          break;
        }
      }
    }
    setSelected(new Set());
    setRunning(false);
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    void queryClient.invalidateQueries({ queryKey: queryKeys.me });
  }

  async function finish() {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) await closeGitHubImportSession(session).catch(() => undefined);
  }

  const doneCount = statuses ? [...statuses.values()].filter((s) => s.state === "done").length : 0;
  const queued = statuses ? (repos ?? []).filter((r) => statuses.has(r.id)) : [];

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-3xl`}>
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">Import</p>
          <h1 className="mt-1 font-serif text-4xl text-stone-900 sm:text-5xl">Projects from GitHub</h1>
          {login && <p className="mt-2 text-sm text-stone-600">Connected as <span className="font-semibold text-stone-900">@{login}</span></p>}
        </header>

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-maroon-700" />
            {refreshing ? "Reading commits and pushes from GitHub…" : "Reading your repositories…"}
          </div>
        ) : refreshing ? (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-serif text-2xl text-stone-900">GitHub history</h2>
            {error && <p role="alert" className={`mt-3 ${ui.error}`}>{error}</p>}
            <Link to={`/project/${refreshing}`} className={`${ui.btn} ${ui.primary} mt-5 px-5 py-2.5 text-sm`}>Back to the project</Link>
          </section>
        ) : !repos ? (
          <Intro error={error} />
        ) : statuses ? (
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5">
              <h2 className="font-serif text-xl text-stone-900">
                {running ? "Importing…" : `${doneCount} of ${queued.length} imported`}
              </h2>
              {!running && (
                <div className="flex flex-wrap gap-2">
                  {!expired && (
                    <button type="button" onClick={() => setStatuses(null)} className={`${ui.btn} ${ui.neutral}`}>
                      Import more
                    </button>
                  )}
                  <Link to="/profile" onClick={finish} className={`${ui.btn} ${ui.primary}`}>Finish</Link>
                </div>
              )}
            </header>
            <ul className="divide-y divide-stone-100">
              {queued.map((repo) => <ProgressRow key={repo.id} repo={repo} status={statuses.get(repo.id)!} />)}
            </ul>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-stone-100 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search repositories"
                  aria-label="Search repositories" className={`${ui.input} pl-9`} />
              </label>
              <button type="button" onClick={toggleAll} disabled={importable.length === 0}
                className={`${ui.btn} ${ui.neutral} py-2`}>
                {allChosen ? "Clear selection" : `Select all ${importable.length}`}
              </button>
            </div>
            {visible.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-stone-500">
                {repos.length === 0 ? "This GitHub account has no repositories yet." : "No repositories match that search."}
              </p>
            ) : (
              <ul className="max-h-[max(16rem,calc(100dvh-28rem))] divide-y sm:max-h-[max(18rem,calc(100dvh-24rem))] divide-stone-100 overflow-y-auto">
                {visible.map((repo) => (
                  <RepoRow key={repo.id} repo={repo} login={login} checked={selected.has(repo.id)} onToggle={() => toggle(repo.id)} />
                ))}
              </ul>
            )}
            <footer className="flex items-center justify-between gap-3 border-t border-stone-100 bg-[#f8f6f0] px-4 py-3.5 sm:px-5">
              <p className="text-xs text-stone-600">
                {selected.size === 0 ? "Choose the repositories to import." : `${selected.size} selected. Each becomes a project with its code analysed.`}
              </p>
              <button type="button" onClick={runImport} disabled={selected.size === 0}
                className={`${ui.btn} ${ui.primary} shrink-0 px-5 py-2.5 text-sm`}>
                Import {selected.size || ""} {selected.size === 1 ? "project" : "projects"}
              </button>
            </footer>
          </section>
        )}
        {repos && error && <p role="alert" className={`mt-4 ${ui.error}`}>{error}</p>}
      </main>
    </div>
  );
}
