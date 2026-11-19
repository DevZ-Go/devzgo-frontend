import blueMiffy from "../assets/elements/blue miffy.jpg";
import proDucktive from "../assets/elements/download (45).jpg";
import offlineDino from "../assets/elements/download (46).jpg";
import starrySnail from "../assets/elements/download (47).jpg";
import cloverLadybug from "../assets/elements/download (48).jpg";
import starryFlower from "../assets/elements/download (49).jpg";
import starHatKid from "../assets/elements/download (50).jpg";
import maroonMiffy from "../assets/elements/download (51).jpg";
import sageMiffy from "../assets/elements/download (52).jpg";
import snoopyMeadow from "../assets/elements/download (53).jpg";
import snoopyAutumn from "../assets/elements/download (54).jpg";
import watercolorFlower from "../assets/elements/flower.jpg";
import escKeycap from "../assets/elements/esc.jpg";
import keycapsDone from "../assets/elements/key.jpg";
import daisyLadybug from "../assets/elements/lady.jpg";
import wonkyFrog from "../assets/elements/wonky frog.jpg";

export const STICKERS = {
  blueMiffy,
  proDucktive,
  offlineDino,
  starrySnail,
  cloverLadybug,
  starryFlower,
  starHatKid,
  maroonMiffy,
  sageMiffy,
  snoopyMeadow,
  snoopyAutumn,
  watercolorFlower,
  escKeycap,
  keycapsDone,
  daisyLadybug,
  wonkyFrog,
} as const;

export type StickerName = keyof typeof STICKERS;

interface StickerBadgeProps {
  name: StickerName;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "diecut" | "stamp" | "polaroid" | "circle";
  caption?: string;
}

const SIZE_MAP = {
  sm: "w-14 h-14 sm:w-16 sm:h-16",
  md: "w-20 h-20 sm:w-24 sm:h-24",
  lg: "w-28 h-28 sm:w-32 sm:h-32",
  xl: "w-36 h-36 sm:w-44 sm:h-44",
};

/**
 * Renders an artwork from `src/assets/elements/` as a tactile die-cut vinyl sticker,
 * postage stamp, or mini polaroid cutout for decorating pages.
 */
export function StickerBadge({
  name,
  alt = "",
  className = "",
  size = "md",
  variant = "diecut",
  caption,
}: StickerBadgeProps) {
  const src = STICKERS[name];

  if (variant === "polaroid") {
    return (
      <div
        className={`inline-flex flex-col items-center bg-white p-2 pb-3 rounded-2xl border-2 border-[#3E2217]/20 shadow-[0_10px_25px_rgba(62,34,23,0.16)] select-none ${className}`}
      >
        <div className={`${SIZE_MAP[size]} rounded-xl overflow-hidden bg-white`}>
          <img src={src} alt={alt} className="w-full h-full object-contain" />
        </div>
        {caption && (
          <span className="font-cursive text-xs sm:text-sm text-[#3E2217] mt-1.5 leading-none">
            {caption}
          </span>
        )}
      </div>
    );
  }

  if (variant === "stamp") {
    return (
      <div
        className={`inline-flex flex-col items-center bg-[#FAF6EC] p-2 rounded-xl border-2 border-dashed border-[#3E2217]/35 shadow-[0_8px_20px_rgba(62,34,23,0.14)] select-none ${className}`}
      >
        <div className={`${SIZE_MAP[size]} rounded-lg overflow-hidden bg-white p-1`}>
          <img src={src} alt={alt} className="w-full h-full object-contain" />
        </div>
        {caption && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#3E2217]/80 mt-1">
            {caption}
          </span>
        )}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-white p-1.5 border-[3px] border-white shadow-[0_8px_22px_rgba(62,34,23,0.18)] ring-1 ring-[#3E2217]/15 overflow-hidden select-none ${SIZE_MAP[size]} ${className}`}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover rounded-full" />
      </div>
    );
  }

  // Default: "diecut" vinyl sticker with thick white contour border & drop shadow
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-white p-1.5 border-[3px] border-white shadow-[0_8px_22px_rgba(62,34,23,0.18)] ring-1 ring-[#3E2217]/12 select-none ${SIZE_MAP[size]} ${className}`}
    >
      <img src={src} alt={alt} className="w-full h-full object-contain rounded-xl" />
    </div>
  );
}
