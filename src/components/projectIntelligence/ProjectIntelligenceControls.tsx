import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  analyzeProject,
  cancelPiJob,
  fetchPiProjectPref,
  fetchPiQuota,
  fetchPiStatus,
  patchPiProjectPref,
} from "../../api/projectIntelligence";
import { getApiErrorMessage } from "../../utils/apiError";
import { GenerateWithAiPanel } from "./GenerateWithAiPanel";

type Props = {
  projectId: string;
  shortDescription: string;
  fullDescription: string;
  onApplyDescriptions: (fields: { short?: string; full?: string }) => void;
};

export function ProjectIntelligenceControls({
  projectId,
  shortDescription,
  fullDescription,
  onApplyDescriptions,
}: Props) {
  const qc = useQueryClient();
  const pref = useQuery({
    queryKey: ["pi-project-pref", projectId],
    queryFn: () => fetchPiProjectPref(projectId),
    retry: false,
  });
  const status = useQuery({
    queryKey: ["pi-status", projectId],
    queryFn: () => fetchPiStatus(projectId),
    retry: false,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s && ["queued", "analyzing", "generating"].includes(s) ? 2000 : false;
    },
  });
  const quota = useQuery({
    queryKey: ["pi-quota", projectId],
    queryFn: () => fetchPiQuota(projectId),
    retry: false,
  });

  const savePref = useMutation({
    mutationFn: (body: { intelligence_enabled?: boolean | null; external_ai_allowed?: boolean }) =>
      patchPiProjectPref(projectId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pi-project-pref", projectId] }),
  });

  const analyze = useMutation({
    mutationFn: () => analyzeProject(projectId, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pi-status", projectId] });
      qc.invalidateQueries({ queryKey: ["pi-quota", projectId] });
      qc.invalidateQueries({ queryKey: ["pi-insights", projectId] });
    },
  });

  if (pref.isError) {
    const msg = getApiErrorMessage(pref.error);
    if (/not enabled|404/i.test(msg)) return null;
  }

  const enabled = pref.data?.intelligence_enabled;
  const effective = pref.data?.effective_auto_analyze;

  return (
    <div className="space-y-4 border-t border-stone-100 pt-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Project Intelligence</h3>
        <p className="mt-1 text-xs text-stone-600">
          Evidence analysis runs on your uploaded source without changing your title or descriptions.
          AI description generation is optional and always requires your approval.
        </p>
      </div>

      {pref.data && (
        <div className="space-y-2 text-sm text-stone-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled !== false && (enabled === true || Boolean(effective))}
              onChange={(e) =>
                savePref.mutate({ intelligence_enabled: e.target.checked ? true : false })
              }
            />
            Enable Project Intelligence for this project
          </label>
          <p className="text-xs text-stone-500">
            Status: {status.data?.status || "none"}
            {status.data?.coverage_pct != null ? ` · ${status.data.coverage_pct}% coverage` : ""}
            {status.data?.error ? ` · ${status.data.error}` : ""}
          </p>
          {quota.data && (
            <p className="text-xs text-stone-600">
              {quota.data.premium
                ? `Premium: ${quota.data.remaining ?? "—"} of ${quota.data.limit} AI projects left this month.`
                : `Free: ${quota.data.remaining ?? 0} of ${quota.data.limit} AI projects left this month` +
                  (quota.data.project_has_ai ? " · this project already has AI content." : ".")}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-stone-300 px-4 py-1.5 text-xs font-semibold text-stone-700 disabled:opacity-50"
              disabled={analyze.isPending}
              onClick={() => analyze.mutate()}
            >
              {analyze.isPending ? "Analyzing…" : "Analyze / refresh evidence"}
            </button>
            {status.data?.status && ["queued", "analyzing", "generating"].includes(status.data.status) && (
              <button
                type="button"
                className="rounded-full border border-stone-300 px-4 py-1.5 text-xs font-semibold text-stone-700"
                onClick={async () => {
                  await cancelPiJob(projectId);
                  qc.invalidateQueries({ queryKey: ["pi-status", projectId] });
                }}
              >
                Cancel
              </button>
            )}
          </div>
          {analyze.isError && <p className="text-xs text-red-700">{getApiErrorMessage(analyze.error)}</p>}
        </div>
      )}

      <GenerateWithAiPanel
        projectId={projectId}
        currentShort={shortDescription}
        currentFull={fullDescription}
        onApplied={onApplyDescriptions}
      />
    </div>
  );
}
