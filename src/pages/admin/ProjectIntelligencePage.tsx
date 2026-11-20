import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminRegenerateProjectSummary,
  fetchAdminPiProjects,
  fetchAdminPiUserDetail,
  fetchAdminPiUsers,
  fetchAdminProjectIntelligence,
  grantAdminPiPremium,
  patchAdminProjectIntelligence,
  type AdminPiUserDetail,
  type AdminPiUserSummary,
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

  const [usageQuery, setUsageQuery] = useState("");
  const [usageSearch, setUsageSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [regenProjectId, setRegenProjectId] = useState("");
  const [regenDetailed, setRegenDetailed] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [projectSearch, setProjectSearch] = useState("");

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

  const usersQuery = useQuery({
    queryKey: ["admin", "project-intelligence", "users", usageSearch],
    queryFn: () => fetchAdminPiUsers({ q: usageSearch || undefined, limit: 50 }),
    retry: false,
  });

  const detailQuery = useQuery({
    queryKey: ["admin", "project-intelligence", "user", selectedUserId],
    queryFn: () => fetchAdminPiUserDetail(selectedUserId!),
    enabled: Boolean(selectedUserId),
    retry: false,
  });

  const projectsQuery = useQuery({
    queryKey: ["admin", "project-intelligence", "projects", projectSearch],
    queryFn: () => fetchAdminPiProjects({ q: projectSearch || undefined, limit: 25 }),
    retry: false,
  });

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

  const regenerate = useMutation({
    mutationFn: (projectId: string) =>
      adminRegenerateProjectSummary(projectId, {
        publish: true,
        include_detailed: regenDetailed,
      }),
    onSuccess: async (data) => {
      setMessage(
        `Regenerated “${data.project_title}”${data.published ? " and published" : ""}${
          data.quality_status ? ` · quality: ${data.quality_status}` : ""
        }.`,
      );
      if (selectedUserId) {
        await qc.invalidateQueries({ queryKey: ["admin", "project-intelligence", "user", selectedUserId] });
      }
      await qc.invalidateQueries({ queryKey: ["admin", "project-intelligence", "users"] });
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
  const users = usersQuery.data?.users ?? [];
  const detail = detailQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-stone-900">Project Intelligence</h2>
        <p className="mt-1 text-sm text-stone-500">
          Quotas, spend, per-user AI usage, and admin summary regeneration. API keys are never shown here.
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
        <h3 className="font-semibold text-stone-900">Assign Project Intelligence Premium</h3>
        <p className="text-xs text-stone-500">
          Manual only — no payments. Optional expiry in days. For Resume Studio + PI together, use Admin → People or Overview.
          Platform admins already have every premium feature.
        </p>
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

      <div className={`space-y-4 ${ui.card} p-5`}>
        <div>
          <h3 className="font-semibold text-stone-900">AI usage by user</h3>
          <p className="mt-1 text-xs text-stone-500">
            Search by email or username. Open a row for month history, ledger calls, generations, and projects.
          </p>
        </div>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setUsageSearch(usageQuery.trim());
          }}
        >
          <input
            className={`${ui.input} min-w-[16rem] flex-1`}
            placeholder="Search email or username"
            value={usageQuery}
            onChange={(e) => setUsageQuery(e.target.value)}
          />
          <button type="submit" className={`${ui.btn} ${ui.primary}`}>
            Search
          </button>
        </form>

        {usersQuery.isLoading && <p className="text-sm text-stone-500">Loading users…</p>}
        {usersQuery.isError && (
          <p className="text-sm text-crimson-700">{getApiErrorMessage(usersQuery.error)}</p>
        )}

        {!usersQuery.isLoading && users.length === 0 && (
          <p className="text-sm text-stone-500">No AI usage rows yet.</p>
        )}

        {users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] uppercase tracking-wide text-stone-400">
                  <th className="py-2 pr-3 font-semibold">User</th>
                  <th className="py-2 pr-3 font-semibold">Month cost</th>
                  <th className="py-2 pr-3 font-semibold">AI projects</th>
                  <th className="py-2 pr-3 font-semibold">Lifetime</th>
                  <th className="py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow
                    key={u.user_id}
                    user={u}
                    selected={selectedUserId === u.user_id}
                    onSelect={() =>
                      setSelectedUserId((cur) => (cur === u.user_id ? null : u.user_id))
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {overview?.near_quota_users && overview.near_quota_users.length > 0 && (
          <div className="border-t border-stone-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Near quota</p>
            <ul className="mt-2 space-y-1 text-sm text-stone-600">
              {overview.near_quota_users.map((u) => (
                <li key={u.user_id}>
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline"
                    onClick={() => setSelectedUserId(u.user_id)}
                  >
                    {u.user_id.slice(0, 8)}… · {u.ai_projects_used} projects · $
                    {Number(u.cost_usd || 0).toFixed(2)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedUserId && (
          <UserDetailPanel
            loading={detailQuery.isLoading}
            error={detailQuery.isError ? getApiErrorMessage(detailQuery.error) : null}
            detail={detail}
            regenerating={regenerate.isPending}
            onRegenerate={(projectId) => {
              setMessage(null);
              regenerate.mutate(projectId);
            }}
          />
        )}
      </div>

      <div className={`space-y-3 ${ui.card} p-5`}>
        <h3 className="font-semibold text-stone-900">Regenerate project summary</h3>
        <p className="text-xs text-stone-500">
          Search by project title, owner email/username, or UUID. Does not consume the owner&apos;s monthly
          allowance; platform cost is still logged. Also available from Browse → Projects when you open a row.
        </p>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setProjectSearch(projectQuery.trim());
          }}
        >
          <input
            className={`${ui.input} min-w-[16rem] flex-1`}
            placeholder="Search projects by title, owner, or UUID"
            value={projectQuery}
            onChange={(e) => setProjectQuery(e.target.value)}
          />
          <button type="submit" className={`${ui.btn} ${ui.primary}`}>
            Search
          </button>
        </form>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={regenDetailed}
            onChange={(e) => setRegenDetailed(e.target.checked)}
          />
          Include detailed / technical on regenerate
        </label>

        {projectsQuery.isLoading && <p className="text-sm text-stone-500">Searching projects…</p>}
        {projectsQuery.isError && (
          <p className="text-sm text-crimson-700">{getApiErrorMessage(projectsQuery.error)}</p>
        )}
        {(projectsQuery.data?.projects ?? []).length > 0 && (
          <ul className="space-y-2">
            {projectsQuery.data!.projects.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 py-2 text-sm"
              >
                <div>
                  <div className="font-medium text-stone-900">{p.title}</div>
                  <div className="text-xs text-stone-500">
                    @{p.owner_username} · {p.owner_email} · {String(p.visibility)}
                    {p.has_publication
                      ? ` · AI ${p.quality_status || "published"}${p.publish_simple ? " · live" : ""}`
                      : " · no AI publication"}
                  </div>
                </div>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.primary} text-xs`}
                  disabled={regenerate.isPending}
                  onClick={() => {
                    setRegenProjectId(p.id);
                    setMessage(null);
                    regenerate.mutate(p.id);
                  }}
                >
                  {regenerate.isPending && regenProjectId === p.id ? "Regenerating…" : "Regenerate"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {projectsQuery.isFetched && (projectsQuery.data?.projects ?? []).length === 0 && (
          <p className="text-sm text-stone-500">No projects matched.</p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
          <input
            className={`${ui.input} min-w-[18rem] flex-1`}
            placeholder="Or paste project UUID"
            value={regenProjectId}
            onChange={(e) => setRegenProjectId(e.target.value)}
          />
          <button
            type="button"
            className={`${ui.btn} ${ui.primary}`}
            disabled={!regenProjectId.trim() || regenerate.isPending}
            onClick={() => {
              setMessage(null);
              regenerate.mutate(regenProjectId.trim());
            }}
          >
            {regenerate.isPending ? "Regenerating…" : "Regenerate by ID"}
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-stone-700">{message}</p>}
    </div>
  );
}

function UserRow({
  user,
  selected,
  onSelect,
}: {
  user: AdminPiUserSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr className={`border-b border-stone-100 ${selected ? "bg-stone-50" : ""}`}>
      <td className="py-2 pr-3">
        <div className="font-medium text-stone-900">{user.full_name || user.username}</div>
        <div className="text-xs text-stone-500">
          @{user.username} · {user.email}
        </div>
      </td>
      <td className="py-2 pr-3 text-stone-700">${Number(user.month.cost_usd || 0).toFixed(2)}</td>
      <td className="py-2 pr-3 text-stone-700">
        {user.month.ai_projects_used}
        <span className="text-stone-400"> / {user.month.regenerations_used} regen</span>
      </td>
      <td className="py-2 pr-3 text-stone-700">
        ${Number(user.lifetime.cost_usd || 0).toFixed(2)}
        <span className="text-stone-400"> · {user.lifetime.ledger_calls} calls</span>
      </td>
      <td className="py-2 text-right">
        <button type="button" className={`${ui.btn} text-xs`} onClick={onSelect}>
          {selected ? "Hide" : "Detail"}
        </button>
      </td>
    </tr>
  );
}

function UserDetailPanel({
  loading,
  error,
  detail,
  regenerating,
  onRegenerate,
}: {
  loading: boolean;
  error: string | null;
  detail: AdminPiUserDetail | undefined;
  regenerating: boolean;
  onRegenerate: (projectId: string) => void;
}) {
  if (loading) return <p className="text-sm text-stone-500">Loading detail…</p>;
  if (error) return <p className="text-sm text-crimson-700">{error}</p>;
  if (!detail) return null;

  return (
    <div className="space-y-4 border-t border-stone-100 pt-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Month tokens" value={`${detail.month.tokens_in} in / ${detail.month.tokens_out} out`} />
        <Stat label="Month requests" value={String(detail.month.requests_count)} />
        <Stat label="Visitor AI projects" value={String(detail.visitor_ai_projects)} />
        <Stat
          label="Owned / published AI"
          value={`${detail.owned_projects} / ${detail.projects_with_ai_publication}`}
        />
      </div>

      {detail.months.length > 0 && (
        <Section title="Month history">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-stone-400">
                  <th className="py-1 pr-2">Month</th>
                  <th className="py-1 pr-2">Projects</th>
                  <th className="py-1 pr-2">Regen</th>
                  <th className="py-1 pr-2">Requests</th>
                  <th className="py-1 pr-2">Tokens</th>
                  <th className="py-1">Cost</th>
                </tr>
              </thead>
              <tbody>
                {detail.months.map((m) => (
                  <tr key={m.year_month} className="border-t border-stone-100 text-stone-700">
                    <td className="py-1 pr-2">{m.year_month}</td>
                    <td className="py-1 pr-2">{m.ai_projects_used}</td>
                    <td className="py-1 pr-2">{m.regenerations_used}</td>
                    <td className="py-1 pr-2">{m.requests_count}</td>
                    <td className="py-1 pr-2">
                      {m.tokens_in}/{m.tokens_out}
                    </td>
                    <td className="py-1">${Number(m.cost_usd || 0).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title={`Ledger (${detail.ledger.length})`}>
        {detail.ledger.length === 0 ? (
          <p className="text-xs text-stone-500">No ledger rows.</p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-stone-600">
            {detail.ledger.map((r) => (
              <li key={r.id}>
                {r.created_at?.slice(0, 19) || "—"} · {r.model} · {r.tokens_in}/{r.tokens_out} · $
                {Number(r.estimated_cost_usd || 0).toFixed(4)}
                {r.project_title ? ` · ${r.project_title}` : r.project_id ? ` · ${r.project_id.slice(0, 8)}…` : ""}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Generations (${detail.generations.length})`}>
        {detail.generations.length === 0 ? (
          <p className="text-xs text-stone-500">No generation records.</p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-stone-600">
            {detail.generations.map((g) => (
              <li key={g.id}>
                {g.created_at?.slice(0, 19) || "—"} · {g.kind}/{g.status} · {g.model || "—"}
                {g.actual_cost_usd != null ? ` · $${Number(g.actual_cost_usd).toFixed(4)}` : ""}
                {g.project_title ? ` · ${g.project_title}` : ""}
                {g.error ? ` · err: ${g.error}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Visitor requests (${detail.visitor_requests.length})`}>
        {detail.visitor_requests.length === 0 ? (
          <p className="text-xs text-stone-500">None.</p>
        ) : (
          <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-stone-600">
            {detail.visitor_requests.map((v) => (
              <li key={v.id}>
                {v.created_at?.slice(0, 19) || "—"} · {v.project_id.slice(0, 8)}…
                {v.was_cache_hit ? " · cache" : " · new"}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Owned projects (${detail.projects.length})`}>
        {detail.projects.length === 0 ? (
          <p className="text-xs text-stone-500">No projects.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {detail.projects.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-50 py-1"
              >
                <div>
                  <div className="font-medium text-stone-900">{p.title}</div>
                  <div className="text-xs text-stone-500">
                    {p.visibility}
                    {p.has_publication
                      ? ` · AI ${p.quality_status || "published"}${p.publish_simple ? " · live" : ""}`
                      : " · no AI publication"}
                  </div>
                </div>
                <button
                  type="button"
                  className={`${ui.btn} text-xs`}
                  disabled={regenerating}
                  onClick={() => onRegenerate(p.id)}
                >
                  Regenerate
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{title}</p>
      <div className="mt-2">{children}</div>
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
