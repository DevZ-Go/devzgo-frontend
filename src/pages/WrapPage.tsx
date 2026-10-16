import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Volume2, VolumeX, ArrowDown } from "lucide-react";
import { WrapChapter } from "../components/wrap/WrapChapter";
import { PixelSprite } from "../components/wrap/PixelSprite";
import { POTION, INVADER, CHERRIES, HEART, GHOST } from "../components/wrap/sprites";
import { mockWrap as w } from "../data/mockWrap";

export function WrapPage() {
  const scrollContainerRef = useRef<HTMLElement>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const chapters = [
    { id: "01", label: "Shipped", color: "#4cc9f0" },
    { id: "02", label: "Stack", color: "#39ff14" },
    { id: "03", label: "Explored", color: "#ff5d3a" },
    { id: "04", label: "Collab", color: "#e63946" },
    { id: "05", label: "Persona", color: "#ff9f1c" },
  ];

  // Track active chapter on scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const pageHeight = window.innerHeight;
      const index = Math.round(container.scrollTop / pageHeight);
      setActiveChapter(Math.min(Math.max(index, 0), chapters.length - 1));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [chapters.length]);

  const scrollToChapter = (idx: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: idx * window.innerHeight,
      behavior: "smooth",
    });
  };

  const handleReplay = () => {
    scrollToChapter(0);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-stone-950 font-sans selection:bg-amber-400 selection:text-black">
      {/* ── PERSISTENT TOP HUD / CONTROLS ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between pointer-events-none">
        {/* Left: Brand Badge */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-800 text-white text-xs font-mono shadow-xl">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold tracking-wider">DEVZ-GO</span>
          <span className="text-stone-500">|</span>
          <span className="text-stone-400 font-medium">WRAP '26</span>
        </div>

        {/* Center: Segmented Chapter Progress Dots */}
        <div className="hidden sm:flex pointer-events-auto items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-800 shadow-xl">
          {chapters.map((ch, idx) => {
            const isActive = activeChapter === idx;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => scrollToChapter(idx)}
                className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all text-[11px] font-mono cursor-pointer"
                title={`Jump to Chapter ${ch.id}`}
              >
                <span
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isActive ? "scale-125" : "opacity-40 group-hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor: isActive ? ch.color : "#a8a29e",
                    boxShadow: isActive ? `0 0 8px ${ch.color}` : "none",
                  }}
                />
                {isActive && (
                  <span style={{ color: ch.color }} className="font-bold">
                    {ch.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Sound & Exit Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 backdrop-blur-md border border-stone-800 text-stone-300 transition-colors shadow-lg cursor-pointer"
            title={soundEnabled ? "Mute Wrap audio" : "Enable Wrap audio"}
            aria-label="Toggle audio"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <Link
            to="/home"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-800 backdrop-blur-md border border-stone-800 text-stone-300 hover:text-white transition-all text-xs font-semibold shadow-lg"
            title="Exit Wrap"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </Link>
        </div>
      </header>

      {/* ── SCROLL DOWN HINT (Visible on first chapter) ── */}
      <AnimatePresence>
        {activeChapter === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-1 font-mono text-[11px] text-stone-400 tracking-wider uppercase"
          >
            <span>Scroll or swipe down</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ArrowDown className="w-4 h-4 text-stone-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN SNAP-SCROLL WRAP CHAPTERS ── */}
      <main
        ref={scrollContainerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory bg-stone-950 scroll-smooth"
      >
        {/* Chapter 01: Shipped Projects */}
        <WrapChapter
          index="01"
          title={`You shipped ${w.posted.count} projects`}
          text={`${w.posted.linesOfCode.toLocaleString()} lines of code crafted & uploaded.`}
          accentColor="#4cc9f0"
          nextColor="#39ff14"
          nextCodeSnippet="const nextStack = await resolveTechProfile();"
          codeFilename="shipped.projects.ts"
          codeSnippet={`// Monthly Activity // OCT 2026\nconst projectsShipped = ${w.posted.count};\nexport const linesOfCode = ${w.posted.linesOfCode};\nawait deployRelease({ verified: true });`}
        >
          <PixelSprite sprite={POTION} size={18} />
        </WrapChapter>

        {/* Chapter 02: Your Tech Stack */}
        <WrapChapter
          index="02"
          title={`Your stack: ${w.topTech[0]}`}
          text={w.topTech.join(" • ")}
          accentColor="#39ff14"
          nextColor="#ff5d3a"
          nextCodeSnippet="const analytics = await fetchBrowsingMetrics();"
          codeFilename="tech.stack.ts"
          codeSnippet={`export const primaryStack = [${w.topTech.map((t) => `"${t}"`).join(", ")}];\nconst dominantLang = "${w.topTech[0]}";\n// 84.6% of commits powered by ${w.topTech[0]}`}
        >
          <PixelSprite sprite={INVADER} size={18} />
        </WrapChapter>

        {/* Chapter 03: Explored Projects */}
        <WrapChapter
          index="03"
          title={`${w.explored.topCategoryPct}% of your browsing was ${w.explored.topCategory}`}
          text={`You explored & analyzed ${w.explored.viewed} student creations.`}
          accentColor="#ff5d3a"
          nextColor="#e63946"
          nextCodeSnippet="const network = await syncCollaborations();"
          codeFilename="explore.analytics.ts"
          codeSnippet={`const viewedCount = ${w.explored.viewed};\nexport const favoriteDomain = "${w.explored.topCategory}";\nconst interestRate = "${w.explored.topCategoryPct}%";`}
        >
          <PixelSprite sprite={CHERRIES} size={18} />
        </WrapChapter>

        {/* Chapter 04: Built Together (Collaborations) */}
        <WrapChapter
          index="04"
          title="Built together"
          text={`${w.collab.joined} projects joined · ${w.collab.invited} collaborators invited.`}
          accentColor="#e63946"
          nextColor="#ff9f1c"
          nextCodeSnippet="const persona = computeDeveloperArchetype();"
          codeFilename="collaborations.ts"
          codeSnippet={`const joinedProjects = ${w.collab.joined};\nconst teamInvites = ${w.collab.invited};\nexport const networkStatus = "COLLABORATIVE_MAKER";`}
        >
          <PixelSprite sprite={HEART} size={18} />
        </WrapChapter>

        {/* Chapter 05: Your Persona & Swipe Up to Exit */}
        <WrapChapter
          index="05"
          title={w.persona}
          text="That's your month in code. Share your milestones with fellow builders!"
          accentColor="#ff9f1c"
          codeFilename="persona.result.ts"
          codeSnippet={`export const developerArchetype = "${w.persona}";\n// Status: LEGENDARY_CREATOR // OCT 2026\nreturn { shareable: true, verified: true };`}
          isLast={true}
          onReplay={handleReplay}
        >
          <PixelSprite sprite={GHOST} size={18} />
        </WrapChapter>
      </main>
    </div>
  );
}
