import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Ban, BellOff, ChevronLeft, ChevronRight, EyeOff, FileText, Flag, Image as ImageIcon, Link2, Star, Timer, X } from "lucide-react";
import type { Message } from "../types/network";
import { linksIn, visibleText } from "../lib/chatText";
import { MemberAvatar } from "./MemberAvatar";
import { api } from "../api/client";

type Library = "media" | "docs" | "links";
type Screen = "home" | "library" | "starred";

export function ChatInfoPanel({
  title,
  username,
  subtitle,
  avatarUrl,
  profileHref,
  messages,
  starredIds,
  groups,
  favourite,
  muted,
  disappearHours,
  reported,
  isGroup,
  canDeleteGroup,
  onClose,
  onMuteFor,
  onBlock,
  onRestrict,
  onFavourite,
  onShare,
  onClear,
  onReport,
  onDisappear,
  onExit,
  onDeleteGroup,
  onOpenMedia,
  onOpenFile,
  onOpenGroup,
}: {
  title: string;
  username?: string;
  subtitle: string;
  avatarUrl?: string | null;
  profileHref?: string;
  messages: Message[];
  starredIds: string[];
  groups: { id: string; title: string }[];
  favourite?: boolean;
  muted?: boolean;
  disappearHours?: number;
  reported?: boolean;
  isGroup?: boolean;
  canDeleteGroup?: boolean;
  onClose: () => void;
  onMuteFor: (duration: "1h" | "8h" | "1w" | "always" | "off") => void;
  onBlock?: () => void;
  onRestrict?: () => void;
  onFavourite: () => void;
  onShare: () => void;
  onClear: () => void;
  onReport?: () => void;
  onDisappear: (hours: number) => void;
  onExit?: () => void;
  onDeleteGroup?: () => void;
  onOpenMedia?: (message: Message) => void;
  onOpenFile?: (message: Message) => void;
  onOpenGroup?: (groupId: string) => void;
}) {
  const [screen, setScreen] = useState<Screen>("home");
  const [library, setLibrary] = useState<Library>("media");
  const [muteOpen, setMuteOpen] = useState(false);
  const starred = messages.filter((message) => starredIds.includes(message.id) && !message.unsent);
  const photos = messages.filter((message) => (message.mediaKind === "image" || message.mediaKind === "video") && message.mediaUrl);
  const docs = messages.filter((message) => (message.mediaKind === "file" || message.mediaKind === "audio") && (message.mediaUrl || message.mediaName));
  const links = messages.flatMap((message) => linksIn(message.content || "").map((url) => ({ id: message.id, url })));

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-stone-900/35 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <aside
        className="flex max-h-[92%] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-[#eadfce] bg-[#fffdf8] shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {screen === "library" ? (
          <LibraryScreen
            library={library}
            photos={photos}
            docs={docs}
            links={links}
            onLibrary={setLibrary}
            onBack={() => setScreen("home")}
            onOpenMedia={onOpenMedia}
            onOpenFile={onOpenFile}
          />
        ) : screen === "starred" ? (
          <StarredScreen messages={starred} onBack={() => setScreen("home")} onOpenMedia={onOpenMedia} onOpenFile={onOpenFile} />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-[#eadfce] px-4 py-3">
              <p className="font-serif text-xl text-[#3d0a14]">Contact info</p>
              <button type="button" aria-label="Close info" onClick={onClose} className="rounded-full p-1.5 hover:bg-[#f6efe2]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <div className="flex items-center gap-3">
                <MemberAvatar name={title} src={avatarUrl} size="md" />
                <div className="min-w-0">
                  {profileHref ? (
                    <Link to={profileHref} className="block truncate font-serif text-2xl text-maroon-800 hover:underline">{title}</Link>
                  ) : (
                    <p className="truncate font-serif text-2xl text-stone-900">{title}</p>
                  )}
                  <p className="truncate font-mono text-xs text-stone-500">{username ? `@${username}` : subtitle}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setLibrary("media"); setScreen("library"); }}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#eadfce] bg-white px-3 py-3 text-left"
              >
                <span className="flex shrink-0">
                  {photos.slice(0, 3).map((message) => (
                    <Tile key={message.id} url={message.mediaUrl || ""} kind={message.mediaKind === "video" ? "video" : "image"} className="-ml-2 h-10 w-10 first:ml-0" />
                  ))}
                  {photos.length === 0 && <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f6efe2] text-maroon-800"><ImageIcon className="h-4 w-4" /></span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-stone-900">Media, links and docs</span>
                  <span className="block text-xs text-stone-500">{photos.length} media · {docs.length} docs · {links.length} links</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
              </button>

              <button type="button" onClick={() => setScreen("starred")} className="flex w-full items-center gap-3 rounded-2xl border border-[#eadfce] bg-white px-3 py-3 text-left">
                <Star className="h-4 w-4 text-[#a07a12]" />
                <span className="min-w-0 flex-1 text-sm font-semibold text-stone-900">Starred messages</span>
                <span className="text-xs text-stone-500">{starred.length}</span>
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </button>

              <Section title="Mute">
                <button type="button" onClick={() => setMuteOpen((open) => !open)} className="flex w-full items-center gap-2 text-sm font-semibold text-stone-800">
                  <BellOff className="h-4 w-4" /> {muted ? "Muted" : "Mute notifications"}
                </button>
                {muteOpen && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {([["1h", "1 hour"], ["8h", "8 hours"], ["1w", "1 week"], ["always", "Always"], ["off", "Unmute"]] as const).map(([value, label]) => (
                      <button key={value} type="button" className="rounded-full border border-[#eadfce] px-2 py-1 text-xs" onClick={() => { onMuteFor(value); setMuteOpen(false); }}>{label}</button>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Disappearing messages">
                <p className="mb-2 flex items-center gap-2 text-xs text-stone-500"><Timer className="h-3.5 w-3.5" /> Messages hide after this long on your side.</p>
                <div className="grid grid-cols-2 gap-1">
                  {([[0, "Off"], [24, "24 hours"], [168, "7 days"], [2160, "90 days"]] as const).map(([hours, label]) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => onDisappear(hours)}
                      className={`rounded-full border px-2 py-1 text-xs ${disappearHours === hours ? "border-maroon-800 bg-[#721c2a] text-[#fffdf8]" : "border-[#eadfce]"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Section>

              {!isGroup && (
                <Section title="Groups in common">
                  {groups.length === 0 ? <Empty>No shared groups.</Empty> : groups.map((group) => (
                    <button key={group.id} type="button" onClick={() => onOpenGroup?.(group.id)} className="flex w-full items-center gap-2 rounded-xl py-2 text-left text-sm font-medium text-stone-800 hover:bg-[#f6efe2]">
                      <span className="min-w-0 flex-1 truncate">{group.title}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
                    </button>
                  ))}
                </Section>
              )}

              <div className="flex flex-col gap-2">
                <button type="button" onClick={onShare} className="rounded-full border border-[#eadfce] py-2 text-sm font-semibold text-maroon-800">Share profile</button>
                <button type="button" onClick={onFavourite} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadfce] py-2 text-sm font-semibold text-stone-800">
                  <Star className={`h-4 w-4 ${favourite ? "fill-[#fced96] text-[#a07a12]" : ""}`} /> {favourite ? "Remove from favourites" : "Add to favourites"}
                </button>
                <button type="button" onClick={onClear} className="rounded-full border border-[#eadfce] py-2 text-sm font-semibold text-stone-700">Clear chat</button>
                {onRestrict && <button type="button" onClick={onRestrict} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadfce] py-2 text-sm font-semibold text-stone-700"><EyeOff className="h-4 w-4" /> Restrict</button>}
                {onBlock && <button type="button" onClick={onBlock} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadfce] py-2 text-sm font-semibold text-stone-800"><Ban className="h-4 w-4" /> Block</button>}
                {onReport && (
                  <button type="button" onClick={onReport} className="inline-flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold text-rose-700">
                    <Flag className="h-4 w-4" /> {reported ? "Reported" : "Report"}
                  </button>
                )}
                {isGroup && onExit && <button type="button" onClick={onExit} className="rounded-full py-2 text-sm font-semibold text-rose-700">Exit group</button>}
                {isGroup && (
                  <button type="button" disabled={!canDeleteGroup} onClick={onDeleteGroup} className="rounded-full py-2 text-sm font-semibold text-rose-700 disabled:text-stone-400">
                    {canDeleteGroup ? "Delete group" : "Delete group after you exit"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function LibraryScreen({
  library, photos, docs, links, onLibrary, onBack, onOpenMedia, onOpenFile,
}: {
  library: Library;
  photos: Message[];
  docs: Message[];
  links: { id: string; url: string }[];
  onLibrary: (library: Library) => void;
  onBack: () => void;
  onOpenMedia?: (message: Message) => void;
  onOpenFile?: (message: Message) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-[#eadfce] px-3 py-3">
        <button type="button" aria-label="Back" onClick={onBack} className="rounded-full p-1.5 hover:bg-[#f6efe2]"><ChevronLeft className="h-4 w-4" /></button>
        <p className="font-serif text-xl text-[#3d0a14]">Media, links and docs</p>
      </div>
      <div className="grid grid-cols-3 gap-2 border-b border-[#eadfce] px-3 py-3">
        <Tab active={library === "media"} onClick={() => onLibrary("media")} label="Media" icon={<ImageIcon className="h-4 w-4" />} />
        <Tab active={library === "docs"} onClick={() => onLibrary("docs")} label="Docs" icon={<FileText className="h-4 w-4" />} />
        <Tab active={library === "links"} onClick={() => onLibrary("links")} label="Links" icon={<Link2 className="h-4 w-4" />} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {library === "media" && (photos.length === 0 ? <Empty>No photos or videos.</Empty> : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((message) => (
              <button key={message.id} type="button" onClick={() => onOpenMedia?.(message)} className="aspect-square overflow-hidden rounded-xl bg-[#f6efe2]" aria-label={message.mediaKind === "video" ? "Open video" : "Open photo"}>
                <Tile url={message.mediaUrl || ""} kind={message.mediaKind === "video" ? "video" : "image"} className="h-full w-full" />
              </button>
            ))}
          </div>
        ))}
        {library === "docs" && (docs.length === 0 ? <Empty>No documents.</Empty> : (
          <div className="space-y-1">
            {docs.map((message) => (
              <button key={message.id} type="button" onClick={() => onOpenFile?.(message)} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-[#f6efe2]">
                <FileText className="h-4 w-4 shrink-0 text-maroon-800" />
                <span className="truncate">{message.mediaKind === "audio" ? "Voice note" : message.mediaName || "Document"}</span>
              </button>
            ))}
          </div>
        ))}
        {library === "links" && (links.length === 0 ? <Empty>No links.</Empty> : (
          <div className="space-y-1">
            {links.map((link) => (
              <a key={`${link.id}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="block truncate rounded-xl px-2 py-2 text-sm text-maroon-800 hover:bg-[#f6efe2] hover:underline">{link.url}</a>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function StarredScreen({
  messages, onBack, onOpenMedia, onOpenFile,
}: {
  messages: Message[];
  onBack: () => void;
  onOpenMedia?: (message: Message) => void;
  onOpenFile?: (message: Message) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-[#eadfce] px-3 py-3">
        <button type="button" aria-label="Back" onClick={onBack} className="rounded-full p-1.5 hover:bg-[#f6efe2]"><ChevronLeft className="h-4 w-4" /></button>
        <p className="font-serif text-xl text-[#3d0a14]">Starred messages</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? <Empty>No starred messages.</Empty> : messages.map((message) => {
          const visual = message.mediaUrl && (message.mediaKind === "image" || message.mediaKind === "video");
          const text = visibleText(message.content || "");
          return (
            <button
              key={message.id}
              type="button"
              onClick={() => {
                if (visual) onOpenMedia?.(message);
                else if (message.mediaUrl) onOpenFile?.(message);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#eadfce] bg-white p-2 text-left"
            >
              {visual && <Tile url={message.mediaUrl || ""} kind={message.mediaKind === "video" ? "video" : "image"} className="h-14 w-14 shrink-0 rounded-xl" />}
              <span className="min-w-0">
                <span className="block truncate text-sm text-stone-800">{text || (message.mediaKind === "audio" ? "Voice note" : message.mediaName || message.mediaKind || "Message")}</span>
                <span className="block text-[11px] text-stone-500">{new Date(message.createdAt).toLocaleString()}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Tile({ url, kind, className }: { url: string; kind: "image" | "video"; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    let dead = false;
    let objectUrl = "";
    api.get(url, { responseType: "blob" }).then((res) => {
      objectUrl = URL.createObjectURL(res.data);
      if (dead) URL.revokeObjectURL(objectUrl);
      else setSrc(objectUrl);
    }).catch(() => undefined);
    return () => {
      dead = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  if (!src) return <span className={`block bg-[#f6efe2] ${className || ""}`} />;
  if (kind === "video") return <video src={src} muted className={`object-cover ${className || ""}`} />;
  return <img src={src} alt="" className={`object-cover ${className || ""}`} />;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "#721c2a" }}>{title}</h3>
      <div className="space-y-1 rounded-2xl border border-[#eadfce] bg-white px-3 py-2">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="text-sm text-stone-500">{children}</p>;
}

function Tab({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-[11px] font-semibold ${active ? "border-maroon-800 bg-[#721c2a] text-[#fffdf8]" : "border-[#eadfce] bg-white text-stone-700"}`}>
      {icon}
      {label}
    </button>
  );
}
