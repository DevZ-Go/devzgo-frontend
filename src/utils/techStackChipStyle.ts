/**
 * Deterministic Tailwind classes per tech name so every stack has a distinct colour.
 * Two contexts: light page backgrounds vs dark overlays (project cards on images).
 */

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Light UI: detail page, forms, profile */
const ON_LIGHT = [
  "bg-emerald-50 text-emerald-900 border-emerald-200/90",
  "bg-sky-50 text-sky-900 border-sky-200/90",
  "bg-violet-50 text-violet-900 border-violet-200/90",
  "bg-amber-50 text-amber-900 border-amber-200/90",
  "bg-rose-50 text-rose-900 border-rose-200/90",
  "bg-cyan-50 text-cyan-900 border-cyan-200/90",
  "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200/90",
  "bg-lime-50 text-lime-900 border-lime-200/90",
  "bg-indigo-50 text-indigo-900 border-indigo-200/90",
  "bg-orange-50 text-orange-900 border-orange-200/90",
  "bg-teal-50 text-teal-900 border-teal-200/90",
  "bg-pink-50 text-pink-900 border-pink-200/90",
] as const;

/** Dark overlays on cover images */
const ON_DARK = [
  "bg-emerald-500/25 text-emerald-100 border-emerald-400/35",
  "bg-sky-500/25 text-sky-100 border-sky-400/35",
  "bg-violet-500/25 text-violet-100 border-violet-400/35",
  "bg-amber-500/25 text-amber-100 border-amber-400/35",
  "bg-rose-500/25 text-rose-100 border-rose-400/35",
  "bg-cyan-500/25 text-cyan-100 border-cyan-400/35",
  "bg-fuchsia-500/25 text-fuchsia-100 border-fuchsia-400/35",
  "bg-lime-500/25 text-lime-100 border-lime-400/35",
  "bg-indigo-500/25 text-indigo-100 border-indigo-400/35",
  "bg-orange-500/25 text-orange-100 border-orange-400/35",
  "bg-teal-500/25 text-teal-100 border-teal-400/35",
  "bg-pink-500/25 text-pink-100 border-pink-400/35",
] as const;

export type TechStackChipContext = "onLight" | "onDark";

export function getTechStackChipClasses(
  name: string,
  context: TechStackChipContext = "onLight"
): string {
  const key = name.trim().toLowerCase() || "unknown";
  const idx = hashString(key) % (context === "onDark" ? ON_DARK.length : ON_LIGHT.length);
  const base =
    context === "onDark" ? ON_DARK[idx]! : ON_LIGHT[idx]!;
  return `px-3 py-1 rounded-full text-xs font-medium border ${base}`;
}

/** Multi-select tech chips (forms, modal) */
export function getTechStackToggleClasses(name: string, selected: boolean): string {
  const chip = getTechStackChipClasses(name, "onLight");
  if (selected) {
    return `${chip} ring-2 ring-indigo-500/70 ring-offset-1 shadow-sm`;
  }
  return `${chip} opacity-90 hover:opacity-100`;
}

/** Compact chip for filter rows (outline when inactive uses same hue family). */
export function getTechStackFilterClasses(
  name: string,
  active: boolean
): string {
  const key = name.trim().toLowerCase() || "unknown";
  const idx = hashString(key) % ON_LIGHT.length;
  const palette = [
    { ring: "ring-emerald-500/40", bg: "bg-emerald-600", light: "bg-emerald-50 text-emerald-900 border-emerald-200" },
    { ring: "ring-sky-500/40", bg: "bg-sky-600", light: "bg-sky-50 text-sky-900 border-sky-200" },
    { ring: "ring-violet-500/40", bg: "bg-violet-600", light: "bg-violet-50 text-violet-900 border-violet-200" },
    { ring: "ring-amber-500/40", bg: "bg-amber-600", light: "bg-amber-50 text-amber-900 border-amber-200" },
    { ring: "ring-rose-500/40", bg: "bg-rose-600", light: "bg-rose-50 text-rose-900 border-rose-200" },
    { ring: "ring-cyan-500/40", bg: "bg-cyan-600", light: "bg-cyan-50 text-cyan-900 border-cyan-200" },
    { ring: "ring-fuchsia-500/40", bg: "bg-fuchsia-600", light: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200" },
    { ring: "ring-lime-500/40", bg: "bg-lime-600", light: "bg-lime-50 text-lime-900 border-lime-200" },
    { ring: "ring-indigo-500/40", bg: "bg-indigo-600", light: "bg-indigo-50 text-indigo-900 border-indigo-200" },
    { ring: "ring-orange-500/40", bg: "bg-orange-600", light: "bg-orange-50 text-orange-900 border-orange-200" },
    { ring: "ring-teal-500/40", bg: "bg-teal-600", light: "bg-teal-50 text-teal-900 border-teal-200" },
    { ring: "ring-pink-500/40", bg: "bg-pink-600", light: "bg-pink-50 text-pink-900 border-pink-200" },
  ];
  const p = palette[idx % palette.length]!;
  if (active) {
    return `px-4 py-2 rounded-full text-sm font-medium border text-white shadow-sm ${p.bg} border-transparent ring-2 ${p.ring} ring-offset-2 ring-offset-white`;
  }
  return `px-4 py-2 rounded-full text-sm font-medium border transition hover:opacity-90 ${p.light}`;
}

const PROJECT_CATEGORY_LIGHT: Record<string, string> = {
  "AI/ML": "bg-purple-50 text-purple-900 border-purple-200",
  "Web Development": "bg-blue-50 text-blue-900 border-blue-200",
  Mobile: "bg-slate-100 text-slate-900 border-slate-200",
  Gaming: "bg-red-50 text-red-900 border-red-200",
  Education: "bg-green-50 text-green-900 border-green-200",
  Productivity: "bg-stone-50 text-stone-900 border-stone-200",
  Other: "bg-neutral-100 text-neutral-900 border-neutral-200",
};

export function getProjectCategoryChipClasses(category: string): string {
  const base =
    PROJECT_CATEGORY_LIGHT[category] ??
    "bg-slate-100 text-slate-800 border-slate-200";
  return `px-3 py-1 rounded-full text-xs font-medium border ${base}`;
}
