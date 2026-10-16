import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "motion/react";
import { ChevronUp, Home, RotateCcw, Share2, Check } from "lucide-react";

interface SwipeExitArrowProps {
  onReplay?: () => void;
}

export function SwipeExitArrow({ onReplay }: SwipeExitArrowProps) {
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);
  const [copied, setCopied] = useState(false);

  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, -70], [1, 0.2]);
  const scale = useTransform(y, [0, -70], [1, 0.9]);

  const handleExit = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      navigate("/home");
    }, 350);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 mt-8 select-none">
      {/* Action Buttons: Share & Replay */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/80 hover:bg-stone-900 text-stone-200 border border-stone-700 text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-stone-400" />}
          <span>{copied ? "Link Copied!" : "Share Wrap"}</span>
        </button>

        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/80 hover:bg-stone-900 text-stone-200 border border-stone-700 text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span>Replay</span>
          </button>
        )}
      </div>

      {/* Interactive Swipe Up to Exit Pill */}
      <motion.div
        style={{ y, opacity, scale }}
        drag="y"
        dragConstraints={{ top: -100, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={(_, info) => {
          if (info.offset.y < -50 || info.velocity.y < -200) {
            handleExit();
          }
        }}
        onClick={handleExit}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group relative flex flex-col items-center gap-1.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-mono text-xs font-bold tracking-widest uppercase shadow-2xl hover:shadow-orange-500/40 cursor-grab active:cursor-grabbing transition-shadow"
      >
        {/* Pulsing Animated Arrows */}
        <motion.div
          animate={{
            y: [-3, -9, -3],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.4,
            ease: "easeInOut",
          }}
          className="flex flex-col items-center -space-y-2 text-white"
        >
          <ChevronUp className="w-5 h-5 drop-shadow-sm" />
          <ChevronUp className="w-4 h-4 opacity-70 drop-shadow-sm" />
        </motion.div>

        <span className="flex items-center gap-2 drop-shadow-md">
          <Home className="w-3.5 h-3.5" />
          <span>SWIPE UP OR CLICK TO EXIT</span>
        </span>
      </motion.div>

      <span className="text-[10px] font-mono text-stone-400 tracking-wider uppercase">
        End of Monthly Wrap · OCT 2026
      </span>
    </div>
  );
}
