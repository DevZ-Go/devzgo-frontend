import { useQuery } from "@tanstack/react-query";
import { Activity, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchStanding } from "../api/profiles";
import { ui } from "../styles/editorial";
import { WeeklyCommits } from "./WeeklyCommits";

const BARS = [
  { key: "projects", label: "Projects", color: "bg-maroon-800" },
  { key: "commits", label: "Commits", color: "bg-amber-500" },
  { key: "pushes", label: "Pushes", color: "bg-autumn-rust" },
  { key: "connections", label: "Connections", color: "bg-forest-700" },
  { key: "activity", label: "Activity", color: "bg-stone-700" },
] as const;

function formatWhen(iso: string | null) {
  if (!iso) return "No recorded push";
  return `Last push ${new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

/** Bars and language mix for the work a viewer is allowed to see. */
export function CandidateStanding({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["standing", userId],
    queryFn: () => fetchStanding(userId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-maroon-700" />
      </div>
    );
  }
  if (error || !data) {
    return <p className={ui.error}>The graphic portfolio could not be loaded.</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl text-stone-900">Where they stand</h2>
        <p className="mt-1 text-sm text-stone-500">
          {formatWhen(data.last_push)} · Each bar is measured against the highest count among people you can find.
        </p>
        <ul className="mt-6 space-y-4">
          {BARS.map((bar) => {
            const value = data[bar.key];
            const hidden = value == null;
            const top = Math.max(value ?? 0, data.top?.[bar.key] ?? 0);
            const width = hidden || !value ? 0 : Math.max(3, Math.round((value / top) * 100));
            return (
              <li key={bar.key}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold text-stone-800">{bar.label}</span>
                  <span className="tabular-nums text-stone-500">
                    {hidden ? "Hidden" : top === 0 ? "None recorded yet" : <><span className="font-semibold text-stone-800">{value}</span> of top {top}</>}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                  {!hidden && <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${width}%` }} />}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="font-serif text-xl text-stone-900">Languages</h3>
          {data.languages.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">No analysed code is visible yet.</p>
          ) : (
            <>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                {data.languages.map((lang, index) => (
                  <div key={lang.name} className={index % 2 ? "bg-amber-400" : "bg-maroon-800"} style={{ width: `${lang.percentage}%` }} />
                ))}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-stone-600">
                {data.languages.map((lang) => (
                  <li key={lang.name} className="flex justify-between">
                    <span>{lang.name}</span>
                    <span className="tabular-nums">{lang.percentage}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="font-serif text-xl text-stone-900">Tech stack</h3>
          {data.tech.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">No tech is listed on the visible projects.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.tech.map((item) => (
                <li key={item.name} className="rounded-full bg-[#fced96] px-3 py-1 text-xs font-semibold text-stone-800">
                  {item.name} · {item.count}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif text-xl text-stone-900">GitHub contributions</h3>
          <Link to={`/profile/${userId}/activity`} className={`${ui.btn} ${ui.primary} rounded-full px-4 py-2`}>
            <Activity className="h-3.5 w-3.5" /> Open activity log
          </Link>
        </div>
        {(data.contributions ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No commits or pushes from imported repositories are visible yet.</p>
        ) : (
          <>
            {(data.weekly ?? []).length > 0 && <div className="mt-4"><WeeklyCommits weekly={data.weekly} /></div>}
            <ul className="mt-5 space-y-4">
              {data.contributions.map((row) => (
                <li key={row.project_id}>
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <Link to={`/project/${row.project_id}`} className="truncate font-semibold text-maroon-800 hover:underline">{row.title}</Link>
                      <span className="shrink-0 rounded-full bg-[#fced96] px-2 py-0.5 text-[11px] font-semibold text-stone-800">
                        {row.owned ? "Owner" : "Contributor"}
                      </span>
                    </span>
                    <span className="tabular-nums text-stone-500">
                      <span className="font-semibold text-stone-800">{row.commits}</span> {row.commits === 1 ? "commit" : "commits"}
                      {" "}· {row.pushes} {row.pushes === 1 ? "push" : "pushes"} · {row.share}% of the repository
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.max(2, row.share)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <p className="text-xs leading-relaxed text-stone-500">
        Counts use projects, connections, and activity this person has made visible to you. Commits and pushes come from
        repositories imported from GitHub and count only the ones this person made, matched by their linked GitHub account
        or email. Pushes cover what GitHub shared at each import or refresh.
      </p>
    </section>
  );
}
