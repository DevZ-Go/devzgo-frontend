import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, File as FileIcon, Folder, FolderOpen } from "lucide-react";
import type { FileTreeNode } from "../utils/buildFileTree";

function TreeRows({
  nodes,
  depth,
  selectedPath,
  expanded,
  onToggle,
  onFileClick,
}: {
  nodes: FileTreeNode[];
  depth: number;
  selectedPath?: string | null;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onFileClick?: (node: FileTreeNode) => void;
}) {
  return (
    <ul className={depth === 0 ? "space-y-0.5" : "mt-0.5 space-y-0.5 border-l border-slate-200 pl-3 ml-2"}>
      {nodes.map((n) => {
        const isOpen = n.is_directory && expanded.has(n.path);
        return (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => {
                if (n.is_directory) {
                  onToggle(n.path);
                  return;
                }
                onFileClick?.(n);
              }}
              className={`w-full text-left flex items-start gap-1.5 py-1 px-2 rounded-lg border transition ${
                selectedPath === n.path
                  ? "bg-indigo-50 border-indigo-200"
                  : "border-transparent hover:border-slate-100 hover:bg-white"
              } cursor-pointer`}
              style={{ paddingLeft: depth === 0 ? undefined : 4 }}
            >
              {n.is_directory ? (
                <>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  {isOpen ? (
                    <FolderOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-3.5 shrink-0" />
                  <FileIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                </>
              )}
              <span className="text-slate-800 text-sm font-medium break-all">{n.name}</span>
            </button>
            {n.is_directory && isOpen && n.children.length > 0 && (
              <TreeRows
                nodes={n.children}
                depth={depth + 1}
                selectedPath={selectedPath}
                expanded={expanded}
                onToggle={onToggle}
                onFileClick={onFileClick}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function collectDirectoryPaths(nodes: FileTreeNode[], out: Set<string> = new Set()): Set<string> {
  for (const n of nodes) {
    if (n.is_directory) {
      out.add(n.path);
      collectDirectoryPaths(n.children, out);
    }
  }
  return out;
}

export function ProjectFileTree({
  roots,
  selectedPath,
  onFileClick,
}: {
  roots: FileTreeNode[];
  selectedPath?: string | null;
  onFileClick?: (node: FileTreeNode) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => collectDirectoryPaths(roots));
  const [initializedFor, setInitializedFor] = useState<string>("");

  // Re-expand all folders when the tree identity changes (new project / re-upload).
  useEffect(() => {
    const key = roots.map((r) => r.id).join(",");
    if (key !== initializedFor) {
      setExpanded(collectDirectoryPaths(roots));
      setInitializedFor(key);
    }
  }, [roots, initializedFor]);

  // Ensure ancestors of the selected file stay expanded.
  useEffect(() => {
    if (!selectedPath) return;
    const parts = selectedPath.split("/").filter(Boolean);
    if (parts.length <= 1) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      let acc = "";
      for (let i = 0; i < parts.length - 1; i++) {
        acc = acc ? `${acc}/${parts[i]}` : parts[i];
        next.add(acc);
      }
      return next;
    });
  }, [selectedPath]);

  if (roots.length === 0) return null;

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  return (
    <div className="max-h-[420px] overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50/50">
      <TreeRows
        nodes={roots}
        depth={0}
        selectedPath={selectedPath}
        expanded={expanded}
        onToggle={toggle}
        onFileClick={onFileClick}
      />
    </div>
  );
}

/** Breadcrumb for the selected workspace path. */
export function FilePathBreadcrumb({ path }: { path: string | null }) {
  if (!path) {
    return <span className="text-slate-400">Select a file to preview</span>;
  }
  const parts = path.split("/").filter(Boolean);
  return (
    <nav aria-label="File path" className="flex flex-wrap items-center gap-1">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        return (
          <span key={`${part}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && <span className="text-slate-600">/</span>}
            <span className={isLast ? "text-slate-100 font-semibold" : "text-slate-400"}>
              {part}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
