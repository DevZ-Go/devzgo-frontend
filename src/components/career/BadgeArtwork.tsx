import type { Badge } from "../../api/career";

/**
 * Asset-ready badge visual. Swap the SVG body for a PNG/SVG asset later via
 * `assetSrc` without changing card layout. Tier differentiation uses a readable
 * rim label + metal tones (not colour alone).
 */
const METAL: Record<string, { face: string; rim: string; ink: string }> = {
  bronze: { face: "#A67C52", rim: "#8B6914", ink: "#FFF8CA" },
  silver: { face: "#9AA3AD", rim: "#6B7280", ink: "#FAF7EE" },
  gold: { face: "#C4A35A", rim: "#8B6914", ink: "#FFF8CA" },
  antique: { face: "#C4A35A", rim: "#8B6914", ink: "#FFF8CA" },
  maroon: { face: "#6B0B0C", rim: "#4A121A", ink: "#FFF8CA" },
  slate: { face: "#5B6470", rim: "#3F4650", ink: "#FAF7EE" },
};

function paletteFor(badge: Badge) {
  if (badge.family === "skill_evidence") {
    return METAL[badge.track] || METAL.bronze;
  }
  if (badge.family === "premium") return METAL.maroon;
  if (badge.family === "assessment") return METAL.maroon;
  if (badge.family === "experience") {
    const months = Number(badge.stable_key.match(/_(\d+)m$/)?.[1] || 0);
    if (months >= 36) return METAL.gold;
    if (months >= 12) return METAL.antique;
    return METAL.bronze;
  }
  return METAL.slate;
}

function rimLabel(badge: Badge): string {
  if (badge.family === "skill_evidence") {
    const t = badge.track.charAt(0).toUpperCase() + badge.track.slice(1);
    return t.slice(0, 3).toUpperCase();
  }
  if (badge.family === "experience") {
    const months = Number(badge.stable_key.match(/_(\d+)m$/)?.[1] || 0);
    if (months >= 12 && months % 12 === 0) return `${months / 12}Y`;
    if (months > 0) return `${months}M`;
  }
  if (badge.family === "assessment" && badge.track === "participation") {
    const n = badge.stable_key.match(/_(\d+)$/)?.[1];
    return n ? String(n) : "★";
  }
  return "";
}

type Props = {
  badge: Badge;
  size?: number;
  /** Optional future asset URL (transparent PNG/SVG). Falls back to composed SVG. */
  assetSrc?: string | null;
  className?: string;
};

export function BadgeArtwork({ badge, size = 88, assetSrc, className = "" }: Props) {
  const metal = paletteFor(badge);
  const label = rimLabel(badge);

  if (assetSrc) {
    return (
      <img
        src={assetSrc}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className}`}
      />
    );
  }

  const isShield = badge.icon_key === "shield" || badge.family === "skill_evidence";
  const isCrest = badge.icon_key === "crest" || badge.family === "assessment";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label={badge.name}
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={`badge-face-${badge.stable_key}-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={metal.face} stopOpacity="1" />
          <stop offset="100%" stopColor={metal.rim} stopOpacity="0.92" />
        </linearGradient>
      </defs>

      {isShield ? (
        <path
          d="M48 8 L78 18 V42 C78 64 48 84 48 84 C48 84 18 64 18 42 V18 Z"
          fill={`url(#badge-face-${badge.stable_key}-${size})`}
          stroke={metal.rim}
          strokeWidth="2.5"
        />
      ) : (
        <circle cx="48" cy="48" r="36" fill={`url(#badge-face-${badge.stable_key}-${size})`} stroke={metal.rim} strokeWidth="2.5" />
      )}

      {/* Inner glyph */}
      {isShield ? (
        // Code / document mark
        <g fill="none" stroke={metal.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="34" y="30" width="28" height="34" rx="3" />
          <path d="M40 40 H56 M40 48 H52 M40 56 H50" />
        </g>
      ) : isCrest ? (
        <path
          d="M48 28 L54 40 H66 L56 48 L60 60 L48 52 L36 60 L40 48 L30 40 H42 Z"
          fill={metal.ink}
          opacity="0.95"
        />
      ) : (
        // Briefcase for experience / premium medallion
        <g fill="none" stroke={metal.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="30" y="40" width="36" height="24" rx="3" />
          <path d="M40 40 V36 C40 32 42 30 48 30 C54 30 56 32 56 36 V40" />
          <path d="M30 50 H66" />
        </g>
      )}

      {label ? (
        <g>
          <rect x="30" y="72" width="36" height="14" rx="7" fill={metal.rim} />
          <text
            x="48"
            y="82.5"
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill={metal.ink}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {label}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
