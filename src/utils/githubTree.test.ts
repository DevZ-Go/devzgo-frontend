import { describe, expect, it } from "vitest";
import { githubTreeEntries } from "./githubTree";

describe("githubTreeEntries", () => {
  it("keeps files and folders and drops anything else", () => {
    const rows = githubTreeEntries([
      { path: "src", type: "tree" },
      { path: "src/app.py", type: "blob" },
      { path: "link", type: "commit" },
    ]);
    expect(rows.map((row) => row.file_path)).toEqual(["src", "src/app.py"]);
    expect(rows[1].parent_path).toBe("src");
    expect(rows[1].is_directory).toBe(false);
  });
});
