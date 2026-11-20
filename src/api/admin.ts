import { api } from "./client";

export interface AdminSession {
  role: "owner" | "admin";
  email: string;
  user_id: string;
  admin_count: number;
  pending_invites: number;
  open_proposals: number;
  owner_email: string;
}

export interface CatalogGroup {
  id: string;
  label: string;
  blurb: string;
  tables: { name: string; label: string; blurb: string; count: number }[];
}

export interface Catalog {
  groups: CatalogGroup[];
  headline: {
    people: number;
    developers: number;
    recruiters: number;
    suspended: number;
    paused: number;
    projects: number;
    open_proposals: number;
  };
}

export interface PersonRow {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  account_type: string;
  status: "active" | "paused" | "suspended" | "deletion scheduled";
  admin_role: "owner" | "admin" | null;
  has_password: boolean;
  github_linked: boolean;
  created_at: string | null;
  deactivated_at: string | null;
  delete_after: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
}

export interface ActionPreview {
  action: string;
  label: string;
  severity: "important" | "critical";
  warning: string;
  typed_label: string;
  typed_value: string;
  casefold: boolean;
  summary: string;
  required_approvals: number | null;
  eligible_admins: number | null;
  blocked: string | null;
}

export interface ActionInput {
  action: string;
  target_id?: string | null;
  payload?: Record<string, unknown>;
}

export interface ActionResult {
  status: "done" | "pending" | "executed" | "rejected" | "cancelled";
  summary?: string;
  proposal_id?: string;
  required_approvals?: number;
  approvals?: number;
  result?: string | null;
}

export interface Proposal {
  id: string;
  action: string;
  target_id: string | null;
  summary: string;
  warning: string;
  reason: string;
  status: string;
  required_approvals: number;
  approvals: number;
  approvers: string[];
  proposer_email: string;
  my_vote: string | null;
  result: string | null;
  created_at: string | null;
  resolved_at: string | null;
}

export interface AuditEvent {
  id: string;
  action: string;
  summary: string;
  severity: string;
  actor_email: string | null;
  target_type: string | null;
  target_id: string | null;
  created_at: string | null;
}

export interface TableColumn {
  name: string;
  secret: boolean;
}

export interface TablePageData {
  table: string;
  label: string;
  group: string;
  blurb: string;
  primary_key: string[];
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  total: number;
  offset: number;
  limit: number;
}

const listParams = { paramsSerializer: { indexes: null as null } };

export async function fetchAdminSession(): Promise<AdminSession> {
  const { data } = await api.get<AdminSession>("/admin/session");
  return data;
}

export async function fetchCatalog(): Promise<Catalog> {
  const { data } = await api.get<Catalog>("/admin/catalog");
  return data;
}

export async function fetchPeople(q: string, offset: number): Promise<{ total: number; people: PersonRow[] }> {
  const { data } = await api.get("/admin/people", { params: { q, offset, limit: 25 } });
  return data;
}

export async function fetchPerson(id: string): Promise<{
  person: PersonRow;
  account: Record<string, unknown>;
  profile: Record<string, unknown> | null;
  counts: Record<string, number>;
}> {
  const { data } = await api.get(`/admin/people/${id}`);
  return data;
}

export async function fetchTable(name: string, q: string, offset: number, eq: string[]): Promise<TablePageData> {
  const { data } = await api.get<TablePageData>(`/admin/tables/${name}`, {
    ...listParams,
    params: { q, offset, limit: 25, eq },
  });
  return data;
}

export async function fetchRow(name: string, pk: string[]): Promise<{ row: Record<string, unknown>; columns: TableColumn[]; blurb: string }> {
  const { data } = await api.get(`/admin/tables/${name}/row`, { ...listParams, params: { pk } });
  return data;
}

export async function previewAction(input: ActionInput): Promise<ActionPreview> {
  const { data } = await api.post<ActionPreview>("/admin/actions/preview", {
    action: input.action,
    target_id: input.target_id ?? null,
    payload: input.payload ?? {},
  });
  return data;
}

export async function runAction(input: ActionInput & { reason: string; typed: string }): Promise<ActionResult> {
  const { data } = await api.post<ActionResult>("/admin/actions", {
    action: input.action,
    target_id: input.target_id ?? null,
    payload: input.payload ?? {},
    reason: input.reason,
    typed: input.typed,
  });
  return data;
}

export async function fetchProposals(status = "pending"): Promise<Proposal[]> {
  const { data } = await api.get<{ proposals: Proposal[] }>("/admin/proposals", { params: { status } });
  return data.proposals;
}

export async function voteProposal(id: string, decision: "approve" | "reject", typed: string, reason: string): Promise<ActionResult> {
  const { data } = await api.post<ActionResult>(`/admin/proposals/${id}/vote`, { decision, typed, reason });
  return data;
}

export async function cancelProposal(id: string): Promise<ActionResult> {
  const { data } = await api.post<ActionResult>(`/admin/proposals/${id}/cancel`);
  return data;
}

export async function fetchAudit(offset: number): Promise<{ total: number; events: AuditEvent[] }> {
  const { data } = await api.get("/admin/audit", { params: { offset } });
  return data;
}

export interface UsageStat {
  key: string;
  label: string;
  count: number;
  people: number;
}

