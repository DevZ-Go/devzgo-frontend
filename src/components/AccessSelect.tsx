import { ACCESS_LEVELS, accessLabel } from "../api/collaborations";
import type { AccessLevel } from "../types/network";
import { SelectMenu } from "./SelectMenu";

const HINTS = Object.fromEntries(ACCESS_LEVELS.map((level) => [level.label, level.detail]));

/** Viewer, Commenter, Editor, or Manager, with what each one allows. Only owners may hand out Manager. */
export function AccessSelect({ value, onChange, allowManager = true, label = "Access level", className = "" }: {
  value: AccessLevel;
  onChange: (next: AccessLevel) => void;
  allowManager?: boolean;
  label?: string;
  className?: string;
}) {
  const levels = ACCESS_LEVELS.filter((level) => allowManager || level.value !== "manager");
  return (
    <SelectMenu
      value={accessLabel(value)}
      options={levels.map((level) => level.label)}
      hints={HINTS}
      placeholder="Access"
      ariaLabel={label}
      onChange={(picked) => onChange(levels.find((level) => level.label === picked)?.value ?? "commenter")}
      className={`rounded-xl border border-stone-200 bg-white px-3 py-1.5 font-sans text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-forest-400 ${className}`}
    />
  );
}
