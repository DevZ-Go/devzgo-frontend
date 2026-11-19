import { motion } from "motion/react";

interface PixelJunctionProps {
  color?: string;
  nextColor?: string;
  codeSnippet?: string;
}

export function PixelJunction({
  color = "#93c5fd",
  nextColor = "#c4b5fd",
}: PixelJunctionProps) {
  const pixelIndices = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="relative w-full py-2 flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none">
      <div className="w-full max-w-md px-6 flex items-center justify-center gap-2 opacity-75">
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, ${nextColor})`,
          }}
        />
        <span className="font-sans text-[10px] font-semibold tracking-[0.2em] uppercase text-white/60">
          scroll
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(90deg, ${nextColor}, ${color}, transparent)`,
          }}
        />
      </div>

      <div className="relative w-48 h-4 mt-1 flex items-center justify-center">
        {pixelIndices.map((idx) => {
          const xOffset = (idx - 4.5) * 18;
          const isNext = idx % 2 === 0;
          const c = isNext ? nextColor : color;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 0.75, scale: 1 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.4, delay: (idx % 4) * 0.05 }}
              style={{
                backgroundColor: c,
                width: 5,
                height: 5,
                left: `calc(50% + ${xOffset}px)`,
              }}
              className="absolute rounded-full"
            />
          );
        })}
      </div>
    </div>
  );
}
