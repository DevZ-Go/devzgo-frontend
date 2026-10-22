import { describe, expect, it } from "vitest";
import { describeSource } from "./projectSource";

const SHA = "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b";

describe("describeSource", () => {
  it("names the repository, branch and commit of a GitHub snapshot", () => {
    const d = describeSource({
      kind: "github",
      repository: "octo/shop-api",
      default_branch: "main",
      snapshot: { origin: "github", ref: "main", commit_sha: SHA, synced_at: "2026-10-01T00:00:00Z" },
      sync_state: "ok",
    });
    expect(d?.label).toBe("From GitHub · octo/shop-api · main at 1a2b3c4");
    expect(d?.href).toBe(`https://github.com/octo/shop-api/tree/${SHA}`);
    expect(d?.state).toBeNull();
  });

  it("links the repository when the commit is unknown", () => {
    const d = describeSource({ kind: "github", repository: "octo/shop-api", default_branch: "main", snapshot: null });
    expect(d?.label).toBe("From GitHub · octo/shop-api");
    expect(d?.href).toBe("https://github.com/octo/shop-api");
  });

  it("describes ZIP uploads and failed replacements", () => {
    const d = describeSource({
      kind: "zip",
      snapshot: { origin: "zip", synced_at: "2026-10-01T00:00:00Z" },
      sync_state: "failed",
      sync_error: "ZIP contains a symlink",
    });
    expect(d).toMatchObject({ label: "From a ZIP upload", href: null, state: "failed", error: "ZIP contains a symlink" });
  });

  it("says nothing for projects without files or source details", () => {
    expect(describeSource(null)).toBeNull();
    expect(describeSource({ kind: "zip", snapshot: null, sync_state: null })).toBeNull();
  });
});
