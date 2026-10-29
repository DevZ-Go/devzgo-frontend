import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BellOff, Loader2, MessageSquare, Paperclip, Plus, Search, Send, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ChatActionsMenu } from "../components/ChatActionsMenu";
import { ChatMessage } from "../components/ChatMessage";
import { GroupDetails } from "../components/GroupDetails";
import { MemberAvatar } from "../components/MemberAvatar";
import {
  createGroup,
  fetchConversations,
  fetchConversationThread,
  fetchGroupThread,
  fetchGroups,
  announceUnreadChange,
  mapMessage,
  markConversationRead,
  markGroupRead,
  reactToMessage,
  sendGroupMessage,
  sendMessage,
  uploadChatAttachment,
  type AttachmentKind,
  type ChatRoomSummary,
} from "../api/messages";
import { clearPersonSafety, fetchPersonSafety, setGroupMuted, setPersonMuted, setPersonSafety, type PersonSafety } from "../api/safety";
import { fetchConnections } from "../api/connections";
import { fetchUserProfile } from "../api/profiles";
import { useRealtimeEvent } from "../realtime/RealtimeProvider";
import type { ConnectionUserSummary, Message, SafetyRelation } from "../types/network";
import { useAuth } from "../auth/AuthContext";
import { assetUrlOrNull } from "../api/config";
import { getApiErrorMessage } from "../utils/apiError";

function threadPreview(content: string, kind?: string | null): string | null {
  const text = content.trim();
  if (text) return text;
  if (kind === "video") return "Video";
  if (kind === "image") return "Photo";
  if (kind === "file") return "File";
  return null;
}

const ACCEPT = [
  "image/png", "image/jpeg", "image/gif", "image/webp", "video/mp4", "video/webm",
  ".pdf", ".txt", ".md", ".csv", ".json", ".docx", ".xlsx", ".pptx", ".zip",
].join(",");
const LIMIT_MB: Record<AttachmentKind, number> = { image: 8, video: 25, file: 15 };
const KIND_LABEL: Record<AttachmentKind, string> = { image: "Photo", video: "Video", file: "File" };

function guessKind(file: File): AttachmentKind {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  return "file";
}

const NO_SAFETY: PersonSafety = { relation: null, blockedMe: false, muted: false };

type PersonRow = { person: ConnectionUserSummary; preview: string | null; unread: number; safety: PersonSafety };
type Pane = { kind: "dm"; person: ConnectionUserSummary } | { kind: "room"; room: ChatRoomSummary };

