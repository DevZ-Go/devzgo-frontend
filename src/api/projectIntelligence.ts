import { api } from "./client";

export type JobStatus = {
  job_id?: string | null;
  status?: string | null;
  job_kind?: string | null;
  coverage_pct?: number | null;
  progress?: Record<string, unknown>;
  error?: string | null;
  cancel_requested?: boolean;
  created_at?: string | null;
  completed_at?: string | null;
  snapshot_id?: string | null;
};

export type Insights = {
  available: boolean;
  audience?: string | null;
  everyday?: {
    one_sentence?: string;
    what_it_does?: string;
    problem?: string;
    who_could_use_it?: string;
    capabilities?: string[];
    what_was_built?: string;
    how_it_works?: string;
    uncertainties?: string[];
  };
  technical?: {
    architecture?: string;
    technologies?: string[];
    api_routes?: { method?: string; path?: string; file?: string }[];
    ui_pages?: { name?: string; file?: string }[];
    data_models?: { name?: string; file?: string }[];
    authentication_signals?: boolean;
    testing_signals?: boolean;
    coverage_pct?: number;
    truncated?: boolean;
    ai_detailed_description?: string;
  };
  uncertainties?: string[];
  snapshot_id?: string | null;
  composer_version?: string | null;
  redacted?: boolean;
  developer?: {
    title?: string;
    short_description?: string;
    full_description?: string;
  };
  simple_english?: {
    what_is_this?: string;
    what_it_does?: string;
    why_use_it?: string;
    who_benefits?: string;
    capabilities?: string[];
    key_features?: string[];
    how_it_works?: string;
    uncertainties?: string[];
  };
};

export type Claim = {
  id: string;
  claim_type: string;
  wording: string;
  support_class: string;
  source_file?: string | null;
  source_location?: string | null;
  source_revision: string;
  visibility: string;
  attribution_status: string;
  refs: { source_file?: string; line_start?: number; label?: string }[];
};

export type AiDraft = {
  id: string;
  status: string;
  model?: string | null;
  short_description?: string | null;
  full_overview?: string | null;
  key_features: string[];
  problem_solved?: string | null;
  potential_audience?: string | null;
  how_it_works_simple?: string | null;
  technical_explanation?: string | null;
  resume_bullets: string[];
  evidence_refs: unknown[];
  parent_draft_id?: string | null;
  created_at?: string | null;
  approved_at?: string | null;
  uncertainties: string[];
};

export type GlobalPref = { auto_analyze_default: boolean };
export type ProjectPref = {
  intelligence_enabled: boolean | null;
  external_ai_allowed: boolean;
  insight_audience: string;
  effective_auto_analyze: boolean;
};

export async function fetchPiGlobalPref(): Promise<GlobalPref> {
  return (await api.get<GlobalPref>("/settings/project-intelligence")).data;
}

export async function patchPiGlobalPref(body: GlobalPref): Promise<GlobalPref> {
  return (await api.patch<GlobalPref>("/settings/project-intelligence", body)).data;
}

export async function fetchPiProjectPref(projectId: string): Promise<ProjectPref> {
  return (await api.get<ProjectPref>(`/projects/${projectId}/intelligence/preferences`)).data;
}

export async function patchPiProjectPref(projectId: string, body: Partial<ProjectPref>): Promise<ProjectPref> {
  return (await api.patch<ProjectPref>(`/projects/${projectId}/intelligence/preferences`, body)).data;
}

export async function fetchPiStatus(projectId: string): Promise<JobStatus> {
  return (await api.get<JobStatus>(`/projects/${projectId}/intelligence/status`)).data;
}

export async function analyzeProject(projectId: string, force = false): Promise<JobStatus> {
  return (await api.post<JobStatus>(`/projects/${projectId}/intelligence/analyze`, { force })).data;
}

export async function cancelPiJob(projectId: string): Promise<JobStatus> {
  return (await api.post<JobStatus>(`/projects/${projectId}/intelligence/cancel`)).data;
}

export async function fetchPiInsights(projectId: string): Promise<Insights> {
  return (await api.get<Insights>(`/projects/${projectId}/intelligence/insights`)).data;
}

export async function fetchPiClaims(projectId: string): Promise<Claim[]> {
  return (await api.get<Claim[]>(`/projects/${projectId}/intelligence/claims`)).data;
}

export type GenerateOutputs = {
  short_description?: boolean;
  detailed_description?: boolean;
  simple_english?: boolean;
  technical_details?: boolean;
  architecture_walkthrough?: boolean;
  recruiter_report?: boolean;
};

export async function generateWithAi(
  projectId: string,
  opts: {
    parent_draft_id?: string;
    grant_consent?: boolean;
    outputs?: GenerateOutputs;
    include_detailed?: boolean;
    idempotency_key?: string;
    regenerate?: boolean;
  } = {},
): Promise<JobStatus> {
  return (await api.post<JobStatus>(`/projects/${projectId}/intelligence/generate`, opts)).data;
}

export async function fetchPiDrafts(projectId: string): Promise<AiDraft[]> {
  return (await api.get<AiDraft[]>(`/projects/${projectId}/intelligence/drafts`)).data;
}

export async function approvePiDraft(
  projectId: string,
  draftId: string,
  body: {
    apply_short_description?: boolean;
    apply_full_description?: boolean;
    publish_simple?: boolean;
    show_detailed_on_page?: boolean;
    adopt_short?: boolean;
    adopt_detailed?: boolean;
  },
): Promise<AiDraft> {
  return (await api.post<AiDraft>(`/projects/${projectId}/intelligence/drafts/${draftId}/approve`, body)).data;
}

export async function discardPiDraft(projectId: string, draftId: string): Promise<AiDraft> {
  return (await api.post<AiDraft>(`/projects/${projectId}/intelligence/drafts/${draftId}/discard`)).data;
}

export async function restorePiDraft(projectId: string, draftId: string): Promise<AiDraft> {
  return (await api.post<AiDraft>(`/projects/${projectId}/intelligence/drafts/${draftId}/restore`)).data;
}

export async function grantPiConsent(projectId: string): Promise<{ consent_id: string }> {
  return (await api.post<{ consent_id: string }>(`/projects/${projectId}/intelligence/consent`)).data;
}

export type PiQuota = {
  premium: boolean;
  plan?: string;
  year_month?: string | null;
  used: number;
  limit: number;
  remaining: number | null;
  can_analyze: boolean;
  can_generate?: boolean;
  project_already_counted: boolean;
  project_has_ai?: boolean;
  regenerations_used?: number;
  regenerations_limit?: number;
  can_regenerate?: boolean;
  concurrent_limit?: number;
  concurrent_active?: number;
  ai_generate_enabled: boolean;
  visitor_insights_enabled: boolean;
  auto_analyze_on_upload: boolean;
  exhausted_message?: string | null;
};

export async function fetchPiQuota(projectId: string): Promise<PiQuota> {
  return (await api.get<PiQuota>(`/projects/${projectId}/intelligence/quota`)).data;
}

export type VisitorAiStatus = {
  is_admin: boolean;
  visitor_ai_enabled: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  can_request_new: boolean;
  summary_ready: boolean;
  can_generate: boolean;
  is_team: boolean;
};

export async function fetchVisitorAiStatus(projectId: string): Promise<VisitorAiStatus> {
  return (await api.get<VisitorAiStatus>(`/projects/${projectId}/intelligence/visitor-ai`)).data;
}

export async function visitorGenerateAi(projectId: string): Promise<JobStatus> {
  return (await api.post<JobStatus>(`/projects/${projectId}/intelligence/visitor-generate`, {})).data;
}
