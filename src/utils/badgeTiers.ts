import type { Badge } from "../api/career";

/** Display order for badge families as defined by the badge engine. */
export const BADGE_FAMILY_ORDER = ["experience", "skill_evidence", "assessment", "premium"] as const;

export type BadgeFamily = (typeof BADGE_FAMILY_ORDER)[number] | string;

const SKILL_TIER_RANK: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  // platinum/diamond exist in seeds but stay disabled / never earned while inactive
  platinum: 4,
  diamond: 5,
};

/**
 * Ladder key for genuinely cumulative tiers (same track).
 * Returns null when the badge is a distinct achievement that must stay visible on its own.
 *
 * Domain rules (from badge_engine SEED_DEFINITIONS):
 * - experience: cumulative months within track (professional, internship_coop, freelance, volunteer)
 * - skill_evidence: bronze → silver → gold (single ladder)
 * - assessment participation: 1 → 3 → 5 → 10 reviews
 * - assessment performance / premium: distinct achievements (not collapsed)
 */
export function cumulativeLadderKey(badge: Badge): string | null {
  if (badge.family === "experience" && badge.track) {
    return `experience:${badge.track}`;
  }
  if (badge.family === "skill_evidence") {
    return "skill_evidence";
  }
  if (badge.family === "assessment" && badge.track === "participation") {
    return "assessment:participation";
  }
  return null;
}

/** Numeric rank within a cumulative ladder — higher = later / higher tier. */
export function cumulativeTierRank(badge: Badge): number {
  if (badge.family === "experience") {
    const match = badge.stable_key.match(/_(\d+)m$/);
    return match ? Number(match[1]) : 0;
  }
  if (badge.family === "skill_evidence") {
    return SKILL_TIER_RANK[badge.track] ?? 0;
  }
  if (badge.family === "assessment" && badge.track === "participation") {
    const match = badge.stable_key.match(/_(\d+)$/);
    return match ? Number(match[1]) : 0;
  }
  return 0;
}

export type BadgeLadderGroup = {
  key: string;
  family: string;
  /** Highest earned tier in this ladder (or the sole badge). */
  primary: Badge;
  /** Earlier earned tiers, lowest → highest (excludes primary). */
  earlier: Badge[];
};

/**
 * Collapse cumulative ladders to highest-earned primary + earlier list.
 * Distinct achievements (no ladder) each become their own group.
 */
export function groupBadgesByLadder(badges: Badge[]): BadgeLadderGroup[] {
  const ladders = new Map<string, Badge[]>();
  const singles: Badge[] = [];

  for (const badge of badges) {
    const key = cumulativeLadderKey(badge);
    if (!key) {
      singles.push(badge);
      continue;
    }
    const list = ladders.get(key) || [];
    list.push(badge);
    ladders.set(key, list);
  }

  const groups: BadgeLadderGroup[] = [];

  for (const [key, list] of ladders) {
    const sorted = [...list].sort((a, b) => cumulativeTierRank(a) - cumulativeTierRank(b));
    const primary = sorted[sorted.length - 1]!;
    const earlier = sorted.slice(0, -1);
    groups.push({ key, family: primary.family, primary, earlier });
  }

  for (const badge of singles) {
    groups.push({
      key: `solo:${badge.id}`,
      family: badge.family,
      primary: badge,
      earlier: [],
    });
  }

  const familyIndex = (family: string) => {
    const i = BADGE_FAMILY_ORDER.indexOf(family as (typeof BADGE_FAMILY_ORDER)[number]);
    return i === -1 ? 99 : i;
  };

  return groups.sort((a, b) => {
    const fam = familyIndex(a.family) - familyIndex(b.family);
    if (fam !== 0) return fam;
    if (a.family === "experience") {
      const trackCmp = a.primary.track.localeCompare(b.primary.track);
      if (trackCmp !== 0) return trackCmp;
      return cumulativeTierRank(b.primary) - cumulativeTierRank(a.primary);
    }
    if (a.family === "skill_evidence" || (a.family === "assessment" && a.primary.track === "participation")) {
      return cumulativeTierRank(b.primary) - cumulativeTierRank(a.primary);
    }
    return a.primary.name.localeCompare(b.primary.name);
  });
}

export function familyLabel(family: string): string {
  switch (family) {
    case "experience":
      return "Experience";
    case "skill_evidence":
      return "Skill Evidence";
    case "assessment":
      return "Assessments";
    case "premium":
      return "Premium";
    default:
      return family;
  }
}

/** Short card blurb from the definition description (not technical criteria). */
export function badgeCardBlurb(badge: Badge): string {
  return (badge.description || "").trim() || "Earned milestone.";
}
