import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Briefcase, ClipboardCheck, GitCommit, Heart, MessageSquare, Share2, Trophy, UserPlus, Users, X } from "lucide-react";
import type { NotificationItem } from "../types/network";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notifications";
import { acceptCollaborationRequest, answerInvitation, declineCollaborationRequest } from "../api/collaborations";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";
import { isCollabActionNotification, notificationDestination, splitRelatedId } from "../utils/notificationLinks";

const HOURS = 48;

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

function typeTone(type: string): string {
  if (type === "achievement") return "bg-amber-100 text-amber-800";
  if (type === "like" || type === "project_like") return "bg-rose-100 text-rose-800";
  if (type.includes("comment") || type === "new_message") return "bg-emerald-100 text-emerald-900";
  if (type.startsWith("connection")) return "bg-emerald-100 text-emerald-900";
  return "bg-maroon-100 text-maroon-900";
}

function TypeIcon({ type }: { type: string }) {
  const cls = "h-2.5 w-2.5";
  if (type === "achievement") return <Trophy className={cls} />;
  if (type === "share" || type === "project_share") return <Share2 className={cls} />;
  if (type === "like" || type === "project_like") return <Heart className={cls} />;
  if (type.includes("comment") || type === "new_message") return <MessageSquare className={cls} />;
  if (type.startsWith("connection")) return <UserPlus className={cls} />;
  if (type.startsWith("collaboration")) return <Users className={cls} />;
  if (type.startsWith("recruitment")) return <Briefcase className={cls} />;
  if (type.startsWith("challenge")) return <ClipboardCheck className={cls} />;
  if (type === "workspace_commit" || type === "workspace_pr") return <GitCommit className={cls} />;
  return <Bell className={cls} />;
}

export function NotificationsDropdown({ className = "text-stone-800 hover:bg-stone-200/80 hover:text-stone-950" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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

  async function markRead(notif: NotificationItem) {
    if (notif.read) return;
    await markNotificationRead(notif.id);
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
  }

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
    await markRead(notif);
    setOpen(false);
    navigate(notificationDestination(notif));
  }

  async function handleCollabAction(notif: NotificationItem, answer: "accept" | "decline") {
    const { primary, secondary } = splitRelatedId(notif.relatedId);
    if (!secondary) {
      await markRead(notif);
      setOpen(false);
      navigate(notificationDestination(notif));
      return;
    }
    setActionBusy(notif.id);
    setActionError(null);
    try {
      if (notif.type === "collaboration_request") {
        if (answer === "accept") await acceptCollaborationRequest(secondary, primary);
        else await declineCollaborationRequest(secondary);
      } else if (notif.type === "collaboration_invitation") {
        await answerInvitation(secondary, answer);
      }
      await markRead(notif);
      void queryClient.invalidateQueries({ queryKey: queryKeys.collab });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      setOpen(false);
      if (answer === "accept" && primary) navigate(`/project/${primary}?focus=team`);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setActionBusy(null);
    }
  }

  const panel = open ? createPortal(
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label="Close notifications" className="absolute inset-0 bg-stone-950/40" onClick={() => setOpen(false)} />
      <aside
        role="dialog"
        aria-label="Notifications"
        className="absolute inset-y-0 right-0 flex w-[min(100%,26rem)] flex-col border-l border-stone-200 bg-white text-stone-900 shadow-[-12px_0_40px_rgba(15,23,42,0.12)]"
      >
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-stone-950">Notifications</h2>
            <p className="text-xs text-stone-500">Past 48 hours{unreadCount > 0 ? ` · ${unreadCount} unread` : ""}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleMarkAllRead()}
                className="rounded-md px-2 py-1 text-xs font-semibold text-[#721c2a] hover:bg-stone-100 disabled:opacity-60"
              >
                Mark all as read
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        {actionError && (
          <p role="alert" className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-800">{actionError}</p>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Bell className="mx-auto h-8 w-8 text-stone-300" />
              <p className="mt-3 text-sm font-semibold text-stone-900">You're all caught up</p>
              <p className="mt-1 text-sm text-stone-500">Nothing new in the last 48 hours.</p>
            </div>
          ) : (
            <ul>
              {recent.map((notif) => {
                const tone = typeTone(notif.type);
                const collab = isCollabActionNotification(notif.type);
                return (
                  <li key={notif.id} className="border-b border-stone-100 last:border-b-0">
                    <div
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-stone-50 ${
                        notif.read ? "bg-white" : "bg-[#faf7f6]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => void handleItemClick(notif)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <span className="relative mt-0.5 shrink-0">
                          {notif.actorAvatar ? (
                            <img src={notif.actorAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700">
                              {(notif.actorName || "DV").slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${tone}`}>
                            <TypeIcon type={notif.type} />
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm leading-5 ${notif.read ? "text-stone-600" : "font-medium text-stone-950"}`}>
                            {notif.message}
                          </span>
                          <span className="mt-1 block text-xs text-stone-500">
                            {LABELS[notif.type] || "Update"} · {formatTimeAgo(notif.createdAt)}
                          </span>
                        </span>
                        {!notif.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#721c2a]" aria-hidden />}
                      </button>
                    </div>
                    {collab && (
                      <div className="flex gap-2 px-4 pb-3 pl-[4.25rem]">
                        <button
                          type="button"
                          disabled={actionBusy === notif.id}
                          onClick={() => void handleCollabAction(notif, "accept")}
                          className="rounded-lg bg-maroon-800 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-maroon-900 disabled:opacity-60"
                        >
                          {actionBusy === notif.id ? "…" : "Accept"}
                        </button>
                        <button
                          type="button"
                          disabled={actionBusy === notif.id}
                          onClick={() => void handleCollabAction(notif, "decline")}
                          className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
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
        className={`group/nav relative rounded-xl p-2 transition focus:outline-none ${className}`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="nav-icon-bell h-5 w-5" />
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
