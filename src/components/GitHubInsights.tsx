import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { GitCommitHorizontal, Github, Loader2, RefreshCw, Upload } from "lucide-react";
import {
  fetchGitHubCommits,
  fetchGitHubInsights,
  fetchGitHubPushes,
  startGitHubRefresh,
  type GitHubCommit,
  type GitHubContributor,
  type GitHubPerson,
  type GitHubPush,
} from "../api/githubHistory";
import { getApiErrorMessage } from "../utils/apiError";
import { ui } from "../styles/editorial";
import { WeeklyCommits } from "./WeeklyCommits";

function day(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
}

function Who({ user, login, name }: { user: GitHubPerson | null; login: string | null; name: string | null }) {
  if (user) {
    return <Link to={`/profile/${user.id}`} className="font-semibold text-maroon-800 hover:underline">{user.full_name || user.username}</Link>;
  }
  if (login) {
    return <a href={`https://github.com/${login}`} target="_blank" rel="noreferrer" className="font-semibold text-stone-800 hover:underline">{login}</a>;
  }
  return <span className="font-semibold text-stone-800">{name || "Unknown author"}</span>;
}

function Avatar({ person }: { person: GitHubContributor }) {
  const src = person.user?.avatar_url || person.avatar_url;
  const letter = (person.user?.full_name || person.name || "?").charAt(0).toUpperCase();
  return src
    ? <img src={src} alt="" className="h-9 w-9 shrink-0 rounded-full border border-stone-200 object-cover" />
    : <span className={`h-9 w-9 shrink-0 rounded-full text-sm ${ui.avatar}`}>{letter}</span>;
}

