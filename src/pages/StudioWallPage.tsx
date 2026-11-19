import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FolderCode,
  Tv,
} from "lucide-react";
import { ExploreStage } from "../components/explore/ExploreStage";
import { ExploreFilters } from "../components/ExploreFilters";
import { ProjectSocialBar } from "../components/explore/ProjectSocialBar";
import { useExploreProjects } from "../hooks/useExploreProjects";
import { resolveApiAssetUrl } from "../api/config";
import { StickerBadge, type StickerName } from "../components/StickerBadge";

const CARD_PALETTES = [
  {
    bg: "bg-[#FCFBF7] border-[#4A121A]/20",
    tape: "bg-[#4A121A] text-[#FAF7F2]",
    chip: "bg-[#FAF7F2] text-[#4A121A] border-[#4A121A]/20",
  },
  {
    bg: "bg-[#FBF2F2] border-[#6B0B0C]/20",
    tape: "bg-[#6B0B0C] text-[#FAF7F2]",
    chip: "bg-[#FAF7F2] text-[#6B0B0C] border-[#6B0B0C]/20",
  },
  {
    bg: "bg-[#FAF6EE] border-[#5C1A24]/20",
    tape: "bg-[#5C1A24] text-[#FAF7F2]",
    chip: "bg-[#FAF7F2] text-[#5C1A24] border-[#5C1A24]/20",
  },
  {
    bg: "bg-[#F5EFF7] border-[#780D18]/20",
    tape: "bg-[#780D18] text-[#FAF7F2]",
    chip: "bg-[#FAF7F2] text-[#780D18] border-[#780D18]/20",
  },
];

const GALLERY_STICKERS: StickerName[] = [
  "sageMiffy",
  "starHatKid",
  "maroonMiffy",
  "snoopyMeadow",
  "watercolorFlower",
  "keycapsDone",
  "daisyLadybug",
  "wonkyFrog",
  "starryFlower",
  "snoopyAutumn",
];

/**
 * Editorial Gallery & Directory experience (Fruit in Frost aesthetic):
 * Single top navigation, curved organic cards, high-fashion editorial styling,
 * with search, filters, scroll toggle, and TV World switcher all on the right.
 */
