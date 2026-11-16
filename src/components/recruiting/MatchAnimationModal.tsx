// src/components/recruiting/MatchAnimationModal.tsx
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, FastForward } from "lucide-react";
import ducksBgImg from "../../assets/ducks_bg.png";
import ducksOnlyImg from "../../assets/ducks_only.png";
import duckRocketImg from "../../assets/duck_rocket.png";

interface MatchAnimationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
}

type Stage = "ducks" | "rocket" | "blastoff";

const STAR_COORDS = [
  { top: "12%", left: "8%", delay: 0.2, size: 2 },
  { top: "18%", left: "85%", delay: 0.5, size: 3 },
  { top: "28%", left: "22%", delay: 0.9, size: 2 },
  { top: "15%", left: "55%", delay: 1.2, size: 3 },
  { top: "42%", left: "92%", delay: 0.1, size: 2 },
  { top: "72%", left: "14%", delay: 0.7, size: 2 },
  { top: "82%", left: "88%", delay: 1.4, size: 3 },
  { top: "68%", left: "48%", delay: 0.4, size: 2 },
  { top: "88%", left: "32%", delay: 1.1, size: 2 },
  { top: "35%", left: "75%", delay: 0.8, size: 3 },
  { top: "55%", left: "5%", delay: 1.3, size: 2 },
  { top: "92%", left: "68%", delay: 0.3, size: 2 },
];

