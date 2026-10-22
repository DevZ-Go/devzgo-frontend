import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import type { ProjectSource } from "../types/project";
import { describeSource } from "../utils/projectSource";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Where the files below come from, and whether the last update of them finished. */
export function ProjectSourceLine({ source }: { source: ProjectSource | null | undefined }) {
  const d = describeSource(source);
  if (!d) return null;
  return (
    <div className="mb-4 space-y-2 text-sm">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-stone-600">
        {d.href ? (
          <a href={d.href} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-maroon-800 hover:underline break-all">
            {d.label}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </a>
        ) : (
          <span className="font-medium text-stone-800">{d.label}</span>
        )}
        {d.syncedAt && <span className="text-stone-500">· updated {formatDate(d.syncedAt)}</span>}
      </p>
      {d.state === "pending" && (
        <p className="inline-flex items-center gap-2 text-stone-600">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Updating the files…
        </p>
      )}
      {d.state === "failed" && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            The last update didn&apos;t finish{d.syncedAt ? ", so these are the files from before it" : ""}.
            {d.error && <> {d.error}</>}
          </span>
        </p>
      )}
    </div>
  );
}
