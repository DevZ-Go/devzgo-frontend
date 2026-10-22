import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { fetchStanding } from "../api/profiles";
import { ui } from "../styles/editorial";

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
      <p className="text-xs leading-relaxed text-stone-500">
        Counts use projects, connections, and activity this person has made visible to you. Commits are the repository
        total when a GitHub repo was imported. Pushes are the recent push events GitHub returned at that import, up to 100.
      </p>
    </section>
  );
}
