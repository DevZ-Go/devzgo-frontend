import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  FolderCode,
  Heart,
  LayoutGrid,
  Share2,
  Trophy,
  Tv,
} from "lucide-react";
import { ExploreStage } from "../components/explore/ExploreStage";
import { ExploreFilters } from "../components/ExploreFilters";
import { ProjectSocialBar } from "../components/explore/ProjectSocialBar";
import { ProjectTeamAvatars, teamFromProject } from "../components/ProjectTeamAvatars";
import { useExploreProjects } from "../hooks/useExploreProjects";
import { useProjectLike } from "../hooks/useProjectLike";
import { resolveApiAssetUrl } from "../api/config";
import { noteGalleryDirection } from "../usage";

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

/**
 * Dedicated Like button with tactile spring feedback for the hero banner.
 */
function HeroLikeButton({
  projectId,
  initialLikes,
  initialLiked,
}: {
  projectId: string;
  initialLikes: number;
  initialLiked: boolean;
}) {
  const { count, liked, toggle } = useProjectLike(projectId, initialLikes, initialLiked);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={`group inline-flex h-11 items-center gap-2 rounded-full border px-4 transition-all duration-300 backdrop-blur-md cursor-pointer ${
        liked
          ? "border-[#FFF3B0] bg-[#FFF3B0] text-[#4A121A] shadow-[0_0_18px_rgba(255,243,176,0.45)] scale-[1.02]"
          : "border-white/35 bg-black/25 text-white hover:border-[#FFF3B0] hover:bg-white/20 hover:text-[#FFF3B0]"
      }`}
      title={liked ? "Unlike build" : "Like build"}
      aria-label="Like build"
    >
      <Heart
        className={`w-4 h-4 transition-transform duration-200 group-hover:scale-125 ${
          liked ? "fill-current text-[#4A121A]" : ""
        }`}
      />
      <span className="font-sans text-xs font-semibold">{count}</span>
    </button>
  );
}

/**
 * Cinematic Gallery & Directory Showcase (Globe Express luxury slider aesthetic):
 * Full-bleed atmospheric background, dramatic typography, floating cards carousel on the right,
 * bottom timeline & index indicator, and integrated right-side filter controls.
 */