export function MessagesPage() {
  const [searchParams] = useSearchParams();
  const targetUserParam = searchParams.get("user");
  const { user } = useAuth();

  const [people, setPeople] = useState<PersonRow[]>([]);
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [pane, setPane] = useState<Pane | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [makingGroup, setMakingGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ConnectionUserSummary[]>([]);
  const [detailsFor, setDetailsFor] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<
    { mediaKey: string; mediaKind: AttachmentKind; mediaName: string | null; name: string } | null
  >(null);
  const [uploading, setUploading] = useState(false);
  const [paneSafety, setPaneSafety] = useState<PersonSafety>(NO_SAFETY);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadLists = useCallback(async (openUserId?: string) => {
    try {
      const [conversations, connections, groups] = await Promise.all([
        fetchConversations(),
        fetchConnections(),
        fetchGroups().catch(() => [] as ChatRoomSummary[]),
      ]);
      const rows = new Map<string, PersonRow>();
      for (const connection of connections.accepted) {
        rows.set(connection.partner.id, { person: connection.partner, preview: null, unread: 0, safety: NO_SAFETY });
      }
      for (const conversation of conversations) {
        const id = conversation.otherUser.id;
        const existing = rows.get(id);
        rows.set(id, {
          person: existing?.person ?? conversation.otherUser,
          preview: threadPreview(conversation.lastMessage.content, conversation.lastMessage.mediaKind),
          unread: conversation.unreadCount,
          safety: {
            relation: conversation.relation ?? null,
            blockedMe: Boolean(conversation.blockedMe),
            muted: Boolean(conversation.muted),
          },
        });
      }
      const list = [...rows.values()].sort((a, b) => b.unread - a.unread || (a.person.username || "").localeCompare(b.person.username || ""));
      setPeople(list);
      setContacts(connections.accepted.map((c) => c.partner));
      setRooms(groups);

      if (openUserId) {
        const found = list.find(
          (row) => row.person.id === openUserId || row.person.username.toLowerCase() === openUserId.toLowerCase()
        );
        if (found) setPane({ kind: "dm", person: found.person });
        else {
          const profile = await fetchUserProfile(openUserId);
          setPane({
            kind: "dm",
            person: {
              id: profile.userId || profile.id,
              username: profile.username,
              fullName: profile.fullName,
              headline: profile.headline,
              avatarUrl: profile.avatarUrl,
            },
          });
        }
      }
    } catch {
      /* the empty list explains itself */
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadLists(targetUserParam || undefined);
    const refresh = () => void loadLists();
    window.addEventListener("devzgo:messages-updated", refresh);
    return () => window.removeEventListener("devzgo:messages-updated", refresh);
  }, [loadLists, targetUserParam]);

  useEffect(() => {
    if (!pane) return;
    let cancelled = false;
    setLoadingThread(true);
    setMessages([]);
    setAttachment(null);
    setPaneSafety(NO_SAFETY);
    if (pane.kind === "dm") {
      void fetchPersonSafety(pane.person.id)
        .then((safety) => {
          if (!cancelled) setPaneSafety(safety);
        })
        .catch(() => undefined);
    }
    const run = pane.kind === "dm" ? fetchConversationThread(pane.person.id) : fetchGroupThread(pane.room.id);
    void run
      .then(async (thread) => {
        if (cancelled) return;
        setMessages(thread);
        if (pane.kind === "dm") await markConversationRead(pane.person.id);
        else {
          announceUnreadChange();
          setRooms((prev) => prev.map((r) => (r.id === pane.room.id ? { ...r, unreadCount: 0 } : r)));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingThread(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pane]);

  useRealtimeEvent((event) => {
    if (!pane) return;
    if (pane.kind === "dm" && event.type === "message.new") {
      const msg = mapMessage(event.message as Record<string, unknown>);
      if (msg.senderId !== pane.person.id) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      void markConversationRead(pane.person.id);
    } else if (pane.kind === "room" && event.type === "message.room" && event.room_id === pane.room.id && event.message) {
      const msg = mapMessage(event.message as Record<string, unknown>);
      if (msg.senderId === user?.id) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      void markGroupRead(pane.room.id).catch(() => undefined);
    } else if (event.type === "message.read" && pane.kind === "dm" && event.by === pane.person.id) {
      setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    } else if (event.type === "message.reaction") {
      const same =
        (pane.kind === "dm" && event.with_user === pane.person.id) ||
        (pane.kind === "room" && event.room_id === pane.room.id);
      if (!same) return;
      const run = pane.kind === "dm" ? fetchConversationThread(pane.person.id) : fetchGroupThread(pane.room.id);
      void run.then(setMessages).catch(() => undefined);
    } else if (event.type === "resync" || event.type === "poll") {
      const run = pane.kind === "dm" ? fetchConversationThread(pane.person.id) : fetchGroupThread(pane.room.id);
      void run.then(setMessages).catch(() => undefined);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!pane || sending || uploading) return;
    const content = inputContent.trim();
    if (!content && !attachment) return;
    setSending(true);
    setSendError(null);
    try {
      const sent =
        pane.kind === "dm"
          ? await sendMessage(pane.person.id, content, attachment ?? undefined)
          : await sendGroupMessage(pane.room.id, content, attachment ?? undefined);
      setInputContent("");
      setAttachment(null);
      setMessages((prev) => [...prev, sent]);
      void loadLists();
    } catch (err) {
      setSendError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const kind = guessKind(file);
    if (file.size > LIMIT_MB[kind] * 1024 * 1024) {
      setSendError(`${KIND_LABEL[kind]}s must be ${LIMIT_MB[kind]} MB or smaller.`);
      return;
    }
    setUploading(true);
    setSendError(null);
    try {
      const stored = await uploadChatAttachment(file);
      setAttachment({ ...stored, name: file.name });
    } catch (err) {
      setSendError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  function applySafety(personId: string, safety: PersonSafety) {
    setPaneSafety(safety);
    setPeople((prev) => prev.map((row) => (row.person.id === personId ? { ...row, safety } : row)));
    announceUnreadChange();
  }

  async function handleMute(muted: boolean) {
    if (!pane) return;
    setSafetyBusy(true);
    setSendError(null);
    try {
      if (pane.kind === "dm") applySafety(pane.person.id, await setPersonMuted(pane.person.id, muted));
      else {
        await setGroupMuted(pane.room.id, muted);
        setRooms((prev) => prev.map((r) => (r.id === pane.room.id ? { ...r, muted } : r)));
        announceUnreadChange();
      }
    } catch (err) {
      setSendError(getApiErrorMessage(err));
    } finally {
      setSafetyBusy(false);
    }
  }

  async function handleRelation(relation: SafetyRelation | null) {
    if (pane?.kind !== "dm") return;
    setSafetyBusy(true);
    setSendError(null);
    try {
      const id = pane.person.id;
      applySafety(id, relation ? await setPersonSafety(id, relation) : await clearPersonSafety(id));
      if (relation === "block") setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setSendError(getApiErrorMessage(err));
    } finally {
      setSafetyBusy(false);
    }
  }

  async function handleReact(messageId: string, emoji: string) {
    if (!pane) return;
    try {
      const updated = await reactToMessage(messageId, emoji, pane.kind === "room" ? pane.room.id : undefined);
      setMessages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setSendError(getApiErrorMessage(err));
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setGroupError(null);
    try {
      const room = await createGroup(groupTitle.trim(), groupMembers);
      setMakingGroup(false);
      setGroupTitle("");
      setGroupMembers([]);
      setRooms((prev) => [room, ...prev]);
      setPane({ kind: "room", room });
    } catch (err) {
      setGroupError(getApiErrorMessage(err));
    }
  }

  const query = searchFilter.trim().toLowerCase();
  const shownPeople = useMemo(
    () =>
      people.filter((row) => {
        const name = `${row.person.fullName || ""} ${row.person.username}`.toLowerCase();
        return !query || name.includes(query);
      }),
    [people, query]
  );
  const shownRooms = useMemo(
    () => rooms.filter((room) => !query || room.title.toLowerCase().includes(query)),
    [rooms, query]
  );

  const room = pane?.kind === "room" ? (rooms.find((r) => r.id === pane.room.id) ?? pane.room) : null;
  const title = pane?.kind === "dm" ? pane.person.fullName || pane.person.username : room?.title;
  const subtitle =
    pane?.kind === "dm"
      ? `@${pane.person.username}`
      : room
        ? `${room.memberCount} people${room.projectId ? " · project team" : ""}`
        : "";

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f6f0] text-stone-900 lg:h-full lg:min-h-0">
      <Navbar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-4 pt-20 sm:px-8 lg:min-h-0 lg:pb-3">
        <div className="grid h-[calc(100dvh-7rem)] min-h-[420px] grid-cols-1 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm md:grid-cols-[340px_1fr] lg:h-auto lg:min-h-0 lg:flex-1">
          <div className={`flex h-full flex-col border-r border-stone-100 ${pane ? "hidden md:flex" : "flex"}`}>
            <div className="border-b border-stone-100 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-serif text-2xl text-stone-900">Messages</h2>
                <button
                  type="button"
                  onClick={() => setMakingGroup((open) => !open)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#fced96] px-3 py-1.5 text-xs font-semibold text-stone-900"
                >
                  <Plus className="h-3.5 w-3.5" /> New group
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search people or groups"
                  aria-label="Search people or groups"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
              {makingGroup && (
                <form onSubmit={handleCreateGroup} className="mt-3 space-y-2 rounded-2xl border border-stone-200 bg-[#faf7ee] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">New group</p>
                    <button type="button" onClick={() => setMakingGroup(false)} aria-label="Close new group">
                      <X className="h-4 w-4 text-stone-500" />
                    </button>
                  </div>
                  <input
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    required
                    maxLength={120}
                    placeholder="Group name"
                    aria-label="Group name"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                  />
                  <div className="max-h-36 space-y-1 overflow-y-auto">
                    {people.length === 0 && <p className="text-xs text-stone-500">No connections yet.</p>}
                    {people.map((row) => (
                      <label key={row.person.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={groupMembers.includes(row.person.id)}
                          onChange={(e) =>
                            setGroupMembers((ids) =>
                              e.target.checked ? [...ids, row.person.id] : ids.filter((id) => id !== row.person.id)
                            )
                          }
                        />
                        <span className="min-w-0">
                          <span className="block break-words">{row.person.fullName || row.person.username}</span>
                          <span className="block break-all font-mono text-[11px] text-stone-500">@{row.person.username}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {groupError && <p className="text-xs text-rose-700">{groupError}</p>}
                  <button
                    type="submit"
                    disabled={!groupTitle.trim() || groupMembers.length === 0}
                    className="w-full rounded-lg bg-maroon-800 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Create group
                  </button>
                </form>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                </div>
              ) : (
                <>
                  <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Groups</p>
                  {shownRooms.length === 0 ? null : (
                    shownRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          setDetailsFor(null);
                          setPane({ kind: "room", room });
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left ${pane?.kind === "room" && pane.room.id === room.id ? "bg-amber-50" : "hover:bg-stone-50"}`}
                      >
                        <MemberAvatar name={room.title} src={room.avatarUrl} size="md" className="!h-10 !w-10" />
                        <span className="min-w-0 flex-1">
                          <span className="block break-words font-serif text-base text-stone-900">{room.title}</span>
                          <span className="block truncate text-xs text-stone-500">
                            {room.projectId ? "Collaboration" : "Group"} · {room.memberCount}
                            {room.lastMessage ? ` · ${room.lastMessage}` : ""}
                          </span>
                        </span>
                        {room.muted && <BellOff className="mt-1 h-3.5 w-3.5 shrink-0 text-stone-400" aria-label="Muted" />}
                        {room.unreadCount > 0 && (
                          <span className={`rounded-full px-1.5 text-[10px] font-bold ${room.muted ? "bg-stone-200 text-stone-600" : "bg-maroon-800 text-white"}`}>
                            {room.unreadCount}
                          </span>
                        )}
                      </button>
                    ))
                  )}

                  <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Direct messages</p>
                  {shownPeople.length === 0 ? null : (
                    shownPeople.map((row) => (
                      <button
                        key={row.person.id}
                        type="button"
                        onClick={() => {
                          setDetailsFor(null);
                          setPane({ kind: "dm", person: row.person });
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left ${pane?.kind === "dm" && pane.person.id === row.person.id ? "bg-amber-50" : "hover:bg-stone-50"}`}
                      >
                        <MemberAvatar name={row.person.fullName || row.person.username} src={row.person.avatarUrl} size="md" className="!h-10 !w-10" />
                        <span className="min-w-0 flex-1">
                          <span className="block break-words font-medium text-stone-900">{row.person.fullName || row.person.username}</span>
                          <span className="block break-all font-mono text-[11px] text-stone-500">@{row.person.username}</span>
                          {row.safety.relation ? (
                            <span className="block text-xs font-semibold text-stone-500">
                              {row.safety.relation === "block" ? "Blocked" : "Restricted"}
                            </span>
                          ) : (
                            row.preview && <span className="block truncate text-xs text-stone-500">{row.preview}</span>
                          )}
                        </span>
                        {row.safety.muted && <BellOff className="mt-1 h-3.5 w-3.5 shrink-0 text-stone-400" aria-label="Muted" />}
                        {row.unread > 0 && (
                          <span
                            className={`rounded-full px-1.5 text-[10px] font-bold ${
                              row.safety.muted || row.safety.relation ? "bg-stone-200 text-stone-600" : "bg-maroon-800 text-white"
                            }`}
                          >
                            {row.unread}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          <div className={`relative flex h-full min-h-0 flex-col bg-[#faf7ee] ${pane ? "flex" : "hidden md:flex"}`}>
            {room && detailsFor === room.id && (
              <GroupDetails
                roomId={room.id}
                meId={user?.id ? String(user.id) : undefined}
                connections={contacts}
                onClose={() => setDetailsFor(null)}
                onChanged={(details) => {
                  const patch = { title: details.title, avatarUrl: assetUrlOrNull(details.avatar_url), memberCount: details.members.length };
                  setRooms((prev) => prev.map((r) => (r.id === details.id ? { ...r, ...patch } : r)));
                }}
                onLeft={() => {
                  const leftId = room.id;
                  setDetailsFor(null);
                  setPane(null);
                  setRooms((prev) => prev.filter((r) => r.id !== leftId));
                }}
              />
            )}
            {pane ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <button type="button" onClick={() => setPane(null)} className="md:hidden" aria-label="Back to conversations">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    {room ? (
                      <button
                        type="button" onClick={() => setDetailsFor(room.id)}
                        className="flex min-w-0 items-center gap-3 rounded-xl text-left hover:opacity-80"
                        aria-label={`Group details for ${room.title}`}
                      >
                        <MemberAvatar name={room.title} src={room.avatarUrl} size="sm" />
                        <span className="min-w-0">
                          <span className="block break-words font-serif text-lg text-stone-900">{title}</span>
                          <span className="block break-all font-mono text-[11px] text-stone-500">{subtitle} · tap for info</span>
                        </span>
                      </button>
                    ) : pane.kind === "dm" ? (
                      <Link to={`/profile/${pane.person.id}`} className="flex min-w-0 items-center gap-3 rounded-xl hover:opacity-80">
                        <MemberAvatar name={pane.person.fullName || pane.person.username} src={pane.person.avatarUrl} size="sm" />
                        <span className="min-w-0">
                          <span className="block break-words font-serif text-lg text-stone-900">{title}</span>
                          <span className="block break-all font-mono text-[11px] text-stone-500">{subtitle}</span>
                        </span>
                      </Link>
                    ) : null}
                  </div>
                  {pane.kind === "dm" ? (
                    <ChatActionsMenu
                      kind="dm"
                      name={pane.person.fullName || `@${pane.person.username}`}
                      profileHref={`/profile/${pane.person.id}`}
                      muted={paneSafety.muted}
                      relation={paneSafety.relation}
                      busy={safetyBusy}
                      onMute={(value) => void handleMute(value)}
                      onRelation={(value) => void handleRelation(value)}
                    />
                  ) : (
                    <ChatActionsMenu
                      kind="room"
                      name={room?.title ?? pane.room.title}
                      muted={Boolean(room?.muted)}
                      busy={safetyBusy}
                      onMute={(value) => void handleMute(value)}
                      onGroupInfo={() => setDetailsFor(pane.room.id)}
                    />
                  )}
                </div>
                {pane.kind === "dm" && paneSafety.relation === "restrict" && (
                  <p className="border-b border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-600">
                    You restricted this person. You won't be notified about their messages, and they can't see when you've read them.
                  </p>
                )}
                {pane.kind !== "dm" && room?.muted && (
                  <p className="border-b border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-600">
                    This group is muted. New messages won't add to your unread count.
                  </p>
                )}
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {loadingThread ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="py-16 text-center text-sm text-stone-500">No messages yet. Say hello.</p>
                  ) : (
                    messages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        mine={Boolean(msg.isOutgoing || msg.senderId === user?.id)}
                        onReact={(emoji) => void handleReact(msg.id, emoji)}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {sendError && <p className="px-4 text-xs text-rose-700">{sendError}</p>}
                {attachment && (
                  <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
                    <span className="min-w-0 truncate">{KIND_LABEL[attachment.mediaKind]} · {attachment.name}</span>
                    <button type="button" aria-label="Remove attachment" onClick={() => setAttachment(null)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {pane.kind === "dm" && (paneSafety.relation === "block" || paneSafety.blockedMe) ? (
                  <div className="flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                    <span>
                      {paneSafety.relation === "block"
                        ? `You blocked @${pane.person.username}. Unblock them to send a message.`
                        : "You can't reply to this conversation."}
                    </span>
                    {paneSafety.relation === "block" && (
                      <button
                        type="button"
                        disabled={safetyBusy}
                        onClick={() => void handleRelation(null)}
                        className="shrink-0 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-maroon-800 hover:bg-amber-50 disabled:opacity-50"
                      >
                        Unblock
                      </button>
                    )}
                  </div>
                ) : (
                <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-stone-200 bg-white p-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      void handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Attach a photo, video or file"
                    title="Attach a photo, video or file"
                    disabled={uploading || sending}
                    onClick={() => fileRef.current?.click()}
                    className="rounded-xl border border-stone-200 p-2.5 text-stone-600 hover:text-maroon-800 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </button>
                  <input
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    placeholder={pane.kind === "dm" ? `Message @${pane.person.username}` : `Message ${room?.title ?? pane.room.title}`}
                    aria-label="Message"
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <button
                    type="submit"
                    disabled={(!inputContent.trim() && !attachment) || sending || uploading}
                    className="rounded-xl bg-maroon-800 p-2.5 text-white disabled:opacity-50"
                    aria-label="Send"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
                )}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center text-stone-500">
                <MessageSquare className="mb-3 h-10 w-10 text-stone-300" />
                <h3 className="font-serif text-2xl text-stone-900">Messages</h3>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
