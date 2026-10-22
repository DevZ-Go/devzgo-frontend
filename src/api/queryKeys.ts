import { QueryClient, type QueryKey } from "@tanstack/react-query";
import type { RealtimeEvent } from "../realtime/RealtimeProvider";

/** Every cache key in one place, so screens showing the same data share (and refresh) one copy. */
export const queryKeys = {
  me: ["me"] as const,
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  projectLike: (id: string) => ["projects", id, "like"] as const,
  projectComments: (id: string) => ["projects", id, "comments"] as const,
  workspace: (id: string) => ["projects", id, "workspace"] as const,
  qualityReport: (id: string) => ["projects", id, "quality-report"] as const,
  skillMatrix: (userId: string) => ["projects", "skill-matrix", userId] as const,
  sharedAssessments: (userId: string) => ["challenges", "shared", userId] as const,
  challenges: ["challenges"] as const,
  feed: ["feed"] as const,
  activity: (id: string) => ["feed", id] as const,
  connections: ["connections"] as const,
  collab: ["collab"] as const,
  wrap: (month: string) => ["wrap", month] as const,
  notifications: ["notifications"] as const,
  messages: ["messages"] as const,
};

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

/** Server event names ("project.interaction") and notification types ("project_like") start with the area they touch. */
const AREAS: [string, QueryKey][] = [
  ["project", queryKeys.projects],
  ["connection", queryKeys.connections],
  ["collab", queryKeys.collab],
  ["challenge", queryKeys.challenges],
  ["feed", queryKeys.feed],
  ["like", queryKeys.feed],
  ["comment", queryKeys.feed],
  ["message", queryKeys.messages],
  ["new_message", queryKeys.messages],
  ["workspace", queryKeys.projects],
  ["notification", queryKeys.notifications],
];

/** Which cached queries an event makes stale; "all" after a reconnect or offline poll, to recover missed events. */
export function keysForEvent(event: RealtimeEvent): QueryKey[] | "all" {
  if (event.type === "poll" || event.type === "resync") return "all";
  const names = [event.type, typeof event.notification_type === "string" ? event.notification_type : ""];
  return AREAS.filter(([prefix]) => names.some((n) => n.startsWith(prefix))).map(([, key]) => key);
}

export function refreshForEvent(client: QueryClient, event: RealtimeEvent) {
  const keys = keysForEvent(event);
  if (keys === "all") return void client.invalidateQueries();
  keys.forEach((queryKey) => void client.invalidateQueries({ queryKey }));
}
