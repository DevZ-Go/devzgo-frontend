import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Link as LinkIcon, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import {
  analyzeProject,
  fetchPiClaims,
  fetchPiInsights,
  fetchPiQuota,
  fetchVisitorAiStatus,
  visitorGenerateAi,
  type Insights,
} from "../../api/projectIntelligence";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../utils/apiError";

type Props = {
  projectId: string;
  onOpenFile?: (path: string) => void;
  isTeam?: boolean;
};

export function UnderstandProject({ projectId, onOpenFile, isTeam }: Props) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [openSimple, setOpenSimple] = useState(true);
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
  const communityGenerate = useMutation({
    mutationFn: () => visitorGenerateAi(projectId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pi-insights", projectId] });
      await qc.invalidateQueries({ queryKey: ["pi-visitor-ai", projectId] });
      await qc.invalidateQueries({ queryKey: ["pi-claims", projectId] });
    },
  });

  if (insights.isLoading) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-500">Loading project insights…</p>
      </section>
    );
  }
  if (insights.isError) {
    if (/not enabled|404/i.test(getApiErrorMessage(insights.error))) return null;
    return null;
  }

  const data = insights.data as Insights | undefined;
  const visitor = visitorAi.data;
  const showCommunityCta = Boolean(token && !isTeam && visitor?.can_generate);

  if (!data?.available) {
    if (isTeam) {
      return (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl text-stone-900">Understand this project</h2>
          <p className="mt-2 text-sm text-stone-600">
            Automatic code insights are free. AI explanations are created only when you choose Generate with AI.
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
            <Link to={`/project/${projectId}/edit`} className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700">
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
    if (showCommunityCta) {
      return (
        <CommunityGenerateCard
          visitor={visitor!}
          pending={communityGenerate.isPending}
          error={communityGenerate.isError ? getApiErrorMessage(communityGenerate.error) : null}
          onGenerate={() => communityGenerate.mutate()}
        />
      );
    }
    return null;
  }

  const simple = data.simple_english || {};
  const technical = data.technical || {};
  const features = [
    ...(simple.capabilities || []),
    ...((simple.key_features as string[] | undefined) || []),
  ].filter(Boolean);
  const developer = data.developer || {};
  const hasSimple =
    Boolean(
      simple.what_is_this ||
        simple.what_it_does ||
        simple.how_it_works ||
        simple.why_use_it ||
        features.length ||
        developer.short_description ||
        developer.full_description,
    );
  const hasTech = Boolean(
    technical.architecture ||
      (technical.technologies || []).length ||
      (technical.api_routes || []).length ||
      technical.ai_detailed_description,
  );

  return (
    <div className="space-y-4">
      {showCommunityCta && !visitor?.summary_ready && !hasSimple && !hasTech && (
        <CommunityGenerateCard
          visitor={visitor!}
          pending={communityGenerate.isPending}
          error={communityGenerate.isError ? getApiErrorMessage(communityGenerate.error) : null}
          onGenerate={() => communityGenerate.mutate()}
        />
      )}

      {hasSimple && (
        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenSimple((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left sm:px-8"
            aria-expanded={openSimple}
          >
            <div>
              <h2 className="font-serif text-2xl text-stone-900">Understand this project</h2>
              <p className="mt-1 text-sm text-stone-500">A plain-language explanation for everyone.</p>
            </div>
            <ChevronDown className={`h-5 w-5 shrink-0 text-stone-500 transition ${openSimple ? "rotate-180" : ""}`} />
          </button>
          {openSimple && (
            <div className="space-y-5 border-t border-stone-100 px-6 py-6 sm:px-8">
              <Block title="What is this?">
                <p>
                  {simple.what_is_this ||
                    simple.what_it_does ||
                    developer.short_description ||
                    developer.title ||
                    "Not confirmed yet."}
                </p>
              </Block>
              <Block title="What does it do?">
                <p>{simple.what_it_does || developer.short_description || "Not confirmed yet."}</p>
              </Block>
              {(simple.why_use_it || !developer.short_description) && (
                <Block title="Why would someone use it?">
                  <p>{simple.why_use_it || "Not confirmed from the available evidence."}</p>
                </Block>
              )}
              {simple.who_benefits && (
                <Block title="Who could benefit?">
                  <p>{simple.who_benefits}</p>
                </Block>
              )}
              {features.length > 0 && (
                <Block title="Main features">
                  <ul className="list-disc space-y-1 pl-5">
                    {features.map((f: string) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </Block>
              )}
              <Block title="How it works, simply">
                <p>{simple.how_it_works || developer.full_description || "Not confirmed yet."}</p>
              </Block>
            </div>
          )}
        </section>
      )}

      {hasTech && (
        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenTech((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left sm:px-8"
            aria-expanded={openTech}
          >
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Technical insights</h2>
              <p className="mt-1 text-sm text-stone-500">Source-supported details for curious readers.</p>
            </div>
            <ChevronDown className={`h-5 w-5 shrink-0 text-stone-500 transition ${openTech ? "rotate-180" : ""}`} />
          </button>
          {openTech && (
            <div className="space-y-5 border-t border-stone-100 px-6 py-6 sm:px-8">
              {technical.ai_detailed_description && (
                <Block title="Detailed description">
                  <p className="whitespace-pre-wrap">{technical.ai_detailed_description}</p>
                </Block>
              )}
              <Block title="Architecture">
                <p>{technical.architecture || "Not enough evidence yet."}</p>
              </Block>
              {(technical.technologies || []).length > 0 && (
                <Block title="Technologies">
                  <p>{(technical.technologies || []).join(", ")}</p>
                </Block>
              )}
              {(technical.api_routes || []).length > 0 && (
                <Block title="API evidence">
                  <ul className="space-y-1 font-mono text-xs text-stone-700">
                    {(technical.api_routes || []).slice(0, 20).map((r, i) => (
                      <li key={`${r.method}-${r.path}-${i}`}>
                        <span className="font-semibold">{r.method}</span> {r.path}
                        {r.file && isTeam && onOpenFile ? (
                          <button type="button" className="ml-2 inline-flex items-center gap-1 text-maroon-800 underline" onClick={() => onOpenFile(r.file!)}>
                            <LinkIcon className="h-3 w-3" /> {r.file}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
              {claims.data && claims.data.length > 0 && (
                <Block title="Source-backed claims">
                  <ul className="space-y-2">
                    {claims.data.slice(0, 20).map((c) => (
                      <li key={c.id} className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                        {c.wording}
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
              {data.redacted && (
                <p className="text-xs text-stone-500">Some paths are hidden because you are not on the project team.</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function CommunityGenerateCard({
  visitor,
  pending,
  error,
  onGenerate,
}: {
  visitor: { used: number; limit: number | null; remaining: number | null; is_admin: boolean };
  pending: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  const quotaLabel = visitor.is_admin
    ? "Admins have unlimited community summaries."
    : `Uses 1 of your ${visitor.limit ?? 5} community AI projects (${visitor.remaining ?? 0} left).`;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-maroon-800" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl text-stone-900">Generate an AI summary</h2>
          <p className="mt-2 text-sm text-stone-600">
            Create a plain-English explanation and technical overview for this project. Once generated, it is saved
            for everyone who views the project later.
          </p>
          <p className="mt-2 text-xs text-stone-500">{quotaLabel}</p>
          <button
            type="button"
            disabled={pending}
            onClick={onGenerate}
            className="mt-4 rounded-xl bg-maroon-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Generating…" : "Generate AI summary"}
          </button>
          {error && <p className="mt-2 text-xs text-crimson-700">{error}</p>}
        </div>
      </div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
      <div className="text-sm leading-relaxed text-stone-600">{children}</div>
    </div>
  );
}
