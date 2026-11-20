import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminProjectIntelligence,
  grantAdminPiPremium,
  patchAdminProjectIntelligence,
} from "../../api/admin";
import { getApiErrorMessage } from "../../utils/apiError";
import { ui } from "../../styles/editorial";

export function ProjectIntelligencePage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "project-intelligence"],
    queryFn: fetchAdminProjectIntelligence,
    retry: false,
  });
  const [limit, setLimit] = useState(10);
  const [premiumLimit, setPremiumLimit] = useState(30);
  const [freeRegen, setFreeRegen] = useState(1);
  const [premiumRegen, setPremiumRegen] = useState(3);
  const [visitor, setVisitor] = useState(true);
  const [visitorAi, setVisitorAi] = useState(true);
  const [visitorAiLimit, setVisitorAiLimit] = useState(5);
  const [aiGen, setAiGen] = useState(true);
  const [autoUpload, setAutoUpload] = useState(true);
  const [dailyBudget, setDailyBudget] = useState(50);
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [message, setMessage] = useState<string | null>(null);
  const [premiumEmail, setPremiumEmail] = useState("");
  const [premiumDays, setPremiumDays] = useState("");

  useEffect(() => {
    const s = query.data?.settings;
    if (!s) return;
    setLimit(Number(s.free_project_limit ?? 10));
    setPremiumLimit(Number(s.premium_project_limit ?? 30));
    setFreeRegen(Number(s.free_regenerations_per_project ?? 1));
    setPremiumRegen(Number(s.premium_regenerations_per_project ?? 3));
    setVisitor(Boolean(s.visitor_insights_enabled));
    setVisitorAi(s.visitor_ai_enabled !== false);
    setVisitorAiLimit(Number(s.visitor_ai_project_limit ?? 5));
    setAiGen(Boolean(s.ai_generate_enabled));
    setAutoUpload(Boolean(s.auto_analyze_on_upload));
    setDailyBudget(Number(s.global_daily_budget_usd ?? 50));
    setMonthlyBudget(Number(s.global_monthly_budget_usd ?? 500));
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      patchAdminProjectIntelligence({
        free_project_limit: Math.max(0, Number(limit) || 0),
        premium_project_limit: Math.max(0, Number(premiumLimit) || 0),
        free_regenerations_per_project: Math.max(0, Number(freeRegen) || 0),
        premium_regenerations_per_project: Math.max(0, Number(premiumRegen) || 0),
        visitor_insights_enabled: visitor,
        visitor_ai_enabled: visitorAi,
        visitor_ai_project_limit: Math.max(0, Number(visitorAiLimit) || 0),
        ai_generate_enabled: aiGen,
        auto_analyze_on_upload: autoUpload,
        global_daily_budget_usd: Math.max(0, Number(dailyBudget) || 0),
        global_monthly_budget_usd: Math.max(0, Number(monthlyBudget) || 0),
      }),
    onSuccess: async () => {
      setMessage("Saved. Limits apply immediately.");
      await qc.invalidateQueries({ queryKey: ["admin", "project-intelligence"] });
    },
    onError: (err) => setMessage(getApiErrorMessage(err)),
  });

  const premium = useMutation({
    mutationFn: (revoke: boolean) =>
      grantAdminPiPremium({
        email: premiumEmail.trim(),
        days: premiumDays ? Number(premiumDays) : undefined,
        revoke,
      }),
    onSuccess: async (_data, revoke) => {
      setMessage(revoke ? "Premium removed." : "Premium assigned.");
      setPremiumEmail("");
      await qc.invalidateQueries({ queryKey: ["admin", "project-intelligence"] });
    },
    onError: (err) => setMessage(getApiErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    save.mutate();
  }

  if (query.isLoading) return <p className="text-sm text-stone-500">Loading…</p>;
  if (query.isError) {
    return <p className="text-sm text-crimson-700">{getApiErrorMessage(query.error)}</p>;
  }

  const overview = query.data?.overview;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-stone-900">Project Intelligence</h2>
        <p className="mt-1 text-sm text-stone-500">
          Quotas, spending ceilings, and Premium assignment. API keys are never shown here.
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Feature flag:{" "}
          <span className="font-semibold text-stone-800">
            {query.data?.feature_flag_enabled ? "on" : "off"}
          </span>
        </p>
      </div>

      {overview && (
        <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${ui.card} p-4`}>
          <Stat label="Daily spend" value={`$${(overview.daily_spend_usd ?? 0).toFixed(2)}`} />
          <Stat label="Monthly spend" value={`$${(overview.monthly_spend_usd ?? 0).toFixed(2)}`} />
          <Stat label="Monthly requests" value={String(overview.monthly_requests ?? 0)} />
          <Stat label="Enhanced projects" value={String(overview.unique_enhanced_projects ?? 0)} />
          <Stat label="Failed gens" value={String(overview.failed_generations ?? 0)} />
          <Stat label="Premium entitlements" value={String(overview.active_premium_entitlements ?? 0)} />
          <Stat
            label="Tokens (month)"
            value={`${overview.monthly_tokens_in ?? 0} in / ${overview.monthly_tokens_out ?? 0} out`}
          />
          <Stat
            label="AI generation"
            value={overview.ai_generate_enabled ? "enabled" : "disabled"}
          />
        </div>
      )}

      <form onSubmit={onSubmit} className={`space-y-4 ${ui.card} p-5`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Num label="Free AI projects / month" value={limit} onChange={setLimit} />
          <Num label="Premium AI projects / month" value={premiumLimit} onChange={setPremiumLimit} />
          <Num label="Free regenerations / project" value={freeRegen} onChange={setFreeRegen} />
          <Num label="Premium regenerations / project" value={premiumRegen} onChange={setPremiumRegen} />
          <Num label="Global daily budget (USD)" value={dailyBudget} onChange={setDailyBudget} step="0.01" />
          <Num label="Global monthly budget (USD)" value={monthlyBudget} onChange={setMonthlyBudget} step="0.01" />
          <Num label="Community AI projects / user" value={visitorAiLimit} onChange={setVisitorAiLimit} />
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={aiGen} onChange={(e) => setAiGen(e.target.checked)} />
          AI generation enabled (global kill switch)
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={visitor} onChange={(e) => setVisitor(e.target.checked)} />
          Visitor insights enabled
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={visitorAi} onChange={(e) => setVisitorAi(e.target.checked)} />
          Community AI summaries (signed-in users, shared after first generate)
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={autoUpload} onChange={(e) => setAutoUpload(e.target.checked)} />
          Auto-analyze on upload (deterministic, no OpenAI)
        </label>
        <button type="submit" disabled={save.isPending} className={`${ui.btn} ${ui.primary}`}>
          {save.isPending ? "Saving…" : "Save settings"}
        </button>
      </form>

      <div className={`space-y-3 ${ui.card} p-5`}>
        <h3 className="font-semibold text-stone-900">Assign Premium</h3>
        <p className="text-xs text-stone-500">Manual only — no payments. Optional expiry in days.</p>
        <div className="flex flex-wrap gap-2">
          <input
            className={ui.input}
            placeholder="user@email.com"
            value={premiumEmail}
            onChange={(e) => setPremiumEmail(e.target.value)}
          />
          <input
            className={`${ui.input} w-28`}
            placeholder="Days"
            value={premiumDays}
            onChange={(e) => setPremiumDays(e.target.value)}
          />
          <button
            type="button"
            className={`${ui.btn} ${ui.primary}`}
            disabled={!premiumEmail.trim() || premium.isPending}
            onClick={() => premium.mutate(false)}
          >
            Grant
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.danger}`}
            disabled={!premiumEmail.trim() || premium.isPending}
            onClick={() => premium.mutate(true)}
          >
            Revoke
          </button>
        </div>
      </div>

      {overview?.near_quota_users && overview.near_quota_users.length > 0 && (
        <div className={`space-y-2 ${ui.card} p-5`}>
          <h3 className="font-semibold text-stone-900">Users near quota</h3>
          <ul className="space-y-1 text-sm text-stone-600">
            {overview.near_quota_users.map((u) => (
              <li key={u.user_id}>
                {u.user_id.slice(0, 8)}… · {u.ai_projects_used} projects · ${Number(u.cost_usd || 0).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && <p className="text-sm text-stone-700">{message}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-stone-800">{label}</span>
      <input
        type="number"
        min={0}
        step={step || "1"}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${ui.input} mt-1`}
      />
    </label>
  );
}
