import { motion } from "motion/react";

interface PixelJunctionProps {
  color?: string;
  nextColor?: string;
  codeSnippet?: string;
}

export function PixelJunction({
  color = "#4cc9f0",
  nextColor = "#39ff14",
  codeSnippet,
}: PixelJunctionProps) {
  // 16 pixel blocks that simulate pixel creation at the transition boundary
  const pixelIndices = Array.from({ length: 18 }, (_, i) => i);

  return (
    <div className="relative w-full py-8 flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none">
      {/* Dynamic pixelated seam line */}
      <div className="w-full max-w-2xl px-6 flex items-center justify-between gap-1 opacity-75">
        <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-stone-400 to-transparent" />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-stone-900/80 backdrop-blur-md text-[10px] font-mono text-stone-300 border border-stone-700/60 shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: nextColor }} />
          <span className="text-stone-400">PIXEL_JUNCTION //</span>
          <span style={{ color: nextColor }} className="font-bold">TRANSITION</span>
        </div>
        <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-stone-400 to-transparent" />
      </div>

      {/* Scattered pixel cluster emerging at the transition junction */}
      <div className="relative w-64 h-14 mt-2 flex items-center justify-center">
        {pixelIndices.map((idx) => {
          const delay = (idx % 6) * 0.12;
          const xOffset = ((idx % 7) - 3) * 22;
          const yOffset = (Math.floor(idx / 6) - 1) * 14;
          const isNext = idx % 2 === 0;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{
                opacity: [0, 0.9, 0.4, 0.8],
                scale: [0, 1.2, 0.9, 1],
                y: [yOffset + 15, yOffset - 5, yOffset],
              }}
              viewport={{ amount: 0.5 }}
              transition={{
                duration: 0.7,
                delay,
                ease: "easeOut",
              }}
              style={{
                backgroundColor: isNext ? nextColor : color,
                width: idx % 3 === 0 ? 12 : 8,
                height: idx % 3 === 0 ? 12 : 8,
                left: `calc(50% + ${xOffset}px)`,
                top: `calc(50% + ${yOffset}px)`,
                boxShadow: `0 0 10px ${isNext ? nextColor : color}`,
              }}
              className="absolute rounded-[1px] image-rendering-pixelated"
            />
          );
        })}
      </div>

      {/* Floating incoming code preview text */}
      {codeSnippet && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 0.85, y: 0 }}
          viewport={{ amount: 0.6 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="font-mono text-[11px] text-stone-500 tracking-wider mt-1 px-3 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700"
        >
          <code>{codeSnippet}</code>
        </motion.div>
      )}
    </div>
  );
}
