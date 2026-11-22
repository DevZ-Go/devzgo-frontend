import { useState } from "react";
import { Mail, X } from "lucide-react";
import { broadcastClubEmail } from "../../api/groups";

const field =
  "w-full rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm text-[#2D120D] placeholder:text-[#6E5952]/65 focus:outline-none focus:ring-2 focus:ring-[#780D18]/25 focus:border-[#780D18]";
const label = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#780D18] mb-1.5";

export function ClubBroadcastModal({
  groupId,
  clubName,
  onClose,
}: {
  groupId: string;
  clubName: string;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await broadcastClubEmail(groupId, subject.trim(), body.trim());
      setMessage(`Queued email to ${res.queued} opted-in member${res.queued === 1 ? "" : "s"}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#2D120D]/50"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-[#DECDBA] bg-[#F7F1E8] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#DECDBA] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#780D18] text-white">
              <Mail className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold">Email members</h3>
              <p className="text-[11px] text-[#6E5952]">{clubName} · opted-in only</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg border border-[#DECDBA] bg-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="text-xs text-[#780D18]">{error}</p>}
        {message && <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{message}</p>}
        <div>
          <label className={label}>Subject</label>
          <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
        </div>
        <div>
          <label className={label}>Message</label>
          <textarea className={field} rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write to opted-in members…" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#6E5952]">
            Close
          </button>
          <button
            type="button"
            disabled={saving || Boolean(message)}
            onClick={() => void send()}
            className="rounded-lg bg-[#780D18] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {saving ? "Sending…" : "Send email"}
          </button>
        </div>
      </div>
    </div>
  );
}