export interface Insights {
  days: number;
  visits: number;
  people: number;
  pages: UsageStat[];
  gallery: UsageStat;
  tv: UsageStat;
  horizontal: UsageStat;
  vertical: UsageStat;
}

export async function fetchInsights(days: number): Promise<Insights> {
  const { data } = await api.get<Insights>("/admin/insights", { params: { days } });
  return data;
}

export async function fetchAccess(): Promise<{
  admins: { user_id: string; email: string; username: string; role: "owner" | "admin"; created_at: string | null }[];
  invites: { email: string; role: string; created_at: string | null }[];
  owner_email: string;
  team_emails: string[];
  you: string;
  your_role: string;
}> {
  const { data } = await api.get("/admin/access");
  return data;
}

export type ProjectIntelligenceAdminSettings = {
  free_project_limit?: number;
  premium_project_limit?: number;
  free_regenerations_per_project?: number;
  premium_regenerations_per_project?: number;
  visitor_insights_enabled?: boolean;
  visitor_ai_enabled?: boolean;
  visitor_ai_project_limit?: number;
  ai_generate_enabled?: boolean;
  auto_analyze_on_upload?: boolean;
  global_daily_budget_usd?: number;
  global_monthly_budget_usd?: number;
  [key: string]: unknown;
};

export type ProjectIntelligenceAdminOverview = {
  daily_spend_usd?: number;
  monthly_spend_usd?: number;
  monthly_requests?: number;
  unique_enhanced_projects?: number;
  failed_generations?: number;
  active_premium_entitlements?: number;
  monthly_tokens_in?: number;
  monthly_tokens_out?: number;
  ai_generate_enabled?: boolean;
  near_quota_users?: {
    user_id: string;
    ai_projects_used: number;
    regenerations_used: number;
    cost_usd: number;
  }[];
};

export async function fetchAdminProjectIntelligence(): Promise<{
  feature_flag_enabled: boolean;
  settings: ProjectIntelligenceAdminSettings;
  overview?: ProjectIntelligenceAdminOverview;
}> {
  const { data } = await api.get("/admin/project-intelligence");
  return data;
}

export async function patchAdminProjectIntelligence(
  settings: Partial<ProjectIntelligenceAdminSettings>,
): Promise<{ settings: ProjectIntelligenceAdminSettings }> {
  const { data } = await api.patch("/admin/project-intelligence", { settings });
  return data;
}

export async function grantAdminPiPremium(body: {
  email?: string;
  user_id?: string;
  days?: number;
  revoke?: boolean;
}): Promise<{ ok: boolean; email: string; premium: boolean }> {
  const { data } = await api.post("/admin/project-intelligence/premium", body);
  return data;
}

export type AdminPiUserSummary = {
  user_id: string;
  email: string;
  username: string;
  full_name: string;
  year_month: string;
  month: {
    ai_projects_used: number;
    regenerations_used: number;
    requests_count: number;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
  };
  lifetime: {
    cost_usd: number;
    tokens_in: number;
    tokens_out: number;
    ledger_calls: number;
  };
  visitor_ai_projects: number;
  owned_projects: number;
  projects_with_ai_publication: number;
};

export type AdminPiUserDetail = AdminPiUserSummary & {
  months: {
    year_month: string;
    ai_projects_used: number;
    regenerations_used: number;
    requests_count: number;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
  }[];
  ledger: {
    id: string;
    project_id: string | null;
    project_title: string | null;
    job_id: string | null;
    provider: string;
    model: string;
    tokens_in: number;
    tokens_out: number;
    estimated_cost_usd: number;
    created_at: string | null;
  }[];
  generations: {
    id: string;
    user_id?: string;
    project_id: string;
    project_title: string | null;
    kind: string;
    status: string;
    model: string | null;
    prompt_version: string;
    counts_as_project: boolean;
    tokens_in: number;
    tokens_out: number;
    actual_cost_usd: number | null;
    error: string | null;
    created_at: string | null;
    completed_at: string | null;
  }[];
  visitor_requests: {
    id: string;
    project_id: string;
    was_cache_hit: boolean;
    created_at: string | null;
  }[];
  projects: {
    id: string;
    title: string;
    visibility: string;
    has_publication: boolean;
    quality_status: string | null;
    schema_version: string | null;
    publish_simple: boolean;
    updated_at: string | null;
  }[];
};

export type AdminPiRegenerateResult = {
  ok: boolean;
  project_id: string;
  project_title: string;
  draft_id: string;
  job_id: string | null;
  generation_record_id: string;
  published: boolean;
  quality_status: string | null;
  completed_at: string;
};

export async function fetchAdminPiUsers(params?: {
  q?: string;
  limit?: number;
}): Promise<{ users: AdminPiUserSummary[] }> {
  const { data } = await api.get("/admin/project-intelligence/users", { params });
  return data;
}

export async function fetchAdminPiUserDetail(
  userId: string,
  params?: { ledger_limit?: number },
): Promise<AdminPiUserDetail> {
  const { data } = await api.get(`/admin/project-intelligence/users/${userId}`, { params });
  return data;
}

export async function adminRegenerateProjectSummary(
  projectId: string,
  body?: { publish?: boolean; include_detailed?: boolean },
): Promise<AdminPiRegenerateResult> {
  const { data } = await api.post(`/admin/project-intelligence/projects/${projectId}/regenerate`, body ?? {});
  return data;
}
