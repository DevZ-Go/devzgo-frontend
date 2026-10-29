import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Ban, Bell, BellOff, EyeOff, Info, MoreHorizontal, ShieldCheck, User } from "lucide-react";
import type { SafetyRelation } from "../types/network";

type Confirm = "block" | "restrict" | null;

const itemClass =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-amber-50 hover:text-stone-900 focus:bg-amber-50 focus:outline-none";

const COPY: Record<SafetyRelation, { title: string; body: string; action: string }> = {
  block: {
    title: "Block",
    body: "Neither of you can message the other or send a connection request, and your connection ends. They aren't told.",
    action: "Block",
  },
  restrict: {
    title: "Restrict",
    body: "They can still message you, but you won't be notified and they won't see when you've read their messages. They aren't told.",
    action: "Restrict",
  },
};

/** The ⋯ menu in a chat header: mute for everyone; restrict and block for direct chats. */
export function ChatActionsMenu({
  kind,
  name,
  profileHref,
  muted,
  relation,
  busy,
  onMute,
  onRelation,
  onGroupInfo,
}: {
  kind: "dm" | "room";
  name: string;
  profileHref?: string;
  muted: boolean;
  relation?: SafetyRelation | null;
  busy?: boolean;
  onMute: (muted: boolean) => void;
  onRelation?: (relation: SafetyRelation | null) => void;
  onGroupInfo?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirm(null);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirm(null);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
    setConfirm(null);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label="Chat options"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((value) => !value)}
        className="rounded-full p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-maroon-800 disabled:opacity-50"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-30 w-72 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-lg shadow-stone-900/10"
        >
          {confirm ? (
            <div className="space-y-3 p-2">
              <p className="font-serif text-lg text-stone-900">{COPY[confirm].title} {name}?</p>
              <p className="text-xs leading-relaxed text-stone-600">{COPY[confirm].body}</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => run(() => onRelation?.(confirm))}
                  className="rounded-full bg-maroon-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-maroon-900"
                >
                  {COPY[confirm].action}
                </button>
              </div>
            </div>
          ) : (
            <>
              {kind === "dm" && profileHref && (
                <Link role="menuitem" to={profileHref} className={itemClass} onClick={() => setOpen(false)}>
                  <User className="h-4 w-4 text-stone-500" /> View profile
                </Link>
              )}
              {kind === "room" && onGroupInfo && (
                <button role="menuitem" type="button" className={itemClass} onClick={() => run(onGroupInfo)}>
                  <Info className="h-4 w-4 text-stone-500" /> Group info
                </button>
              )}
              <button role="menuitem" type="button" className={itemClass} onClick={() => run(() => onMute(!muted))}>
                {muted ? <Bell className="h-4 w-4 text-stone-500" /> : <BellOff className="h-4 w-4 text-stone-500" />}
                {muted ? "Unmute notifications" : "Mute notifications"}
              </button>
              {kind === "dm" && onRelation && (
                <>
                  <div className="my-1 border-t border-stone-100" />
                  {relation === "restrict" ? (
                    <button role="menuitem" type="button" className={itemClass} onClick={() => run(() => onRelation(null))}>
                      <ShieldCheck className="h-4 w-4 text-stone-500" /> Unrestrict
                    </button>
                  ) : relation !== "block" ? (
                    <button role="menuitem" type="button" className={itemClass} onClick={() => setConfirm("restrict")}>
                      <EyeOff className="h-4 w-4 text-stone-500" /> Restrict
                    </button>
                  ) : null}
                  {relation === "block" ? (
                    <button role="menuitem" type="button" className={itemClass} onClick={() => run(() => onRelation(null))}>
                      <ShieldCheck className="h-4 w-4 text-stone-500" /> Unblock
                    </button>
                  ) : (
                    <button
                      role="menuitem"
                      type="button"
                      className={`${itemClass} !text-rose-700 hover:!bg-rose-50`}
                      onClick={() => setConfirm("block")}
                    >
                      <Ban className="h-4 w-4" /> Block
                    </button>
                  )}
                </>
              )}
              <p className="px-3 pb-1 pt-2 text-[11px] text-stone-400">
                Manage everyone you've muted, restricted or blocked in{" "}
                <Link to="/settings?section=safety" className="font-semibold text-maroon-800 hover:underline" onClick={() => setOpen(false)}>
                  Settings
                </Link>
                .
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
