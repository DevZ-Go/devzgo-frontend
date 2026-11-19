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
  const shell =
    tone === "deck"
      ? "bg-[#1B2E5E] text-[#FAF6EC]"
      : tone === "night"
        ? "bg-[#140e0c] text-amber-50"
        : tone === "felt"
          ? "bg-[#5B233B] text-[#FAF6EC]"
          : "bg-[#B6C7E3] text-[#5B233B]";

  return (
    <div className={`flex h-dvh flex-col overflow-hidden ${shell}`}>
      {/* Colorful Checkered Trim from Second Palette Reference (#DA6844, #B6C7E3, #9EA654, #D5BEEA, #8D5E46, #FCFBF4) */}
      {!dark && (
        <div
          className="h-2.5 w-full shrink-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #DA6844 0px, #DA6844 36px, #B6C7E3 36px, #B6C7E3 60px, #9EA654 60px, #9EA654 96px, #D5BEEA 96px, #D5BEEA 120px, #8D5E46 120px, #8D5E46 156px, #FCFBF4 156px, #FCFBF4 180px)",
          }}
        />
      )}
      {/* Ultra-clean 3-item upper bar: Back button, Title, Search + Vertical Filters menu */}
      <header
        className={`flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-8 z-30 ${
          dark
            ? "border-b border-white/15 bg-black/20"
            : "border-b-2 border-[#5B233B]/20 bg-[#5B233B] text-[#FCFBF4] shadow-xs"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/explore"
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.16em] transition ${
              dark
                ? "bg-white/15 hover:bg-white/25 text-white"
                : "bg-[#D5BEEA] hover:bg-[#FCFBF4] text-[#5B233B]"
            }`}
          >
            &larr; Studio
          </Link>
          <h1 className="font-cursive text-2xl sm:text-3xl tracking-wide text-[#FCFBF4] m-0">
            {title}
          </h1>
        </div>

        <ExploreFilters
          filters={data.filters}
          onChange={data.setFilters}
          techStacks={data.techStacks}
          hasFilters={data.hasFilters}
          onClear={data.clearFilters}
          classes={{
            root: "flex flex-wrap items-center justify-end gap-2.5",
            input: dark
              ? "w-44 sm:w-56 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm text-white placeholder:text-white/50 focus:outline-none"
              : "w-44 sm:w-56 rounded-full border-2 border-[#D5BEEA] bg-[#FCFBF4] px-4 py-1.5 text-sm font-medium text-[#5B233B] placeholder:text-[#5B233B]/50 focus:outline-none focus:ring-2 focus:ring-[#D5BEEA]",
            select:
              "rounded-full border border-[#5B233B]/40 bg-white px-3 py-1.5 text-xs text-[#5B233B]",
            button:
              "px-3 py-1.5 rounded-full bg-[#DA6844] text-[#FCFBF4] text-xs font-bold uppercase tracking-wider hover:bg-[#C05532]",
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
