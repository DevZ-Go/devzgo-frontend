import { api } from "./client";

export type WorkspaceStatus = {
  source_kind: string;
  repository: string | null;
  default_branch: string | null;
  tracked_branch: string | null;
  can_edit: boolean;
  configured: boolean;
  connection: { connected: boolean; configured: boolean; status: string | null; login: string | null };
  sync: { id: string; status: string; error: string | null; commit_sha: string | null; branch: string | null; steps: Record<string, { state: string; detail?: string | null }> | null } | null;
};

export type WorkspaceDraft = {
  id: string;
  branch: string;
  path: string;
  content: string;
  base_blob_sha: string | null;
  base_commit_sha: string | null;
  line_ending: string;
  has_bom: boolean;
  revision: number;
};

export type LiveFile = {
  exists: boolean;
  path: string;
  sha: string | null;
  content: string | null;
  size: number;
  editable: boolean;
  blocked: string | null;
};

export type GitBranch = { name: string; sha: string | null; protected: boolean; default: boolean };

const root = (projectId: string) => `/projects/${projectId}/workspace`;

export const fetchWorkspace = async (projectId: string) => (await api.get<WorkspaceStatus>(root(projectId))).data;

export const fetchConnection = async () =>
  (await api.get<WorkspaceStatus["connection"]>("/github/connection")).data;

export async function startGitHubEditing(): Promise<string> {
  const res = await api.post<{ url: string }>("/github/connection/authorize", null, { withCredentials: true });
  return res.data.url;
}

export const disconnectGitHubEditing = async () => (await api.delete("/github/connection")).data;

export const fetchDrafts = async (projectId: string, branch: string) =>
  (await api.get<WorkspaceDraft[]>(`${root(projectId)}/drafts`, { params: { branch } })).data;

export async function saveDraft(projectId: string, draft: {
  branch: string; path: string; content: string; base_blob_sha: string | null; base_commit_sha: string | null;
  line_ending: string; has_bom: boolean;
}) {
  return (await api.put<WorkspaceDraft>(`${root(projectId)}/drafts`, draft)).data;
}

export const discardDraft = async (projectId: string, branch: string, path: string) =>
  api.delete(`${root(projectId)}/drafts`, { params: { branch, path } });

export const fetchBranches = async (projectId: string) =>
  (await api.get<GitBranch[]>(`${root(projectId)}/branches`)).data;

export const fetchLiveTree = async (projectId: string, ref: string) =>
  (await api.get<{ sha: string; truncated: boolean; entries: { path?: string; type?: string }[] }>(`${root(projectId)}/tree`, { params: { ref } })).data;

export const fetchLiveFile = async (projectId: string, ref: string, path: string) =>
  (await api.get<LiveFile>(`${root(projectId)}/file`, { params: { ref, path } })).data;

export async function commitFile(projectId: string, body: {
  branch: string; path: string; content: string; message: string; base_blob_sha: string | null; idempotency_key: string;
}) {
  return (await api.post<{ committed: boolean; sha: string | null; url: string | null; sync: string; replayed: boolean }>(`${root(projectId)}/commit`, body)).data;
}

export async function commitFiles(projectId: string, body: {
  branch: string; message: string; parent_sha: string; idempotency_key: string;
  files: { path: string; content: string; base_blob_sha: string | null }[];
}) {
  return (await api.post<{ committed: boolean; sha: string | null; url: string | null; sync: string }>(`${root(projectId)}/commits`, body)).data;
}

export const createWorkspaceBranch = async (projectId: string, name: string, fromSha: string) =>
  (await api.post<{ name: string; sha: string }>(`${root(projectId)}/branches`, { name, from_sha: fromSha })).data;

export const compareBranches = async (projectId: string, base: string, head: string) =>
  (await api.get<{ status: string; ahead_by: number; behind_by: number; files: { path: string; status: string }[]; truncated: boolean }>(
    `${root(projectId)}/compare`, { params: { base, head } },
  )).data;

export const openPullRequest = async (projectId: string, body: { title: string; body: string; head: string; base: string }) =>
  (await api.post<{ number: number; url: string; state: string }>(`${root(projectId)}/pulls`, body)).data;

export const retrySync = async (projectId: string, jobId: string) =>
  (await api.post(`${root(projectId)}/sync/${jobId}/retry`)).data;

export const refreshWorkspace = async (projectId: string, kind: "history" | "source" | "analysis") =>
  (await api.post<{ kind: string; status: string }>(`${root(projectId)}/refresh`, { kind })).data;
