import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, FolderCode } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ExploreLink } from "../components/tvworld/ExploreLink";
import { fetchProjects, resolveApiAssetUrl } from "../api";
import { ImageWithFallback } from "../components/ImageWithFallback";
import type { ApiProject } from "../types/project";
import dreamBigApples from "../assets/editorial/dream_big_apples.jpg";
import bestSellersBoxes from "../assets/editorial/best_sellers_boxes.jpg";
import pixelCatBackground from "../assets/pixelcat-ezgif.com-gif-to-mp4-converter.mp4";

// Decorative corner gingham / washi tape accent for the media card
function CornerTape() {
  return (
    <div
      className="absolute -top-3 -right-3 w-32 h-10 z-20 shadow-md rotate-[28deg] pointer-events-none opacity-90"
      style={{
        backgroundColor: "#5a6b5c",
        backgroundImage: `
          repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.35) 0, rgba(255, 255, 255, 0.35) 6px, transparent 0, transparent 12px),
          repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.25) 0, rgba(0, 0, 0, 0.25) 6px, transparent 0, transparent 12px)
        `,
      }}
    />
  );
}

export function LandingPage() {
  const [useVideoBg, setUseVideoBg] = useState(true);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchProjects()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setProjects(data.slice(0, 3));
        }
      })
      .catch(() => {
        if (isMounted) setProjects([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f5ed] text-stone-800 selection:bg-amber-200 lg:h-dvh lg:overflow-y-auto lg:snap-y lg:snap-mandatory">
      {/* ── Top Editorial Navigation ── */}
      <Navbar variant="editorial" />

      {/* ── SECTION 1: HERO (Pasture Landscape, "Where coders code. Like, Really.", "EXPLORE", & Badges) ── */}
      <section className="relative w-full h-dvh snap-start flex items-center justify-center overflow-hidden bg-[#2a211c]">
        {/* Pastoral Hero Background Image / Video Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {useVideoBg ? (
            <video
              src={pixelCatBackground}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <img
              src={dreamBigApples}
              alt="dream BIG apple artwork"
              className="w-full h-full object-cover object-[center_40%]"
            />
          )}

          {/* Gentle vignette overlay for crisp typography */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45 pointer-events-none" />
        </div>

        {/* Center Content: Headline & "EXPLORE" Pill Button */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-serif text-5xl sm:text-7xl md:text-8xl font-normal text-[#f5eedc] drop-shadow-[0_2px_15px_rgba(0,0,0,0.7)] tracking-tight leading-[1.08]"
          >
            dream <span className="italic font-medium">BIG</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <ExploreLink
              className="inline-block px-8 py-3 rounded-full bg-[#fced96] hover:bg-[#fae77c] text-stone-900 font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              EXPLORE PROJECTS
            </ExploreLink>
            <Link
              to="/add-project"
              className="inline-block px-8 py-3 rounded-full bg-white/90 hover:bg-white text-stone-900 font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all duration-200 shadow-sm"
            >
              Add project
            </Link>

            {/* Optional subtle background switcher button */}
            <button
              type="button"
              onClick={() => setUseVideoBg((v) => !v)}
              className="px-3 py-2 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-xs text-[10px] font-sans uppercase tracking-wider text-stone-800 transition-colors shadow-xs"
              title="Switch the home background"
            >
              {useVideoBg ? "Photo" : "Pixelcat"}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: OVERLAPPING SHEET & FEATURED PROJECTS CARDS ── */}
      <section className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-[#f8f6f0] px-6 md:px-14 py-10 border-t border-stone-200/50 shadow-2xl lg:mt-0 lg:rounded-none lg:min-h-dvh lg:snap-start lg:flex lg:items-center lg:py-8">
        <div className="max-w-[1360px] mx-auto">
          {/* Section Header */}
          <div className="mb-8 lg:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight">
                Featured Projects
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-sans mt-1 tracking-wide">
                Fresh student projects, open-source tools, and developer creations.
              </p>
            </div>
            <Link
              to="/explore"
              className="text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-stone-900 underline underline-offset-4"
            >
              View all projects &rarr;
            </Link>
          </div>

          {/* Cards Grid: 1 Special Promo Card + 3 Dynamic Project Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* 1. Feature / Promo Card (Brown package style with "TOP PROJECTS" & "EXPLORE ALL") */}
            <div className="group relative rounded-2xl bg-[#eee8db] border border-[#dfd6c5] p-6 flex flex-col justify-between overflow-hidden min-h-[280px] lg:min-h-0 lg:h-full shadow-sm hover:shadow-md transition-shadow">
              {/* Top Tag */}
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded bg-[#a79479] text-white shadow-xs">
                  TOP PROJECTS
                </span>
              </div>

              {/* Packaged Boxes / Community Kit Artwork */}
              <div className="my-auto flex items-center justify-center py-4">
                <img
                  src={bestSellersBoxes}
                  alt="Curated student projects and community kits"
                  className="w-36 h-36 lg:w-32 lg:h-32 object-cover rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Bottom "EXPLORE ALL" Pill Button */}
              <div className="z-10">
                <Link
                  to="/explore"
                  className="w-full block text-center py-2.5 px-4 rounded-full bg-[#fced96] hover:bg-[#fae77c] text-stone-900 font-sans text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                >
                  EXPLORE ALL
                </Link>
              </div>
            </div>

            {/* 2, 3, 4. The 3 Featured Developer Project Cards */}
            {projects.slice(0, 3).map((project, idx) => {
              const projectId = String(project.id);
              const linked = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
              const coverUrl = resolveApiAssetUrl(project.cover_image_url || project.image_url);
              const stackLabel =
                project.tech_stacks && project.tech_stacks.length > 0
                  ? project.tech_stacks.slice(0, 2).join(" · ")
                  : project.category || "Open Source";

              return (
                <Link
                  key={project.id ?? idx}
                  to={linked ? `/project/${projectId}` : "/explore"}
                  className="group flex flex-col text-left focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-2xl"
                >
                  {/* Project Image Square (matching the editorial pedestal aspect) */}
                  <div className="aspect-[4/3] lg:aspect-[5/4] lg:max-h-[34vh] rounded-2xl bg-[#dbe6df] border border-[#cbdbd0] overflow-hidden flex items-center justify-center relative shadow-xs transition-transform duration-300 group-hover:-translate-y-1">
                    {coverUrl ? (
                      <ImageWithFallback
                        src={coverUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#dbe6df] to-[#cbdbd0] text-stone-700">
                        <FolderCode className="w-10 h-10 text-stone-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-serif text-sm font-semibold text-center text-stone-800 line-clamp-2">
                          {project.title}
                        </span>
                      </div>
                    )}

                    {/* Subtle top category tag */}
                    {project.category && (
                      <span className="absolute top-3 left-3 text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/85 backdrop-blur-xs text-stone-700 shadow-xs">
                        {project.category}
                      </span>
                    )}
                  </div>

                  {/* Project Title and Metadata */}
                  <div className="mt-3.5">
                    <h3 className="font-serif text-lg text-stone-900 font-normal group-hover:text-amber-800 transition-colors truncate">
                      {project.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-stone-500 font-sans mt-0.5">
                      <span className="truncate max-w-[150px]">{stackLabel}</span>
                      <span className="flex items-center gap-1 text-stone-400 ml-2 shrink-0">
                        <Heart className="w-3 h-3 text-red-400 fill-red-400/40" />
                        <span>{project.likes ?? 0}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f6f0] px-6 md:px-14 py-12 lg:min-h-dvh lg:snap-start lg:flex lg:items-center lg:py-10">
        <div className="max-w-[1360px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Column: Soft Pastel Blue Story Card */}
            <div className="rounded-3xl bg-[#cde1f2] p-8 sm:p-12 md:p-14 flex flex-col justify-center text-center shadow-xs">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-600 mb-6 block">
                DREAM BIG · BUILD BOLD
              </span>
              <p className="font-serif text-xl sm:text-2xl md:text-[1.7rem] text-stone-800 leading-relaxed font-normal max-w-lg mx-auto">
                Our community is about turning ideas into reality. It's thinking
                long-term about what inspires developers, creators, and students.
                And it's crafting the tools and experiences that make a real
                difference—celebrating creativity and the craft of dreaming big.
              </p>
            </div>

            {/* Right Column: Photo Box with Corner Gingham Tape */}
            <div className="relative rounded-3xl bg-stone-200/60 border border-stone-300/40 overflow-hidden min-h-[280px] lg:min-h-[46vh] lg:max-h-[62vh] flex items-center justify-center shadow-xs group">
              {/* Decorative Corner Washi/Gingham Tape */}
              <CornerTape />

              {/* Dream Big Apples Artwork */}
              <img
                src={dreamBigApples}
                alt="dream BIG apple artwork"
                className="w-full h-full object-cover min-h-[280px] lg:min-h-0 lg:max-h-[62vh] group-hover:scale-105 transition-transform duration-500"
              />
            </div>
        </div>
      </section>
    </div>
  );
}
