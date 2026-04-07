import type { ProjectFileEntry } from "../api/projects";

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  is_directory: boolean;
  children: FileTreeNode[];
}

/**
 * Build a nested tree from flat `File` rows using `parent_path` and `file_path`.
 */
export function buildFileTreeFromEntries(files: ProjectFileEntry[]): FileTreeNode[] {
  const byPath = new Map<string, FileTreeNode>();
  for (const f of files) {
    byPath.set(f.file_path, {
      id: f.id,
      name: f.file_name,
      path: f.file_path,
      is_directory: f.is_directory,
      children: [],
    });
  }

  const roots: FileTreeNode[] = [];
  for (const f of files) {
    const node = byPath.get(f.file_path);
    if (!node) continue;
    const pp = f.parent_path?.trim() || "";
    if (!pp) {
      roots.push(node);
    } else {
      const parent = byPath.get(pp);
      if (parent?.is_directory) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  function sortChildren(n: FileTreeNode) {
    n.children.sort((a, b) => {
      if (a.is_directory !== b.is_directory) return a.is_directory ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
    n.children.forEach(sortChildren);
  }

  roots.sort((a, b) => {
    if (a.is_directory !== b.is_directory) return a.is_directory ? -1 : 1;
    return a.path.localeCompare(b.path, undefined, { sensitivity: "base" });
  });
  roots.forEach(sortChildren);
  return roots;
}
