import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Layers,
  Link as LinkIcon,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  analyzeProject,
  fetchPiClaims,
  fetchPiInsights,
  fetchPiQuota,
  fetchVisitorAiStatus,
  type Insights,
  type ProjectBrief,
} from "../../api/projectIntelligence";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../utils/apiError";

type Props = {
  projectId: string;
  onOpenFile?: (path: string) => void;
  isTeam?: boolean;
};

function briefFromInsights(data: Insights): ProjectBrief | null {
  const b = data.project_brief;
  if (b && (b.overview || b.headline || (b.features && b.features.length))) {
    return b;
  }
  const s = data.simple_english || {};
  const features = [...(s.key_features || []), ...(s.capabilities || [])].filter(Boolean);
  const overview = s.what_it_does || s.how_it_works || data.developer?.short_description || "";
  if (!overview && !features.length) return null;
  return {
    headline: s.what_is_this || data.developer?.title || "",
    overview,
    features,
    purpose: s.why_use_it || undefined,
    audience: s.who_benefits || undefined,
    workflow: s.how_it_works || undefined,
    limitations: s.uncertainties || data.uncertainties,
  };
}

export function UnderstandProject({ projectId, onOpenFile, isTeam }: Props) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [openTech, setOpenTech] = useState(false);

  const insights = useQuery({
    queryKey: ["pi-insights", projectId],
    queryFn: () => fetchPiInsights(projectId),
    retry: false,
  });
  const claims = useQuery({
    queryKey: ["pi-claims", projectId],
    queryFn: () => fetchPiClaims(projectId),
    enabled: openTech,
    retry: false,
  });
  const quota = useQuery({
    queryKey: ["pi-quota", projectId],
    queryFn: () => fetchPiQuota(projectId),
    enabled: Boolean(isTeam),
    retry: false,
  });
  const visitorAi = useQuery({
    queryKey: ["pi-visitor-ai", projectId],
    queryFn: () => fetchVisitorAiStatus(projectId),
    enabled: Boolean(token) && !isTeam,
    retry: false,
  });
  const analyze = useMutation({
    mutationFn: () => analyzeProject(projectId, true),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pi-insights", projectId] });
      await qc.invalidateQueries({ queryKey: ["pi-quota", projectId] });
    },
  });

  if (insights.isLoading) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-[#FFFDF8] p-6 shadow-sm">
        <p className="text-sm text-stone-500">Loading project explanation…</p>
      </section>
    );
  }
  if (insights.isError) {
    if (/not enabled|404/i.test(getApiErrorMessage(insights.error))) return null;
    return null;
  }

  const data = insights.data as Insights | undefined;
  if (!data?.available) {
    if (isTeam) {
      return (
        <section className="rounded-2xl border border-stone-200 bg-[#FFFDF8] p-6 shadow-sm">
          <h2 className="font-serif text-2xl text-stone-900">Understand this project</h2>
          <p className="mt-2 text-sm text-stone-600">
            Run automatic analysis for a basic overview, or generate a polished AI explanation from
            the edit page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={analyze.isPending}
              onClick={() => analyze.mutate()}
              className="rounded-xl bg-maroon-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {analyze.isPending ? "Analyzing…" : "Run automatic analysis"}
            </button>
            <Link
              to={`/project/${projectId}/edit`}
              className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700"
            >
              Generate with AI
            </Link>
          </div>
          {quota.data && (
            <p className="mt-2 text-xs text-stone-500">
              AI projects left this month: {quota.data.remaining ?? 0}/{quota.data.limit}
            </p>
          )}
        </section>
      );
    }
    return null;
  }

  const brief = briefFromInsights(data);
  const technical = data.technical || {};
  const hasTech = Boolean(
    technical.architecture ||
      (technical.technologies || []).length ||
      (technical.api_routes || []).length ||
      technical.ai_detailed_description,
  );
  const isAi = Boolean(data.ai_explanation_valid || data.explanation_kind === "ai");
  // Never show a large visitor generation banner when a usable brief already exists.
  const showOwnerRegen = Boolean(isTeam);

  if (!brief) {
    return isTeam ? (
      <section className="rounded-2xl border border-stone-200 bg-[#FFFDF8] p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-stone-900">Understand this project</h2>
        <p className="mt-2 text-sm text-stone-600">
          No visitor-ready explanation yet. Generate one from the project edit page when you are ready.
        </p>
        <Link
          to={`/project/${projectId}/edit`}
          className="mt-4 inline-flex rounded-xl bg-maroon-800 px-4 py-2 text-xs font-semibold text-white"
        >
          Open Generate with AI
        </Link>
      </section>
    ) : null;
  }

  const metaBits = [brief.context, brief.scope].filter(Boolean);
  const features = (brief.features || []).filter(Boolean).slice(0, 6);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-stone-200/90 bg-[#FFFDF8] shadow-sm">
        <div className="border-b border-stone-100 px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            {isAi ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-maroon-800/8 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-maroon-800">
                <Sparkles className="h-3 w-3" aria-hidden />
                AI-explained in simple English
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-stone-600">
                Project overview
              </span>
            )}
            {showOwnerRegen && (
              <Link
                to={`/project/${projectId}/edit`}
                className="ml-auto text-[11px] font-semibold text-stone-500 hover:text-maroon-800"
              >
                Regenerate in edit
              </Link>
            )}
          </div>
          <h2 className="mt-3 font-serif text-2xl leading-snug text-stone-900 sm:text-[1.75rem]">
            {brief.headline || "Understand this project"}
          </h2>
          {brief.overview && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600 sm:text-[15px]">
              {brief.overview}
            </p>
          )}
          {metaBits.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-stone-500">{metaBits.join(" · ")}</p>
          )}
        </div>

        {features.length > 0 && (
          <div className="grid gap-3 border-b border-stone-100 px-6 py-5 sm:grid-cols-2 sm:px-8">
            {features.map((f) => (
              <div key={f} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-maroon-800/10 text-maroon-800">
                  <Layers className="h-3.5 w-3.5" aria-hidden />
                </span>
                <p className="text-sm leading-snug text-stone-700">{f}</p>
              </div>
            ))}
          </div>
        )}

        {(brief.purpose || brief.audience || brief.workflow) && (
          <div className="space-y-4 px-6 py-5 sm:px-8">
            {brief.purpose && (
              <BriefRow icon={Target} title="Why it matters" body={brief.purpose} />
            )}
            {brief.audience && (
              <BriefRow icon={Users} title="Who it helps" body={brief.audience} />
            )}
            {brief.workflow && (
              <BriefRow icon={Workflow} title="How it works" body={brief.workflow} />
            )}
          </div>
        )}

        {brief.limitations && brief.limitations.length > 0 && isTeam && (
          <div className="border-t border-stone-100 px-6 py-4 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Notes</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-stone-500">
              {brief.limitations.slice(0, 3).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {hasTech && (
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setOpenTech((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left sm:px-8"
            aria-expanded={openTech}
          >
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Technical details</h3>
              <p className="mt-0.5 text-xs text-stone-500">Source-backed notes for curious readers.</p>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-stone-500 transition ${openTech ? "rotate-180" : ""}`} />
          </button>
          {openTech && (
            <div className="space-y-4 border-t border-stone-100 px-6 py-5 sm:px-8">
              {technical.ai_detailed_description && (
                <TechBlock title="Detailed description">
                  <p className="whitespace-pre-wrap">{technical.ai_detailed_description}</p>
                </TechBlock>
              )}
              {technical.architecture && (
                <TechBlock title="Architecture">
                  <p>{technical.architecture}</p>
                </TechBlock>
              )}
              {(technical.technologies || []).length > 0 && (
                <TechBlock title="Technologies">
                  <p>{(technical.technologies || []).join(", ")}</p>
                </TechBlock>
              )}
              {(technical.api_routes || []).length > 0 && (
                <TechBlock title="API evidence">
                  <ul className="space-y-1 font-mono text-xs text-stone-700">
                    {(technical.api_routes || []).slice(0, 20).map((r, i) => (
                      <li key={`${r.method}-${r.path}-${i}`}>
                        <span className="font-semibold">{r.method}</span> {r.path}
                        {r.file && isTeam && onOpenFile ? (
                          <button
                            type="button"
                            className="ml-2 inline-flex items-center gap-1 text-maroon-800 underline"
                            onClick={() => onOpenFile(r.file!)}
                          >
                            <LinkIcon className="h-3 w-3" /> {r.file}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </TechBlock>
              )}
              {claims.data && claims.data.length > 0 && (
                <TechBlock title="Source-backed claims">
                  <ul className="space-y-2">
                    {claims.data.slice(0, 20).map((c) => (
                      <li key={c.id} className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                        {c.wording}
                      </li>
                    ))}
                  </ul>
                </TechBlock>
              )}
              {data.redacted && (
                <p className="text-xs text-stone-500">
                  Some paths are hidden because you are not on the project team.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Quiet note for signed-in visitors only when no valid AI brief and they still have quota —
          no large generation banner on pages that already explain the project. */}
      {!isTeam && token && visitorAi.data?.can_generate && !data.ai_explanation_valid && !brief.overview && (
        <p className="text-xs text-stone-500">
          An AI explanation is not available yet for this project.
        </p>
      )}
    </div>
  );
}

function BriefRow({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Target;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-stone-700">{body}</p>
      </div>
    </div>
  );
}

function TechBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-semibold text-stone-800">{title}</h4>
      <div className="text-sm leading-relaxed text-stone-600">{children}</div>
    </div>
  );
}
