import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Briefcase, CheckCheck, ClipboardCheck, GitCommit, Heart, MessageSquare, Share2, Sparkles, Trophy, UserPlus, Users, X } from "lucide-react";
import type { NotificationItem } from "../types/network";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notifications";
import { queryKeys } from "../api/queryKeys";

const HOURS = 48;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatTimeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (!Number.isFinite(mins) || mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

function isRecent(iso: string): boolean {
  const then = new Date(iso).getTime();
  return Number.isFinite(then) && Date.now() - then <= HOURS * 60 * 60 * 1000;
}

const LABELS: Record<string, string> = {
  like: "Like",
  project_like: "Like",
  comment: "Comment",
  project_comment: "Comment",
  share: "Share",
  project_share: "Share",
  achievement: "Achievement",
  connection_request: "Connection",
  connection_accepted: "Connection",
  new_message: "Message",
  collaboration_request: "Collaboration",
  collaboration_accepted: "Collaboration",
  collaboration_invitation: "Collaboration",
  collaboration_joined: "Collaboration",
  collaboration_left: "Collaboration",
  collaboration_removed: "Collaboration",
  recruitment_request: "Recruiter",
  recruitment_accepted: "Recruiter",
  recruitment_declined: "Recruiter",
  challenge_invitation: "Challenge",
  challenge_posted: "Challenge",
  challenge_submission: "Challenge",
  challenge_response: "Challenge",
  challenge_feedback: "Challenge",
  workspace_commit: "Commit",
  workspace_pr: "Pull request",
};

function TypeIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5";
  if (type === "achievement") return <Trophy className={`${cls} text-amber-700`} />;
  if (type === "share" || type === "project_share") return <Share2 className={`${cls} text-maroon-800`} />;
  if (type === "like" || type === "project_like") return <Heart className={`${cls} text-rose-700`} />;
  if (type.includes("comment") || type === "new_message") return <MessageSquare className={`${cls} text-forest-800`} />;
  if (type.startsWith("connection")) return <UserPlus className={`${cls} text-forest-800`} />;
  if (type.startsWith("collaboration")) return <Users className={`${cls} text-maroon-800`} />;
  if (type.startsWith("recruitment")) return <Briefcase className={`${cls} text-maroon-800`} />;
  if (type.startsWith("challenge")) return <ClipboardCheck className={`${cls} text-maroon-800`} />;
  if (type === "workspace_commit" || type === "workspace_pr") return <GitCommit className={`${cls} text-maroon-800`} />;
  return <Sparkles className={`${cls} text-stone-600`} />;
}

function destination(notif: NotificationItem): string {
  const related = (notif.relatedId || "").split(":")[0];
  if (notif.type === "connection_request" || notif.type === "connection_accepted") {
    return `/profile/${notif.actorId || notif.actorUsername}`;
  }
  if (notif.type === "new_message") return `/messages?user=${notif.actorId}`;
  if (notif.type === "recruitment_request") return "/opportunities";
  if (notif.type === "recruitment_accepted") return `/messages?user=${notif.actorId}`;
  if (notif.type === "recruitment_declined") return "/recruit/inbox";
  if (notif.type === "challenge_invitation" || notif.type === "challenge_posted") return UUID.test(related) ? `/assessments/${related}` : "/assessments";
  if (notif.type === "challenge_feedback") return "/assessments";
  if (notif.type === "challenge_submission" || notif.type === "challenge_response") return UUID.test(related) ? `/recruit/challenges/${related}` : "/recruit/challenges";
  if ((notif.type === "workspace_commit" || notif.type === "workspace_pr") && UUID.test(related)) {
    return `/project/${related}/workspace`;
  }
  if (
    ["project_like", "project_comment", "project_share", "collaboration_request", "collaboration_accepted", "collaboration_invitation", "collaboration_joined"].includes(notif.type)
    && UUID.test(related)
  ) {
    return `/project/${related}`;
  }
  if (UUID.test(related)) return `/network/post/${related}`;
  return "/network";
}

export function NotificationsDropdown({ className = "text-stone-800 hover:bg-stone-200/80 hover:text-stone-950" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery({ queryKey: queryKeys.notifications, queryFn: fetchNotifications });
  const setNotifications = (update: (prev: NotificationItem[]) => NotificationItem[]) =>
    queryClient.setQueryData<NotificationItem[]>(queryKeys.notifications, (prev) => update(prev ?? []));
  const recent = notifications.filter((n) => isRecent(n.createdAt));
  const unreadCount = recent.filter((n) => !n.read).length;

  useEffect(() => {
    const handleUpdate = () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications }, { cancelRefetch: false });
    window.addEventListener("devzgo:notifications-updated", handleUpdate);
    return () => window.removeEventListener("devzgo:notifications-updated", handleUpdate);
  }, [queryClient]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleMarkAllRead() {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Leave the dots in place if the request fails.
    } finally {
      setLoading(false);
    }
  }

  async function handleItemClick(notif: NotificationItem) {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    }
    setOpen(false);
    navigate(destination(notif));
  }

  const panel = open ? createPortal(
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label="Close notifications" className="absolute inset-0 bg-stone-950/40" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-[min(100%,24rem)] flex-col border-l border-stone-200 bg-[#f7f5ed] text-stone-900 shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-maroon-800">Last 48 hours</p>
            <h2 className="font-serif text-3xl text-stone-900">Notifications</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-stone-600 hover:bg-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>
        {unreadCount > 0 && (
          <div className="flex justify-end px-5 py-2">
            <button type="button" disabled={loading} onClick={() => void handleMarkAllRead()} className="inline-flex items-center gap-1 text-xs font-semibold text-maroon-800 hover:text-maroon-900">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
          {recent.length === 0 ? (
            <p className="px-3 py-16 text-center font-serif text-lg text-stone-500">Nothing new in the last 48 hours.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((notif) => (
                <li key={notif.id}>
                  <button
                    type="button"
                    onClick={() => void handleItemClick(notif)}
                    className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left ${notif.read ? "bg-white/70" : "bg-[#fced96]"}`}
                  >
                    <span className="relative shrink-0">
                      {notif.actorAvatar ? (
                        <img src={notif.actorAvatar} alt="" className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-maroon-800 font-serif text-sm text-amber-100">
                          {(notif.actorName || "DV").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-[#f7f5ed] p-0.5">
                        <TypeIcon type={notif.type} />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{LABELS[notif.type] || "Update"}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-stone-800">{notif.message}</span>
                      <span className="mt-1 block text-[11px] text-stone-500">{formatTimeAgo(notif.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative rounded-xl p-2 transition focus:outline-none ${className}`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon-800 px-1 text-[10px] font-bold text-amber-100">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {panel}
    </>
  );
}
