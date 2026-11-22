import { useRef, useState } from "react";
import { X, Megaphone, Pin, Send, ImagePlus, Link2, Users, Globe, FileText, CheckCircle2 } from "lucide-react";
import type { GroupAnnouncement } from "../../types/groups";
import { useAuth } from "../../auth/AuthContext";
import { createGroupAnnouncement, uploadAnnouncementMedia } from "../../api/groups";
import { assetUrlOrNull } from "../../api/config";

type MediaItem = { url: string; type: string; source: string };

interface CreateAnnouncementModalProps {
  groupId: string;
  userRole: "host" | "president" | "vice_president" | "treasurer" | "executive";
  userCustomTitle?: string | null;
  clubName?: string;
  initialEventId?: string | null;
  initialTitle?: string;
  initialContent?: string;
  /** Pre-attached media (e.g. event poster when sharing an event). */
  initialMedia?: MediaItem[];
  events?: Array<{ id: string; title: string }>;
  onClose: () => void;
  onSuccess: (newAnnouncement: GroupAnnouncement) => void;
}

const BADGES: GroupAnnouncement["badge"][] = [
  "Official Announcement",
  "Meeting & Workshop",
  "Project Call",
  "General Update",
];

const field =
  "w-full rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm text-[#2D120D] placeholder:text-[#6E5952]/65 focus:outline-none focus:ring-2 focus:ring-[#780D18]/25 focus:border-[#780D18]";
const label = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#780D18] mb-1.5";

