import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Terminal } from "lucide-react";
import { SwipeExitArrow } from "./SwipeExitArrow";

export type WrapThemeVariant =
  | "system-alert"
  | "crt-cobalt"
  | "retro-os"
  | "hacker-source"
  | "binary-folder"
  | "cyber-plum";

interface WrapChapterProps {
  index: string;
  label?: string;
  cursiveKicker?: string;
  title: string;
  text: string;
  codeSnippet?: string;
  codeFilename?: string;
  accentColor?: string;
  nextColor?: string;
  nextCodeSnippet?: string;
  variant?: WrapThemeVariant;
  isLast?: boolean;
  onNext?: () => void;
  onReplay?: () => void;
  children: ReactNode;
}

const THEME_CONFIG: Record<
  WrapThemeVariant,
  {
    sectionBg: string;
    windowBg: string;
    windowBorder: string;
    headerBg: string;
    headerText: string;
    kickerColor: string;
    titleColor: string;
    bodyColor: string;
    badgeBg: string;
    windowTitle: string;
    okLabel: string;
    okBtnClass: string;
  }
> = {
  "system-alert": {
    // Deep Midnight Navy & Botticelli Sky Blue
    sectionBg: "bg-gradient-to-b from-[#0B1320] via-[#111E32] to-[#0D1626]",
    windowBg: "bg-[#14233A]/90 backdrop-blur-xl",
    windowBorder: "border-[#CDE3E8]/45 shadow-[0_20px_50px_rgba(14,30,56,0.75)]",
    headerBg: "bg-[#1B3150] border-b border-[#CDE3E8]/25",
    headerText: "text-[#FFF8CA]",
    kickerColor: "text-[#CDE3E8]",
    titleColor: "text-[#FFF8CA]",
    bodyColor: "text-[#E2F1F5]",
    badgeBg: "bg-[#CDE3E8]/15 border-[#CDE3E8]/40 text-[#CDE3E8]",
    windowTitle: "DevZ-Go · Monthly Highlight ✦",
    okLabel: "Next Chapter ↓",
    okBtnClass:
      "bg-[#FFF8CA] hover:bg-[#CDE3E8] text-[#14233A] font-bold shadow-md",
  },
  "crt-cobalt": {
    // Deep Sapphire & Lemon Chiffon Gold
    sectionBg: "bg-gradient-to-b from-[#091534] via-[#102454] to-[#0B1839]",
    windowBg: "bg-[#132A60]/90 backdrop-blur-xl",
    windowBorder: "border-[#FFF8CA]/45 shadow-[0_20px_50px_rgba(9,21,52,0.75)]",
    headerBg: "bg-[#1A387A] border-b border-[#FFF8CA]/25",
    headerText: "text-[#FFF8CA]",
    kickerColor: "text-[#FFF8CA]",
    titleColor: "text-[#FFF8CA]",
    bodyColor: "text-[#DBEAFE]",
    badgeBg: "bg-[#FFF8CA]/15 border-[#FFF8CA]/45 text-[#FFF8CA]",
    windowTitle: "DevZ-Go · Spotlight ✦",
    okLabel: "Next Chapter ↓",
    okBtnClass:
      "bg-[#FFF8CA] hover:bg-white text-[#102454] font-bold shadow-md",
  },
  "retro-os": {
    // Deep Espresso-Rosewood & Warm Cream (Signature Landing Page Palette in Dark Mode)
    sectionBg: "bg-gradient-to-b from-[#1B0B09] via-[#2D120D] to-[#1A0D18]",
    windowBg: "bg-[#3A1812]/90 backdrop-blur-xl",
    windowBorder: "border-[#CDE3E8]/45 shadow-[0_20px_50px_rgba(0,0,0,0.75)]",
    headerBg: "bg-[#6B0B0C] border-b border-[#FFF8CA]/25",
    headerText: "text-[#FFF8CA]",
    kickerColor: "text-[#CDE3E8]",
    titleColor: "text-[#FFF8CA]",
    bodyColor: "text-[#FFF8CA]/85",
    badgeBg: "bg-[#FFF8CA]/15 border-[#FFF8CA]/35 text-[#FFF8CA]",
    windowTitle: "DevZ-Go · Community Note ✦",
    okLabel: "Next Chapter ↓",
    okBtnClass:
      "bg-[#CDE3E8] hover:bg-[#FFF8CA] text-[#2D120D] font-bold shadow-md",
  },
  "hacker-source": {
    // Deep Forest Teal & Mint Sage
    sectionBg: "bg-gradient-to-b from-[#081512] via-[#122923] to-[#0B1917]",
    windowBg: "bg-[#17352E]/90 backdrop-blur-xl",
    windowBorder: "border-[#E2F0CB]/45 shadow-[0_20px_50px_rgba(8,21,18,0.75)]",
    headerBg: "bg-[#20463D] border-b border-[#E2F0CB]/25",
    headerText: "text-[#FFF8CA]",
    kickerColor: "text-[#E2F0CB]",
    titleColor: "text-[#FFF8CA]",
    bodyColor: "text-[#E2F0CB]/90",
    badgeBg: "bg-[#E2F0CB]/15 border-[#E2F0CB]/40 text-[#E2F0CB]",
    windowTitle: "DevZ-Go · Builder Log ✦",
    okLabel: "Next Chapter ↓",
    okBtnClass:
      "bg-[#E2F0CB] hover:bg-[#FFF8CA] text-[#122923] font-bold shadow-md",
  },
  "binary-folder": {
    // Deep Twilight Slate & Powder Blue
    sectionBg: "bg-gradient-to-b from-[#0A131C] via-[#142536] to-[#0C1724]",
    windowBg: "bg-[#182C40]/90 backdrop-blur-xl",
    windowBorder: "border-[#CBE4EE]/45 shadow-[0_20px_50px_rgba(10,19,28,0.75)]",
    headerBg: "bg-[#213B54] border-b border-[#CBE4EE]/25",
    headerText: "text-[#FFF8CA]",
    kickerColor: "text-[#CBE4EE]",
    titleColor: "text-[#FFF8CA]",
    bodyColor: "text-[#CBE4EE]/90",
    badgeBg: "bg-[#CBE4EE]/15 border-[#CBE4EE]/40 text-[#CBE4EE]",
    windowTitle: "DevZ-Go · Studio Log ✦",
    okLabel: "Next Chapter ↓",
    okBtnClass:
      "bg-[#CBE4EE] hover:bg-[#FFF8CA] text-[#142536] font-bold shadow-md",
  },
  "cyber-plum": {
    // Deep Velvet Plum & Soft Lilac
    sectionBg: "bg-gradient-to-b from-[#130A1E] via-[#221235] to-[#111528]",
    windowBg: "bg-[#2A1742]/90 backdrop-blur-xl",
    windowBorder: "border-[#D5BEEA]/50 shadow-[0_20px_55px_rgba(19,10,30,0.8)]",
    headerBg: "bg-[#3B205B] border-b border-[#D5BEEA]/30",
    headerText: "text-[#FFF8CA]",
    kickerColor: "text-[#D5BEEA]",
    titleColor: "text-[#FFF8CA]",
    bodyColor: "text-[#EDE2F8]",
    badgeBg: "bg-[#D5BEEA]/15 border-[#D5BEEA]/45 text-[#D5BEEA]",
    windowTitle: "DevZ-Go · Monthly Persona ✦",
    okLabel: "Continue ↓",
    okBtnClass:
      "bg-[#D5BEEA] hover:bg-[#FFF8CA] text-[#221235] font-bold shadow-md",
  },
};

