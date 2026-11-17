import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Archive, Ban, Bell, BellOff, EyeOff, Info, LogOut, MoreVertical, Pin, ShieldCheck, Trash2, User } from "lucide-react";
import type { SafetyRelation } from "../types/network";

type Confirm = "block" | "restrict" | null;

const itemClass =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-amber-50 hover:text-stone-900 focus:bg-amber-50 focus:outline-none";

const COPY: Record<SafetyRelation, { title: string; body: string; action: string }> = {
  block: {
    title: "Block",
    body: "Full cut: neither of you can message or connect, your connection ends, and you won't see each other in search. They aren't told.",
    action: "Block",
  },
  restrict: {
    title: "Restrict",
    body: "No DMs either way. Their work stays findable if you search, and they can still see your public projects. They aren't told.",
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
  openToken = 0,
  pinned,
  archived,
  markedUnread,
  onMute,
  onMuteFor,
  onRelation,
  onGroupInfo,
  onCloseChat,
  onUserInfo,
  onPin,
  onArchive,
  onDeleteChat,
  onMarkUnread,
  onExitGroup,
  align = "right",
}: {
  kind: "dm" | "room";
  name: string;
  profileHref?: string;
  muted: boolean;
  relation?: SafetyRelation | null;
  busy?: boolean;
  openToken?: number;
  pinned?: boolean;
  archived?: boolean;
  markedUnread?: boolean;
  onMute: (muted: boolean) => void;
  onMuteFor?: (duration: "1h" | "8h" | "1w" | "always" | "off") => void;
  onRelation?: (relation: SafetyRelation | null) => void;
  onGroupInfo?: () => void;
  onCloseChat?: () => void;
  onUserInfo?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onDeleteChat?: () => void;
  onMarkUnread?: () => void;
  onExitGroup?: () => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [muteMenu, setMuteMenu] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      setMuteMenu(false);
      setConfirm(null);
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

  useEffect(() => {
    if (openToken) setOpen(true);
  }, [openToken]);

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
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setBox({ top: rect.bottom + 6, left: align === "left" ? rect.left : Math.max(8, rect.right - 288) });
          setOpen((value) => !value);
        }}
        className="rounded-full p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-maroon-800 disabled:opacity-50"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[70] w-72 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-lg shadow-stone-900/10"
          style={{ top: box.top, left: Math.min(box.left, window.innerWidth - 296) }}
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
          ) : muteMenu ? (
            <div className="p-1">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Mute</p>
              {([
                ["1h", "1 hour"],
                ["8h", "8 hours"],
                ["1w", "1 week"],
                ["always", "Always"],
              ] as const).map(([id, label]) => (
                <button key={id} type="button" className={itemClass} onClick={() => run(() => (onMuteFor ? onMuteFor(id) : onMute(true)))}>
                  {label}
                </button>
              ))}
              {muted && (
                <button type="button" className={itemClass} onClick={() => run(() => (onMuteFor ? onMuteFor("off") : onMute(false)))}>
                  Unmute
                </button>
              )}
              <button type="button" className={itemClass} onClick={() => setMuteMenu(false)}>Back</button>
            </div>
          ) : (
            <>
              {onCloseChat && (
                <button role="menuitem" type="button" className={itemClass} onClick={() => run(onCloseChat)}>Close chat</button>
              )}
              {onUserInfo && (
                <button role="menuitem" type="button" className={itemClass} onClick={() => run(onUserInfo)}>
                  <User className="h-4 w-4 text-stone-500" /> {kind === "room" ? "Group info" : "User info"}
                </button>
              )}
              {kind === "dm" && profileHref && (
                <Link role="menuitem" to={profileHref} className={itemClass} onClick={() => setOpen(false)}>
                  <User className="h-4 w-4 text-stone-500" /> Open profile
                </Link>
              )}
              {kind === "room" && onGroupInfo && (
                <button role="menuitem" type="button" className={itemClass} onClick={() => run(onGroupInfo)}>
                  <Info className="h-4 w-4 text-stone-500" /> Members
                </button>
              )}
              <button role="menuitem" type="button" className={itemClass} onClick={() => setMuteMenu(true)}>
                {muted ? <Bell className="h-4 w-4 text-stone-500" /> : <BellOff className="h-4 w-4 text-stone-500" />}
                {muted ? "Muted" : "Mute"}
              </button>
              {onPin && (
                <button role="menuitem" type="button" className={itemClass} onClick={() => run(onPin)}>
                  <Pin className="h-4 w-4 text-stone-500" /> {pinned ? "Unpin" : "Pin"}
                </button>
              )}
              {onArchive && (
                <button role="menuitem" type="button" className={itemClass} onClick={() => run(onArchive)}>
                  <Archive className="h-4 w-4 text-stone-500" /> {archived ? "Unarchive" : "Archive"}
                </button>
              )}
              {onMarkUnread && (
                <button role="menuitem" type="button" className={itemClass} onClick={() => run(onMarkUnread)}>
                  {markedUnread ? "Mark as read" : "Mark as unread"}
                </button>
              )}
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
              {onExitGroup && (
                <button role="menuitem" type="button" className={itemClass} onClick={() => run(onExitGroup)}>
                  <LogOut className="h-4 w-4 text-stone-500" /> Exit group
                </button>
              )}
              {onDeleteChat && (
                <button role="menuitem" type="button" className={`${itemClass} !text-rose-700 hover:!bg-rose-50`} onClick={() => run(onDeleteChat)}>
                  <Trash2 className="h-4 w-4" /> Delete chat
                </button>
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
        </div>,
        document.body,
      )}
    </div>
  );
}
