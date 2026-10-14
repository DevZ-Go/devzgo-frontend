import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  Users,
  Check,
  CheckCheck,
  Sparkles,
} from "lucide-react";
import type { NotificationItem } from "../types/network";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await fetchNotifications();
        if (!cancelled) setNotifications(list);
      } catch {
        // Ignore
      }
    }
    load();

    const handleUpdate = () => {
      load();
    };
    window.addEventListener("devzgo:notifications-updated", handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("devzgo:notifications-updated", handleUpdate);
    };
  }, []);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  async function handleMarkAllRead() {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleItemClick(notif: NotificationItem) {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    setOpen(false);

    // Route based on type
    if (notif.type === "connection_request" || notif.type === "connection_accepted") {
      navigate(`/profile/${notif.actorId || notif.actorUsername}`);
    } else if (notif.type === "new_message") {
      navigate(`/messages?user=${notif.actorId}`);
    } else if (
      notif.type === "collaboration_request" ||
      notif.type === "collaboration_accepted"
    ) {
      if (notif.relatedId && notif.relatedId.startsWith("proj")) {
        navigate(`/project/${notif.relatedId}`);
      } else {
        navigate(`/project/${notif.relatedId || ""}`);
      }
    } else {
      navigate("/network");
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      case "comment":
        return <MessageSquare className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />;
      case "new_message":
        return <MessageSquare className="w-3.5 h-3.5 text-purple-500 fill-purple-500/20" />;
      case "connection_request":
        return <UserPlus className="w-3.5 h-3.5 text-emerald-500" />;
      case "connection_accepted":
        return <Check className="w-3.5 h-3.5 text-emerald-600" />;
      case "collaboration_request":
      case "collaboration_accepted":
        return <Users className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 border border-gray-100 py-2 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={loading}
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleItemClick(notif)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition hover:bg-gray-50/80 ${
                    !notif.read ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    {notif.actorAvatar ? (
                      <img
                        src={notif.actorAvatar}
                        alt={notif.actorName}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center text-xs">
                        {notif.actorName?.slice(0, 2).toUpperCase() || "DV"}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-sm ring-1 ring-gray-100">
                      {getIcon(notif.type)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 leading-snug line-clamp-2">
                      <span className="font-semibold text-gray-900">{notif.actorName}</span>{" "}
                      {notif.message.replace(notif.actorName, "").trim()}
                    </p>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
