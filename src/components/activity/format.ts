export const DAY_MS = 86_400_000;

/** Milliseconds at UTC midnight for a YYYY-MM-DD day, so day arithmetic ignores daylight saving. */
export function parseDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export const dayString = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Today as YYYY-MM-DD in the viewer's time zone. */
export const localToday = () => new Date().toLocaleDateString("en-CA");

export function longDay(day: string) {
  return new Date(parseDay(day)).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function describeDay(day: string, commits: number, pushes: number) {
  if (!commits && !pushes) return `No activity on ${longDay(day)}`;
  const parts = [commits && `${commits} commit${commits === 1 ? "" : "s"}`, pushes && `${pushes} push${pushes === 1 ? "" : "es"}`].filter(Boolean);
  return `${parts.join(" and ")} on ${longDay(day)}`;
}
