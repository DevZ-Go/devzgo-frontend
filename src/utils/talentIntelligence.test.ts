import { describe, expect, it } from "vitest";
import type { SkillMatrix } from "../api/evidence";
import { criterionKey, deadlineText, fromLocalInput, minutesText, toLocalInput } from "./challenges";
import { fileLink, filterMatrix } from "./evidence";
import { addRequirement, removeRequirement, toggleImportance } from "./requirements";

const skill = (name: string, classes: SkillMatrix["categories"][number]["skills"][number]["classes"]) => ({
  name, category: "frontend", classes, sources: [], project_count: 1, owned_projects: 1, team_projects: 0, commits: 0,
  last_activity: null, projects: [],
});

describe("skill matrix filters", () => {
  const matrix: SkillMatrix = {
    user_id: "u", restricted: false, projects_considered: 1, projects_with_file_evidence: 1,
    totals: { skills: 3, detected: 2, contribution_linked: 1, declared: 1 },
    categories: [
      { key: "frontend", label: "Frontend", skills: [skill("React", ["contribution_linked", "detected"]), skill("Vue.js", ["detected"])] },
      { key: "data", label: "Data & AI", skills: [skill("pandas", ["declared"])] },
    ],
  };

  it("keeps only skills with the chosen evidence class and drops empty categories", () => {
    expect(filterMatrix(matrix, "all")).toHaveLength(2);
    expect(filterMatrix(matrix, "contribution_linked").map((c) => c.skills.map((s) => s.name))).toEqual([["React"]]);
    expect(filterMatrix(matrix, "declared").map((c) => c.key)).toEqual(["data"]);
  });

  it("links evidence files into the project file viewer", () => {
    expect(fileLink("p1", "src/App test.tsx")).toBe("/project/p1?file=src%2FApp%20test.tsx");
    expect(fileLink("p1", "a.py")).toBe("/project/p1?file=a.py");
  });
});

describe("requirement editing", () => {
  it("never lists a technology as both required and preferred", () => {
    let lists = addRequirement({ required: [], preferred: [] }, "  React ", "required");
    lists = addRequirement(lists, "react", "preferred");
    expect(lists).toEqual({ required: [], preferred: ["react"] });
    lists = toggleImportance(lists, "REACT");
    expect(lists).toEqual({ required: ["REACT"], preferred: [] });
    expect(addRequirement(lists, "react", "required")).toEqual(lists);
    expect(removeRequirement(lists, "react")).toEqual({ required: [], preferred: [] });
    expect(addRequirement(lists, "   ", "required")).toBe(lists);
  });
});

describe("challenge deadlines", () => {
  it("round-trips local input values through UTC", () => {
    const iso = fromLocalInput("2026-11-03T17:30");
    expect(iso).not.toBeNull();
    expect(toLocalInput(iso)).toBe("2026-11-03T17:30");
    expect(fromLocalInput("")).toBeNull();
  });

  it("makes rubric keys the server accepts", () => {
    expect(criterionKey("API design & docs", [])).toBe("api_design_docs");
    expect(criterionKey("Testing", ["testing", "testing_2"])).toBe("testing_3");
    expect(criterionKey("!!!", [])).toBe("criterion");
  });

  it("describes time left without guessing", () => {
    const now = new Date("2026-10-22T12:00:00Z");
    expect(deadlineText(null, now)).toBe("No deadline");
    expect(deadlineText("2026-10-22T11:00:00Z", now)).toBe("Deadline passed");
    expect(deadlineText("2026-10-22T12:20:00Z", now)).toBe("Closes in under an hour");
    expect(deadlineText("2026-10-22T17:00:00Z", now)).toBe("Closes in 5 hours");
    expect(deadlineText("2026-10-26T12:00:00Z", now)).toBe("Closes in 4 days");
    expect(minutesText(90)).toBe("About 1.5 h");
    expect(minutesText(45)).toBe("About 45 min");
  });
});
