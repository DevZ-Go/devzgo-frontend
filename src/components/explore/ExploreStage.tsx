import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ExploreFilters } from "../ExploreFilters";
import type { useExploreProjects } from "../../hooks/useExploreProjects";

type ExploreData = ReturnType<typeof useExploreProjects>;

/** Full-screen frame shared by the Explore themes so each one fits the laptop without a page scrollbar. */
export function ExploreStage({
  title,
  tone,
  data,
  children,
}: {
  title: string;
  tone: "paper" | "felt" | "night" | "deck";
  data: ExploreData;
  children: ReactNode;
}) {
  const dark = tone === "felt" || tone === "night" || tone === "deck";
  const shell = tone === "deck"
    ? "bg-[#14061f] text-white"
    : tone === "night"
      ? "bg-[#140e0c] text-amber-50"
      : tone === "felt"
        ? "bg-[#3b2420] text-stone-100"
        : "bg-[#f7f5ed] text-stone-800";
  return (
    <div className={`flex h-dvh flex-col overflow-hidden ${shell}`}>
      <header className={`flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 ${dark ? "border-b border-white/10" : "border-b border-stone-200 bg-[#f8f6f0]"}`}>
        <Link to="/explore" className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70 hover:opacity-100">
          Back
        </Link>
        <h1 className={`font-serif text-xl tracking-tight ${dark ? "text-amber-50" : "text-stone-900"}`}>{title}</h1>
        <ExploreFilters
          filters={data.filters}
          onChange={data.setFilters}
          techStacks={data.techStacks}
          hasFilters={data.hasFilters}
          onClear={data.clearFilters}
          classes={{
            root: "flex min-w-[16rem] flex-1 flex-wrap items-center justify-end gap-2",
            input: dark
              ? "w-36 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
              : "w-36 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300",
            select: dark
              ? "rounded-full border border-white/20 bg-transparent px-2 py-1.5 text-xs text-white"
              : "rounded-full border border-stone-200 bg-white px-2 py-1.5 text-xs",
            button: "text-[11px] font-semibold uppercase tracking-wider opacity-70 hover:opacity-100",
          }}
        />
      </header>
      {data.error && (
        <p className="px-6 py-2 text-sm text-rose-600">
          {data.error}{" "}
          <button type="button" onClick={data.reload} className="underline">
            Retry
          </button>
        </p>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
