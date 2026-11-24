import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Film,
  Flame,
  FolderCode,
  Heart,
  LayoutGrid,
  MessageSquare,
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
 * Vertical Instagram Reels Action Rail: Like, Comment, and Share buttons.
 */
function ReelLikeButton({
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
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-110 active:scale-90 ${
          liked
            ? "border-[#FF4A65]/50 bg-[#FF4A65]/25 text-[#FF4A65] shadow-[0_0_20px_rgba(255,74,101,0.45)]"
            : "border-white/25 bg-black/40 text-white hover:border-white/50 hover:bg-black/60"
        }`}
        title={liked ? "Unlike build" : "Like build"}
        aria-label="Like build"
      >
        <Heart
          className={`w-5 h-5 transition-transform duration-200 ${
            liked ? "fill-current text-[#FF4A65] scale-110" : ""
          }`}
        />
      </button>
      <span className="font-sans text-[11px] font-bold text-white drop-shadow-md mt-1 select-none">
        {count}
      </span>
    </div>
  );
}

function ReelCommentButton({
  projectId,
  count,
}: {
  projectId: string;
  count: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <Link
        to={`/project/${projectId}#comments`}
        className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-all duration-200 cursor-pointer hover:border-white/50 hover:bg-black/60 hover:scale-110 active:scale-90"
        title="View discussion"
        aria-label="View comments"
      >
        <MessageSquare className="w-5 h-5" />
      </Link>
      <span className="font-sans text-[11px] font-bold text-white drop-shadow-md mt-1 select-none">
        {count}
      </span>
    </div>
  );
}

