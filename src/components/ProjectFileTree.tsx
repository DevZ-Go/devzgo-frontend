import { File as FileIcon, Folder } from "lucide-react";
import type { FileTreeNode } from "../utils/buildFileTree";

function TreeRows({
  nodes,
  depth,
}: {
  nodes: FileTreeNode[];
  depth: number;
}) {
  return (
    <ul className={depth === 0 ? "space-y-0.5" : "mt-0.5 space-y-0.5 border-l border-slate-200 pl-3 ml-2"}>
      {nodes.map((n) => (
        <li key={n.id}>
          <div
            className="flex items-start gap-2 py-1 px-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-100"
            style={{ paddingLeft: depth === 0 ? undefined : 4 }}
          >
            {n.is_directory ? (
              <Folder className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <FileIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            )}
            <span className="text-slate-800 text-sm font-medium break-all">{n.name}</span>
            {n.is_directory && (
              <span className="text-xs text-slate-400 font-mono shrink-0">/</span>
            )}
          </div>
          {n.children.length > 0 && (
            <TreeRows nodes={n.children} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function ProjectFileTree({ roots }: { roots: FileTreeNode[] }) {
  if (roots.length === 0) return null;
  return (
    <div className="max-h-[420px] overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50/50">
      <TreeRows nodes={roots} depth={0} />
    </div>
  );
}
