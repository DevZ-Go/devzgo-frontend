import type { ProjectFileEntry } from "../api";

export type GitTreeEntry = { path?: string; type?: string };

/** Turn GitHub's flat tree into the rows the project file tree already understands. */
export function githubTreeEntries(entries: GitTreeEntry[]): ProjectFileEntry[] {
  const rows: ProjectFileEntry[] = [];
  for (const entry of entries) {
    if (!entry.path || (entry.type !== "blob" && entry.type !== "tree")) continue;
    const parts = entry.path.split("/");
    rows.push({
      id: entry.path,
      file_name: parts[parts.length - 1] || entry.path,
      file_path: entry.path,
      is_directory: entry.type === "tree",
      parent_path: parts.length > 1 ? parts.slice(0, -1).join("/") : null,
    });
  }
  return rows;
}
