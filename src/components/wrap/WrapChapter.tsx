import { motion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { PixelJunction } from "./PixelJunction";
import { PixelCodeBlock } from "./PixelCodeBlock";
import { SwipeExitArrow } from "./SwipeExitArrow";

interface WrapChapterProps {
  index: string;
  title: string;
  text: string;
  codeSnippet?: string;
  codeFilename?: string;
  accentColor?: string;
  nextColor?: string;
  nextCodeSnippet?: string;
  isLast?: boolean;
  onReplay?: () => void;
  children: ReactNode;
}

export function WrapChapter({
  index,
  title,
  text,
  codeSnippet,
  codeFilename,
  accentColor = "#4cc9f0",
  nextColor,
  nextCodeSnippet,
  isLast = false,
  onReplay,
  children,
}: WrapChapterProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Multi-tier parallax offsets
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-40, 40]);
  const floatingBgY = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const spriteRotate = useTransform(scrollYProgress, [0, 1], [-3, 3]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen snap-start flex flex-col items-center justify-center px-6 sm:px-12 py-16 text-center overflow-hidden bg-stone-900 text-stone-100"
    >
      {/* ── PARALLAX RETRO BACKGROUND GRID & FLOATING PARTICLES ── */}
      <motion.div
        style={{ y: floatingBgY }}
        className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20"
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(${accentColor} 1.5px, transparent 1.5px)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Ambient atmospheric glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
          style={{ backgroundColor: `${accentColor}20` }}
        />
      </motion.div>

      {/* ── CHAPTER CONTENT (Parallax Foreground) ── */}
      <motion.div
        style={{ y: parallaxY }}
        className="relative z-10 max-w-3xl w-full flex flex-col items-center gap-6"
      >
        {/* Index Pill & Accent Badge */}
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase border shadow-md"
            style={{
              borderColor: `${accentColor}50`,
              backgroundColor: `${accentColor}18`,
              color: accentColor,
            }}
          >
            CHAPTER // {index}
          </span>
        </div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.6 }}
          transition={{ duration: 0.5 }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-md"
        >
          {title}
        </motion.h2>

        {/* Pixel Sprite with Floating Elevation & Pixel Sparkle */}
        <motion.div
          style={{ rotate: spriteRotate }}
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ amount: 0.6 }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 20,
            delay: 0.15,
          }}
          className="p-6 rounded-3xl bg-stone-950/70 border border-stone-800 shadow-2xl backdrop-blur-md relative group"
        >
          {/* Subtle glow under sprite */}
          <div
            className="absolute inset-0 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity"
            style={{ backgroundColor: accentColor }}
          />
          <div className="relative z-10">{children}</div>
        </motion.div>

        {/* Descriptive Text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.6 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="max-w-md text-stone-300 font-sans text-base sm:text-lg leading-relaxed"
        >
          {text}
        </motion.p>

        {/* Pixel Code Block (Materializes with the code) */}
        {codeSnippet && (
          <PixelCodeBlock
            filename={codeFilename}
            code={codeSnippet}
            accentColor={accentColor}
          />
        )}

        {/* Last Chapter: Interactive Swipe Exit Arrow */}
        {isLast && <SwipeExitArrow onReplay={onReplay} />}
      </motion.div>

      {/* ── PIXEL JUNCTION AT TRANSITION BOUNDARY (Creates pixels at junction of transition) ── */}
      {!isLast && nextColor && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <PixelJunction
            color={accentColor}
            nextColor={nextColor}
            codeSnippet={nextCodeSnippet}
          />
        </div>
      )}
    </section>
  );
}
