import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, Github, Loader2, RefreshCw } from "lucide-react";
import {
  fetchGitHubInsights,
  startGitHubRefresh,
  type GitHubContributor,
} from "../api/githubHistory";
import { getApiErrorMessage } from "../utils/apiError";
import { ui } from "../styles/editorial";
import { WeeklyCommits } from "./WeeklyCommits";

function day(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
}

function Who({ person }: { person: GitHubContributor }) {
  if (person.user) {
    return <Link to={`/profile/${person.user.id}`} className="font-semibold text-maroon-800 hover:underline">{person.user.full_name || person.user.username}</Link>;
  }
  if (person.login) {
    return <a href={`https://github.com/${person.login}`} target="_blank" rel="noreferrer" className="font-semibold text-stone-800 hover:underline">{person.login}</a>;
  }
  return <span className="font-semibold text-stone-800">{person.name || "Unknown author"}</span>;
}

function Avatar({ person }: { person: GitHubContributor }) {
  const src = person.user?.avatar_url || person.avatar_url;
  const letter = (person.user?.full_name || person.name || "?").charAt(0).toUpperCase();
  return src
    ? <img src={src} alt="" className="h-9 w-9 shrink-0 rounded-full border border-stone-200 object-cover" />
    : <span className={`h-9 w-9 shrink-0 rounded-full text-sm ${ui.avatar}`}>{letter}</span>;
}

/** A summary of who built an imported repository. Every commit and push lives in the project's activity log. */
export function GitHubInsights({ projectId }: { projectId: string }) {
  const insights = useQuery({ queryKey: ["github-insights", projectId], queryFn: () => fetchGitHubInsights(projectId) });
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
  const logPath = `/project/${projectId}/activity`;
  const plural = (n: number, word: string, many = `${word}s`) => `${n.toLocaleString()} ${n === 1 ? word : many}`;

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
        <div className="flex flex-wrap gap-2">
          {!empty && (
            <Link to={logPath} className={`${ui.btn} ${ui.neutral}`}>
              <Activity className="h-3.5 w-3.5 text-maroon-800" /> Open activity log
            </Link>
          )}
          {data.can_refresh && (
            <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={refresh} disabled={starting}>
              {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh from GitHub
            </button>
          )}
        </div>
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
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar person={c} />
                  <div className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-0">
                    <p className="truncate font-sans text-sm">
                      <Who person={c} />
                      {c.user && c.login && <span className="text-xs text-stone-500"> · {c.login} on GitHub</span>}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-maroon-700" style={{ width: `${Math.max(2, c.share)}%` }} />
                      </div>
                      <span className="w-12 shrink-0 text-right font-sans text-xs font-semibold text-stone-700">{c.share}%</span>
                    </div>
                    <p className="mt-1 font-sans text-xs text-stone-500">
                      {plural(c.commits, "commit")}
                      {c.additions != null && <> · <span className="text-forest-700">+{c.additions.toLocaleString()}</span> <span className="text-crimson-700">−{(c.deletions ?? 0).toLocaleString()}</span></>}
                      {" "}· {plural(c.pushes, "push", "pushes")}
                      {c.last_commit_at && <> · last commit {day(c.last_commit_at)}</>}
                    </p>
                  </div>
                  {c.user && (
                    <Link to={`/profile/${c.user.id}/activity?project=${projectId}`} className={`${ui.btn} ${ui.neutral} ml-12 sm:ml-0`}
                      aria-label={`${c.user.full_name || c.user.username}'s activity on this project`}>
                      <Activity className="h-3.5 w-3.5 text-maroon-800" /> Their activity
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <Link to={logPath}
            className="group flex items-center justify-between gap-3 rounded-xl border border-maroon-100 bg-maroon-50 px-4 py-3 font-sans text-sm text-stone-700 transition hover:border-maroon-300">
            <span>
              See every commit and push, day by day, in the <span className="font-semibold text-maroon-800">activity log</span>.
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-maroon-800 transition group-hover:translate-x-0.5" />
          </Link>
        </>
      )}
    </section>
  );
}
