import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Check, CheckCheck, Copy, CornerUpLeft, Download, Eye, FileText, Forward, Info, Plus, Smile, Star, Trash2 } from "lucide-react";
import { api } from "../api/client";
import type { Message } from "../types/network";
import { MemberAvatar } from "./MemberAvatar";
import { ChatMediaThumb } from "./ChatMediaViewer";
import { EmojiPicker } from "./EmojiPicker";
import { parseChatContent, visibleText } from "../lib/chatText";

const TOP_EMOJIS = ["👍", "❤️", "😂", "😮", "🙏"];

function formatMessageTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "numeric" }).format(new Date(isoString));
  } catch {
    return "";
  }
}

/** Documents never open inline: they download through the signed-in API with their original name. */
function ChatFile({ url, name, mine }: { url: string; name: string; mine: boolean }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function download() {
    setBusy(true);
    setFailed(false);
    try {
      const res = await api.get(url, { responseType: "blob" });
      const objectUrl = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className={`mt-1 flex w-full min-w-[12rem] items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
        mine ? "border-white/30 bg-white/10 hover:bg-white/20" : "border-stone-200 bg-stone-50 hover:bg-amber-50"
      }`}
    >
      <FileText className="h-5 w-5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{name}</span>
        <span className="block text-[11px] opacity-75">{failed ? "Couldn't download. Try again." : busy ? "Downloading…" : "Download"}</span>
      </span>
      <Download className="h-4 w-4 shrink-0" aria-hidden />
    </button>
  );
}

/** One chat bubble: who sent it, any photo, video or file, and emoji reactions. */
export function ChatMessage({
  message, mine, grouped, starred, highlighted, onReact, onOpenMedia, onUnsend, onDelete, onOpenOnce, onReply, onJumpToReply, onToggleStar, onForward, onSave, onInfo,
}: {
  message: Message;
  mine: boolean;
  grouped?: boolean;
  starred?: boolean;
  highlighted?: boolean;
  onReact: (emoji: string) => void;
  onOpenMedia?: () => void;
  onUnsend?: () => void;
  onDelete?: () => void;
  onOpenOnce?: () => void;
  onReply?: () => void;
  onJumpToReply?: (reply: { id?: string; snippet: string }) => void;
  onToggleStar?: () => void;
  onForward?: () => void;
  onSave?: () => void;
  onInfo?: () => void;
}) {
  const [quick, setQuick] = useState(false);
  const [actions, setActions] = useState(false);
  const [confirmUnsend, setConfirmUnsend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [picker, setPicker] = useState<{ top: number; left: number } | null>(null);
  const [sheet, setSheet] = useState<{ top: number; left: number } | null>(null);
  const hold = useRef<number | null>(null);
  const name = message.senderName || message.senderUsername || "Member";
  const profile = message.senderId ? `/profile/${message.senderId}` : "/profile";
  const kind = message.mediaKind;
  const time = formatMessageTime(message.createdAt);
  const receipt = mine ? (message.read ? <CheckCheck className="h-3.5 w-3.5 text-[#fced96]" /> : <Check className="h-3.5 w-3.5" />) : null;
  const parsed = parseChatContent(message.content || "");
  const voice = kind === "audio" || parsed.voice;
  const visual = Boolean(message.mediaUrl && !voice && (kind === "image" || kind === "video"));
  const caption = Boolean(parsed.text || parsed.contact);

  function place(event: MouseEvent | PointerEvent, width: number) {
    const target = "currentTarget" in event ? (event.currentTarget as HTMLElement).getBoundingClientRect() : null;
    const top = target ? target.top : event.clientY;
    const left = Math.min(Math.max(8, target ? (mine ? target.right - width : target.left) : event.clientX), window.innerWidth - width - 8);
    return { top, left };
  }

  function openSheet(event: MouseEvent | PointerEvent) {
    setQuick(false);
    setConfirmUnsend(false);
    setSheet(place(event, 240));
    setActions(true);
  }

  function startHold(event: PointerEvent) {
    if (event.pointerType === "mouse") return;
    const point = event.currentTarget;
    hold.current = window.setTimeout(() => {
      setQuick(false);
      setConfirmUnsend(false);
      const rect = point.getBoundingClientRect();
      setSheet({ top: rect.top, left: Math.min(Math.max(8, mine ? rect.right - 240 : rect.left), window.innerWidth - 248) });
      setActions(true);
    }, 480);
  }

  function clearHold() {
    if (hold.current) window.clearTimeout(hold.current);
    hold.current = null;
  }

  if (message.unsent) {
    return (
      <p className="py-1 text-center text-[12px] text-stone-500">
        {mine ? "You unsent a message" : `${name} unsent a message`}
      </p>
    );
  }

  if (message.viewOnce && message.opened && !message.content && !message.mediaUrl) {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfce] bg-white/80 px-3 py-1 text-[12px] text-stone-500">
          <Eye className="h-3.5 w-3.5" /> Opened
        </p>
      </div>
    );
  }

  if (message.viewOnce && !mine && !message.mediaUrl && !message.content) {
    const label = kind === "video" ? "Video" : kind === "image" ? "Photo" : kind === "file" ? "File" : "Message";
    return (
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onOpenOnce}
          className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-left shadow-sm"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#721c2a] text-[#fced96]">
            <Eye className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-medium text-stone-900">View once</span>
            <span className="block text-[11px] text-stone-500">{label}</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div id={`msg-${message.id}`} className={`group relative flex items-end gap-2 rounded-2xl transition ${mine ? "flex-row-reverse" : ""} ${highlighted ? "bg-[#fced96]/70" : ""}`}>
      {grouped && !mine ? (
        <Link to={profile} aria-label={`Profile of ${name}`} className="mb-1 shrink-0">
          <MemberAvatar name={name} src={message.senderAvatarUrl} size="sm" />
        </Link>
      ) : null}
      <div className={`flex max-w-[85%] flex-col sm:max-w-[70%] ${mine ? "items-end" : "items-start"}`}>
        {grouped && !mine && (
          <Link to={profile} className="mb-1 max-w-full px-1 text-[11px] font-semibold text-maroon-800 hover:underline">
            <span className="break-words">{name}</span>
            {message.senderUsername && (
              <span className="ml-1 break-all font-mono font-normal text-stone-500">@{message.senderUsername}</span>
            )}
          </Link>
        )}
        <div className={`relative flex items-end gap-1 ${mine ? "flex-row-reverse" : ""}`}>
          <div
            onDoubleClick={openSheet}
            onPointerDown={startHold}
            onPointerUp={clearHold}
            onPointerLeave={clearHold}
            onPointerCancel={clearHold}
            onContextMenu={(event) => {
              event.preventDefault();
              openSheet(event);
            }}
            className={`relative text-[0.94rem] leading-snug shadow-sm ${
              visual ? "p-1" : "px-3 py-1.5"
            } ${
              mine
                ? "rounded-2xl rounded-br-md bg-[#721c2a] text-[#fffdf8]"
                : "rounded-2xl rounded-bl-md bg-white text-stone-900"
            }`}
          >
            {message.viewOnce && (
              <span className={`absolute -top-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-[#fced96] text-[10px] font-bold text-[#3d0a14] ${mine ? "left-1" : "right-1"}`} title="View once">
                1
              </span>
            )}
            {message.mediaUrl && voice && <VoiceNote url={message.mediaUrl} mine={mine} />}
            {message.mediaUrl && !voice && (kind === "image" || kind === "video") && (
              <ChatMediaThumb
                url={message.mediaUrl}
                kind={kind}
                label={`${kind === "video" ? "Video" : "Photo"} from ${name}`}
                onOpen={() => onOpenMedia?.()}
                stamp={!caption ? <span className="inline-flex items-center gap-1">{time}{receipt}</span> : undefined}
              />
            )}
            {message.mediaUrl && kind === "file" && (
              <ChatFile url={message.mediaUrl} name={message.mediaName || "attachment"} mine={mine} />
            )}
            {parsed.forwarded && <p className={`text-[10px] italic ${visual ? "px-2 pt-1" : ""} ${mine ? "text-[#f6d7b0]" : "text-stone-400"}`}>Forwarded</p>}
            {parsed.reply && (
              <button
                type="button"
                onClick={() => onJumpToReply?.(parsed.reply!)}
                className={`mb-1 w-full border-l-2 px-2 text-left text-[11px] ${mine ? "border-[#fced96] text-[#f6d7b0]" : "border-maroon-800 text-stone-500"}`}
              >
                <span className="font-semibold">{parsed.reply.name}</span>
                <span className="mt-0.5 block truncate">{parsed.reply.snippet}</span>
              </button>
            )}
            {parsed.contact && (
              <Link to={parsed.contact.href} className={`mb-1 flex items-center gap-2 rounded-xl px-2 py-1.5 ${mine ? "bg-white/10" : "bg-[#f6efe2]"}`}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#721c2a] text-xs font-semibold text-[#fced96]">
                  {(parsed.contact.name || "?").slice(0, 1)}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{parsed.contact.name}</span>
                  <span className="block font-mono text-[11px] opacity-75">@{parsed.contact.username}</span>
                </span>
              </Link>
            )}
            {parsed.text && <p className={`whitespace-pre-wrap break-words ${visual ? "px-2 py-1" : ""}`}>{parsed.text}</p>}
            {(!visual || caption) && (
              <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${visual ? "px-2 pb-1" : ""} ${mine ? "text-[#f6d7b0]" : "text-stone-400"}`}>
                {time}
                {receipt}
              </p>
            )}
          </div>
          <div className="relative hidden [@media(hover:hover)]:block">
            <button
              type="button"
              aria-label="React"
              data-emoji-toggle
              onClick={() => setQuick((value) => !value)}
              className="grid h-7 w-7 place-items-center rounded-full bg-white text-stone-500 opacity-0 shadow-sm transition group-hover:opacity-100"
            >
              <Smile className="h-4 w-4" />
            </button>
            {quick && (
              <div className={`absolute bottom-full z-20 mb-1 flex items-center gap-0.5 rounded-full border border-[#eadfce] bg-white p-1 shadow-lg ${mine ? "right-0" : "left-0"}`}>
                {TOP_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`React with ${emoji}`}
                    className="rounded-full px-1 py-0.5 text-lg leading-none hover:bg-[#f6efe2]"
                    onClick={() => {
                      setQuick(false);
                      onReact(emoji);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="More emojis"
                  data-emoji-toggle
                  className="grid h-7 w-7 place-items-center rounded-full text-stone-500 hover:bg-[#f6efe2]"
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const width = 304;
                    setPicker({ top: rect.top, left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8) });
                    setQuick(false);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        {(message.reactions || []).length > 0 && (
          <div className={`-mt-1 flex flex-wrap items-center gap-1 ${mine ? "flex-row-reverse" : ""}`}>
            {(message.reactions || []).map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                aria-pressed={reaction.mine}
                onClick={() => onReact(reaction.emoji)}
                className={`rounded-full border px-1.5 py-0.5 text-xs shadow-sm ${
                  reaction.mine ? "border-[#e7c84a] bg-[#fff8d4] text-stone-900" : "border-[#eadfce] bg-white text-stone-700"
                }`}
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}
        {picker && createPortal(
          <div className="fixed z-[80]" style={{ top: picker.top, left: picker.left }}>
            <EmojiPicker
              align="left"
              onClose={() => setPicker(null)}
              onPick={(emoji) => {
                setPicker(null);
                onReact(emoji);
              }}
            />
          </div>,
          document.body,
        )}
        {actions && sheet && createPortal(
          <MessageSheet
            top={sheet.top}
            left={sheet.left}
            mine={mine}
            starred={starred}
            canCopy={Boolean(visibleText(message.content || ""))}
            canSave={Boolean(message.mediaUrl)}
            confirmDelete={confirmDelete}
            onClose={() => setActions(false)}
            onReact={(emoji) => {
              setActions(false);
              onReact(emoji);
            }}
            onMore={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setPicker({ top: rect.top, left: Math.min(Math.max(8, rect.left), window.innerWidth - 312) });
            }}
            onUnsend={() => { setActions(false); setConfirmUnsend(true); }}
            onDelete={() => (confirmDelete ? onDelete?.() : setConfirmDelete(true))}
            onCancelDelete={() => setConfirmDelete(false)}
            onReply={() => { setActions(false); onReply?.(); }}
            onStar={() => { setActions(false); onToggleStar?.(); }}
            onCopy={() => {
              void navigator.clipboard?.writeText(visibleText(message.content || ""));
              setActions(false);
            }}
            onForward={() => { setActions(false); onForward?.(); }}
            onSave={() => { setActions(false); onSave?.(); }}
            onInfo={() => { setActions(false); onInfo?.(); }}
          />,
          document.body,
        )}
        {confirmUnsend && createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="unsend-title">
            <div className="w-full max-w-sm rounded-3xl bg-[#fffdf8] p-5 shadow-2xl">
              <p id="unsend-title" className="font-serif text-2xl text-[#3d0a14]">Unsend message?</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                This deletes it for everyone, as if it was never sent. That includes photos, videos, voice notes and files.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmUnsend(false)} className="rounded-full border border-[#eadfce] px-4 py-2 text-sm font-semibold text-stone-700">Cancel</button>
                <button type="button" onClick={() => { setConfirmUnsend(false); onUnsend?.(); }} className="rounded-full bg-[#721c2a] px-4 py-2 text-sm font-semibold text-white">Unsend</button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
}

function MessageSheet({
  top, left, mine, starred, canCopy, canSave, confirmDelete, onClose, onReact, onMore, onUnsend, onDelete, onCancelDelete, onReply, onStar, onCopy, onForward, onSave, onInfo,
}: {
  top: number;
  left: number;
  mine: boolean;
  starred?: boolean;
  canCopy: boolean;
  canSave: boolean;
  confirmDelete: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onMore: (event: MouseEvent<HTMLButtonElement>) => void;
  onUnsend: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  onReply: () => void;
  onStar: () => void;
  onCopy: () => void;
  onForward: () => void;
  onSave: () => void;
  onInfo: () => void;
}) {
  const row = "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm text-stone-800 hover:bg-[#f6efe2]";
  return (
    <>
      <button type="button" aria-label="Close message options" className="fixed inset-0 z-[70]" onClick={onClose} />
      <div
        className="fixed z-[80] w-60 rounded-2xl border border-[#eadfce] bg-white p-1.5 shadow-xl"
        style={{ top: Math.max(8, top - 8), left, transform: "translateY(-100%)" }}
      >
        <div className="mb-1 flex items-center justify-between gap-0.5 px-1">
          {TOP_EMOJIS.map((emoji) => (
            <button key={emoji} type="button" className="rounded-full px-1 text-lg hover:bg-[#f6efe2]" onClick={() => onReact(emoji)}>{emoji}</button>
          ))}
          <button type="button" aria-label="More emojis" data-emoji-toggle className="grid h-7 w-7 place-items-center rounded-full hover:bg-[#f6efe2]" onClick={onMore}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {mine && <button type="button" className={`${row} text-maroon-800`} onClick={onUnsend}>Unsend</button>}
        {confirmDelete ? (
          <div className="flex items-center justify-between px-2 py-1 text-xs">
            <span>Delete for you?</span>
            <button type="button" className="font-semibold text-maroon-800" onClick={onDelete}>Delete</button>
            <button type="button" onClick={onCancelDelete}>Cancel</button>
          </div>
        ) : (
          <button type="button" className={row} onClick={onDelete}><Trash2 className="h-4 w-4" /> Delete</button>
        )}
        <button type="button" className={row} onClick={onReply}><CornerUpLeft className="h-4 w-4" /> Reply</button>
        <button type="button" className={row} onClick={onStar}><Star className={`h-4 w-4 ${starred ? "fill-[#fced96] text-[#a07a12]" : ""}`} /> {starred ? "Unstar" : "Star"}</button>
        {canCopy && <button type="button" className={row} onClick={onCopy}><Copy className="h-4 w-4" /> Copy</button>}
        <button type="button" className={row} onClick={onForward}><Forward className="h-4 w-4" /> Forward</button>
        {canSave && <button type="button" className={row} onClick={onSave}><Download className="h-4 w-4" /> Save</button>}
        <button type="button" className={row} onClick={onInfo}><Info className="h-4 w-4" /> Info</button>
      </div>
    </>
  );
}

function VoiceNote({ url, mine }: { url: string; mine: boolean }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [asVideo, setAsVideo] = useState(false);
  useEffect(() => {
    let dead = false;
    let objectUrl = "";
    api.get(url, { responseType: "blob" }).then((res) => {
      objectUrl = URL.createObjectURL(res.data);
      if (dead) URL.revokeObjectURL(objectUrl);
      else setSrc(objectUrl);
    }).catch(() => { if (!dead) setFailed(true); });
    return () => {
      dead = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  if (failed) return <p className="text-xs">Couldn't load this voice note.</p>;
  if (!src) return <p className="text-xs opacity-70">Loading voice note…</p>;
  if (asVideo) return <video src={src} controls className="mt-1 h-10 max-w-[240px]" />;
  return <audio src={src} controls onError={() => setAsVideo(true)} className={`mt-1 h-9 max-w-[240px] ${mine ? "invert" : ""}`} />;
}
