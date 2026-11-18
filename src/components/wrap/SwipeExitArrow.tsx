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
  const opacity = useTransform(y, [0, -60], [1, 0.25]);
  const scale = useTransform(y, [0, -60], [1, 0.94]);

  const handleExit = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      navigate("/home");
    }, 260);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-3 mt-1 select-none">
      {/* Clean 2000s Pill Buttons: Share, Replay, and Back to Home in one tidy row */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 font-sans text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5 text-sky-300" />}
          <span>{copied ? "Link copied!" : "Share Wrap"}</span>
        </button>

        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 font-sans text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-300" />
            <span>Replay</span>
          </button>
        )}

        <motion.button
          type="button"
          style={{ y, opacity, scale }}
          drag="y"
          dragConstraints={{ top: -80, bottom: 0 }}
          dragElastic={0.35}
          onDragEnd={(_, info) => {
            if (info.offset.y < -45 || info.velocity.y < -180) {
              handleExit();
            }
          }}
          onClick={handleExit}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#A5B4FC] via-[#C4B5FD] to-[#93C5FD] text-[#0F172A] font-sans text-xs font-bold tracking-wide shadow-[0_6px_20px_rgba(165,180,252,0.35)] cursor-pointer transition-all"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Back to Home</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
}
