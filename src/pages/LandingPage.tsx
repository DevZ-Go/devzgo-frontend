import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, FolderCode } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ExploreLink } from "../components/tvworld/ExploreLink";
import { fetchProjects, resolveApiAssetUrl } from "../api";
import { ImageWithFallback } from "../components/ImageWithFallback";
import type { ApiProject } from "../types/project";
import lockInImage from "../assets/lock_in.jpg";
import bestSellersBoxes from "../assets/editorial/best_sellers_boxes.jpg";
import pixelCatBackground from "../assets/pixelcat-ezgif.com-gif-to-mp4-converter.mp4";

export function LandingPage() {
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
    <div className="min-h-screen bg-[#FFF8CA] text-[#2D120D] selection:bg-[#CDE3E8] overflow-x-hidden">
      {/* ── Top Editorial Navigation ── */}
      <Navbar variant="editorial" />

      {/* ── SECTION 1: HERO ── */}
      <section className="relative w-full h-dvh flex items-center justify-center overflow-hidden bg-[#2D120D]">
        {/* Pastoral Hero Video Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            src={pixelCatBackground}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center"
          />

          {/* Gentle vignette overlay for crisp typography */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/50 pointer-events-none" />
        </div>

        {/* Center Content: Headline & "EXPLORE" Pill Button */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="font-cursive text-2xl sm:text-3xl text-[#fced96] drop-shadow-md mb-2"
          >
            Where coders code. Like, really.
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-serif text-5xl sm:text-7xl md:text-8xl font-normal text-[#f5eedc] drop-shadow-[0_2px_15px_rgba(0,0,0,0.7)] tracking-tight leading-[1.08]"
          >
            dream <span className="font-cursive italic font-bold text-[#fced96]">BIG</span>
          </motion.h1>

          <motion.div
            data-tour="home-cta"
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
          </motion.div>
        </div>

        {/* ── WAVE 1: Dollop-Style Curved Text Wave Ribbon into Rosewood Section ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none leading-none">
          <svg
            viewBox="0 0 1440 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-[70px] sm:h-[95px] md:h-[120px] block"
            preserveAspectRatio="none"
          >
            {/* Lemon Chiffon Wave Band Behind Text */}
            <path
              d="M0,45 C240,95 480,5 720,45 C960,85 1200,10 1440,45 L1440,130 L0,130 Z"
              fill="#FFF8CA"
            />
            {/* Rosewood Wave Fill Below */}
            <path
              d="M0,82 C240,132 480,42 720,82 C960,122 1200,47 1440,82 L1440,130 L0,130 Z"
              fill="#6B0B0C"
            />
            {/* Curved Path for Wave Text */}
            <path
              id="top-wave-text-path"
              d="M-60,67 C220,117 470,27 720,67 C970,107 1210,32 1500,67"
              fill="none"
            />
            <text
              fill="#6B0B0C"
              className="font-sans font-extrabold uppercase text-[13px] tracking-[0.18em]"
            >
              <textPath href="#top-wave-text-path" startOffset="0%">
                FRESH BUILDS, IN CODE. DREAM BIG, BUILD BOLD. FRESH BUILDS, IN CODE. DREAM BIG, BUILD BOLD. FRESH BUILDS, IN CODE.
              </textPath>
            </text>
          </svg>
        </div>
      </section>

      {/* ── SECTION 2: ROSEWOOD FEATURED PROJECTS SECTION ── */}
      <section className="relative z-10 bg-[#6B0B0C] text-[#FFF8CA] px-6 md:px-14 pt-8 pb-16 sm:pt-12 sm:pb-20">
        <div className="max-w-[1360px] mx-auto">
          {/* Section Header: Left Title/Subtitle + Right View All Projects (Clean Center) */}
          <div className="mb-10 sm:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="text-left">
              <span className="font-cursive text-2xl sm:text-3xl text-[#CDE3E8] block mb-0.5">
                Find your new fav build
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#FFF8CA] font-semibold tracking-tight">
                Featured Projects
              </h2>
              <p className="text-xs sm:text-sm text-[#FFF8CA]/80 font-sans mt-2 tracking-wide">
                Fresh student projects, open-source tools, and developer creations.
              </p>
            </div>
            <Link
              to="/explore"
              className="self-start sm:self-end inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#2D120D]/60 hover:bg-[#CDE3E8] text-[#FFF8CA] hover:text-[#2D120D] border border-[#CDE3E8]/50 text-xs font-semibold uppercase tracking-wider transition-all shrink-0"
            >
              View all projects &rarr;
            </Link>
          </div>

          {/* Cards Grid: 1 Special Promo Card + 3 Dynamic Project Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 items-stretch">
            {/* 1. Feature / Promo Card */}
            <div className="group relative rounded-3xl bg-[#FFF8CA] text-[#2D120D] border-2 border-[#CDE3E8] p-6 flex flex-col justify-between overflow-hidden min-h-[300px] shadow-xl hover:-translate-y-1.5 transition-all duration-300">
              {/* Top Tag */}
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-[#6B0B0C] text-[#FFF8CA] shadow-xs">
                  TOP PROJECTS
                </span>
                <span className="font-cursive text-lg text-[#6B0B0C] font-bold">
                  curated
                </span>
              </div>

              {/* Packaged Boxes / Community Kit Artwork */}
              <div className="my-auto flex flex-col items-center justify-center py-4">
                <img
                  src={bestSellersBoxes}
                  alt="Curated student projects and community kits"
                  className="w-36 h-36 object-cover rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-300"
                />
                <p className="font-serif text-sm text-[#2D120D]/80 mt-3 text-center">
                  Hand-picked builds from the community
                </p>
              </div>

              {/* Bottom "EXPLORE ALL" Pill Button */}
              <div className="z-10">
                <Link
                  to="/explore"
                  className="w-full block text-center py-2.5 px-4 rounded-full bg-[#2D120D] hover:bg-[#6B0B0C] text-[#FFF8CA] font-sans text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
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
                  className="group flex flex-col justify-between rounded-3xl bg-[#FFF8CA] p-4 text-left shadow-xl border-2 border-[#CDE3E8]/70 hover:border-[#CDE3E8] transition-all duration-300 hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-[#CDE3E8]"
                >
                  {/* Project Image Frame (Uncropped object-contain on soft pedestal so GitHub cards aren't cut off) */}
                  <div className="aspect-[16/10] w-full rounded-2xl bg-white border border-[#2D120D]/15 overflow-hidden flex items-center justify-center relative shadow-inner p-2">
                    {coverUrl ? (
                      <ImageWithFallback
                        src={coverUrl}
                        alt={project.title}
                        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#CDE3E8]/50 to-[#FFF8CA] text-[#2D120D] rounded-xl">
                        <FolderCode className="w-10 h-10 text-[#6B0B0C] mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-serif text-sm font-semibold text-center text-[#2D120D] line-clamp-2">
                          {project.title}
                        </span>
                      </div>
                    )}

                    {project.category && (
                      <span className="absolute top-2.5 left-2.5 text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#2D120D] text-[#FFF8CA] shadow-xs">
                        {project.category}
                      </span>
                    )}
                  </div>

                  {/* Project Title and Metadata */}
                  <div className="mt-4 px-1 pt-1">
                    <h3 className="font-serif text-xl text-[#2D120D] font-semibold group-hover:text-[#6B0B0C] transition-colors truncate">
                      {project.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-[#2D120D]/75 font-sans mt-1.5 pt-2 border-t border-[#2D120D]/15">
                      <span className="truncate max-w-[165px] font-medium">{stackLabel}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#CDE3E8] text-[#2D120D] font-semibold ml-2 shrink-0">
                        <Heart className="w-3 h-3 text-[#6B0B0C] fill-[#6B0B0C]" />
                        <span>{project.likes_count ?? project.likes ?? 0}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WAVE 2: Rosewood-to-Botticelli-to-Lemon-Chiffon Curved Wave Divider into DevSpace Section ── */}
      <div className="relative z-10 bg-[#6B0B0C] leading-none pointer-events-none -mt-1">
        <svg
          viewBox="0 0 1440 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-[70px] sm:h-[95px] md:h-[120px] block"
          preserveAspectRatio="none"
        >
          {/* Botticelli Blue Wave Band */}
          <path
            d="M0,40 C240,0 480,90 720,40 C960,-10 1200,85 1440,40 L1440,130 L0,130 Z"
            fill="#CDE3E8"
          />
          {/* Bottom Lemon Chiffon Section Fill */}
          <path
            d="M0,78 C240,38 480,128 720,78 C960,28 1200,123 1440,78 L1440,130 L0,130 Z"
            fill="#FFF8CA"
          />
          <path
            id="bottom-wave-text-path"
            d="M-60,62 C220,22 470,112 720,62 C970,12 1210,107 1500,62"
            fill="none"
          />
          <text
            fill="#2D120D"
            className="font-sans font-extrabold uppercase text-[13px] tracking-[0.18em]"
          >
            <textPath href="#bottom-wave-text-path" startOffset="0%">
              CRAFTED BY STUDENTS, FOR CREATORS. LOCKED IN AND BUILDING. CRAFTED BY STUDENTS, FOR CREATORS. LOCKED IN AND BUILDING.
            </textPath>
          </text>
        </svg>
      </div>

      {/* ── SECTION 3: DEVSPACE FISHEYE BANNER SECTION ── */}
      <section className="bg-[#FFF8CA] px-4 sm:px-6 md:px-14 pt-20 pb-20 sm:pt-24 lg:py-20">
        <div className="max-w-[1360px] mx-auto w-full">
          {/* Tall banner: story, artwork, and DevSpace */}
          <div className="relative w-full rounded-3xl bg-black border-2 border-[#2D120D]/25 overflow-hidden min-h-[540px] sm:min-h-[640px] lg:min-h-[76vh] px-6 sm:px-10 lg:px-12 py-10 flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] items-center gap-8 shadow-2xl group">
            {/* Subtle Ambient Starlight Accents in the Black Space */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(1.5px 1.5px at 8% 18%, #FFF8CA 100%, transparent), radial-gradient(1px 1px at 88% 16%, #CDE3E8 100%, transparent), radial-gradient(1.5px 1.5px at 82% 76%, #FFF8CA 100%, transparent), radial-gradient(1px 1px at 14% 78%, #CDE3E8 100%, transparent), radial-gradient(1.5px 1.5px at 92% 46%, #FFF8CA 100%, transparent)",
              }}
            />

            {/* Left Column: Clean Editorial Story Text (Centered in Left Black Space) */}
            <div className="relative z-10 max-w-[290px] mx-auto flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center gap-2 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-[#CDE3E8] animate-pulse" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#FFF8CA] whitespace-nowrap">
                  DREAM BIG · BUILD BOLD
                </span>
              </div>

              <p className="font-serif text-sm sm:text-[15px] text-[#FFF8CA]/90 leading-relaxed font-normal tracking-wide">
                Our community is about turning ideas into reality. It&apos;s
                thinking long-term about what inspires developers, creators, and
                students. And it&apos;s crafting the tools and experiences that
                make a real difference—celebrating creativity and the{" "}
                <span className="italic text-[#CDE3E8]">
                  craft of dreaming big
                </span>
                .
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-center">
              <img
                src={lockInImage}
                alt="Lock in artwork"
                className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] lg:w-[52vh] lg:h-[52vh] xl:w-[58vh] xl:h-[58vh] max-w-full object-contain object-center group-hover:scale-[1.02] transition-transform duration-700"
              />
            </div>

            {/* Right column: DevSpace */}
            <div className="relative z-10 max-w-[280px] mx-auto flex flex-col items-center lg:items-end text-center lg:text-right">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#CDE3E8] block mb-2 whitespace-nowrap">
                LATE NIGHT SESSIONS
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl xl:text-5xl font-normal text-[#FFF8CA] tracking-tight leading-none">
                Dev<span className="italic font-medium text-[#CDE3E8]">Space</span>
              </h3>
              <p className="font-serif italic text-xs sm:text-sm text-[#FFF8CA]/80 mt-2.5 leading-relaxed tracking-wide">
                where caffeine, cats &amp; midnight code orbit together.
              </p>
            </div>

            {/* Bottom-Right Inside Card: About Developers Link */}
            <div className="lg:absolute lg:bottom-6 lg:right-8 z-20 flex justify-end w-full lg:w-auto">
              <Link
                to="/about-developers"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2D120D]/90 hover:bg-[#6B0B0C] text-[#FFF8CA] border border-[#CDE3E8]/40 font-sans text-xs font-semibold tracking-wider uppercase shadow-lg transition-all hover:scale-[1.02]"
              >
                <span className="h-2 w-2 rounded-full bg-[#CDE3E8]" />
                <span>About Developers</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