function ReelShareButton({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/project/${projectId}`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };
  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={handleShare}
        className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-all duration-200 cursor-pointer hover:border-white/50 hover:bg-black/60 hover:scale-110 active:scale-90"
        title={`Share ${title}`}
        aria-label="Share build"
      >
        <Share2 className="w-5 h-5" />
      </button>
      <span className="font-sans text-[11px] font-bold text-white drop-shadow-md mt-1 select-none">
        {copied ? "Copied!" : "Share"}
      </span>
    </div>
  );
}

/**
 * Cinematic Gallery & Directory Showcase (Globe Express luxury slider aesthetic):
 * Full-bleed atmospheric background, dramatic typography, floating cards carousel on the right,
 * bottom timeline & index indicator, and integrated right-side filter controls.
 */
export function StudioWallPage({
  initialMode = "horizontal",
}: {
  initialMode?: "horizontal" | "vertical" | "cinematic" | "grid";
} = {}) {
  const data = useExploreProjects();
  const [viewMode, setViewMode] = useState<"horizontal" | "vertical">(
    initialMode === "vertical" || initialMode === "grid" ? "vertical" : "horizontal"
  );
  const [currentReel, setCurrentReel] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const projects = data.projects ?? [];

  // Reset active reel when filter changes
  useEffect(() => {
    setCurrentReel(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [data.appliedKey]);

  useEffect(() => {
    noteGalleryDirection(viewMode);
  }, [viewMode]);

  const scrollToReel = (targetIdx: number) => {
    const el = containerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(projects.length - 1, targetIdx));
    const child = el.children[clamped] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentReel(clamped);
    }
  };

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const h = el.clientHeight || 1;
    const idx = Math.round(el.scrollTop / h);
    if (idx >= 0 && idx < projects.length && idx !== currentReel) {
      setCurrentReel(idx);
    }
  };

  // Keyboard navigation (ArrowDown / ArrowUp / PageDown / PageUp / j / k)
  useEffect(() => {
    if (viewMode !== "horizontal") return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") {
        e.preventDefault();
        scrollToReel(currentReel + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") {
        e.preventDefault();
        scrollToReel(currentReel - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewMode, currentReel, projects.length]);

  const onDarkGlass = viewMode === "horizontal";
  const glassControl = onDarkGlass
    ? "inline-flex h-9 items-center gap-1.5 rounded-full border border-white/25 bg-white/12 px-3.5 text-xs font-sans font-semibold text-[#FFF8CA] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md transition-all cursor-pointer hover:bg-white/18"
    : "inline-flex h-9 items-center gap-1.5 rounded-full border border-[#4A121A]/18 bg-[#FAF7F2]/55 px-3.5 text-xs font-sans font-semibold text-[#4A121A] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-md transition-all cursor-pointer hover:bg-[#FAF7F2]/75";
  const glassInput = onDarkGlass
    ? "explore-glass-search h-9 w-36 sm:w-52 rounded-full border border-[#FFF8CA]/22 bg-transparent text-xs font-sans text-[#FFF8CA] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-md focus:border-[#FFF8CA]/45 focus:outline-none transition-all"
    : "h-9 w-36 sm:w-52 rounded-full border border-[#4A121A]/18 bg-[#FAF7F2]/65 text-xs font-sans text-[#4A121A] placeholder:text-[#4A121A]/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-md focus:border-[#4A121A]/40 focus:outline-none transition-all";
  const glassMenu = onDarkGlass
    ? "absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-[#FFF8CA]/25 bg-[#1A0B0E] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.55)] space-y-3.5 text-left text-[#FFF8CA]"
    : "absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-[#4A121A]/20 bg-[#FAF7F2] p-4 shadow-[0_16px_40px_rgba(45,18,13,0.18)] space-y-3.5 text-left text-[#4A121A]";
  const glassSelect = onDarkGlass
    ? "w-full rounded-xl border border-[#FFF8CA]/25 bg-[#2A1217] px-3 py-2 text-xs font-sans text-[#FFF8CA] focus:outline-none"
    : "w-full rounded-xl border border-[#4A121A]/20 bg-white px-3 py-2 text-xs font-sans text-[#4A121A] focus:outline-none";
  const modeIdle = onDarkGlass ? "text-[#FFF8CA]/75 hover:text-[#FFF8CA]" : "text-[#4A121A]/70 hover:text-[#4A121A]";
  const modeShell = onDarkGlass
    ? "inline-flex h-9 items-center rounded-full border border-white/25 bg-white/10 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md"
    : "inline-flex h-9 items-center rounded-full border border-[#4A121A]/15 bg-[#FAF7F2]/55 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-md";

  return (
    <ExploreStage title="projects studio" tone="paper" data={data}>
      <div data-tour="explore-studio" className="relative flex min-h-0 flex-1 flex-col">
        {/* Floating liquid-glass toolbar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center px-3 pt-3 sm:px-5 sm:pt-4">
          <div
            className={`explore-glass-toolbar pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-[1.35rem] px-2.5 py-2 sm:gap-2.5 sm:px-3 ${
              onDarkGlass ? "" : "explore-glass-toolbar--light"
            }`}
            role="toolbar"
            aria-label="Explore controls"
          >
            <ExploreFilters
              filters={data.filters}
              onChange={data.setFilters}
              techStacks={data.techStacks}
              hasFilters={data.hasFilters}
              onClear={data.clearFilters}
              classes={{
                root: `flex flex-wrap items-center gap-2 ${onDarkGlass ? "text-[#FFF8CA]" : "text-[#4A121A]"}`,
                input: glassInput,
                button: glassControl,
                menu: glassMenu,
                select: glassSelect,
              }}
            />

            {/* Unified 3-Way Switch: Reels | Directory | TV World */}
            <div className={modeShell} role="tablist" aria-label="Explore view modes">
              <button
                type="button"
                role="tab"
                onClick={() => setViewMode("horizontal")}
                aria-selected={viewMode === "horizontal"}
                title="Scrollable Reels gallery view"
                className={`inline-flex h-full items-center gap-1.5 px-3.5 rounded-full text-xs font-sans font-semibold transition-all cursor-pointer ${
                  viewMode === "horizontal"
                    ? "bg-[#780D18]/90 text-[#FFF8CA] shadow-sm"
                    : modeIdle
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Reels</span>
              </button>
              <button
                type="button"
                role="tab"
                onClick={() => setViewMode("vertical")}
                aria-selected={viewMode === "vertical"}
                title="Vertical directory grid view"
                className={`inline-flex h-full items-center gap-1.5 px-3.5 rounded-full text-xs font-sans font-semibold transition-all cursor-pointer ${
                  viewMode === "vertical"
                    ? "bg-[#780D18]/90 text-[#FFF8CA] shadow-sm"
                    : modeIdle
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Directory</span>
                <span className="md:hidden">Grid</span>
              </button>
              <Link
                to="/explore/tv"
                role="tab"
                title="Switch to TV World interactive retro room"
                className={`inline-flex h-full items-center gap-1.5 px-3.5 rounded-full text-xs font-sans font-semibold transition-all cursor-pointer ${modeIdle}`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">TV World</span>
              </Link>
            </div>
          </div>
        </div>

      {/* Main Body */}
      {data.projects === null ? (
        <div className="flex h-full flex-1 items-center justify-center bg-[#FAF7F2] dark:bg-[#18080C] pt-16">
          <p className="font-serif italic text-2xl text-[#4A121A]/70 animate-pulse">
            Curating the gallery frames…
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-full flex-1 flex-col items-center justify-center bg-[#FAF7F2] dark:bg-[#18080C] p-6 pt-20 text-center">
          <p className="font-serif text-xl text-[#4A121A] dark:text-[#FAF7F2]">
            No projects match these filters.
          </p>
          <button
            type="button"
            onClick={data.clearFilters}
            className="mt-4 rounded-full border border-[#4A121A] bg-[#4A121A] px-5 py-2 font-sans text-xs font-semibold uppercase tracking-wider text-[#FAF7F2] hover:bg-[#6B0B0C] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "horizontal" ? (
        /* ================= INSTAGRAM REELS VERTICAL SCROLL GALLERY ================= */
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="reels-container relative flex-1 h-full w-full overflow-y-auto select-none bg-[#120507]"
          style={{ scrollSnapType: "y mandatory" }}
        >
          {projects.map((project, idx) => {
            const cover = resolveApiAssetUrl(project.cover_image_url || project.image_url);
            const team = teamFromProject(project);
            const owner = team.find((p) => p.is_owner) || team[0];
            return (
              <section
                key={project.id}
                className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden flex flex-col justify-between p-6 pt-20 sm:p-10 sm:pt-24 md:p-14 md:pt-24"
                style={{ height: "100%" }}
                data-reel-index={idx}
              >
                {/* Full-Bleed Media Background */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className="h-full w-full object-cover object-center"
                      loading={idx < 2 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#2D120D] via-[#4A121A] to-[#120507] flex items-center justify-center">
                      <FolderCode className="w-32 h-32 text-white/10" />
                    </div>
                  )}

                  {/* Cinematic Lighting & Gradients for Legibility */}
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#120507]/95 via-[#120507]/60 to-black/20 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#120507]/95 via-[#120507]/45 to-transparent pointer-events-none" />
                </div>

                {/* Center Spacer */}
                <div className="relative z-10 flex-1 min-h-0 pointer-events-none" />

                {/* Bottom Area: Left Story Details + Right Reel Action Bar */}
                <div className="relative z-10 flex items-end justify-between gap-6 pointer-events-none">
                  {/* Left: Project Details Overlay */}
                  <div className="max-w-xl md:max-w-2xl flex flex-col justify-end space-y-3 pb-2 sm:pb-4 pointer-events-auto">
                    {/* Category Pill Tag */}
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-[#FFF3B0] drop-shadow-sm">
                        — {project.category || "STUDENT SHOWCASE"}
                      </span>
                    </div>

                    {/* Project Title */}
                    <Link to={`/project/${project.id}`} className="group block">
                      <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#FAF7F2] drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] leading-tight break-words line-clamp-2 group-hover:text-[#FFF8CA] transition-colors">
                        {project.title}
                      </h2>
                    </Link>

                    {/* Project Blurb */}
                    <p className="line-clamp-2 sm:line-clamp-3 font-sans text-xs sm:text-sm md:text-base text-[#FAF7F2]/90 leading-relaxed drop-shadow-sm max-w-lg">
                      {project.short_description ||
                        project.full_description ||
                        "Student creation built with passion, curated and showcased on DevZ-Go."}
                    </p>

                    {/* Tech Stack Badges */}
                    {project.tech_stacks && project.tech_stacks.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {project.tech_stacks.slice(0, 5).map((tech) => (
                          <span
                            key={tech}
                            className="inline-block rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-2.5 py-0.5 font-sans text-[11px] font-medium text-[#FFF3B0] shadow-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Creator / Collaborators Team */}
                    {owner && (
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <ProjectTeamAvatars people={team} maxVisible={4} onDark size="md" />
                        <div className="min-w-0">
                          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FFF8CA]/65">
                            {team.length > 1 ? "Built by the team" : "Created by"}
                          </p>
                          <Link
                            to={owner.user_id ? `/profile/${owner.user_id}` : `/profile/${owner.username}`}
                            className="truncate font-sans text-sm font-semibold text-[#FFF8CA] hover:underline block"
                          >
                            @{owner.username}
                            {team.length > 1 ? (
                              <span className="ml-1.5 font-medium text-[#FFF8CA]/70">
                                · {team.length} people
                              </span>
                            ) : null}
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Discover Project Link */}
                    <div className="pt-2">
                      <Link
                        to={`/project/${project.id}`}
                        className="group inline-flex items-center gap-2.5 rounded-full border border-white/40 bg-white/15 hover:bg-[#FFF3B0] hover:border-[#FFF3B0] hover:text-[#4A121A] text-white px-5 sm:px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-md transition-all duration-300 shadow-xl hover:scale-105 active:scale-95"
                      >
                        <span>Discover Project</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>

                  {/* Right: Instagram Reels Floating Action Rail */}
                  <div className="flex flex-col items-center gap-3 sm:gap-4 pb-2 sm:pb-4 pointer-events-auto shrink-0">
                    {/* Reel Index Pill */}
                    <div className="rounded-full bg-black/45 border border-white/20 px-2.5 py-1 text-[11px] font-sans font-bold text-[#FFF3B0] backdrop-blur-md shadow-md select-none">
                      {idx + 1} / {projects.length}
                    </div>

                    {/* Reel Like Button */}
                    <ReelLikeButton
                      projectId={String(project.id)}
                      initialLikes={project.likes_count ?? project.likes ?? 0}
                      initialLiked={Boolean(project.is_liked)}
                    />

                    {/* Reel Comment Button */}
                    <ReelCommentButton
                      projectId={String(project.id)}
                      count={project.comments_count ?? 0}
                    />

                    {/* Reel Share Button */}
                    <ReelShareButton
                      projectId={String(project.id)}
                      title={project.title}
                    />

                    {/* Up / Down Navigation Controls */}
                    <div className="flex flex-col items-center gap-1.5 pt-1.5 border-t border-white/15">
                      <button
                        type="button"
                        onClick={() => scrollToReel(idx - 1)}
                        disabled={idx === 0}
                        title="Previous reel"
                        aria-label="Previous reel"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToReel(idx + 1)}
                        disabled={idx === projects.length - 1}
                        title="Next reel"
                        aria-label="Next reel"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* ================= VERTICAL DIRECTORY GRID (Preserved Mode) ================= */
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-20 sm:px-8 sm:pt-24 bg-[#F7F2EB] dark:bg-[#18080C]">
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
                        {(() => {
                          const team = teamFromProject(project);
                          const owner = team.find((p) => p.is_owner) || team[0];
                          return (
                            <div className="flex min-w-0 items-center gap-2">
                              <ProjectTeamAvatars people={team} maxVisible={4} />
                              {owner && (
                                <span className="truncate font-sans text-[11px] font-semibold text-[#4A121A]/75 dark:text-[#FAF7F2]/75">
                                  @{owner.username}
                                  {team.length > 1 ? ` +${team.length - 1}` : ""}
                                </span>
                              )}
                            </div>
                          );
                        })()}
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
      </div>
    </ExploreStage>
  );
}
