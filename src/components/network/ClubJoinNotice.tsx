import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, Mail, X } from "lucide-react";
import { patchClubEmailOptIn } from "../../api/groups";

export type ClubJoinNoticeKind = "joined" | "pending";

type Props = {
  clubId: string;
  clubName: string;
  kind: ClubJoinNoticeKind;
  emailOptIn?: boolean;
  showOpenClub?: boolean;
  onDismiss: () => void;
  onEmailOptInChange?: (value: boolean) => void;
};

export function ClubJoinNotice({
  clubId,
  clubName,
  kind,
  emailOptIn = true,
  showOpenClub = false,
  onDismiss,
  onEmailOptInChange,
}: Props) {
  const [emailsOn, setEmailsOn] = useState(emailOptIn);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggleEmails = async () => {
    if (saving) return;
    const next = !emailsOn;
    setEmailsOn(next);
    setSaveError(null);
    setSaving(true);
    try {
      const res = await patchClubEmailOptIn(clubId, next);
      setEmailsOn(res.emailBroadcastOptIn);
      onEmailOptInChange?.(res.emailBroadcastOptIn);
    } catch {
      setEmailsOn(!next);
      setSaveError("Could not update email preference. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative mb-6 rounded-2xl border border-[#780D18]/25 bg-white shadow-[0_10px_28px_rgba(45,18,13,0.08)] overflow-hidden"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-[#6E5952] hover:bg-[#F7F1E8] hover:text-[#2D120D] transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 p-4 sm:p-5 pr-12">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            kind === "joined"
              ? "bg-[#780D18] text-[#F7F1E8]"
              : "bg-[#F7F1E8] text-[#780D18] border border-[#780D18]/25"
          }`}
        >
          {kind === "joined" ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-serif text-lg sm:text-xl font-bold text-[#2D120D] leading-snug">
              {kind === "joined" ? `You're in ${clubName}` : `Request sent to ${clubName}`}
            </p>
            <p className="mt-1 text-sm text-[#2D120D]/75 leading-relaxed">
              {kind === "joined"
                ? "You can open announcements, events, and the member directory. Club broadcast emails start on for you — turn them off here anytime."
                : "Presidents and executives will review your request. You'll unlock the club once they approve."}
            </p>
          </div>

          {kind === "joined" && (
            <div className="rounded-xl border border-[#DECDBA] bg-[#F7F1E8]/70 p-3 sm:p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-[#780D18] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#2D120D]">Club email updates</p>
                    <p className="text-[12px] text-[#6E5952] leading-relaxed">
                      Event reminders and club broadcasts for this club only.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailsOn}
                  aria-label="Club email updates"
                  disabled={saving}
                  onClick={() => void toggleEmails()}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    emailsOn ? "bg-[#780D18]" : "bg-[#DECDBA]"
                  } disabled:opacity-60`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                      emailsOn ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {saveError && <p className="text-[11px] text-[#780D18] font-medium">{saveError}</p>}
              <p className="text-[11px] text-[#6E5952]">
                Manage every club under{" "}
                <Link
                  to="/settings?section=notifications"
                  className="font-semibold text-[#780D18] underline underline-offset-2 hover:text-[#5C0A12]"
                >
                  Settings → Notifications
                </Link>
                .
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {kind === "joined" && showOpenClub && (
              <Link
                to={`/network/groups/${clubId}`}
                className="inline-flex items-center rounded-lg bg-[#780D18] px-3.5 py-2 text-xs font-bold text-[#F7F1E8] hover:bg-[#5C0A12] transition"
              >
                Open club
              </Link>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center rounded-lg border border-[#DECDBA] bg-white px-3.5 py-2 text-xs font-bold text-[#2D120D] hover:bg-[#F7F1E8] transition"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
