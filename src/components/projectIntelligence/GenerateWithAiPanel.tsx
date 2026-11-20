import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight } from "lucide-react";
import {
  approvePiDraft,
  discardPiDraft,
  fetchPiDrafts,
  fetchPiQuota,
  fetchPiStatus,
  generateWithAi,
  grantPiConsent,
  type AiDraft,
} from "../../api/projectIntelligence";
import { getApiErrorMessage } from "../../utils/apiError";

type Props = {
  projectId: string;
  currentShort?: string;
  currentFull?: string;
  onApplied?: (fields: { short?: string; full?: string }) => void;
  onApprovedContinue?: () => void;
  continueLabel?: string;
};

export function GenerateWithAiPanel({
  projectId,
  currentShort,
  currentFull,
  onApplied,
  onApprovedContinue,
  continueLabel = "Continue",
}: Props) {
  const qc = useQueryClient();
  const [consent, setConsent] = useState(false);
  const [includeDetailed, setIncludeDetailed] = useState(false);
  const [selected, setSelected] = useState<AiDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approvedDone, setApprovedDone] = useState(false);
  const [publishSimple, setPublishSimple] = useState(true);
  const [adoptShort, setAdoptShort] = useState(false);
  const [adoptDetailed, setAdoptDetailed] = useState(false);

  const drafts = useQuery({
    queryKey: ["pi-drafts", projectId],
    queryFn: () => fetchPiDrafts(projectId),
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

  const savedDraft = useMemo(
    () => (drafts.data || []).find((d) => d.status === "approved" || d.status === "draft") || null,
    [drafts.data],
  );

  const generate = useMutation({
    mutationFn: async (asRegen: boolean) => {
      setError(null);
      setApprovedDone(false);
      if (consent) {
        try {
          await grantPiConsent(projectId);
        } catch {
          /* ok */
        }
      }
      return generateWithAi(projectId, {
        grant_consent: consent,
        regenerate: asRegen,
        include_detailed: Boolean(quota.data?.premium && includeDetailed),
        idempotency_key: `ui:${projectId}:${includeDetailed ? "d" : "s"}:${asRegen ? "r" : "i"}:${Date.now()}`,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pi-drafts", projectId] });
      await qc.invalidateQueries({ queryKey: ["pi-status", projectId] });
      await qc.invalidateQueries({ queryKey: ["pi-quota", projectId] });
      const list = await fetchPiDrafts(projectId);
      setSelected(list.find((d) => d.status === "draft") || list[0] || null);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const approve = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("No draft selected");
      return approvePiDraft(projectId, selected.id, {
        publish_simple: publishSimple,
        show_detailed_on_page: Boolean(quota.data?.premium && includeDetailed),
        adopt_short: adoptShort,
        adopt_detailed: adoptDetailed,
        apply_short_description: false,
        apply_full_description: false,
      });
    },
    onSuccess: (draft) => {
      if (adoptShort || adoptDetailed) {
        onApplied?.({
          short: adoptShort ? draft.short_description || undefined : undefined,
          full: adoptDetailed ? draft.full_overview || undefined : undefined,
        });
      }
      setApprovedDone(true);
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["pi-drafts", projectId] });
      qc.invalidateQueries({ queryKey: ["pi-insights", projectId] });
      qc.invalidateQueries({ queryKey: ["pi-publication", projectId] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const jobStatus = status.data?.status;
  const busy =
    generate.isPending ||
    (jobStatus != null && ["queued", "analyzing", "generating"].includes(jobStatus));
  const q = quota.data;
  const canGenerate = q?.can_generate !== false && q?.ai_generate_enabled !== false;
  const canRegen = Boolean(q?.can_regenerate);

  if (approvedDone) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5" role="status">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-emerald-950">Done</h3>
              <p className="mt-1 text-sm text-emerald-900/80">
                Your AI package is saved. Your original writing was kept unless you chose to replace it.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {onApprovedContinue ? (
                <button
                  type="button"
                  onClick={onApprovedContinue}
                  className="inline-flex items-center gap-2 rounded-xl bg-maroon-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-maroon-900"
                >
                  {continueLabel}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setApprovedDone(false)}
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-medium text-emerald-950"
              >
                Generate again later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div>
        <h3 className="text-base font-semibold text-stone-900">Generate with AI</h3>
        <p className="mt-1 text-sm text-stone-600">
          Creates a short description, a simple explanation anyone can understand, and key feature
          highlights from your uploaded code evidence. Nothing is published until you approve.
        </p>
        {q && (
          <p className="mt-2 text-xs text-stone-500">
            {q.premium ? "Premium" : "Free"} plan ·{" "}
            {q.remaining == null ? "—" : `${q.remaining} of ${q.limit}`} AI projects left this month
            {q.project_has_ai
              ? " · regenerating this project uses a regeneration allowance"
              : " · this uses 1 AI project from your monthly allowance"}
          </p>
        )}
      </div>

      {q?.exhausted_message && !q.project_has_ai && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {q.exhausted_message}
        </div>
      )}

      {savedDraft && !selected && (
        <button
          type="button"
          onClick={() => setSelected(savedDraft)}
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-sm hover:border-maroon-300"
        >
          <span className="font-semibold text-stone-800">View saved draft</span>
          <span className="mt-0.5 block truncate text-stone-500">
            {savedDraft.short_description || savedDraft.how_it_works_simple || "Open"}
          </span>
        </button>
      )}

      {q?.premium && (
        <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-stone-300"
            checked={includeDetailed}
            onChange={(e) => setIncludeDetailed(e.target.checked)}
          />
          <span>
            <span className="font-semibold">Include detailed AI description</span>
            <span className="mt-0.5 block text-xs text-stone-500">
              Longer overview, technical explanation, and resume-ready highlights (Premium).
            </span>
          </span>
        </label>
      )}

      <label className="flex items-start gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-stone-300"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I allow project evidence summaries for this project to be processed by the configured AI
          provider.
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !consent || !canGenerate}
          onClick={() => generate.mutate(false)}
          className="rounded-xl bg-maroon-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-maroon-900 disabled:opacity-50"
        >
          {busy ? "Working…" : "Generate with AI"}
        </button>
        {q?.project_has_ai && (
          <button
            type="button"
            disabled={busy || !consent || !canRegen}
            onClick={() => generate.mutate(true)}
            className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 disabled:opacity-50"
          >
            Regenerate ({q.regenerations_used}/{q.regenerations_limit})
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {selected && (
        <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50/80 p-4 sm:p-5">
          <h4 className="font-semibold text-stone-900">Review before publishing</h4>
          <Field label="AI short description" value={selected.short_description} />
          <Field label="Simple explanation" value={selected.how_it_works_simple} />
          {selected.key_features?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Key features</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-stone-700">
                {selected.key_features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {selected.full_overview && (
            <Field label="Detailed description (Premium)" value={selected.full_overview} />
          )}
          {(currentShort || currentFull) && (
            <p className="text-xs text-stone-500">
              Your current written description stays as-is unless you choose to replace it below.
            </p>
          )}
          <label className="flex items-start gap-2 text-sm text-stone-700">
            <input type="checkbox" className="mt-1" checked={publishSimple} onChange={(e) => setPublishSimple(e.target.checked)} />
            <span>Publish the simple explanation on the project page (visitors can read it for free).</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-stone-700">
            <input type="checkbox" className="mt-1" checked={adoptShort} onChange={(e) => setAdoptShort(e.target.checked)} />
            <span>Replace my short description with the AI short description (can be restored later).</span>
          </label>
          {selected.full_overview && (
            <label className="flex items-start gap-2 text-sm text-stone-700">
              <input type="checkbox" className="mt-1" checked={adoptDetailed} onChange={(e) => setAdoptDetailed(e.target.checked)} />
              <span>Replace my full description with the AI detailed description.</span>
            </label>
          )}
          <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-4">
            <button
              type="button"
              className="rounded-xl bg-maroon-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={approve.isPending}
              onClick={() => approve.mutate()}
            >
              {approve.isPending ? "Saving…" : "Approve package"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
              onClick={async () => {
                await discardPiDraft(projectId, selected.id);
                setSelected(null);
                qc.invalidateQueries({ queryKey: ["pi-drafts", projectId] });
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-stone-800">{value}</p>
    </div>
  );
}
