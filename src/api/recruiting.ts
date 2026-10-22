import { api } from "./client";
import { assetUrlOrNull } from "./config";
import type { Standing } from "./profiles";

export type Person = {
  id: string;
  username: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
};

export const ENTRY_STATUSES = [
  ["new", "New"],
  ["reviewing", "Reviewing"],
  ["contacted", "Contacted"],
  ["interviewing", "Interviewing"],
  ["hired", "Hired"],
  ["not_a_fit", "Not a fit"],
] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number][0];
export const statusLabel = (id: string) => ENTRY_STATUSES.find(([key]) => key === id)?.[1] ?? id;

export const WORK_TYPES = ["full-time", "part-time", "internship", "co-op", "contract", "freelance"] as const;
export const WORK_ARRANGEMENTS = ["remote", "hybrid", "on-site"] as const;

export type ShortlistEntry = {
  id: string;
  shortlist_id: string;
  candidate: Person;
  status: EntryStatus;
  note: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Shortlist = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
  count: number;
  statuses: Record<string, number>;
};

export type ShortlistDetail = Shortlist & { entries: ShortlistEntry[] };

export type RecruitmentRequest = {
  id: string;
  recruiter: Person;
  recruiter_company: string | null;
  candidate: Person;
  role_title: string;
  work_type: string | null;
  message: string;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  created_at: string;
  responded_at: string | null;
};

export type ProjectEvidence = {
  id: string;
  title: string;
  short_description: string | null;
  cover_image_url: string | null;
  tech_stacks: string[];
  languages: { name: string; percentage: number }[];
  category: string | null;
  complexity: string | null;
  github_url: string | null;
  has_source: boolean;
  commits: number | null;
  likes_count: number;
  updated_at: string | null;
};

export type JoinedEvidence = {
  id: string;
  title: string;
  owner_username: string | null;
  contribution_info: string | null;
  tech_stacks: string[];
  joined_at: string | null;
};

export type CandidateView = {
  profile: Record<string, unknown>;
  standing: Standing;
  projects: ProjectEvidence[];
  collaborations: JoinedEvidence[];
  wraps: { month: string; title: string | null; summary: string | null; persona: string | null; published_at: string | null }[];
  shortlists: { shortlist_id: string; shortlist_name: string; entry_id: string; status: EntryStatus; note: string | null }[];
  contact: { allowed: boolean; reason: string | null; pending_request_id: string | null; accepted: boolean };
};

export type Dashboard = {
  shortlists: number;
  candidates: number;
  statuses: Record<string, number>;
  requests: Record<string, number>;
  recent_entries: ShortlistEntry[];
  recent_requests: RecruitmentRequest[];
};

const person = (p: Person): Person => ({ ...p, avatar_url: assetUrlOrNull(p.avatar_url) });
const entry = (e: ShortlistEntry): ShortlistEntry => ({ ...e, candidate: person(e.candidate) });
const request = (r: RecruitmentRequest): RecruitmentRequest => ({ ...r, recruiter: person(r.recruiter), candidate: person(r.candidate) });

export async function fetchDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>("/recruiting/dashboard");
  return { ...data, recent_entries: data.recent_entries.map(entry), recent_requests: data.recent_requests.map(request) };
}

export async function fetchCandidate(id: string): Promise<CandidateView> {
  const { data } = await api.get<CandidateView>(`/recruiting/candidates/${id}`);
  return { ...data, projects: data.projects.map((p) => ({ ...p, cover_image_url: assetUrlOrNull(p.cover_image_url) })) };
}

export async function fetchShortlists(): Promise<Shortlist[]> {
  return (await api.get<Shortlist[]>("/recruiting/shortlists")).data;
}

export async function fetchShortlist(id: string): Promise<ShortlistDetail> {
  const { data } = await api.get<ShortlistDetail>(`/recruiting/shortlists/${id}`);
  return { ...data, entries: data.entries.map(entry) };
}

export async function createShortlist(name: string, description?: string): Promise<Shortlist> {
  return (await api.post<Shortlist>("/recruiting/shortlists", { name, description: description || undefined })).data;
}

export async function renameShortlist(id: string, name: string, description: string | null): Promise<Shortlist> {
  return (await api.patch<Shortlist>(`/recruiting/shortlists/${id}`, { name, description })).data;
}

export async function deleteShortlist(id: string): Promise<void> {
  await api.delete(`/recruiting/shortlists/${id}`);
}

export async function addToShortlist(shortlistId: string, candidateId: string, note?: string): Promise<ShortlistEntry> {
  const { data } = await api.post<ShortlistEntry>(`/recruiting/shortlists/${shortlistId}/entries`,
    { candidate_id: candidateId, note: note || undefined });
  return entry(data);
}

export async function updateEntry(shortlistId: string, entryId: string, change: { status?: EntryStatus; note?: string | null }) {
  const { data } = await api.patch<ShortlistEntry>(`/recruiting/shortlists/${shortlistId}/entries/${entryId}`, change);
  return entry(data);
}

export async function removeEntry(shortlistId: string, entryId: string): Promise<void> {
  await api.delete(`/recruiting/shortlists/${shortlistId}/entries/${entryId}`);
}

export async function sendRecruitmentRequest(body: { candidate_id: string; role_title: string; work_type?: string; message: string }) {
  return request((await api.post<RecruitmentRequest>("/recruiting/requests", body)).data);
}

export async function fetchSentRequests(): Promise<RecruitmentRequest[]> {
  return (await api.get<RecruitmentRequest[]>("/recruiting/requests/sent")).data.map(request);
}

export async function fetchIncomingRequests(): Promise<RecruitmentRequest[]> {
  return (await api.get<RecruitmentRequest[]>("/recruiting/requests/incoming")).data.map(request);
}

export async function answerRequest(id: string, answer: "accept" | "decline"): Promise<RecruitmentRequest> {
  return request((await api.put<RecruitmentRequest>(`/recruiting/requests/${id}/${answer}`)).data);
}

export async function withdrawRequest(id: string): Promise<RecruitmentRequest> {
  return request((await api.delete<RecruitmentRequest>(`/recruiting/requests/${id}`)).data);
}
