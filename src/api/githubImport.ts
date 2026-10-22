import { api } from "./client";

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: string | null;
  description: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  language: string | null;
  stars: number;
  size_kb: number;
  updated_at: string | null;
  html_url: string;
  imported_project_id: string | null;
};

export type GitHubImportSession = { session: string; login: string; repos: GitHubRepo[] };

export type GitHubImportResult = {
  repo_id: number;
  project_id: string;
  title: string;
  visibility: "Public" | "Private";
  code: "analysed" | "empty" | "skipped" | "failed";
  detail: string | null;
  total_files: number;
};

export const startGitHubImport = async (): Promise<string> =>
  (await api.post<{ url: string }>("/github/import/authorize")).data.url;

export const openGitHubImportSession = async (code: string, state: string): Promise<GitHubImportSession> =>
  (await api.post("/github/import/session", { code, state })).data;

export const importGitHubRepo = async (session: string, repoId: number): Promise<GitHubImportResult> =>
  (await api.post(`/github/import/repos/${repoId}`, { session })).data;

export const closeGitHubImportSession = async (session: string): Promise<void> => {
  await api.post("/github/import/session/close", { session });
};
