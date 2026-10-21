import { motion } from "motion/react";
import { Terminal } from "lucide-react";

interface PixelCodeBlockProps {
  filename?: string;
  code: string;
  accentColor?: string;
}

export function PixelCodeBlock({
  filename = "wrap.config.ts",
  code,
  accentColor = "#39ff14",
}: PixelCodeBlockProps) {
  const lines = code.trim().split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 18 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ amount: 0.5 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative max-w-lg w-full mx-auto rounded-xl bg-stone-950 text-stone-200 border-2 border-stone-800 shadow-2xl overflow-hidden font-mono text-left my-4 select-none"
      style={{
        boxShadow: `0 12px 30px -10px ${accentColor}25`,
      }}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-stone-900 border-b border-stone-800 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] font-semibold text-stone-300 ml-1.5 flex items-center gap-1">
            <Terminal className="w-3 h-3 text-stone-400" />
            {filename}
          </span>
        </div>

        {/* Pixel Status Indicator */}
        <div className="flex items-center gap-1 text-[10px] text-stone-500">
          <span
            className="w-1.5 h-1.5 rounded-sm animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
          <span style={{ color: accentColor }}>PIXEL_SYNC</span>
        </div>
      </div>

      {/* Code Body with Staggered Materialization */}
      <div className="p-4 text-xs sm:text-[13px] leading-relaxed overflow-x-auto space-y-1 bg-stone-950/95">
        {lines.map((line, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ amount: 0.6 }}
            transition={{ duration: 0.35, delay: 0.15 + idx * 0.08 }}
            className="flex items-start gap-3"
          >
            <span className="text-stone-600 select-none text-[11px] w-4 text-right">
              {idx + 1}
            </span>
            <span className="text-stone-200 font-mono tracking-tight">
              {line.split(" ").map((token, tIdx) => {
                if (token.startsWith("//")) {
                  return (
                    <span key={tIdx} className="text-stone-500 italic">
                      {token}{" "}
                    </span>
                  );
                }
                if (["const", "export", "let", "function", "import", "type"].includes(token)) {
                  return (
                    <span key={tIdx} className="text-amber-400 font-semibold">
                      {token}{" "}
                    </span>
                  );
                }
                if (["return", "await", "async"].includes(token)) {
                  return (
                    <span key={tIdx} className="text-pink-400 font-semibold">
                      {token}{" "}
                    </span>
                  );
                }
                if (!isNaN(Number(token.replace(/,/g, "")))) {
                  return (
                    <span key={tIdx} style={{ color: accentColor }} className="font-bold">
                      {token}{" "}
                    </span>
                  );
                }
                return <span key={tIdx}>{token} </span>;
              })}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Retro scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
        }}
      />
    </motion.div>
  );
}