export function StudioWallPage({
  initialMode = "cinematic",
}: {
  initialMode?: "cinematic" | "grid" | "horizontal" | "vertical";
} = {}) {
  const data = useExploreProjects();
  const [viewMode, setViewMode] = useState<"cinematic" | "grid">(
    initialMode === "vertical" || initialMode === "grid" ? "grid" : "cinematic"
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselTrackRef = useRef<HTMLDivElement>(null);
  const projects = data.projects ?? [];

  // Reset active index when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [data.appliedKey]);

  useEffect(() => {
    noteGalleryDirection(viewMode === "cinematic" ? "horizontal" : "vertical");
  }, [viewMode]);

  // Keep active index in bounds
  const clampedIndex = useMemo(() => {
    if (projects.length === 0) return 0;
    return Math.min(Math.max(activeIndex, 0), projects.length - 1);
  }, [activeIndex, projects.length]);

  const activeProject = projects[clampedIndex] ?? null;

  const goNext = () => {
    if (projects.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % projects.length);
  };

  const goPrev = () => {
    if (projects.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + projects.length) % projects.length);
  };

  // Keyboard navigation (Left / Right arrow keys)
  useEffect(() => {
    if (viewMode !== "cinematic") return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewMode, projects.length]);

  // Swipe & Gestures support (Touch, Mouse/Pointer Drag, and Trackpad)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const lastWheelTime = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    // Horizontal swipe threshold 45px, prioritizing horizontal gesture over vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on empty stage areas; ignore clicks on buttons, links, or inputs
    const target = e.target as HTMLElement | null;
    if (target?.closest("button") || target?.closest("a") || target?.closest("input")) return;
    pointerStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const diffX = pointerStartX.current - e.clientX;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    pointerStartX.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode !== "cinematic") return;
    const now = Date.now();
    if (now - lastWheelTime.current < 380) return; // Debounce trackpad horizontal swipes
    if (Math.abs(e.deltaX) > 30 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      lastWheelTime.current = now;
      if (e.deltaX > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  // Calculate upcoming carousel cards to display on the right
  const upcomingCards = useMemo(() => {
    if (projects.length <= 1) return [];
    const count = Math.min(projects.length - 1, 5);
    const list = [];
    for (let i = 1; i <= count; i++) {
      const targetIdx = (clampedIndex + i) % projects.length;
      list.push({
        project: projects[targetIdx],
        originalIndex: targetIdx,
      });
    }
    return list;
  }, [projects, clampedIndex]);

  const activeCover = activeProject
    ? resolveApiAssetUrl(activeProject.cover_image_url || activeProject.image_url)
    : "";

  return (
    <ExploreStage title="projects studio" tone="paper" data={data}>
      {/* Top Header & Integrated Right-Side Action Controls */}
      <header className="shrink-0 border-b border-[#4A121A]/15 bg-[#FAF7F2] dark:bg-[#1A0B0E] px-4 py-2.5 sm:px-8 z-30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Left: Title & Count */}
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#4A121A] dark:text-[#FFF8CA] m-0">
              projects studio
            </h1>
            <span className="hidden sm:inline-block h-4 w-px bg-[#4A121A]/20 dark:bg-white/20" />
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4A121A]/70 dark:text-[#FAF7F2]/70">
              EXPLORE STUDENT CREATIONS · {projects.length} {projects.length === 1 ? "BUILD" : "BUILDS"}
            </span>
          </div>

          {/* Right: Search, Filters, View Mode & TV World Switcher */}
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
                input:
                  "h-9 w-36 sm:w-52 rounded-full border border-[#4A121A]/25 bg-white dark:bg-[#2A1217] px-3.5 text-xs font-sans text-[#4A121A] dark:text-[#FAF7F2] placeholder-[#4A121A]/40 focus:border-[#4A121A] focus:outline-none transition-all shadow-xs",
                button:
                  "inline-flex h-9 items-center gap-1.5 rounded-full border border-[#4A121A]/25 bg-[#FAF7F2] dark:bg-[#2A1217] hover:bg-[#F2ECE1] px-3.5 text-xs font-sans font-medium uppercase tracking-wider text-[#4A121A] dark:text-[#FAF7F2] transition-all shadow-xs cursor-pointer",
                menu: "absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-[#4A121A]/20 bg-[#FAF7F2] dark:bg-[#2A1217] p-4 shadow-xl space-y-3.5 text-left text-[#4A121A] dark:text-[#FAF7F2]",
                select:
                  "w-full rounded-xl border border-[#4A121A]/25 bg-white dark:bg-[#1A0B0E] px-3 py-2 text-xs font-sans text-[#4A121A] dark:text-[#FAF7F2] focus:outline-none",
              }}
            />

            {/* Mode Switcher [Cinematic Gallery / Directory Grid] */}
            <div className="inline-flex h-9 items-center rounded-full border border-[#4A121A]/25 bg-[#FAF7F2] dark:bg-[#2A1217] p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("cinematic")}
                aria-pressed={viewMode === "cinematic"}
                title="Cinematic luxury gallery slider view"
                className={`inline-flex h-full items-center px-3.5 rounded-full text-xs font-sans font-medium uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === "cinematic"
                    ? "bg-[#4A121A] text-[#FAF7F2] shadow-xs"
                    : "text-[#4A121A]/70 dark:text-[#FAF7F2]/70 hover:text-[#4A121A]"
                }`}
              >
                <span className="hidden md:inline">Cinematic</span>
                <span className="md:hidden">Gallery</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                title="Directory grid view"
                className={`inline-flex h-full items-center gap-1.5 px-3.5 rounded-full text-xs font-sans font-medium uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#4A121A] text-[#FAF7F2] shadow-xs"
                    : "text-[#4A121A]/70 dark:text-[#FAF7F2]/70 hover:text-[#4A121A]"
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span className="hidden md:inline">Directory</span>
                <span className="md:hidden">Grid</span>
              </button>
            </div>

            {/* Switch to TV World */}
            <Link
              to="/explore/tv"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#4A121A] bg-[#4A121A] hover:bg-[#6B0B0C] px-3.5 text-xs font-sans font-medium uppercase tracking-wider text-[#FAF7F2] transition-all shadow-xs hover:scale-[1.02]"
              title="Switch to TV World interactive retro room"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">TV World</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      {data.projects === null ? (
        <div className="flex h-full flex-1 items-center justify-center bg-[#FAF7F2] dark:bg-[#18080C]">
          <p className="font-serif italic text-2xl text-[#4A121A]/70 animate-pulse">
            Curating the gallery frames…
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-full flex-1 flex-col items-center justify-center bg-[#FAF7F2] dark:bg-[#18080C] p-6 text-center">
          <p className="font-serif text-xl text-[#4A121A] dark:text-[#FAF7F2]">
            No projects match these filters.
          </p>
          <button
            type="button"
            onClick={data.clearFilters}
            className="mt-4 rounded-full border border-[#4A121A] bg-[#4A121A] px-5 py-2 font-mono text-xs uppercase tracking-wider text-[#FAF7F2] hover:bg-[#6B0B0C] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "cinematic" && activeProject ? (
        /* ================= CINEMATIC LUXURY GALLERY SLIDER (Globe Express Visuals) ================= */
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className="relative flex min-h-0 flex-1 w-full overflow-hidden bg-[#120507] select-none touch-pan-y cursor-grab active:cursor-grabbing"
        >
          {/* Full-Bleed Animated Background with Smooth Crossfade */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProject.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1.0] }}
                className="absolute inset-0 h-full w-full"
              >
                {activeCover ? (
                  <img
                    src={activeCover}
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#2D120D] via-[#4A121A] to-[#120507] flex items-center justify-center">
                    <FolderCode className="w-36 h-36 text-white/10" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Ambient Lighting & High-Contrast Overlays */}
            {/* Left Vignette for Typography Legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#120507]/95 via-[#120507]/65 to-black/30 pointer-events-none" />
            {/* Bottom Vignette for Timeline & Index Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#120507]/90 via-transparent to-black/35 pointer-events-none" />
          </div>

          {/* Foreground Layout: Left Hero Text + Right Floating Cards Carousel */}
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-6 sm:p-10 md:p-14">
            {/* Center Area: Left Hero Content + Right Carousel */}
            <div className="flex flex-1 items-center justify-between gap-8 min-h-0">
              {/* Left Side: Dramatic Hero Text Overlay */}
              <div className="max-w-xl md:max-w-2xl flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeProject.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="space-y-3.5"
                  >
                    {/* Category Dash Tag (Reference: — Switzerland Alps) */}
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-[#FFF3B0] drop-shadow-sm">
                        — {activeProject.category || "STUDENT SHOWCASE"}
                      </span>
                    </div>

                    {/* Massive Bold Headline (Reference: Condensed Impactful Font) */}
                    <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight text-[#FAF7F2] drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] leading-[0.94] break-words line-clamp-3">
                      {activeProject.title}
                    </h2>

                    {/* Project Blurb / Short Description */}
                    <p className="line-clamp-3 font-sans text-xs sm:text-sm md:text-base text-[#FAF7F2]/85 leading-relaxed drop-shadow-sm max-w-lg">
                      {activeProject.short_description ||
                        activeProject.full_description ||
                        "Student creation built with passion, curated and showcased on DevZ-Go."}
                    </p>

                    {/* Tech Stack Badges */}
                    {activeProject.tech_stacks && activeProject.tech_stacks.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {activeProject.tech_stacks.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="inline-block rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-2.5 py-0.5 font-sans text-[11px] font-medium text-[#FFF3B0] shadow-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons: Like + Discover Project + Team */}
                    <div className="flex flex-wrap items-center gap-3.5 pt-3">
                      {/* Tactile Like Button */}
                      <HeroLikeButton
                        projectId={String(activeProject.id)}
                        initialLikes={activeProject.likes_count ?? activeProject.likes ?? 0}
                        initialLiked={Boolean(activeProject.is_liked)}
                      />

                      {/* Main Pill Button: DISCOVER PROJECT */}
                      <Link
                        to={`/project/${activeProject.id}`}
                        className="group inline-flex items-center gap-2.5 rounded-full border border-white/40 bg-white/10 hover:bg-[#FFF3B0] hover:border-[#FFF3B0] hover:text-[#4A121A] text-white px-6 sm:px-7 py-2.5 sm:py-3 font-sans text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-md transition-all duration-300 shadow-xl hover:scale-105 active:scale-95"
                      >
                        <span>Discover Project</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>

                      {/* Creator / Team Avatars */}
                      <div className="hidden sm:flex items-center pl-2">
                        <ProjectTeamAvatars people={teamFromProject(activeProject)} maxVisible={4} />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Side: Floating Vertical Cards Carousel */}
              {upcomingCards.length > 0 && (
                <div
                  ref={carouselTrackRef}
                  className="hidden md:flex items-center gap-4 lg:gap-5 overflow-visible pl-4"
                >
                  {upcomingCards.map(({ project: cardProj, originalIndex }, cIdx) => {
                    const cardCover = resolveApiAssetUrl(
                      cardProj.cover_image_url || cardProj.image_url
                    );
                    return (
                      <motion.div
                        key={cardProj.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: cIdx * 0.08 }}
                        onClick={() => setActiveIndex(originalIndex)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setActiveIndex(originalIndex);
                          }
                        }}
                        className="group relative w-[170px] lg:w-[200px] xl:w-[220px] aspect-[2/3] shrink-0 rounded-2xl lg:rounded-3xl overflow-hidden border-2 border-white/25 bg-black/40 shadow-[0_16px_40px_rgba(0,0,0,0.6)] cursor-pointer hover:border-white/60 hover:scale-105 hover:-translate-y-2 transition-all duration-300"
                        title={`Switch to ${cardProj.title}`}
                      >
                        {/* Background Thumbnail Image */}
                        {cardCover ? (
                          <img
                            src={cardCover}
                            alt=""
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#4A121A] to-[#120507] p-4 text-center">
                            <FolderCode className="w-10 h-10 text-white/30 mb-2" />
                            <span className="font-serif text-sm font-semibold text-white/90 line-clamp-2">
                              {cardProj.title}
                            </span>
                          </div>
                        )}

                        {/* Bottom Gradient Overlay & Title */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end text-left">
                          <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-[#FFF3B0] line-clamp-1 drop-shadow-sm">
                            — {cardProj.category || "PROJECT"}
                          </span>
                          <h4 className="font-serif text-sm lg:text-base font-bold uppercase tracking-tight text-white line-clamp-2 leading-tight mt-0.5 drop-shadow-md">
                            {cardProj.title}
                          </h4>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Controls Bar: < > Navigation + Timeline Line + Big Index Indicator */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10 z-20">
              {/* Left / Prev & Next Circular Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={projects.length <= 1}
                  aria-label="Previous project"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-md hover:border-white hover:bg-white/20 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={projects.length <= 1}
                  aria-label="Next project"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-md hover:border-white hover:bg-white/20 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="hidden sm:inline-flex items-center gap-1 font-sans text-[10px] text-white/50 uppercase tracking-widest pl-1.5 select-none">
                  Swipe or arrows
                </span>
              </div>

              {/* Center: Glowing Progress Timeline Line */}
              <div className="flex-1 max-w-xs sm:max-w-md md:max-w-lg mx-6 sm:mx-10">
                <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden relative">
                  <div
                    className="h-full bg-[#FFF3B0] rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,243,176,0.6)]"
                    style={{
                      width: `${((clampedIndex + 1) / projects.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Right: Big Bold Slide Number Index (Reference: 01, 02...) */}
              <div className="flex items-baseline gap-1 text-white select-none">
                <span className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white/95 drop-shadow-md">
                  {String(clampedIndex + 1).padStart(2, "0")}
                </span>
                <span className="font-sans text-xs sm:text-sm text-white/50 tracking-wider">
                  / {String(projects.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= VERTICAL DIRECTORY GRID (Preserved Mode) ================= */
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 bg-[#F7F2EB] dark:bg-[#18080C]">
          <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-12">
            {projects.map((project, idx) => {
              const cover = resolveApiAssetUrl(project.cover_image_url || project.image_url);
              const palette = CARD_PALETTES[idx % CARD_PALETTES.length];
              return (
                <li key={project.id} className="pt-2">
                  <article
                    className={`group relative flex h-full flex-col justify-between rounded-2xl border-2 ${palette.bg} dark:bg-[#220D12] p-3.5 shadow-[0_6px_20px_rgba(74,18,26,0.08)] hover:shadow-[0_12px_28px_rgba(74,18,26,0.15)] transition-all duration-300 hover:-translate-y-1`}
                  >
                    {/* Top Metric Icons (Top 1, Most Viewed, Most Shared - pure icons with no written text) */}
                    <div className="absolute -top-3 left-3.5 flex items-center gap-1.5 z-10">
                      {idx === 0 ? (
                        <div
                          title="Top 1 Build"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF3B0] text-[#4A121A] border border-[#4A121A]/20 shadow-xs"
                        >
                          <Trophy className="w-3.5 h-3.5 fill-[#4A121A]" />
                        </div>
                      ) : idx === 1 ? (
                        <div
                          title="Most Viewed"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF7F2] dark:bg-[#2A1217] text-[#4A121A] dark:text-[#FFF8CA] border border-[#4A121A]/20 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      ) : idx === 2 ? (
                        <div
                          title="Most Shared"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF7F2] dark:bg-[#2A1217] text-[#4A121A] dark:text-[#FFF8CA] border border-[#4A121A]/20 shadow-xs"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div
                          title="Trending Build"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF7F2] dark:bg-[#2A1217] text-[#780D18] dark:text-[#FFF8CA] border border-[#4A121A]/20 shadow-xs"
                        >
                          <Flame className="w-3.5 h-3.5 text-[#780D18]" />
                        </div>
                      )}
                    </div>

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
                          <p className="mt-1 line-clamp-2 font-sans text-xs text-[#4A121A]/75 dark:text-[#FAF7F2]/75 leading-relaxed">
                            {project.short_description}
                          </p>
                        )}
                      </div>
                    </Link>

                    <div className="mt-2.5 pt-2 px-0.5 border-t border-[#4A121A]/15 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <ProjectTeamAvatars people={teamFromProject(project)} maxVisible={4} />
                        <Link
                          to={`/project/${project.id}`}
                          className="px-3.5 py-1 rounded-full border border-[#4A121A] bg-[#4A121A] hover:bg-[#6B0B0C] text-[#FAF7F2] text-xs font-sans font-semibold uppercase tracking-wider transition-all shadow-xs shrink-0"
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
                        coverUrl={cover}
                        blurb={project.short_description}
                        techStacks={project.tech_stacks}
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
