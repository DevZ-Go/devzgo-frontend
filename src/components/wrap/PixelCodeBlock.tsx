import { motion } from "motion/react";
import { Terminal } from "lucide-react";

interface PixelCodeBlockProps {
  filename?: string;
  code: string;
  accentColor?: string;
}

export function PixelCodeBlock({
  filename = "wrap.ts",
  code,
  accentColor = "#93c5fd",
}: PixelCodeBlockProps) {
  const lines = code.trim().split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.4 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative max-w-md w-full mx-auto rounded-xl bg-[#0B101B]/90 text-slate-100 border border-white/15 shadow-lg overflow-hidden text-left select-none"
    >
      {/* Compact 2000s Code Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/5 border-b border-white/10 text-[11px] text-slate-300 font-sans">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          </div>
          <span className="font-semibold text-slate-200 ml-1 flex items-center gap-1">
            <Terminal className="w-3 h-3" style={{ color: accentColor }} />
            {filename}
          </span>
        </div>
        <span className="text-[10px] font-medium" style={{ color: accentColor }}>
          verified ✦
        </span>
      </div>

      {/* Compact Code Body */}
      <div className="px-4 py-2.5 text-xs leading-relaxed overflow-x-auto space-y-0.5 font-mono bg-[#070B13]">
        {lines.map((line, idx) => (
          <div key={idx} className="flex items-start gap-2.5">
            <span className="text-slate-600 select-none text-[10px] w-3 text-right">
              {idx + 1}
            </span>
            <span className="text-slate-200 tracking-tight">{line}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
