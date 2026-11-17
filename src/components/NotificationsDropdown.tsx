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

function typeTone(type: string): string {
  if (type === "achievement") return "bg-amber-100 text-amber-800";
  if (type === "like" || type === "project_like") return "bg-rose-100 text-rose-800";
  if (type.includes("comment") || type === "new_message") return "bg-emerald-100 text-emerald-900";
  if (type.startsWith("connection")) return "bg-emerald-100 text-emerald-900";
  return "bg-maroon-100 text-maroon-900";
}

function TypeIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5";
  if (type === "achievement") return <Trophy className={cls} />;
  if (type === "share" || type === "project_share") return <Share2 className={cls} />;
  if (type === "like" || type === "project_like") return <Heart className={cls} />;
  if (type.includes("comment") || type === "new_message") return <MessageSquare className={cls} />;
  if (type.startsWith("connection")) return <UserPlus className={cls} />;
  if (type.startsWith("collaboration")) return <Users className={cls} />;
  if (type.startsWith("recruitment")) return <Briefcase className={cls} />;
  if (type.startsWith("challenge")) return <ClipboardCheck className={cls} />;
  if (type === "workspace_commit" || type === "workspace_pr") return <GitCommit className={cls} />;
  return <Sparkles className={cls} />;
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
      <button type="button" aria-label="Close notifications" className="absolute inset-0 bg-[#3d0a14]/35 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-[min(100%,26rem)] flex-col border-l border-[#e7d3b0] bg-[linear-gradient(180deg,#fffdf8_0%,#f6efe2_100%)] text-stone-900 shadow-[-18px_0_40px_rgba(61,10,20,0.18)]">
        <header className="relative overflow-hidden border-b border-[#ead9b8] px-5 py-5">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#fced96]/70 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/brand/logo.png" alt="" className="h-11 w-11 rounded-2xl object-cover shadow-[0_8px_0_0_#721c2a]" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-maroon-800">Last 48 hours</p>
                <h2 className="font-serif text-3xl leading-none text-stone-900">Notifications</h2>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-[#ead9b8] bg-white p-2 text-stone-600 shadow-[0_3px_0_0_#e7d3b0] hover:translate-y-px hover:shadow-[0_2px_0_0_#e7d3b0]" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          {unreadCount > 0 && (
            <div className="relative mt-4 flex items-center justify-between">
              <span className="rounded-full bg-maroon-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#fced96] shadow-[0_3px_0_0_#3d0a14]">
                {unreadCount} new
              </span>
              <button type="button" disabled={loading} onClick={() => void handleMarkAllRead()} className="inline-flex items-center gap-1 rounded-full border border-maroon-200 bg-white px-3 py-1.5 text-xs font-semibold text-maroon-800 shadow-[0_3px_0_0_#f3d5dc] hover:translate-y-px hover:shadow-[0_2px_0_0_#f3d5dc] disabled:opacity-60">
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            </div>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {recent.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-[#ead9b8] bg-white/80 px-6 py-14 text-center shadow-[0_10px_0_0_#efe2c8]">
              <Bell className="mx-auto h-6 w-6 text-maroon-800" />
              <p className="mt-3 font-serif text-2xl text-stone-800">All quiet</p>
              <p className="mt-1 text-sm text-stone-500">Nothing new in the last 48 hours.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recent.map((notif) => {
                const tone = typeTone(notif.type);
                return (
                  <li key={notif.id}>
                    <button
                      type="button"
                      onClick={() => void handleItemClick(notif)}
                      className={`group flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition duration-150 hover:-translate-y-0.5 ${
                        notif.read
                          ? "border-[#eadfce] bg-white shadow-[0_6px_0_0_#efe4d2,0_12px_18px_rgba(61,10,20,0.05)] hover:shadow-[0_8px_0_0_#e7d8c0,0_16px_22px_rgba(61,10,20,0.08)]"
                          : "border-[#e7c84a] bg-[linear-gradient(180deg,#fff8d4_0%,#fced96_100%)] shadow-[0_7px_0_0_#e2c44a,0_14px_22px_rgba(114,28,42,0.12)] hover:shadow-[0_9px_0_0_#d7b53a,0_18px_24px_rgba(114,28,42,0.16)]"
                      }`}
                    >
                      <span className="relative shrink-0">
                        {notif.actorAvatar ? (
                          <img src={notif.actorAvatar} alt="" className="h-11 w-11 rounded-2xl object-cover shadow-[0_4px_0_0_rgba(61,10,20,0.25)]" />
                        ) : (
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(160deg,#8b263e,#5e1522)] font-serif text-sm text-[#fced96] shadow-[0_4px_0_0_#3d0a14]">
                            {(notif.actorName || "DV").slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span className={`absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white shadow-[0_2px_0_0_rgba(61,10,20,0.2)] ${tone}`}>
                          <TypeIcon type={notif.type} />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-maroon-800">{LABELS[notif.type] || "Update"}</span>
                          {!notif.read && <span className="h-2 w-2 shrink-0 rounded-full bg-maroon-800 shadow-[0_0_0_3px_rgba(114,28,42,0.15)]" />}
                        </span>
                        <span className="mt-1 block text-sm font-medium leading-snug text-stone-900">{notif.message}</span>
                        <span className="mt-1.5 block text-[11px] text-stone-500">{formatTimeAgo(notif.createdAt)}</span>
                      </span>
                    </button>
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
