import { api } from "./client";

export type ExperienceCategory =
  | "full_time" | "part_time" | "contract" | "freelance" | "coop" | "internship"
  | "volunteer" | "academic_project" | "independent_project" | "other";

export type Audience = "private" | "connections" | "recruiters" | "public";

export type SkillInterval = {
  id?: string;
  tech_stack_id: number;
  tech_name?: string | null;
  start_year?: number | null;
  start_month?: number | null;
  end_year?: number | null;
  end_month?: number | null;
};

export type Experience = {
  id: string;
  organization: string;
  title: string;
  category: ExperienceCategory;
  start_year?: number | null;
  start_month?: number | null;
  end_year?: number | null;
  end_month?: number | null;
  is_current: boolean;
  location?: string | null;
  description?: string | null;
  responsibilities: string[];
  achievements: string[];
  source: string;
  review_state: string;
  visibility: Audience;
  sort_order: number;
  skill_intervals: SkillInterval[];
  project_ids: string[];
  duration?: { known: boolean; months: number | null; label: string } | null;
};

export type Education = {
  id: string;
  institution: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_year?: number | null;
  start_month?: number | null;
  end_year?: number | null;
  end_month?: number | null;
  is_current: boolean;
  description?: string | null;
  visibility: Audience;
  sort_order?: number;
};

export type Certification = {
  id: string;
  name: string;
  issuer?: string | null;
  year?: number | null;
  month?: number | null;
  visibility: Audience;
};

export type CareerSummary = {
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  category_durations: Record<string, { known: boolean; months: number | null; label: string }>;
  skill_durations: Record<string, { known: boolean; months: number | null; label: string }>;
};

export type ImportItem = {
  id: string;
  item_type: string;
  field_path: string;
  extracted_value: Record<string, unknown>;
  normalized_value?: Record<string, unknown> | null;
  source_location?: string | null;
  confidence: string;
  review_state: string;
};

export type ImportJob = {
  id: string;
  original_filename: string;
  format: string;
  status: string;
  error?: string | null;
  analysis?: Record<string, unknown> | null;
  items: ImportItem[];
};

export type Badge = {
  id: string;
  stable_key: string;
  family: string;
  track: string;
  name: string;
  description: string;
  icon_key: string;
  criteria: string;
  criteria_version: number;
  awarded_at?: string | null;
  visibility: Audience;
  provenance_label?: string | null;
  evidence_refs: unknown[];
  limitations: string;
};

export const CATEGORY_LABELS: Record<ExperienceCategory, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  coop: "Co-op",
  internship: "Internship",
  volunteer: "Volunteer",
  academic_project: "Academic project",
  independent_project: "Independent project",
  other: "Other",
};

export async function fetchMyCareer(): Promise<CareerSummary> {
  return (await api.get<CareerSummary>("/career/me")).data;
}

export async function fetchUserCareer(userId: string): Promise<CareerSummary> {
  return (await api.get<CareerSummary>(`/career/users/${userId}`)).data;
}

export async function createExperience(body: Partial<Experience> & { organization: string; title: string; category: ExperienceCategory }) {
  return (await api.post<Experience>("/career/experiences", body)).data;
}

export async function updateExperience(id: string, body: Partial<Experience>) {
  return (await api.patch<Experience>(`/career/experiences/${id}`, body)).data;
}

export async function deleteExperience(id: string) {
  await api.delete(`/career/experiences/${id}`);
}

export async function createEducation(body: Omit<Education, "id">) {
  return (await api.post<Education>("/career/education", body)).data;
}

export async function updateEducation(id: string, body: Partial<Education>) {
  return (await api.patch<Education>(`/career/education/${id}`, body)).data;
}

export async function deleteEducation(id: string) {
  await api.delete(`/career/education/${id}`);
}

export async function createCertification(body: Omit<Certification, "id">) {
  return (await api.post<Certification>("/career/certifications", body)).data;
}

export async function updateCertification(id: string, body: Partial<Certification>) {
  return (await api.patch<Certification>(`/career/certifications/${id}`, body)).data;
}

export async function deleteCertification(id: string) {
  await api.delete(`/career/certifications/${id}`);
}

export async function uploadCareerImport(file: File): Promise<ImportJob> {
  const body = new FormData();
  body.append("file", file);
  return (await api.post<ImportJob>("/career/imports", body)).data;
}

export async function importFromPortfolioResume(): Promise<ImportJob> {
  return (await api.post<ImportJob>("/career/imports/from-portfolio")).data;
}

export async function fetchImport(jobId: string): Promise<ImportJob> {
  return (await api.get<ImportJob>(`/career/imports/${jobId}`)).data;
}

export type ImportSaveAs = "experience" | "education" | "skill" | "certification";

export async function confirmImport(
  jobId: string,
  items: {
    item_id: string;
    review_state: string;
    visibility?: Audience;
    normalized_value?: unknown;
    save_as?: ImportSaveAs;
  }[],
) {
  return (await api.post<ImportJob>(`/career/imports/${jobId}/confirm`, { items })).data;
}

export async function fetchMyBadges(): Promise<Badge[]> {
  return (await api.get<{ badges: Badge[] }>("/badges/me")).data.badges;
}

export async function fetchUserBadges(userId: string): Promise<Badge[]> {
  return (await api.get<{ badges: Badge[] }>(`/badges/users/${userId}`)).data.badges;
}

export async function recalculateBadges() {
  return (await api.post("/badges/me/recalculate")).data;
}

export async function setBadgeVisibility(id: string, visibility: Audience) {
  return (await api.patch(`/badges/${id}/visibility`, { visibility })).data;
}

export async function fetchEntitlements() {
  return (await api.get<{ features: { feature: string; active: boolean }[] }>("/career/entitlements")).data;
}

export async function fetchTransparency() {
  return (await api.get("/career/transparency")).data;
}

export async function createEvaluation(body: {
  candidate_id: string;
  purpose: "general_discovery" | "opportunity_evaluation";
  acknowledgement: boolean;
  role_title?: string;
  requirements?: Record<string, unknown>;
  result_summary?: Record<string, unknown>;
}) {
  return (await api.post("/recruiting/evaluations", body)).data;
}

export async function listResumeTemplates() {
  return (await api.get<{ templates: { key: string; name: string; description: string }[] }>("/resume-studio/templates")).data.templates;
}

export async function generateResume(body: { title: string; template_key: string; job_description?: string }) {
  return (await api.post("/resume-studio/resumes", body)).data;
}

export async function listGeneratedResumes() {
  return (await api.get<{ resumes: { id: string; title: string; template_key: string }[] }>("/resume-studio/resumes")).data.resumes;
}

export async function downloadResumeExport(resumeId: string, format: "pdf" | "docx") {
  const { data } = await api.get<Blob>(`/resume-studio/resumes/${resumeId}/export.${format}`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