export function CreateAnnouncementModal({
  groupId,
  userRole,
  userCustomTitle,
  clubName,
  initialEventId,
  initialTitle,
  initialContent,
  initialMedia = [],
  events = [],
  onClose,
  onSuccess,
}: CreateAnnouncementModalProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialTitle || "");
  const [content, setContent] = useState(initialContent || "");
  const [badge, setBadge] = useState<GroupAnnouncement["badge"]>(
    initialEventId ? "Meeting & Workshop" : "Official Announcement"
  );
  const [audience, setAudience] = useState<"members" | "public">("members");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [pinned, setPinned] = useState(false);
  const [eventId, setEventId] = useState(initialEventId || "");
  const [media, setMedia] = useState<MediaItem[]>(() =>
    (initialMedia || []).filter((m) => m?.url).slice(0, 12)
  );
  const [mediaUrlDraft, setMediaUrlDraft] = useState("");
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDays, setPollDays] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMediaUrl = () => {
    const url = mediaUrlDraft.trim();
    if (!url) return;
    const type = /youtube|youtu\.be|vimeo|\.mp4|\.webm/i.test(url) ? "video" : "image";
    setMedia((prev) => [...prev, { url, type, source: "url" }].slice(0, 12));
    setMediaUrlDraft("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please provide both a title and content.");
      return;
    }
    if (includePoll) {
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (!pollQuestion.trim() || opts.length < 2) {
        setError("Poll needs a question and at least two choices.");
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      const created = await createGroupAnnouncement(groupId, {
        title: title.trim(),
        content: content.trim(),
        badge,
        pinned,
        status,
        audience,
        eventId: eventId || null,
        mediaUrls: media,
        pollQuestion: includePoll ? pollQuestion.trim() : undefined,
        pollOptions: includePoll ? opts : undefined,
        pollDurationDays: includePoll ? pollDays : undefined,
        author: {
          id: String(user?.id ?? "usr-me"),
          name: user?.username || "Club Executive",
          username: user?.username || "executive",
          role: userRole,
          customTitle:
            userCustomTitle ||
            (userRole === "host" || userRole === "president" ? "President" : "Executive"),
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#2D120D]/50"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-[#F7F1E8] border border-[#DECDBA] shadow-2xl p-5 sm:p-6 space-y-4 text-[#2D120D] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#DECDBA]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-2 rounded-lg bg-[#780D18] text-[#F7F1E8] shrink-0">
              <Megaphone className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-bold truncate">Announcement</h3>
              {clubName && <p className="text-[11px] text-[#6E5952] truncate">{clubName}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg border border-[#DECDBA] bg-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#780D18]/10 border border-[#780D18]/20 text-xs text-[#780D18]">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={label}>Type</label>
            <div className="flex flex-wrap gap-1.5">
              {BADGES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBadge(b)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    badge === b ? "bg-[#780D18] text-[#F7F1E8]" : "bg-white border border-[#DECDBA] text-[#2D120D]"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "members" as const, icon: Users, title: "Members" },
                { id: "public" as const, icon: Globe, title: "Public" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAudience(opt.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition ${
                  audience === opt.id
                    ? "border-[#780D18] bg-[#780D18]/10 ring-1 ring-[#780D18]/30"
                    : "border-[#DECDBA] bg-white hover:border-[#780D18]/40"
                }`}
              >
                <opt.icon className={`w-4 h-4 ${audience === opt.id ? "text-[#780D18]" : "text-[#6E5952]"}`} />
                <span className="text-xs font-bold">{opt.title}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "published" as const, icon: CheckCircle2, title: "Publish now" },
                { id: "draft" as const, icon: FileText, title: "Save draft" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatus(opt.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition ${
                  status === opt.id
                    ? "border-[#780D18] bg-[#780D18]/10 ring-1 ring-[#780D18]/30"
                    : "border-[#DECDBA] bg-white hover:border-[#780D18]/40"
                }`}
              >
                <opt.icon className={`w-4 h-4 ${status === opt.id ? "text-[#780D18]" : "text-[#6E5952]"}`} />
                <span className="text-xs font-bold">{opt.title}</span>
              </button>
            ))}
          </div>

          {events.length > 0 && (
            <div>
              <label className={label}>Linked event</label>
              <select className={field} value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">None</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={label}>Title *</label>
            <input className={field} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement headline" />
          </div>
          <div>
            <label className={label}>Body *</label>
            <textarea className={field} rows={4} required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a clear update for members…" />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-[#DECDBA] bg-white/70 hover:border-[#780D18]/50 hover:bg-white px-4 py-6 flex flex-col items-center gap-2 transition"
            >
              <ImagePlus className="w-6 h-6 text-[#780D18]" />
              <span className="text-xs font-bold text-[#2D120D]">Add photo or video</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                void uploadAnnouncementMedia(groupId, f)
                  .then((row) => setMedia((prev) => [...prev, row].slice(0, 12)))
                  .catch((err) => setError(err instanceof Error ? err.message : "Upload failed"));
              }}
            />
            <div className="flex gap-2">
              <input
                className={field}
                value={mediaUrlDraft}
                onChange={(e) => setMediaUrlDraft(e.target.value)}
                placeholder="Or paste image / YouTube URL"
              />
              <button type="button" onClick={addMediaUrl} className="rounded-lg bg-white border border-[#DECDBA] px-3 text-xs font-semibold shrink-0" aria-label="Add link">
                <Link2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {media.length > 0 && (
              <div className="space-y-2">
                {media.map((m, i) => (
                  <div key={`${m.url}-${i}`} className="relative rounded-xl border border-[#DECDBA] bg-white overflow-hidden">
                    {m.type === "video" ? (
                      <div className="min-h-[5rem] px-3 py-6 text-xs font-semibold text-center text-[#6E5952]">
                        Video attached
                      </div>
                    ) : (
                      <img
                        src={assetUrlOrNull(m.url) || m.url}
                        alt=""
                        className="w-full max-h-72 object-contain bg-[#2D120D]/5"
                      />
                    )}
                    <button
                      type="button"
                      className="absolute top-2 right-2 rounded-full bg-[#780D18] text-white p-1 shadow"
                      onClick={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Remove media"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded text-[#780D18]" />
            <Pin className="w-3.5 h-3.5 text-[#780D18]" />
            Pin to top
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input type="checkbox" checked={includePoll} onChange={(e) => setIncludePoll(e.target.checked)} className="rounded text-[#780D18]" />
            Attach a poll
          </label>

          {includePoll && (
            <div className="rounded-lg border border-[#DECDBA] bg-white p-3 space-y-3">
              <div>
                <label className={label}>Poll question</label>
                <input className={field} value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="What should we do next?" />
              </div>
              {pollOptions.map((opt, i) => (
                <input
                  key={i}
                  className={field}
                  value={opt}
                  onChange={(e) =>
                    setPollOptions((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))
                  }
                  placeholder={`Choice ${i + 1}`}
                />
              ))}
              {pollOptions.length < 8 && (
                <button
                  type="button"
                  className="text-xs font-semibold text-[#780D18]"
                  onClick={() => setPollOptions((prev) => [...prev, ""])}
                >
                  + Add choice
                </button>
              )}
              <div>
                <label className={label}>Open for (days)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  className={field}
                  value={pollDays}
                  onChange={(e) => setPollDays(Number(e.target.value) || 5)}
                />
                <p className="text-[11px] text-[#6E5952] mt-1">Default 5 days. Members can change their vote until close.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DECDBA]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#6E5952]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#780D18] text-[#F7F1E8] text-xs font-bold disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Saving…" : status === "draft" ? "Save draft" : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
