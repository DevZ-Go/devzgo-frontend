import { describe, expect, it } from "vitest";
import type { Badge } from "../api/career";
import {
  cumulativeLadderKey,
  cumulativeTierRank,
  groupBadgesByLadder,
} from "./badgeTiers";

function badge(partial: Partial<Badge> & Pick<Badge, "id" | "stable_key" | "family" | "track" | "name">): Badge {
  return {
    description: "",
    icon_key: "medallion",
    criteria: "",
    criteria_version: 1,
    visibility: "private",
    evidence_refs: [],
    limitations: "",
    awarded_at: "2024-01-01T00:00:00Z",
    ...partial,
  };
}

describe("badgeTiers", () => {
  it("ranks experience by months from stable_key", () => {
    expect(cumulativeTierRank(badge({
      id: "1", stable_key: "exp_professional_6m", family: "experience", track: "professional", name: "6m",
    }))).toBe(6);
    expect(cumulativeTierRank(badge({
      id: "2", stable_key: "exp_professional_24m", family: "experience", track: "professional", name: "2y",
    }))).toBe(24);
  });

  it("collapses cumulative experience within a track to highest tier", () => {
    const groups = groupBadgesByLadder([
      badge({ id: "a", stable_key: "exp_professional_6m", family: "experience", track: "professional", name: "6 Months" }),
      badge({ id: "b", stable_key: "exp_professional_12m", family: "experience", track: "professional", name: "1 Year" }),
      badge({ id: "c", stable_key: "exp_professional_24m", family: "experience", track: "professional", name: "2 Years" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.primary.stable_key).toBe("exp_professional_24m");
    expect(groups[0]!.earlier.map((b) => b.stable_key)).toEqual([
      "exp_professional_6m",
      "exp_professional_12m",
    ]);
  });

  it("keeps distinct experience tracks separate", () => {
    const groups = groupBadgesByLadder([
      badge({ id: "a", stable_key: "exp_professional_12m", family: "experience", track: "professional", name: "Pro" }),
      badge({ id: "b", stable_key: "exp_internship_12m", family: "experience", track: "internship_coop", name: "Intern" }),
    ]);
    expect(groups).toHaveLength(2);
  });

  it("collapses skill evidence bronze→silver", () => {
    const groups = groupBadgesByLadder([
      badge({ id: "a", stable_key: "skill_bronze", family: "skill_evidence", track: "bronze", name: "Bronze", icon_key: "shield" }),
      badge({ id: "b", stable_key: "skill_silver", family: "skill_evidence", track: "silver", name: "Silver", icon_key: "shield" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.primary.track).toBe("silver");
    expect(groups[0]!.earlier).toHaveLength(1);
    expect(groups[0]!.earlier[0]!.track).toBe("bronze");
  });

  it("does not collapse distinct assessment performance badges", () => {
    const a = badge({
      id: "1", stable_key: "assess_skill_demonstrated", family: "assessment", track: "performance", name: "Skill Demonstrated", icon_key: "crest",
    });
    const b = badge({
      id: "2", stable_key: "assess_advanced", family: "assessment", track: "performance", name: "Advanced", icon_key: "crest",
    });
    expect(cumulativeLadderKey(a)).toBeNull();
    expect(cumulativeLadderKey(b)).toBeNull();
    expect(groupBadgesByLadder([a, b])).toHaveLength(2);
  });

  it("collapses assessment participation counts", () => {
    const groups = groupBadgesByLadder([
      badge({ id: "1", stable_key: "assess_participation_1", family: "assessment", track: "participation", name: "First", icon_key: "crest" }),
      badge({ id: "3", stable_key: "assess_participation_3", family: "assessment", track: "participation", name: "3", icon_key: "crest" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.primary.stable_key).toBe("assess_participation_3");
  });
});
