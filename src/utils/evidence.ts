import type { CheckStatus, EvidenceClass, SkillMatrix } from "../api/evidence";

export const EVIDENCE_CLASSES: { id: EvidenceClass; label: string; body: string }[] = [
  { id: "detected", label: "Detected", body: "Found in project source: dependencies, imports, config files or file types." },
  { id: "contribution_linked", label: "Contribution-linked", body: "Detected in a project where this person has credited GitHub commits." },
  { id: "declared", label: "Declared", body: "Listed by the person, with no detected project evidence yet." },
];

export const classLabel = (id: EvidenceClass) => EVIDENCE_CLASSES.find((c) => c.id === id)?.label ?? id;

const SOURCE_LABELS: Record<string, string> = {
  dependency: "Dependency",
  import: "Source import",
  config: "Config file",
  extension: "File type",
  language: "Language bar",
  recorded: "Detected at upload",
  project: "Added to a project",
  profile: "Profile skill",
};

export const sourceLabel = (id: string) => SOURCE_LABELS[id] ?? id;

export const STATUS_META: Record<CheckStatus, { label: string; tone: string }> = {
  found: { label: "Evidence found", tone: "bg-[#DCFCE7] text-[#14532D] border-[#15803D]/40" },
  not_detected: { label: "Not detected", tone: "bg-stone-100 text-stone-700 border-stone-200" },
  not_assessed: { label: "Not assessed", tone: "bg-white text-stone-500 border-dashed border-stone-300" },
  needs_review: { label: "Needs review", tone: "bg-amber-50 text-amber-900 border-amber-300" },
};

/** The categories that still have skills once only one evidence class is shown ("all" keeps everything). */
export function filterMatrix(matrix: SkillMatrix, only: EvidenceClass | "all"): SkillMatrix["categories"] {
  if (only === "all") return matrix.categories;
  return matrix.categories
    .map((category) => ({ ...category, skills: category.skills.filter((s) => s.classes.includes(only)) }))
    .filter((category) => category.skills.length > 0);
}

export const fileLink = (projectId: string, file: string) => `/project/${projectId}?file=${encodeURIComponent(file)}`;

export const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
