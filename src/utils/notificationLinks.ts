import type { NotificationItem } from "../types/network";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** related_id is often `primary` or `primary:secondary` (project:comment, project:request, …). */
export function splitRelatedId(relatedId: string | null | undefined): { primary: string; secondary: string | null } {
  const raw = (relatedId || "").trim();
  if (!raw) return { primary: "", secondary: null };
  const [primary = "", secondary = ""] = raw.split(":");
  return {
    primary,
    secondary: secondary && UUID.test(secondary) ? secondary : secondary || null,
  };
}

/** Where a notification click should land, including query params that scroll/focus the exact item. */
export function notificationDestination(notif: NotificationItem): string {
  const { primary, secondary } = splitRelatedId(notif.relatedId);
  const related = primary;

  if (notif.type === "achievement") {
    return "/profile?tab=badges";
  }
  if (notif.type === "connection_request") {
    return "/network/connections?tab=requests";
  }
  if (notif.type === "connection_accepted") {
    return `/profile/${notif.actorId || notif.actorUsername}`;
  }
  if (notif.type === "new_message") return `/messages?user=${notif.actorId}`;
  if (notif.type === "recruitment_request") return "/opportunities";
  if (notif.type === "recruitment_accepted") return `/messages?user=${notif.actorId}`;
  if (notif.type === "recruitment_declined") return "/recruit/inbox";
  if (notif.type === "challenge_invitation" || notif.type === "challenge_posted") {
    return UUID.test(related) ? `/assessments/${related}` : "/assessments";
  }
  if (notif.type === "challenge_feedback") return "/assessments";
  if (notif.type === "challenge_submission" || notif.type === "challenge_response") {
    return UUID.test(related) ? `/recruit/challenges/${related}` : "/recruit/challenges";
  }
  if ((notif.type === "workspace_commit" || notif.type === "workspace_pr") && UUID.test(related)) {
    return `/project/${related}/workspace`;
  }
  if (notif.type === "project_comment" && UUID.test(related)) {
    const q = new URLSearchParams({ focus: "comment" });
    if (secondary && UUID.test(secondary)) q.set("comment", secondary);
    return `/project/${related}?${q.toString()}`;
  }
  if (notif.type === "comment" && UUID.test(related)) {
    const q = new URLSearchParams();
    if (secondary && UUID.test(secondary)) q.set("comment", secondary);
    const qs = q.toString();
    return qs ? `/network/post/${related}?${qs}` : `/network/post/${related}`;
  }
  if (notif.type === "collaboration_request" && UUID.test(related)) {
    const q = new URLSearchParams({ focus: "team" });
    if (secondary && UUID.test(secondary)) q.set("request", secondary);
    return `/project/${related}?${q.toString()}`;
  }
  if (notif.type === "collaboration_invitation" && UUID.test(related)) {
    const q = new URLSearchParams({ focus: "team" });
    if (secondary && UUID.test(secondary)) q.set("invite", secondary);
    return `/project/${related}?${q.toString()}`;
  }
  if (
    ["project_like", "project_share", "collaboration_accepted", "collaboration_joined"].includes(notif.type)
    && UUID.test(related)
  ) {
    return `/project/${related}${notif.type.startsWith("collaboration") ? "?focus=team" : ""}`;
  }
  if (UUID.test(related)) return `/network/post/${related}`;
  return "/network";
}

export function isCollabActionNotification(type: string): boolean {
  return type === "collaboration_request" || type === "collaboration_invitation";
}
