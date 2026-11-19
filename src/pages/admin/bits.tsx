import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { ui } from "../../styles/editorial";

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex justify-center py-16" role="status" aria-label={label}>
      <Loader2 className="h-6 w-6 animate-spin text-[#6B0B0C]" />
    </div>
  );
}

export function Banner({ tone, children }: { tone: "ok" | "bad"; children: ReactNode }) {
  const color = tone === "ok" ? "border-[#15803D] bg-[#DCFCE7] text-[#14532D]" : "border-[#DC2626] bg-[#FEE2E2] text-[#991B1B]";
  return <p className={`rounded-2xl border-2 px-4 py-3 text-sm font-medium ${color}`}>{children}</p>;
}

export function display(value: unknown, detail = false): string {
  if (value == null || value === "") return "—";
  if (typeof value === "object" && value && "redacted" in value) {
    return (value as { present?: boolean }).present ? "Hidden" : "—";
  }
  if (typeof value === "object") {
    const text = JSON.stringify(value, null, detail ? 2 : 0);
    if (!detail && text.length > 180) return `${text.slice(0, 180)}…`;
    return text;
  }
  return String(value);
}

export function titleCase(name: string): string {
  return name.replaceAll("_", " ");
}

export function when(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export const panel = `${ui.card} p-4 sm:p-5`;

export function statusClass(status: string): string {
  if (status === "active") return "bg-[#DCFCE7] text-[#14532D]";
  if (status === "suspended" || status === "deletion scheduled") return "bg-[#FEE2E2] text-[#991B1B]";
  return "bg-[#FEF3C7] text-[#92400E]";
}