/** Commits or pushes, newest first, loading older ones on request. */
function History({ projectId, githubUrl, contributor, kind }: {
  projectId: string; githubUrl: string | null; contributor: string | null; kind: "commits" | "pushes";
}) {
  const list = useInfiniteQuery({
    queryKey: ["github-history", projectId, kind, contributor],
    queryFn: async ({ pageParam }): Promise<{ total: number; items: (GitHubCommit | GitHubPush)[] }> => kind === "commits"
      ? fetchGitHubCommits(projectId, contributor, pageParam)
      : fetchGitHubPushes(projectId, contributor, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
  });
  const pages = list.data?.pages ?? [];
  const total = pages[0]?.total ?? 0;
  const repo = (githubUrl ?? "").replace(/\/+$/, "");

  return (
    <div className="min-w-0">
      <h4 className="mb-2 flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-stone-500">
        {kind === "commits" ? <GitCommitHorizontal className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
        {kind === "commits" ? "Commits" : "Pushes"} {list.isSuccess && `(${total})`}
      </h4>
      {list.isLoading ? <p className={ui.muted}>Loading…</p> : total === 0 ? (
        <p className={ui.muted}>{kind === "commits" ? "No commits stored yet." : "No pushes recorded yet. GitHub shares pushes from the last 90 days, and each refresh keeps adding to this list."}</p>
      ) : (
        <ul className="space-y-2">
          {pages.flatMap((page) => page.items).map((item) => "sha" in item ? (
            <li key={item.sha} className="font-sans text-sm leading-snug">
              <span className="block truncate text-stone-800">{item.message || "(no message)"}</span>
              <span className="text-xs text-stone-500">
                <Who user={item.user} login={item.login} name={item.name} /> · {day(item.committed_at)} ·{" "}
                {repo ? <a href={`${repo}/commit/${item.sha}`} target="_blank" rel="noreferrer" className="font-mono hover:underline">{item.sha.slice(0, 7)}</a>
                  : <span className="font-mono">{item.sha.slice(0, 7)}</span>}
              </span>
            </li>
          ) : (
            <li key={item.id} className="font-sans text-sm leading-snug text-stone-700">
              <Who user={item.user} login={item.login} name={null} /> pushed
              {item.commit_count ? ` ${item.commit_count} ${item.commit_count === 1 ? "commit" : "commits"}` : ""}
              {item.branch && <> to <span className="font-mono text-xs">{item.branch}</span></>}
              <span className="block text-xs text-stone-500">{day(item.pushed_at)}</span>
            </li>
          ))}
        </ul>
      )}
      {list.hasNextPage && (
        <button type="button" className={`${ui.btn} ${ui.neutral} mt-3`} disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
          {list.isFetchingNextPage ? "Loading…" : "Show older"}
        </button>
      )}
    </div>
  );
}

/** Who built an imported repository: each person's share of commits, their pushes, and the full history. */
export function GitHubInsights({ projectId }: { projectId: string }) {
  const insights = useQuery({ queryKey: ["github-insights", projectId], queryFn: () => fetchGitHubInsights(projectId) });
  const [open, setOpen] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const data = insights.data;

  async function refresh() {
    setStarting(true);
    setRefreshError(null);
    try {
      await startGitHubRefresh(projectId);
    } catch (err) {
      setRefreshError(getApiErrorMessage(err));
      setStarting(false);
    }
  }

  if (insights.isLoading || !data) return null;
  const empty = data.totals.contributors === 0 && data.totals.pushes === 0;

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl text-stone-900">
            <Github className="h-5 w-5 text-maroon-800" /> GitHub insights
          </h2>
          <p className={`mt-1 ${ui.muted}`}>
            {data.synced_at ? `Read from GitHub on ${day(data.synced_at)}.` : "Imported before contribution history was kept."}
            {" "}Members are matched by their linked GitHub account or email; everyone else shows their GitHub name.
          </p>
        </div>
        {data.can_refresh && (
          <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={refresh} disabled={starting}>
            {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh from GitHub
          </button>
        )}
      </div>
      {refreshError && <p role="alert" className={ui.error}>{refreshError}</p>}

      {empty ? (
        <p className={ui.empty}>
          {data.can_refresh ? "Refresh from GitHub to see who made each commit and push." : "Contribution history appears here once the owner refreshes it from GitHub."}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {([["Commits", "Commits", data.totals.commits], ["Pushes", "Pushes", data.totals.pushes],
              ["Contributors", "People", data.totals.contributors]] as const).map(([label, short, value]) => (
              <div key={label} className="min-w-0 rounded-xl border border-stone-200 bg-[#f8f6f0] px-3 py-2.5">
                <dt className="font-sans text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{label}</span>
                </dt>
                <dd className="font-serif text-2xl text-stone-900">{value.toLocaleString()}</dd>
              </div>
            ))}
          </dl>

          {data.weekly.length > 0 && <WeeklyCommits weekly={data.weekly} />}

          <div>
            <h3 className="mb-2 font-serif text-lg text-stone-900">Contributors</h3>
            <ul className="divide-y divide-stone-100">
              {data.contributors.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar person={c} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-sm">
                        <Who user={c.user} login={c.login} name={c.name} />
                        {c.user && c.login && <span className="text-xs text-stone-500"> · {c.login} on GitHub</span>}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                          <div className="h-full rounded-full bg-maroon-700" style={{ width: `${Math.max(2, c.share)}%` }} />
                        </div>
                        <span className="w-12 shrink-0 text-right font-sans text-xs font-semibold text-stone-700">{c.share}%</span>
                      </div>
                      <p className="mt-1 font-sans text-xs text-stone-500">
                        {c.commits.toLocaleString()} {c.commits === 1 ? "commit" : "commits"}
                        {c.additions != null && <> · <span className="text-forest-700">+{c.additions.toLocaleString()}</span> <span className="text-crimson-700">−{(c.deletions ?? 0).toLocaleString()}</span></>}
                        {" "}· {c.pushes} {c.pushes === 1 ? "push" : "pushes"}
                        {c.last_commit_at && <> · last commit {day(c.last_commit_at)}</>}
                      </p>
                    </div>
                    <button type="button" className={`${ui.btn} ${ui.neutral}`} aria-expanded={open === c.id}
                      onClick={() => setOpen(open === c.id ? null : c.id)}>
                      {open === c.id ? "Hide history" : "History"}
                    </button>
                  </div>
                  {open === c.id && (
                    <div className="mt-3 grid gap-5 rounded-xl bg-[#f8f6f0] p-4 md:grid-cols-2">
                      <History projectId={projectId} githubUrl={data.github_url} contributor={c.id} kind="commits" />
                      <History projectId={projectId} githubUrl={data.github_url} contributor={c.id} kind="pushes" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-serif text-lg text-stone-900">Activity</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <History projectId={projectId} githubUrl={data.github_url} contributor={null} kind="commits" />
              <History projectId={projectId} githubUrl={data.github_url} contributor={null} kind="pushes" />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
