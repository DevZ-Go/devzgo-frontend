import { api } from "./client";
import type { NotificationItem } from "../types/network";
import { INITIAL_DEMO_NOTIFICATIONS } from "../data/networkDemoData";

const STORAGE_KEY_NOTIFICATIONS = "devzgo_notifications_v1";

function getLocalNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(INITIAL_DEMO_NOTIFICATIONS));
      return INITIAL_DEMO_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_NOTIFICATIONS;
  }
}

function saveLocalNotifications(notifications: NotificationItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent("devzgo:notifications-updated"));
  } catch {
    // Ignore
  }
}

function mapNotification(n: Record<string, unknown>): NotificationItem {
  const a = (n.actor as Record<string, unknown>) || {};
  return {
    id: String(n.id),
    recipientId: (n.recipient_id || n.recipientId || "") as string,
    actorId: (n.actor_id || n.actorId || "") as string,
    actorName: (n.actor_name || a.full_name || a.fullName || a.username || "Developer") as string,
    actorUsername: (n.actor_username || a.username || "dev") as string,
    actorAvatar: (n.actor_avatar || a.avatar_url || a.avatarUrl || null) as string | null,
    type: n.type as NotificationItem["type"],
    relatedId: (n.related_id || n.relatedId || null) as string | null,
    message: (n.message || "") as string,
    read: Boolean(n.read),
    createdAt: (n.created_at || n.createdAt || new Date().toISOString()) as string,
  };
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await api.get("/notifications");
    if (Array.isArray(res.data)) {
      return res.data.map(mapNotification);
    }
  } catch (err) {
    console.warn("Backend unavailable, loading local notifications:", err);
  }

  return getLocalNotifications();
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await api.put(`/notifications/${notificationId}/read`);
    return;
  } catch (err) {
    console.warn("Backend unavailable, marking notification read locally:", err);
  }

  const list = getLocalNotifications();
  const updated = list.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
  saveLocalNotifications(updated);
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await api.put("/notifications/read-all");
    return;
  } catch (err) {
    console.warn("Backend unavailable, marking all read locally:", err);
  }

  const list = getLocalNotifications();
  const updated = list.map((n) => ({ ...n, read: true }));
  saveLocalNotifications(updated);
}

export async function fetchUnreadNotificationsCount(): Promise<number> {
  try {
    const res = await api.get("/notifications/unread-count");
    if (typeof res.data?.unread_count === "number") {
      return res.data.unread_count;
    }
  } catch {
    // fallback
  }

  const list = getLocalNotifications();
  return list.filter((n) => !n.read).length;
}