export function StudioWallPage({
  initialMode = "horizontal",
}: {
  initialMode?: "horizontal" | "vertical";
} = {}) {
  const data = useExploreProjects();
  const [scrollMode, setScrollMode] = useState<"horizontal" | "vertical">(initialMode);
  const horizontalScroller = useRef<HTMLDivElement>(null);
  const projects = data.projects ?? [];

  useEffect(() => {
    horizontalScroller.current?.scrollTo({ left: 0 });
  }, [data.appliedKey]);

  // Keyboard arrow support in Horizontal mode
  useEffect(() => {
    if (scrollMode !== "horizontal") return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const el = horizontalScroller.current;
      if (!el) return;
      if (e.key === "ArrowRight") el.scrollBy({ left: 300, behavior: "smooth" });
      if (e.key === "ArrowLeft") el.scrollBy({ left: -300, behavior: "smooth" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollMode]);

  // Translate vertical mouse-wheel into smooth horizontal scrolling when in Horizontal mode
  const handleWheelHorizontal = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollMode !== "horizontal") return;
    const el = horizontalScroller.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  };

  const scrollHorizontalBy = (delta: number) => {
    horizontalScroller.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <ExploreStage title="projects studio" tone="paper" data={data}>
      {/* Editorial Gallery Header & Action Controls Bar */}
      <header className="shrink-0 border-b border-[#4A121A]/15 bg-[#FAF7F2] dark:bg-[#1f0d11] px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Left: Title & Build Count */}
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#4A121A] dark:text-[#FFF8CA] m-0">
              projects studio
            </h1>
            <span className="hidden sm:inline-block h-4 w-px bg-[#4A121A]/20 dark:bg-white/20" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A121A]/70 dark:text-[#FAF7F2]/70">
              EXPLORE STUDENT CREATIONS · {projects.length} {projects.length === 1 ? "BUILD" : "BUILDS"}
            </span>
          </div>

          {/* Right: All Functionality on the Right Side */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Search & Filters */}
            <ExploreFilters
              filters={data.filters}
              onChange={data.setFilters}
              techStacks={data.techStacks}
              hasFilters={data.hasFilters}
              onClear={data.clearFilters}
              classes={{
                root: "flex items-center gap-2",
                input: "h-9 w-40 sm:w-56 rounded-full border border-[#4A121A]/25 bg-white dark:bg-[#2A1217] px-3.5 text-xs font-sans text-[#4A121A] dark:text-[#FAF7F2] placeholder-[#4A121A]/40 focus:border-[#4A121A] focus:outline-none transition-all shadow-xs",
                button: "inline-flex h-9 items-center gap-1.5 rounded-full border border-[#4A121A]/25 bg-[#FAF7F2] dark:bg-[#2A1217] hover:bg-[#F2ECE1] px-4 text-xs font-mono uppercase tracking-wider text-[#4A121A] dark:text-[#FAF7F2] transition-all shadow-xs cursor-pointer",
                menu: "absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-[#4A121A]/20 bg-[#FAF7F2] dark:bg-[#2A1217] p-4 shadow-xl space-y-3.5 text-left text-[#4A121A] dark:text-[#FAF7F2]",
                select: "w-full rounded-xl border border-[#4A121A]/25 bg-white dark:bg-[#1A0B0E] px-3 py-2 text-xs font-sans text-[#4A121A] dark:text-[#FAF7F2] focus:outline-none",
              }}
            />

            {/* Scroll View Mode Switcher [ ↔ Hoz | ↕ Vert ] */}
            <div className="inline-flex h-9 items-center rounded-full border border-[#4A121A]/25 bg-[#FAF7F2] dark:bg-[#2A1217] p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setScrollMode("horizontal")}
                aria-pressed={scrollMode === "horizontal"}
                title="Horizontal scroll gallery view"
                className={`inline-flex h-full items-center gap-1.5 px-3 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  scrollMode === "horizontal"
                    ? "bg-[#4A121A] text-[#FAF7F2] shadow-xs"
                    : "text-[#4A121A]/70 dark:text-[#FAF7F2]/70 hover:text-[#4A121A]"
                }`}
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span className="hidden md:inline">Horizontal</span>
                <span className="md:hidden">Hoz</span>
              </button>
              <button
                type="button"
                onClick={() => setScrollMode("vertical")}
                aria-pressed={scrollMode === "vertical"}
                title="Vertical grid directory view"
                className={`inline-flex h-full items-center gap-1.5 px-3 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  scrollMode === "vertical"
                    ? "bg-[#4A121A] text-[#FAF7F2] shadow-xs"
                    : "text-[#4A121A]/70 dark:text-[#FAF7F2]/70 hover:text-[#4A121A]"
                }`}
              >
                <ArrowUpDown className="w-3 h-3" />
                <span className="hidden md:inline">Vertical</span>
                <span className="md:hidden">Vert</span>
              </button>
            </div>

            {/* Quick Switch to TV World */}
            <Link
              to="/explore/tv"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#4A121A] bg-[#4A121A] hover:bg-[#6B0B0C] px-4 text-xs font-mono uppercase tracking-wider text-[#FAF7F2] transition-all shadow-xs hover:scale-[1.02]"
              title="Switch to TV World interactive retro room"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">TV World</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {data.projects === null ? (
        <p className="flex h-full items-center justify-center font-serif italic text-2xl text-[#4A121A]/70">
          Curating the gallery frames…
        </p>
      ) : projects.length === 0 ? (
        <p className="flex h-full items-center justify-center font-serif text-lg text-[#4A121A]/70">
          No projects match these filters.
        </p>
      ) : scrollMode === "horizontal" ? (
        /* ================= HORIZONTAL SCROLLABLE EDITORIAL GALLERY ================= */
        <div className="relative flex min-h-0 flex-1 items-center overflow-hidden bg-[#F7F2EB] dark:bg-[#18080C]">
          {/* Left / Right Quick Scroll Controls */}
          <button
            type="button"
            onClick={() => scrollHorizontalBy(-300)}
            aria-label="Scroll left"
            className="hidden sm:flex absolute left-4 z-20 h-9 w-9 items-center justify-center rounded-full bg-[#FAF7F2] dark:bg-[#2A1217] text-[#4A121A] dark:text-[#FAF7F2] border border-[#4A121A]/25 shadow-md hover:bg-[#4A121A] hover:text-[#FAF7F2] transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollHorizontalBy(300)}
            aria-label="Scroll right"
            className="hidden sm:flex absolute right-4 z-20 h-9 w-9 items-center justify-center rounded-full bg-[#FAF7F2] dark:bg-[#2A1217] text-[#4A121A] dark:text-[#FAF7F2] border border-[#4A121A]/25 shadow-md hover:bg-[#4A121A] hover:text-[#FAF7F2] transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div
            ref={horizontalScroller}
            onWheel={handleWheelHorizontal}
            className="flex h-full w-full items-center gap-6 overflow-x-auto overflow-y-hidden px-6 py-4 snap-x snap-mandatory sm:px-14 scroll-smooth"
          >
            {projects.map((project, idx) => {
              const cover = resolveApiAssetUrl(project.cover_image_url || project.image_url);
              const palette = CARD_PALETTES[idx % CARD_PALETTES.length];
              const sticker = idx % 2 === 0 ? GALLERY_STICKERS[Math.floor(idx / 2)] : undefined;
              const owner = project.owner_username || project.owner?.username || "developer";

              return (
                <article
                  key={project.id}
                  className={`group relative flex w-[min(260px,calc(100vw-3.5rem))] sm:w-[275px] shrink-0 snap-center flex-col justify-between rounded-2xl border-2 ${palette.bg} dark:bg-[#220D12] p-3.5 shadow-[0_6px_20px_rgba(74,18,26,0.08)] hover:shadow-[0_12px_28px_rgba(74,18,26,0.15)] transition-all duration-300 hover:-translate-y-1`}
                >
                  {/* Top Curved Washi Tag */}
                  <div
                    className={`absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-[0.16em] shadow-xs ${palette.tape}`}
                  >
                    #{String(idx + 1).padStart(2, "0")} · {project.category || "BUILD"}
                  </div>

                  {/* Corner Sticker */}
                  {sticker && (
                    <StickerBadge
                      name={sticker}
                      size="sm"
                      variant="circle"
                      className="absolute -top-2.5 -right-2 rotate-6 z-10 !w-8 !h-8"
                    />
                  )}

                  <div className="flex flex-col">
                    {/* Curved Image Container */}
                    <div className="aspect-square w-full min-h-0 overflow-hidden rounded-xl bg-white border border-[#4A121A]/15 p-2 flex items-center justify-center shadow-inner">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="h-full w-full object-cover rounded-lg group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-[#F7F2EB] px-3 text-center">
                          <FolderCode className="w-8 h-8 text-[#4A121A] mb-1.5" />
                          <span className="font-serif text-base font-semibold text-[#4A121A] line-clamp-2">
                            {project.title}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 px-0.5">
                      <h3 className="break-words font-serif text-lg sm:text-xl font-bold leading-tight text-[#4A121A] dark:text-[#FFF8CA]">
                        {project.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 font-serif italic text-xs text-[#4A121A]/75 dark:text-[#FAF7F2]/75 leading-relaxed">
                        {project.short_description || project.full_description || "Student build showcased on DevZ-Go."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 px-0.5 border-t border-[#4A121A]/15 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="break-all font-mono text-[11px] font-semibold text-[#4A121A]/90 dark:text-[#FAF7F2]/90 truncate">
                        @{owner}
                      </span>
                      <Link
                        to={`/project/${project.id}`}
                        className="px-3.5 py-1 rounded-full border border-[#4A121A] bg-[#4A121A] hover:bg-[#6B0B0C] text-[#FAF7F2] text-xs font-mono uppercase tracking-wider transition-all shadow-xs shrink-0"
                      >
                        Open &rarr;
                      </Link>
                    </div>
                    <ProjectSocialBar
                      projectId={String(project.id)}
                      title={project.title}
                      initialLikes={project.likes_count ?? project.likes ?? 0}
                      initialLiked={Boolean(project.is_liked)}
                      likesHidden={Boolean(project.likes_hidden)}
                      isOwner={project.is_owner === true}
                      commentsCount={project.comments_count ?? 0}
                      commentsEnabled={project.comments_enabled !== false}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= VERTICAL SCROLLABLE EDITORIAL GRID ================= */
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 bg-[#F7F2EB] dark:bg-[#18080C]">
          <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-12">
            {projects.map((project, idx) => {
              const cover = resolveApiAssetUrl(project.cover_image_url || project.image_url);
              const palette = CARD_PALETTES[idx % CARD_PALETTES.length];
              const sticker = idx % 3 === 0 ? GALLERY_STICKERS[Math.floor(idx / 3)] : undefined;
              const owner = project.owner_username || project.owner?.username || "developer";

              return (
                <li key={project.id} className="pt-2">
                  <article
                    className={`group relative flex h-full flex-col justify-between rounded-2xl border-2 ${palette.bg} dark:bg-[#220D12] p-3.5 shadow-[0_6px_20px_rgba(74,18,26,0.08)] hover:shadow-[0_12px_28px_rgba(74,18,26,0.15)] transition-all duration-300 hover:-translate-y-1`}
                  >
                    {/* Top Curved Number & Category Pill */}
                    <div
                      className={`absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-[0.16em] shadow-xs ${palette.tape}`}
                    >
                      #{String(idx + 1).padStart(2, "0")} · {project.category || "BUILD"}
                    </div>

                    {sticker && (
                      <StickerBadge
                        name={sticker}
                        size="sm"
                        variant="circle"
                        className="absolute -top-2.5 -right-2 rotate-6 z-10 !w-8 !h-8"
                      />
                    )}

                    <Link to={`/project/${project.id}`} className="block">
                      <div className="aspect-square w-full rounded-xl bg-white border border-[#4A121A]/15 p-2 overflow-hidden flex items-center justify-center shadow-inner">
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            className="h-full w-full object-cover rounded-lg group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-[#F7F2EB] px-3 text-center">
                            <FolderCode className="w-8 h-8 text-[#4A121A] mb-1.5" />
                            <span className="font-serif text-base font-semibold text-[#4A121A] line-clamp-2">
                              {project.title}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 px-0.5">
                        <h3 className="break-words font-serif text-lg font-bold text-[#4A121A] dark:text-[#FFF8CA] group-hover:text-[#6B0B0C] transition-colors">
                          {project.title}
                        </h3>
                        {project.short_description && (
                          <p className="mt-1 line-clamp-2 font-serif italic text-xs text-[#4A121A]/75 dark:text-[#FAF7F2]/75 leading-relaxed">
                            {project.short_description}
                          </p>
                        )}
                      </div>
                    </Link>

                    <div className="mt-2.5 pt-2 px-0.5 border-t border-[#4A121A]/15 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="break-all font-mono text-[11px] font-semibold text-[#4A121A]/90 dark:text-[#FAF7F2]/90 truncate">
                          @{owner}
                        </span>
                        <Link
                          to={`/project/${project.id}`}
                          className="px-3.5 py-1 rounded-full border border-[#4A121A] bg-[#4A121A] hover:bg-[#6B0B0C] text-[#FAF7F2] text-xs font-mono uppercase tracking-wider transition-all shadow-xs shrink-0"
                        >
                          Open &rarr;
                        </Link>
                      </div>
                      <ProjectSocialBar
                        projectId={String(project.id)}
                        title={project.title}
                        initialLikes={project.likes_count ?? project.likes ?? 0}
                        initialLiked={Boolean(project.is_liked)}
                        likesHidden={Boolean(project.likes_hidden)}
                        isOwner={project.is_owner === true}
                        commentsCount={project.comments_count ?? 0}
                        commentsEnabled={project.comments_enabled !== false}
                      />
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ExploreStage>
  );
}