export function WrapChapter({
  index,
  label,
  cursiveKicker,
  title,
  text,
  codeSnippet,
  codeFilename,
  accentColor = "#CDE3E8",
  variant = "system-alert",
  isLast = false,
  onNext,
  onReplay,
  children,
}: WrapChapterProps) {
  const cfg = THEME_CONFIG[variant];

  return (
    <section
      className={`relative h-dvh max-h-dvh snap-start flex flex-col items-center justify-center px-4 sm:px-6 pt-14 pb-4 text-center overflow-hidden transition-colors duration-700 ${cfg.sectionBg}`}
    >
      {/* Subtle Ambient Starlight Dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="w-full h-full opacity-20"
          style={{
            backgroundImage: `radial-gradient(${accentColor} 1.2px, transparent 1.2px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[110px]"
          style={{ backgroundColor: `${accentColor}20` }}
        />
      </div>

      {/* ── COMPACT, NEVER-CLIPPED WINDOW CARD WITH WEBSITE TYPOGRAPHY ── */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ amount: 0.45, once: false }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`relative z-10 max-w-xl w-full rounded-[2rem] border-2 ${cfg.windowBg} ${cfg.windowBorder} overflow-hidden`}
      >
        {/* Window Titlebar */}
        <div className={`flex items-center justify-between px-5 py-2.5 ${cfg.headerBg}`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
            <span className={`ml-1.5 font-sans text-xs font-semibold tracking-wide ${cfg.headerText}`}>
              {cfg.windowTitle}
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${cfg.badgeBg}`}
          >
            {index} {label ? `· ${label}` : ""}
          </span>
        </div>

        {/* Compact Window Body (Guaranteed to fit inside 100dvh without cutting off) */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col items-center gap-3">
          {/* Website's Signature Cursive Kicker + Serif Heading */}
          <div>
            {cursiveKicker && (
              <span className={`font-cursive text-2xl sm:text-3xl block mb-0.5 ${cfg.kickerColor}`}>
                {cursiveKicker}
              </span>
            )}
            <h2
              className={`font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight m-0 ${cfg.titleColor}`}
            >
              {title}
            </h2>
          </div>

          {/* Clean Illustrated Sticker / Badge Centerpiece (No blocky pixel art) */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ amount: 0.5 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
            className="my-0.5 flex items-center justify-center"
          >
            {children}
          </motion.div>

          {/* Website Sans-Serif Description */}
          {text && (
            <p
              className={`max-w-md font-sans text-xs sm:text-sm leading-relaxed font-medium m-0 ${cfg.bodyColor}`}
            >
              {text}
            </p>
          )}

          {/* Sleek Single-Bar Code Readout (Never pushes the button off-screen) */}
          {codeSnippet && (
            <div className="w-full max-w-md rounded-xl bg-black/45 border border-white/15 px-3.5 py-2 flex items-center justify-between gap-3 text-left font-mono text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                <span className="text-slate-200 truncate">{codeSnippet.replace(/\n/g, "  ")}</span>
              </div>
              {codeFilename && (
                <span className="text-[10px] font-semibold shrink-0 opacity-75" style={{ color: accentColor }}>
                  {codeFilename}
                </span>
              )}
            </div>
          )}

          {/* Action Button or Final Exit Row */}
          {!isLast && onNext ? (
            <button
              type="button"
              onClick={onNext}
              className={`mt-1 inline-flex items-center gap-2 px-6 py-2 rounded-full font-sans text-xs font-bold uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer ${cfg.okBtnClass}`}
            >
              <span>{cfg.okLabel}</span>
            </button>
          ) : null}

          {isLast && <SwipeExitArrow onReplay={onReplay} />}
        </div>
      </motion.div>
    </section>
  );
}