export function MatchAnimationModal({ isOpen, onComplete, onClose }: MatchAnimationModalProps) {
  const [stage, setStage] = useState<Stage>("ducks");
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setStage("ducks");
      setProgress(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = performance.now();

    const updateFrame = (now: number) => {
      const elapsed = now - startTimeRef.current;

      // Stage 1: Ducks walking (0s - 5s / 5000ms)
      if (elapsed < 5000) {
        setStage("ducks");
        const p = Math.min(100, Math.round((elapsed / 5000) * 100));
        setProgress(p);
        rafRef.current = requestAnimationFrame(updateFrame);
      }
      // Stage 2: Rocket floating & hovering (5s - 7.2s / 5000ms - 7200ms)
      else if (elapsed < 7200) {
        setStage("rocket");
        const stage2Elapsed = elapsed - 5000;
        const p = Math.min(100, Math.round((stage2Elapsed / 3000) * 100));
        setProgress(p);
        rafRef.current = requestAnimationFrame(updateFrame);
      }
      // Stage 3: Rocket blast-off & warp speed exit (7.2s - 8s / 7200ms - 8000ms)
      else if (elapsed < 8000) {
        setStage("blastoff");
        setProgress(100);
        rafRef.current = requestAnimationFrame(updateFrame);
      }
      // Complete at 8s (5s ducks + 3s rocket)
      else {
        onComplete();
      }
    };

    rafRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, onComplete]);

  // Handle escape key to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onComplete]);

  if (!isOpen) return null;

  const isDucks = stage === "ducks";
  const isRocketHover = stage === "rocket";
  const isBlastoff = stage === "blastoff";

  const accentColor = isDucks ? "#ffd60a" : isBlastoff ? "#38bdf8" : "#4cc9f0";
  const glowBg = isDucks
    ? "rgba(255, 214, 10, 0.16)"
    : isBlastoff
    ? "rgba(56, 189, 248, 0.28)"
    : "rgba(179, 136, 255, 0.22)";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-8 bg-stone-950 font-sans selection:bg-amber-400 selection:text-black overflow-hidden select-none"
      >
        {/* ── PARALLAX RETRO BACKGROUND GRID (Wrap Section Aesthetic) ── */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-1000"
          style={{
            backgroundImage: `radial-gradient(${accentColor} 1.5px, transparent 1.5px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* ── ATMOSPHERIC AMBIENT GLOW ── */}
        <motion.div
          animate={{
            scale: isDucks ? [1, 1.15, 1] : isBlastoff ? [1.2, 1.5, 1.2] : [1.05, 1.25, 1.05],
            opacity: isBlastoff ? 0.45 : 0.25,
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-[140px] pointer-events-none transition-colors duration-1000"
          style={{ backgroundColor: glowBg }}
        />

        {/* ── RETRO TWINKLING PIXEL STARS ── */}
        {STAR_COORDS.map((s, idx) => (
          <motion.div
            key={idx}
            animate={{
              opacity: isBlastoff ? [0.3, 1, 0.3] : [0.15, 0.85, 0.15],
              scale: isBlastoff ? [1, 1.8, 1] : [1, 1.2, 1],
            }}
            transition={{
              duration: 1.8 + s.delay,
              repeat: Infinity,
              delay: s.delay,
              ease: "easeInOut",
            }}
            className="absolute rounded-none pointer-events-none bg-stone-200"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              boxShadow: `0 0 6px ${accentColor}`,
            }}
          />
        ))}

        {/* ── TOP RETRO HEADER BAR ── */}
        <header className="relative z-30 w-full max-w-4xl flex items-center justify-between gap-3 pt-2">
          {/* Brand Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-800 shadow-xl text-stone-200 text-xs font-mono">
            <span
              className="w-2 h-2 rounded-full transition-colors duration-500 animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span className="font-bold tracking-wider text-white">DEVZ-GO</span>
            <span className="text-stone-600">|</span>
            <span className="text-stone-400 font-medium">RECRUITER RADAR</span>
          </div>

          {/* Phase Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-800 shadow-xl text-xs font-mono">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
                border: `1px solid ${accentColor}40`,
              }}
            >
              {isDucks ? "STAGE 1/2" : "STAGE 2/2"}
            </span>
            <span className="text-stone-300">
              {isDucks ? "Lining Up Candidates" : "Matching Tech Profiles"}
            </span>
          </div>

          {/* Skip Button */}
          <button
            type="button"
            onClick={handleDismiss}
            title="Skip animation and see match results"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-800/90 text-stone-400 hover:text-stone-200 backdrop-blur-md border border-stone-800 transition shadow-xl text-xs font-mono cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>Skip intro</span>
          </button>
        </header>

        {/* ── MAIN PIXEL ART THEATER SCREEN ── */}
        <main className="relative z-20 my-auto max-w-3xl w-full flex flex-col items-center">
          {/* Arcade Cabinet Bezel */}
          <div className="relative w-full rounded-3xl border border-stone-800/90 bg-stone-900/90 p-3 sm:p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden">
            {/* Subtle CRT scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%)] bg-[length:100%_4px] opacity-35 z-20" />

            {/* Glowing corner brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-stone-700 pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-stone-700 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-stone-700 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-stone-700 pointer-events-none" />

            {/* Canvas Container with 16:9 Aspect Ratio */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <AnimatePresence mode="wait">
                {/* ── SCREEN 1: DUCKS WALKING (0s - 5s) ── */}
                {isDucks && (
                  <motion.div
                    key="ducks-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
                  >
                    {/* Rock-solid meadow background (Text, clouds, meadow grass path) - ZERO SCREEN SHAKE */}
                    <img
                      src={ducksBgImg}
                      alt="We've got all your ducks in a row."
                      className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none z-0"
                      style={{
                        imageRendering: "pixelated",
                      }}
                    />

                    {/* Ducks Layer: ACTUALLY WALKING FORWARD (Ducks face left, so marching right-to-left) */}
                    <motion.div
                      initial={{ x: "32%" }}
                      animate={{ x: "-32%" }}
                      transition={{ duration: 5, ease: "linear" }}
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    >
                      {/* Subtle natural step stride cadence as ducks traverse */}
                      <motion.div
                        animate={{ y: [0, -2, 0, -2, 0] }}
                        transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-full"
                      >
                        <img
                          src={ducksOnlyImg}
                          alt="Ducks marching forward"
                          className="w-full h-full object-contain select-none"
                          style={{
                            imageRendering: "pixelated",
                          }}
                        />
                      </motion.div>
                    </motion.div>

                    {/* Atmospheric pond-side glow reflection */}
                    <div
                      className="absolute -bottom-10 inset-x-0 h-28 pointer-events-none opacity-20 blur-2xl z-20"
                      style={{
                        background:
                          "radial-gradient(ellipse at center, rgba(76, 201, 240, 0.35), transparent 70%)",
                      }}
                    />
                  </motion.div>
                )}

                {/* ── SCREEN 2: ROCKET TAKING FLIGHT (5s - 8s) ── */}
                {(!isDucks || isRocketHover || isBlastoff) && !isDucks && (
                  <motion.div
                    key="rocket-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                    className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#060f2e]"
                  >
                    {/* Clean Pristine Pixel Art Scene: Rocket Cruising -> Taking Flight Blast-off */}
                    <motion.div
                      animate={
                        isBlastoff
                          ? {
                              x: 520,
                              y: -400,
                              scale: 1.25,
                              opacity: [1, 1, 0],
                              transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
                            }
                          : {
                              x: [0, 4, 0],
                              y: [0, -3, 0],
                              transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                            }
                      }
                      className="relative w-full h-full flex items-center justify-center pointer-events-none z-10"
                    >
                      <img
                        src={duckRocketImg}
                        alt="Hang On, finding the right duck for you..."
                        className="w-full h-full object-contain select-none"
                        style={{
                          imageRendering: "pixelated",
                        }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── RETRO PROGRESS BAR & LIVE TELEMETRY ── */}
            <div className="mt-4 px-2 sm:px-4">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles
                    className="w-3.5 h-3.5 animate-spin"
                    style={{ color: accentColor, animationDuration: "3s" }}
                  />
                  <span className="font-semibold tracking-wider text-stone-300">
                    {isDucks
                      ? "SCANNING CANDIDATES // REPOSITORIES & EVIDENCE"
                      : isBlastoff
                      ? "WARP ENGAGED // MATCH COMPLETE"
                      : "EVALUATING STACKS // SCORING MATCH ACCURACY"}
                  </span>
                </span>
                <span className="tabular-nums font-bold" style={{ color: accentColor }}>
                  {progress}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="relative w-full h-2.5 rounded-full bg-stone-950/90 border border-stone-800 overflow-hidden p-0.5 shadow-inner">
                <motion.div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: accentColor,
                    boxShadow: `0 0 10px ${accentColor}`,
                  }}
                />
              </div>

              {/* Sub-status description */}
              <p className="mt-2 text-center font-mono text-[11px] text-stone-500 tracking-wide">
                {isDucks
                  ? "Verifying required technologies against actual code contributions..."
                  : isBlastoff
                  ? "Revealing matching developer profiles..."
                  : "Calculating weighted match percentages across 20+ signals..."}
              </p>
            </div>
          </div>
        </main>

        {/* ── FOOTER RETRO BADGE ── */}
        <footer className="relative z-30 pb-2 text-center font-mono text-[11px] text-stone-600 tracking-widest uppercase flex items-center justify-center gap-2">
          <span>DevZ-Go Intelligent Role Matcher</span>
          <span>•</span>
          <span className="text-stone-500">Pixel Powered</span>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
