import { Link } from "react-router-dom";
import { Search, ArrowLeftRight, ArrowUpDown, Tv } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useExploreProjects } from "../hooks/useExploreProjects";
import { resolveApiAssetUrl } from "../api/config";
import { StickerBadge } from "../components/StickerBadge";

/**
 * Hand-drawn "projects studio" emblem with doodle icons arranged in a circle
 * (star, shell, cherry, heart, spiral, fish, tomato, lemon slice, olive)
 * inspired by the Projects Studio & Lovebug Clover reference posters.
 */
function ProjectsStudioEmblem() {
  return (
    <div className="relative mx-auto w-full max-w-2xl rounded-[2.2rem] bg-[#D5BEEA] border-2 border-[#5B233B]/25 px-6 py-7 sm:px-10 sm:py-8 text-[#5B233B] shadow-[0_18px_40px_rgba(91,35,59,0.14)] overflow-hidden">
      {/* Top micro-labels */}
      <div className="flex items-center justify-between font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5B233B]/80 mb-2">
        <span>COMMUNITY UPDATES</span>
        <span>PROJECTS STUDIO</span>
      </div>

      {/* Center Doodle Ring + Script Title */}
      <div className="relative mx-auto flex h-48 sm:h-56 max-w-lg items-center justify-center">
        {/* Hand-drawn SVG doodle ring */}
        <svg
          viewBox="0 0 380 220"
          className="pointer-events-none absolute inset-0 h-full w-full text-[#DA6844]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Top Cherry */}
          <g transform="translate(182, 8)">
            <circle cx="8" cy="22" r="5.5" />
            <path d="M9 16 C10 6, 18 2, 22 4" />
          </g>
          {/* Top-Left Seashell */}
          <g transform="translate(88, 18) rotate(-18)" className="text-[#FCFBF4]">
            <path d="M4 18 C4 6, 24 6, 24 18 L18 22 L10 22 Z" />
            <path d="M10 9 L12 21 M14 8 L14 21 M18 9 L16 21" />
          </g>
          {/* Top-Right Oyster / Pebble */}
          <g transform="translate(264, 18) rotate(15)" className="text-[#FCFBF4]">
            <path d="M4 14 C2 4, 20 2, 24 12 C27 20, 12 24, 4 14 Z" />
            <circle cx="14" cy="13" r="3.5" />
          </g>
          {/* Left Star */}
          <g transform="translate(36, 74) rotate(-12)" className="text-[#FCFBF4]">
            <path d="M10 2 L12.5 7.5 L18.5 8.2 L14 12.2 L15.2 18 L10 15 L4.8 18 L6 12.2 L1.5 8.2 L7.5 7.5 Z" />
          </g>
          {/* Right Heart */}
          <g transform="translate(320, 62) rotate(12)">
            <path d="M10 17 C10 17, 2 11, 2 6 C2 3, 5 1, 8 3 C9.2 4, 10 5, 10 5 C10 5, 10.8 4, 12 3 C15 1, 18 3, 18 6 C18 11, 10 17, 10 17 Z" />
          </g>
          {/* Bottom-Left Olive */}
          <g transform="translate(46, 130) rotate(-10)">
            <ellipse cx="9" cy="12" rx="6.5" ry="9" />
            <circle cx="9" cy="10" r="2" />
          </g>
          {/* Right Spiral */}
          <g transform="translate(322, 122)" className="text-[#FCFBF4]">
            <path d="M10 10 C10 7, 14 7, 14 10 C14 14, 7 14, 7 9 C7 4, 17 4, 17 11 C17 17, 5 17, 4 10" />
          </g>
          {/* Bottom-Left Lemon Slice */}
          <g transform="translate(88, 174) rotate(14)" className="text-[#FCFBF4]">
            <path d="M2 8 A14 14 0 0 0 28 8 Z" />
            <path d="M15 8 L9 17 M15 8 L15 20 M15 8 L21 17" />
          </g>
          {/* Bottom Tomato */}
          <g transform="translate(180, 184)">
            <circle cx="10" cy="13" r="7.5" />
            <path d="M6 5 L10 7 L14 4 M10 3 L10 7" />
          </g>
          {/* Bottom-Right Fish */}
          <g transform="translate(262, 166) rotate(-25)">
            <path d="M2 10 C10 2, 22 2, 30 10 C22 18, 10 18, 2 10 Z" />
            <path d="M30 10 L37 4 L36 16 Z" />
            <circle cx="8" cy="9" r="1" fill="currentColor" />
          </g>
        </svg>

        {/* Handwritten Center Title in Deep Plum-Burgundy */}
        <div className="relative z-10 text-center -rotate-6 select-none">
          <h1 className="font-cursive text-5xl sm:text-6xl md:text-7xl font-bold text-[#5B233B] drop-shadow-[0_2px_6px_rgba(255,255,255,0.45)] leading-[0.88] m-0">
            projects
            <span className="block ml-4">studio</span>
          </h1>
        </div>
      </div>

      {/* Bottom micro-labels */}
      <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#5B233B]/85 mt-1">
        <span className="font-mono font-semibold uppercase tracking-[0.2em]">
          DEVZGO · EXHIBITION
        </span>
        <span className="font-serif italic text-sm tracking-wide">
          projects <span className="not-italic font-normal">studio</span>
        </span>
      </div>
    </div>
  );
}

