import { api } from "./client";
import { queryClient } from "./queryKeys";

export type WrapMetrics = {
  projects_created: number;
  top_tech: string[];
  project_likes_received: number;
  project_comments_received: number;
  posts_published: number;
  post_likes_received: number;
  post_comments_received: number;
  connections_made: number;
  projects_joined: number;
  members_joined_my_projects: number;
  invitations_sent: number;
  top_liked_category: string | null;
};

export type Wrap = {
  month: string;
  status: "in_progress" | "completed";
  period: { start: string; end: string; timezone: string };
  as_of?: string | null;
  metrics: WrapMetrics;
  empty: boolean;
  persona: { label: string; rule: string } | null;
  shared: boolean;
};

export const fetchCurrentWrap = async (): Promise<Wrap> => (await api.get("/wraps/current")).data;
export const fetchWrap = async (month: string): Promise<Wrap> => (await api.get(`/wraps/${month}`)).data;
export const fetchWrapMonths = async (): Promise<string[]> =>
  ((await api.get("/wraps")).data.items as { month: string }[]).map((i) => i.month);
export const shareWrap = (month: string) => api.post(`/wraps/${month}/share`);

/** Months follow the user's own timezone, so tell the server which one this browser is in (once per user and zone). */
export async function syncTimezone(userId: string) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const key = `devzgo_tz:${userId}`;
  if (!tz || localStorage.getItem(key) === tz) return;
  await api.put("/profiles/me", { timezone: tz });
  localStorage.setItem(key, tz);
  void queryClient.invalidateQueries({ queryKey: ["wrap"] });
}
