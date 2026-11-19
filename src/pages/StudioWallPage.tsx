import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FolderCode,
} from "lucide-react";
import { ExploreStage } from "../components/explore/ExploreStage";
import { ProjectSocialBar } from "../components/explore/ProjectSocialBar";
import { useExploreProjects } from "../hooks/useExploreProjects";
import { resolveApiAssetUrl } from "../api/config";
import { StickerBadge, type StickerName } from "../components/StickerBadge";

const CARD_PALETTES = [
  {
    bg: "bg-[#FCFBF4] border-[#5B233B]/30",
    tape: "bg-[#5B233B] text-[#FCFBF4]",
    chip: "bg-[#D5BEEA]/45 text-[#5B233B] border-[#5B233B]/25",
  },
  {
    bg: "bg-[#E9DCF6] border-[#5B233B]/30",
    tape: "bg-[#DA6844] text-[#FCFBF4]",
    chip: "bg-[#FCFBF4] text-[#5B233B] border-[#5B233B]/20",
  },
  {
    bg: "bg-[#E6EBC5] border-[#9EA654]",
    tape: "bg-[#9EA654] text-[#FCFBF4]",
    chip: "bg-[#FCFBF4] text-[#5B233B] border-[#9EA654]",
  },
  {
    bg: "bg-[#DCE7F7] border-[#5B233B]/25",
    tape: "bg-[#8D5E46] text-[#FCFBF4]",
    chip: "bg-[#FCFBF4] text-[#5B233B] border-[#5B233B]/20",
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
 * Combined Gallery & Directory experience:
 * Users can toggle between Horizontal Wall scrolling and Vertical Directory scrolling.
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
      if (e.key === "ArrowRight") el.scrollBy({ left: 360, behavior: "smooth" });
      if (e.key === "ArrowLeft") el.scrollBy({ left: -360, behavior: "smooth" });
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
      {/* Interactive Scroll Direction Switcher + Directory Banner (Warm Cream Cloud Card on Periwinkle Blue with Plum-Burgundy Text) */}
      <div className="shrink-0 px-4 pt-4 pb-2 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] bg-[#FCFBF4] border-2 border-[#5B233B]/25 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-[0_12px_30px_rgba(91,35,59,0.12)] relative text-[#5B233B]">
          <div className="flex items-center gap-3.5">
            <StickerBadge name="blueMiffy" size="sm" variant="circle" className="-rotate-6 shrink-0 !w-11 !h-11" />
            <div>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#DA6844]">
                PROJECTS STUDIO · {projects.length} BUILDS
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5B233B] leading-tight m-0">
                Explore Student Creations
              </h2>
            </div>
          </div>

          {/* Interactive Prompt asking whether to scroll Horizontally or Vertically */}
          <div className="flex flex-wrap items-center gap-2 bg-[#E9DCF6]/70 border-2 border-[#5B233B]/20 rounded-full px-3.5 py-1.5 shadow-xs">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#5B233B] pl-1">
              Scroll:
            </span>
            <button
              type="button"
              onClick={() => setScrollMode("horizontal")}
              aria-pressed={scrollMode === "horizontal"}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                scrollMode === "horizontal"
                  ? "bg-[#5B233B] text-[#FCFBF4] shadow-sm scale-[1.02]"
                  : "bg-transparent text-[#5B233B]/75 hover:bg-[#FCFBF4] hover:text-[#5B233B]"
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Horizontal
            </button>
            <button
              type="button"
              onClick={() => setScrollMode("vertical")}
              aria-pressed={scrollMode === "vertical"}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                scrollMode === "vertical"
                  ? "bg-[#5B233B] text-[#FCFBF4] shadow-sm scale-[1.02]"
                  : "bg-transparent text-[#5B233B]/75 hover:bg-[#FCFBF4] hover:text-[#5B233B]"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Vertical
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {data.projects === null ? (
        <p className="flex h-full items-center justify-center font-cursive text-3xl text-[#284E45]">
          Hanging the gallery frames…
        </p>
      ) : projects.length === 0 ? (
        <p className="flex h-full items-center justify-center font-serif text-lg text-[#3E2217]/70">
          No projects match these filters.
        </p>
      ) : scrollMode === "horizontal" ? (
        /* ================= HORIZONTAL SCROLLABLE GALLERY WALL ================= */
        <div className="relative flex min-h-0 flex-1 items-center overflow-hidden">
          {/* Left / Right Quick Scroll Controls */}
          <button
            type="button"
            onClick={() => scrollHorizontalBy(-380)}
            aria-label="Scroll left"
            className="hidden sm:flex absolute left-3 z-20 h-11 w-11 items-center justify-center rounded-full bg-[#284E45] text-[#FAF6EC] border-2 border-[#E2F0CB] shadow-lg hover:bg-[#3E2217] transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollHorizontalBy(380)}
            aria-label="Scroll right"
            className="hidden sm:flex absolute right-3 z-20 h-11 w-11 items-center justify-center rounded-full bg-[#284E45] text-[#FAF6EC] border-2 border-[#E2F0CB] shadow-lg hover:bg-[#3E2217] transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={horizontalScroller}
            onWheel={handleWheelHorizontal}
            className="flex h-full w-full items-stretch gap-7 overflow-x-auto overflow-y-hidden px-6 py-5 snap-x snap-mandatory sm:px-16 scroll-smooth"
          >
            {projects.map((project, idx) => {
              const cover = resolveApiAssetUrl(project.cover_image_url || project.image_url);
              const palette = CARD_PALETTES[idx % CARD_PALETTES.length];
              const sticker = idx % 2 === 0 ? GALLERY_STICKERS[Math.floor(idx / 2)] : undefined;
              const owner = project.owner_username || project.owner?.username || "developer";

              return (
                <article
                  key={project.id}
                  className={`group relative flex w-[min(310px,calc(100vw-3.5rem))] sm:w-[340px] shrink-0 snap-center flex-col justify-between rounded-[2rem] border-2 ${palette.bg} p-4 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl`}
                >
                  {/* Top Washi Tag */}
                  <div
                    className={`absolute -top-3 left-5 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-2xs ${palette.tape}`}
                  >
                    #{String(idx + 1).padStart(2, "0")} · {project.category || "BUILD"}
                  </div>

                  {/* Unique Corner Sticker (never repeated) */}
                  {sticker && (
                    <StickerBadge
                      name={sticker}
                      size="sm"
                      variant="circle"
                      className="absolute -top-3 -right-2 rotate-6 z-10 !w-10 !h-10"
                    />
                  )}

                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-white border border-[#3E2217]/15 p-2 flex items-center justify-center shadow-inner">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="h-full w-full object-contain rounded-xl group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#CBE4EE]/50 to-[#E2F0CB]/50 px-4 text-center">
                          <FolderCode className="w-9 h-9 text-[#284E45] mb-2" />
                          <span className="font-serif text-lg font-semibold text-[#284E45] line-clamp-2">
                            {project.title}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3.5 px-1">
                      <h3 className="break-words font-serif text-xl font-bold leading-tight text-[#6B0B0C]">
                        {project.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 font-sans text-xs text-[#3E2217]/80 leading-relaxed">
                        {project.short_description || project.full_description || "Student build showcased on DevZ-Go."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 px-1 border-t border-[#3E2217]/15 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="break-all font-mono text-[11px] font-semibold text-[#284E45] truncate">
                        @{owner}
                      </span>
                      <Link
                        to={`/project/${project.id}`}
                        className="px-3.5 py-1 rounded-full bg-[#284E45] hover:bg-[#3E2217] text-[#FAF6EC] text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
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
        /* ================= VERTICAL SCROLLABLE DIRECTORY GRID ================= */
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
          <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-12">
            {projects.map((project, idx) => {
              const cover = resolveApiAssetUrl(project.cover_image_url || project.image_url);
              const palette = CARD_PALETTES[idx % CARD_PALETTES.length];
              const sticker = idx % 3 === 0 ? GALLERY_STICKERS[Math.floor(idx / 3)] : undefined;
              const owner = project.owner_username || project.owner?.username || "developer";

              return (
                <li key={project.id} className="pt-2">
                  <article
                    className={`group relative flex h-full flex-col justify-between rounded-3xl border-2 ${palette.bg} p-4 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl`}
                  >
                    {/* Top Number & Category Pill */}
                    <div
                      className={`absolute -top-3 left-5 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-2xs ${palette.tape}`}
                    >
                      #{String(idx + 1).padStart(2, "0")} · {project.category || "BUILD"}
                    </div>

                    {sticker && (
                      <StickerBadge
                        name={sticker}
                        size="sm"
                        variant="circle"
                        className="absolute -top-3 -right-2 rotate-6 z-10 !w-10 !h-10"
                      />
                    )}

                    <Link to={`/project/${project.id}`} className="block">
                      <div className="aspect-[16/10] rounded-2xl bg-white border border-[#3E2217]/15 p-2 overflow-hidden flex items-center justify-center shadow-inner">
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            className="h-full w-full object-contain rounded-xl group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#CBE4EE]/50 to-[#E2F0CB]/50 px-4 text-center">
                            <FolderCode className="w-8 h-8 text-[#284E45] mb-1.5" />
                            <span className="font-serif text-base font-semibold text-[#284E45] line-clamp-2">
                              {project.title}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3.5 px-1">
                        <h3 className="break-words font-serif text-xl font-semibold text-[#6B0B0C] group-hover:text-[#284E45] transition-colors">
                          {project.title}
                        </h3>
                        {project.short_description && (
                          <p className="mt-1 line-clamp-2 font-sans text-xs text-[#3E2217]/75 leading-relaxed">
                            {project.short_description}
                          </p>
                        )}
                      </div>
                    </Link>

                    <div className="mt-3 pt-2.5 px-1 border-t border-[#3E2217]/15 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="break-all font-mono text-[11px] font-semibold text-[#284E45] truncate">
                          @{owner}
                        </span>
                        <Link
                          to={`/project/${project.id}`}
                          className="px-3.5 py-1 rounded-full bg-[#284E45] hover:bg-[#3E2217] text-[#FAF6EC] text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
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
