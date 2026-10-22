import { api } from "./client";

export type EvidenceClass = "contribution_linked" | "detected" | "declared";
export type CheckStatus = "found" | "not_detected" | "not_assessed" | "needs_review";

export type SkillProject = {
  project_id: string;
  title: string;
  relation: "owner" | "member";
  role: string;
  visibility: string;
  detected: boolean;
  kinds: string[];
  files: { kind: string | null; file: string }[];
  language_share: number | null;
  unrecorded: boolean;
  commits: number;
  last_activity: string | null;
};

export type Skill = {
  name: string;
  category: string;
  classes: EvidenceClass[];
  sources: string[];
  project_count: number;
  owned_projects: number;
  team_projects: number;
  commits: number;
  last_activity: string | null;
  projects: SkillProject[];
};

export type SkillMatrix = {
  user_id: string;
  restricted: boolean;
  projects_considered: number;
  projects_with_file_evidence: number;
  totals: { skills: number } & Record<EvidenceClass, number>;
  categories: { key: string; label: string; skills: Skill[] }[];
};

export type CheckEvidence = { file: string | null; line: number | null; url: string | null; label: string | null };

export type QualityCheck = {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
  evidence: CheckEvidence[];
};

export type StatusCounts = Record<CheckStatus, number>;

export type QualityReport = {
  project_id: string;
  audience: "team" | "viewer";
  analyzed_at: string | null;
  has_source: boolean;
  source_recorded: boolean;
  can_refresh: boolean;
  totals: StatusCounts;
  sections: { key: string; label: string; restricted: boolean; checks: QualityCheck[]; summary: StatusCounts }[];
  recommendations: { check: string; status: CheckStatus; text: string }[];
};

export async function fetchSkillMatrix(userId: string): Promise<SkillMatrix> {
  return (await api.get<SkillMatrix>(`/profiles/${userId}/skill-matrix`)).data;
}

export async function fetchQualityReport(projectId: string): Promise<QualityReport> {
  return (await api.get<QualityReport>(`/projects/${projectId}/quality-report`)).data;
}

export async function refreshQualityReport(projectId: string): Promise<QualityReport> {
  return (await api.post<QualityReport>(`/projects/${projectId}/quality-report/refresh`)).data;
}
