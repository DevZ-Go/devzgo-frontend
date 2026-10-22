import { api } from "./client";
import { assetUrlOrNull } from "./config";
import type { GitHubPerson } from "./githubHistory";

export type ActivityKind = "all" | "commits" | "pushes";
export type ActivityScope = "mine" | "team";

type ProjectRef = { id: string; title: string; github_url: string | null };

type Base = { id: string; at: string | null; project: ProjectRef; user: GitHubPerson | null; login: string | null; name: string | null; url: string | null };
export type CommitItem = Base & { type: "commit"; sha: string; message: string };
export type PushItem = Base & { type: "push"; branch: string | null; commit_count: number | null };
export type ActivityItem = CommitItem | PushItem;

export type ActivitySummary = {
  commits: number;
  pushes: number;
  projects: number;
  active_days: number;
  longest_streak: number;
  current_streak: number;
  first_day: string | null;
  last_day: string | null;
  busiest_weekday: number | null;
  /** Monday first. */
  weekdays: number[];
  legacy_projects: number;
  contributors: number;
};

export type ActivityProject = ProjectRef & { commits: number; pushes: number; last_at: string | null };

export type ActivityLog = {
  timezone: string;
  summary: ActivitySummary;
  /** [day, commits, pushes] for active days since heatmap_start. */
  heatmap: [string, number, number][];
  heatmap_start: string;
  projects: ActivityProject[];
  total: number;
  items: ActivityItem[];
  restricted: boolean;
  subject:
    | { kind: "person"; user: GitHubPerson; scope: ActivityScope }
    | { kind: "project"; user: GitHubPerson; project: ProjectRef & { synced_at: string | null } };
};

export type ActivityFilters = { kind: ActivityKind; q: string; project: string | null; day: string | null; scope: ActivityScope };

export const PAGE_SIZE = 30;

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const person = (p: GitHubPerson | null) => (p ? { ...p, avatar_url: assetUrlOrNull(p.avatar_url) } : null);

function normalize(data: ActivityLog): ActivityLog {
  return {
    ...data,
    items: data.items.map((item) => ({ ...item, user: person(item.user) })),
    subject: { ...data.subject, user: person(data.subject.user) ?? data.subject.user },
  };
}

export async function fetchActivityLog(target: { userId?: string; projectId?: string }, filters: ActivityFilters, offset: number) {
  const path = target.projectId ? `/projects/${target.projectId}/github/activity-log` : `/profiles/${target.userId}/activity-log`;
  const params = {
    kind: filters.kind,
    q: filters.q.trim() || undefined,
    day: filters.day ?? undefined,
    offset,
    limit: PAGE_SIZE,
    tz: tz(),
    ...(target.projectId ? {} : { scope: filters.scope, project: filters.project ?? undefined }),
  };
  const { data } = await api.get<ActivityLog>(path, { params });
  return normalize(data);
}
