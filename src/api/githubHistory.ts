import { api } from "./client";
import { assetUrlOrNull } from "./config";
import { startGitHubImport } from "./githubImport";

export type GitHubPerson = { id: string; username: string; full_name?: string | null; avatar_url?: string | null };

export type GitHubContributor = {
  id: string;
  login: string | null;
  name: string;
  avatar_url: string | null;
  commits: number;
  additions: number | null;
  deletions: number | null;
  pushes: number;
  share: number;
  first_commit_at: string | null;
  last_commit_at: string | null;
  weekly: [number, number][];
  user: GitHubPerson | null;
};

export type GitHubInsights = {
  github_url: string | null;
  synced_at: string | null;
  can_refresh: boolean;
  totals: { commits: number; pushes: number; contributors: number };
  weekly: [number, number][];
  contributors: GitHubContributor[];
};

const person = (p: GitHubPerson | null): GitHubPerson | null => (p ? { ...p, avatar_url: assetUrlOrNull(p.avatar_url) } : null);
const withPeople = <T extends { user: GitHubPerson | null }>(rows: T[]): T[] => rows.map((row) => ({ ...row, user: person(row.user) }));
const base = (projectId: string) => `/projects/${projectId}/github`;

function normalize(data: GitHubInsights): GitHubInsights {
  return { ...data, contributors: withPeople(data.contributors) };
}

export const fetchGitHubInsights = async (projectId: string): Promise<GitHubInsights> =>
  normalize((await api.get<GitHubInsights>(base(projectId))).data);

export const refreshGitHubHistory = async (projectId: string, session: string): Promise<GitHubInsights> =>
  normalize((await api.post<GitHubInsights>(`${base(projectId)}/refresh`, { session })).data);

/** The import page finishes a refresh when GitHub sends the owner back with this project remembered. */
export const REFRESH_KEY = "devzgo.githubRefresh";

export async function startGitHubRefresh(projectId: string): Promise<void> {
  sessionStorage.setItem(REFRESH_KEY, projectId);
  try {
    window.location.assign(await startGitHubImport());
  } catch (err) {
    sessionStorage.removeItem(REFRESH_KEY);
    throw err;
  }
}