function GalleryThumb({ covers }: { covers: string[] }) {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2.5 pattern-blue-gingham px-3 relative overflow-hidden">
      <div className="h-[68%] w-[26%] -rotate-6 border-[3px] border-[#3E2217] bg-white p-1 shadow-md overflow-hidden">
        {covers[0] ? (
          <img src={covers[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[#CBE4EE]" />
        )}
      </div>
      <div className="h-[80%] w-[34%] z-10 border-[3px] border-[#6B0B0C] bg-[#FAF6EC] p-1 shadow-lg overflow-hidden">
        {covers[1] ? (
          <img src={covers[1]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[#FFF8CA]" />
        )}
      </div>
      <div className="h-[64%] w-[24%] rotate-6 border-[3px] border-[#3E2217] bg-white p-1 shadow-md overflow-hidden">
        {covers[2] ? (
          <img src={covers[2]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[#7E97BF]" />
        )}
      </div>
    </div>
  );
}

function TvThumb() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1D3247] flex items-center justify-center">
      <div className="relative h-[74%] w-[68%] rounded-xl border-4 border-[#CBE4EE] bg-[#102030] shadow-[0_0_20px_rgba(203,228,238,0.45)] p-1.5">
        <div className="h-full w-full rounded-sm bg-gradient-to-br from-[#DDE8D5] via-[#CBE4EE] to-[#7E97BF] flex items-center justify-center">
          <Tv className="w-6 h-6 text-[#1D3247]" />
        </div>
      </div>
      <div className="absolute bottom-1.5 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-[#FDF3BA]" />
    </div>
  );
}

export function ThemeSelectPage() {
  const data = useExploreProjects();
  const covers = (data.projects ?? [])
    .map((p) => resolveApiAssetUrl(p.cover_image_url || p.image_url))
    .filter((src): src is string => Boolean(src))
    .slice(0, 3);

  const themes = [
    {
      to: "/explore/studio",
      name: "Gallery",
      subtitle:
        "Scroll horizontally through framed exhibits or vertically through the full project directory & filters.",
      cardClass: "bg-[#FCFBF4] border-[#9EA654] text-[#5B233B]",
      tag: "01 · GALLERY & DIRECTORY",
      tagClass: "bg-[#9EA654] text-[#FCFBF4]",
      badges: [
        { icon: ArrowLeftRight, label: "Horizontal Wall" },
        { icon: ArrowUpDown, label: "Vertical Directory" },
      ],
      thumb: <GalleryThumb covers={covers} />,
      sticker: "blueMiffy" as const,
    },
    {
      to: "/explore/tv",
      name: "TV World",
      subtitle:
        "Tune into interactive retro CRT screens, channel-surf live student builds, and inspect tech stacks.",
      cardClass: "bg-[#E7EFF8] border-[#B6C7E3] text-[#5B233B]",
      tag: "02 · RETRO CRT ROOM",
      tagClass: "bg-[#DA6844] text-[#FCFBF4]",
      badges: [{ icon: Tv, label: "Interactive Channels" }],
      thumb: <TvThumb />,
      sticker: "sageMiffy" as const,
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-[#FAF6EC] dark:bg-[#20100C] text-[#5B233B] relative">
      <Navbar />
      <div className="pt-16 sm:pt-20">
      {/* Decorative Die-Cut Stickers (Every sticker on the page is unique) */}
      <StickerBadge
        name="snoopyMeadow"
        size="lg"
        variant="polaroid"
        caption="cozy studio"
        className="hidden xl:inline-flex absolute top-24 left-8 -rotate-6 z-10"
      />
      <StickerBadge
        name="snoopyAutumn"
        size="md"
        variant="circle"
        className="hidden xl:inline-flex absolute bottom-10 right-8 rotate-6 z-10"
      />
      <StickerBadge
        name="wonkyFrog"
        size="sm"
        className="hidden lg:inline-flex absolute top-24 right-12 rotate-12 z-10"
      />

      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col justify-center px-6 py-8 sm:px-10 relative z-10">
        {/* Projects Studio Periwinkle Emblem + Lovebug Green/Red Subheading */}
        <div className="mb-8 text-center">
          <ProjectsStudioEmblem />
          <p className="mt-4 font-serif italic text-xl sm:text-2xl font-bold text-[#B81D27]">
            Choose a studio space to explore student builds
          </p>
        </div>

        {/* 2 Featured Room Cards: Gallery & TV World */}
        <div data-tour="explore-rooms" className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {themes.map((theme) => (
            <Link
              key={theme.to}
              to={theme.to}
              className={`group relative flex flex-col justify-between rounded-[2rem] border-2 ${theme.cardClass} p-6 shadow-lg transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl`}
            >
              <StickerBadge
                name={theme.sticker}
                size="sm"
                variant="circle"
                className="absolute -top-4 -right-3 rotate-6 z-20"
              />

              <div>
                <div className="h-36 w-full overflow-hidden rounded-2xl border-2 border-white shadow-sm group-hover:scale-[1.02] transition-transform mb-4">
                  {theme.thumb}
                </div>

                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${theme.tagClass} mb-2`}
                >
                  {theme.tag}
                </span>

                <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-[#B81D27]">
                  {theme.name}
                </h2>

                <p className="font-sans text-sm opacity-85 mt-1.5 leading-relaxed">
                  {theme.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-current/15 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {theme.badges.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-[#236329] text-xs font-bold border border-[#236329]/20"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#B81D27]" />
                      {label}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#B81D27] group-hover:translate-x-1 transition-transform">
                  Enter &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Find Developers Banner in Olive Green & Plum-Burgundy */}
        <Link
          to="/explore/developers"
          className="mt-6 flex shrink-0 items-center justify-between rounded-3xl border-2 border-[#5B233B]/30 bg-[#9EA654] hover:bg-[#8B9344] px-6 py-4 text-[#FCFBF4] shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <StickerBadge name="starHatKid" size="sm" variant="circle" className="!w-10 !h-10" />
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold text-[#5B233B] block leading-tight">
                Find Developers &amp; Collaborators
              </span>
              <span className="font-sans text-xs text-[#5B233B]/85 font-medium">
                Search by tech stack, verified commits, and availability
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#5B233B] text-[#FCFBF4] text-xs font-bold uppercase tracking-widest">
            <Search className="w-3.5 h-3.5" />
            Search
          </span>
        </Link>
      </main>
      </div>
    </div>
  );
}
