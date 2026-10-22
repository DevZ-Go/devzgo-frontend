import { describe, expect, it } from "vitest";
import { branchProblem } from "./branchName";

describe("branchProblem", () => {
  it("allows a normal branch and rejects git-forbidden names", () => {
    expect(branchProblem("feature/editor")).toBeNull();
    for (const name of ["../x", "-wip", "a.lock", "has space", "a@{1}", "a..b", "a//b", ".hidden"]) {
      expect(branchProblem(name)).toBeTruthy();
    }
  });
});
