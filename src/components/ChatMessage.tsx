import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, CheckCheck, Download, FileText, SmilePlus } from "lucide-react";
import { api } from "../api/client";
import type { Message } from "../types/network";
import { MemberAvatar } from "./MemberAvatar";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "👀", "🔥", "👏", "✅"];

function formatMessageTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "numeric" }).format(new Date(isoString));
  } catch {
    return "";
  }
}

function ChatAttachment({ url, kind, label }: { url: string; kind: "image" | "video"; label: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let dead = false;
    let objectUrl = "";
    api
      .get(url, { responseType: "blob" })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        if (dead) URL.revokeObjectURL(objectUrl);
        else setSrc(objectUrl);
      })
      .catch(() => {
        if (!dead) setFailed(true);
      });
    return () => {
      dead = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (failed) return <p className="text-xs opacity-80">Couldn't load this file.</p>;
  if (!src) return <p className="text-xs opacity-70">Loading…</p>;
  if (kind === "video") {
    return <video src={src} controls playsInline className="mt-1 max-h-64 w-full rounded-lg bg-black" />;
  }
  return <img src={src} alt={label} className="mt-1 max-h-64 w-full rounded-lg object-contain" />;
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
export function ChatMessage({ message, mine, onReact }: {
  message: Message;
  mine: boolean;
  onReact: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const name = message.senderName || message.senderUsername || "Member";
  const profile = message.senderId ? `/profile/${message.senderId}` : "/profile";
  const kind = message.mediaKind;

  return (
    <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      <Link to={profile} aria-label={mine ? "Your profile" : `Profile of ${name}`} className="mb-6 shrink-0">
        <MemberAvatar name={mine ? "You" : name} src={message.senderAvatarUrl} size="sm" />
      </Link>
      <div className={`flex max-w-[75%] flex-col ${mine ? "items-end" : "items-start"}`}>
        {!mine && (
          <Link to={profile} className="mb-1 max-w-full text-[11px] font-semibold text-maroon-800 hover:underline">
            <span className="break-words">{name}</span>
            {message.senderUsername && (
              <span className="ml-1 break-all font-mono font-normal text-stone-500">@{message.senderUsername}</span>
            )}
          </Link>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            mine ? "bg-gradient-to-r from-maroon-800 to-autumn-rust text-white" : "border border-stone-200 bg-white text-stone-900"
          }`}
        >
          {message.mediaUrl && (kind === "image" || kind === "video") && (
            <ChatAttachment url={message.mediaUrl} kind={kind} label={`${kind === "video" ? "Video" : "Photo"} from ${name}`} />
          )}
          {message.mediaUrl && kind === "file" && (
            <ChatFile url={message.mediaUrl} name={message.mediaName || "attachment"} mine={mine} />
          )}
          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
          <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-amber-100" : "text-stone-400"}`}>
            {formatMessageTime(message.createdAt)}
            {mine && (message.read ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />)}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {(message.reactions || []).map((reaction) => (
            <button
              key={reaction.emoji}
              type="button"
              aria-pressed={reaction.mine}
              onClick={() => onReact(reaction.emoji)}
              className={`rounded-full border px-2 py-0.5 text-xs ${reaction.mine ? "border-maroon-800 bg-amber-50 text-stone-900" : "border-stone-200 bg-white text-stone-700"}`}
            >
              {reaction.emoji} {reaction.count}
            </button>
          ))}
          <div className="relative">
            <button
              type="button"
              aria-label="Add a reaction"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="rounded-full border border-stone-200 bg-white p-1 text-stone-500 hover:text-maroon-800"
            >
              <SmilePlus className="h-3.5 w-3.5" />
            </button>
            {open && (
              <div className={`absolute bottom-8 z-10 flex gap-0.5 rounded-full border border-stone-200 bg-white p-1 shadow-sm ${mine ? "right-0" : "left-0"}`}>
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`React with ${emoji}`}
                    className="rounded-full px-1.5 py-0.5 text-base hover:bg-amber-50"
                    onClick={() => {
                      setOpen(false);
                      onReact(emoji);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
