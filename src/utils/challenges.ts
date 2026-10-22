import type { ChallengeType, Criterion, Difficulty, Rating } from "../api/challenges";

/** Mirrors the server's default rubric, used when a recruiter does not change it. */
export const DEFAULT_CRITERIA: Criterion[] = [
  { key: "correctness", label: "Correctness", description: "Does the work do what the task asks?" },
  { key: "code_quality", label: "Code quality", description: "Readable, well structured and maintainable." },
  { key: "problem_solving", label: "Problem solving", description: "A sound approach, including edge cases." },
  { key: "testing", label: "Testing", description: "Tests or other evidence that the work behaves as intended." },
  { key: "documentation", label: "Documentation", description: "Clear setup notes and explanation." },
  { key: "communication", label: "Technical communication", description: "Decisions and trade-offs explained." },
];

/** A stable snake_case key for a new rubric criterion, unique among the keys already used. */
export function criterionKey(label: string, taken: string[]): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 36) || "criterion";
  let key = base;
  for (let n = 2; taken.includes(key); n += 1) key = `${base}_${n}`;
  return key;
}

export const CHALLENGE_TYPES: [ChallengeType, string][] = [
  ["frontend", "Frontend implementation"],
  ["backend", "Backend implementation"],
  ["full_stack", "Full-stack"],
  ["bug_fix", "Bug fix"],
  ["code_review", "Code review"],
  ["api_design", "API design"],
  ["database_design", "Database design"],
  ["architecture", "Architecture or system design"],
];
export const DIFFICULTIES: [Difficulty, string][] = [
  ["introductory", "Introductory"],
  ["intermediate", "Intermediate"],
  ["advanced", "Advanced"],
];
export const RATINGS: [Rating, string][] = [
  ["needs_improvement", "Needs improvement"],
  ["meets_expectations", "Meets expectations"],
  ["strong", "Strong"],
];

const label = <T extends string>(rows: [T, string][], id: string) => rows.find(([key]) => key === id)?.[1] ?? id;
export const typeLabel = (id: string) => label(CHALLENGE_TYPES, id);
export const difficultyLabel = (id: string) => label(DIFFICULTIES, id);
export const ratingLabel = (id: string) => label(RATINGS, id);

const pad = (n: number) => String(n).padStart(2, "0");

/** An ISO time as the value a datetime-local input shows, in the viewer's own time zone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A datetime-local value (the viewer's time zone) as a UTC ISO string for the server; null when empty. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** "Closes in 3 days", "Closes in 5 hours", "Closed", or "No deadline". */
export function deadlineText(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "No deadline";
  const ms = new Date(iso).getTime() - now.getTime();
  if (ms <= 0) return "Deadline passed";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "Closes in under an hour";
  if (hours < 48) return `Closes in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `Closes in ${days} days`;
}

export const minutesText = (minutes: number | null) => {
  if (!minutes) return null;
  if (minutes < 60) return `About ${minutes} min`;
  const hours = minutes / 60;
  return `About ${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
};
