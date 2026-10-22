const WEEK = 7 * 86400;

/** Bars for commits per GitHub week (Sunday start), ending at the latest week with data. */
export function WeeklyCommits({ weekly, weeks: span = 26 }: { weekly: [number, number][]; weeks?: number }) {
  if (weekly.length === 0) return null;
  const counts = new Map(weekly.map(([week, count]) => [week, count]));
  const latest = Math.max(...weekly.map(([week]) => week));
  const weeks = Array.from({ length: span }, (_, i) => latest - (span - 1 - i) * WEEK);
  const top = Math.max(1, ...weeks.map((week) => counts.get(week) ?? 0));
  const label = (week: number) => new Date(week * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <figure>
      <div className="flex h-24 items-end gap-[3px]" role="img" aria-label={`Commits per week for the last ${span} weeks`}>
        {weeks.map((week) => {
          const count = counts.get(week) ?? 0;
          return (
            <div key={week} title={`${count} commits, week of ${label(week)}`}
              className={`flex-1 rounded-t ${count ? "bg-maroon-700" : "bg-stone-200"}`}
              style={{ height: count ? `${Math.max(8, (count / top) * 100)}%` : "4%" }} />
          );
        })}
      </div>
      <figcaption className="mt-1.5 flex justify-between font-sans text-[11px] text-stone-500">
        <span>{label(weeks[0]!)}</span><span>Commits per week</span><span>{label(weeks[span - 1]!)}</span>
      </figcaption>
    </figure>
  );
}
