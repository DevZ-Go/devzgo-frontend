import React, { useState } from "react";
import { X, Megaphone, Pin, Send } from "lucide-react";
import type { GroupAnnouncement } from "../../types/groups";
import { useAuth } from "../../auth/AuthContext";
import { createGroupAnnouncement } from "../../api/groups";

interface CreateAnnouncementModalProps {
  groupId: string;
  userRole: "host" | "executive";
  userCustomTitle?: string | null;
  onClose: () => void;
  onSuccess: (newAnnouncement: GroupAnnouncement) => void;
}

const BADGES: GroupAnnouncement["badge"][] = [
  "Official Announcement",
  "Meeting & Workshop",
  "Project Call",
  "General Update",
];

export function CreateAnnouncementModal({
  groupId,
  userRole,
  userCustomTitle,
  onClose,
  onSuccess,
}: CreateAnnouncementModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [badge, setBadge] = useState<GroupAnnouncement["badge"]>("Official Announcement");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please provide both a title and content for the announcement.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const created = await createGroupAnnouncement(groupId, {
        title: title.trim(),
        content: content.trim(),
        badge,
        pinned,
        author: {
          id: String(user?.id ?? "usr-me"),
          name: user?.username || "Club Executive",
          username: user?.username || "executive",
          role: userRole,
          customTitle: userCustomTitle || (userRole === "host" ? "Club Host" : "Executive"),
        },
      });
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#FFFDF0] border-2 border-[#2D120D]/25 shadow-2xl p-6 space-y-5 text-[#2D120D]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#2D120D]/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-[#6B0B0C] text-[#FFF8CA]">
              <Megaphone className="w-4 h-4" />
            </span>
            <h3 className="font-serif text-lg font-bold">Publish Group Announcement</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Announcement Badge / Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BADGES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBadge(b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    badge === b
                      ? "bg-[#6B0B0C] text-[#FFF8CA] shadow-2xs"
                      : "bg-white border border-[#2D120D]/20 text-[#2D120D] hover:bg-stone-50"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Workshop This Saturday: ROS 2 Micro-controllers"
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Announcement Body *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share important updates, meeting agendas, deadlines, or project calls with all club members..."
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#2D120D] cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded text-[#6B0B0C] focus:ring-[#6B0B0C]"
              />
              <Pin className="w-3.5 h-3.5 text-[#6B0B0C]" />
              <span>Pin this announcement to the top of the group feed</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2D120D]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#6B0B0C] hover:bg-[#2D120D] text-[#FFF8CA] text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Publishing..." : "Publish to Group"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
