import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileCode2, Info, Loader2, Lock, RefreshCw } from "lucide-react";
import { fetchQualityReport, refreshQualityReport, type CheckEvidence, type CheckStatus, type StatusCounts } from "../../api/evidence";
import { queryKeys } from "../../api/queryKeys";
import { getApiErrorMessage } from "../../utils/apiError";
import { STATUS_META } from "../../utils/evidence";

const ORDER: CheckStatus[] = ["found", "needs_review", "not_detected", "not_assessed"];

function StatusBadge({ status }: { status: CheckStatus }) {
  const meta = STATUS_META[status];
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.tone}`}>{meta.label}</span>;
}

function Counts({ counts }: { counts: StatusCounts }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ORDER.filter((s) => counts[s] > 0).map((s) => (
        <span key={s} className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_META[s].tone}`}>
          {counts[s]} {STATUS_META[s].label.toLowerCase()}
        </span>
      ))}
    </div>
  );
}

function Evidence({ item, onOpenFile }: { item: CheckEvidence; onOpenFile?: (path: string) => void }) {
  const chip = "inline-flex max-w-full items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700";
  if (item.file) {
    const text = `${item.file}${item.line ? `:${item.line}` : ""}`;
    return onOpenFile ? (
      <button type="button" onClick={() => onOpenFile(item.file!)} className={`${chip} font-mono hover:border-maroon-700 hover:text-maroon-800`}>
        <FileCode2 className="h-3 w-3 shrink-0" /><span className="truncate">{text}</span>
      </button>
    ) : <span className={`${chip} font-mono`}><FileCode2 className="h-3 w-3 shrink-0" /><span className="truncate">{text}</span></span>;
  }
  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={`${chip} hover:border-maroon-700 hover:text-maroon-800`}>
        <ExternalLink className="h-3 w-3 shrink-0" /><span className="truncate">{item.label || item.url}</span>
      </a>
    );
  }
  return item.label ? <span className={chip}>{item.label}</span> : null;
}

/** Rule-based quality and impact report for one project. Never runs the project's code. */
export function ProjectQualityReport({ projectId, onOpenFile }: { projectId: string; onOpenFile?: (path: string) => void }) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.qualityReport(projectId), queryFn: () => fetchQualityReport(projectId) });
  const refresh = useMutation({
    mutationFn: () => refreshQualityReport(projectId),
    onSuccess: (report) => client.setQueryData(queryKeys.qualityReport(projectId), report),
  });
  const report = query.data;

  if (query.isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>;
  if (query.isError || !report) {
    return <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">{getApiErrorMessage(query.error)}</p>;
  }
  const team = report.audience === "team";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl text-stone-900">Project report</h2>
            <p className="mt-1 max-w-2xl text-sm text-stone-600">
              Rule-based checks over the project's files and activity. DevZ-Go never runs the code, so a check shows that
              evidence exists, not that it works.
            </p>
            <p className="mt-2 text-xs text-stone-500">
              {report.analyzed_at
                ? `Source analysed ${new Date(report.analyzed_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                : report.has_source ? "The source has not been analysed for this report yet." : "No source code has been added to this project."}
            </p>
          </div>
          {report.can_refresh && (
            <button type="button" onClick={() => refresh.mutate()} disabled={refresh.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-maroon-800 px-4 py-2 text-sm font-semibold text-maroon-800 transition hover:bg-maroon-800 hover:text-amber-50 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`} />
              {refresh.isPending ? "Analysing…" : "Re-analyse source"}
            </button>
          )}
        </div>
        {refresh.isError && <p className="mt-3 text-sm text-crimson-700">{getApiErrorMessage(refresh.error)}</p>}
        {report.has_source && !report.source_recorded && (
          <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            {team
              ? "This project was uploaded before reports existed, so source checks show “Not assessed”. Re-analyse to check the stored source."
              : "Source checks show “Not assessed” until the project team re-analyses the stored source."}
          </p>
        )}
        <div className="mt-4"><Counts counts={report.totals} /></div>
      </section>

      {team && report.recommendations.length > 0 && (
        <section className="rounded-3xl border border-maroon-800/20 bg-[#fffdf3] p-5 sm:p-6">
          <h3 className="font-serif text-xl text-stone-900">Suggested next steps</h3>
          <p className="mt-1 text-xs text-stone-500">Only the project team sees these.</p>
          <ul className="mt-3 space-y-2">
            {report.recommendations.map((r) => (
              <li key={r.check} className="flex flex-wrap items-start gap-2 text-sm text-stone-700">
                <StatusBadge status={r.status} /><span className="min-w-0 flex-1">{r.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.sections.map((section) => (
        <section key={section.key} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby={`report-${section.key}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id={`report-${section.key}`} className="font-serif text-xl text-stone-900">{section.label}</h3>
            {!section.restricted && <Counts counts={section.summary} />}
          </div>
          {section.restricted ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-stone-500"><Lock className="h-4 w-4" /> Visible to the project team only.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-100">
              {section.checks.map((check) => (
                <li key={check.key} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-stone-900">{check.label}</span>
                    <StatusBadge status={check.status} />
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{check.detail}</p>
                  {check.evidence.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {check.evidence.map((item, i) => <Evidence key={i} item={item} onOpenFile={onOpenFile} />)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
