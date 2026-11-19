import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, BellOff, Camera, Eye, FileText, Image as ImageIcon, Loader2, MessageSquare, Mic, Pin, Plus, Search, Send, Smile, UserRound, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ChatActionsMenu } from "../components/ChatActionsMenu";
import { api } from "../api/client";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInfoPanel } from "../components/ChatInfoPanel";
import { EmojiPicker } from "../components/EmojiPicker";
import { ChatMediaViewer, type ChatMediaItem } from "../components/ChatMediaViewer";
import { GroupDetails } from "../components/GroupDetails";
import { MemberAvatar } from "../components/MemberAvatar";
import {
  createGroup,
  fetchConversations,
  fetchConversationThread,
  fetchGroupThread,
  fetchGroups,
  fetchGroupDetails,
  announceUnreadChange,
  mapMessage,
  markConversationRead,
  markGroupRead,
  consumeViewOnce,
  openViewOnce,
  reactToMessage,
  sendGroupMessage,
  leaveGroup,
  sendMessage,
  hideMessage,
  unsendMessage,
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
import { chatKey, useChatPrefs } from "../lib/chatPrefs";
import { contactBody, forwardBody, parseChatContent, replyBody, visibleText } from "../lib/chatText";

function rowPreview(message: { content: string; mediaKind?: string | null; viewOnce?: boolean; opened?: boolean; unsent?: boolean }): string | null {
  if (message.unsent) return null;
  if (message.viewOnce) return message.opened ? "Opened" : "View once";
  return threadPreview(message.content, message.mediaKind);
}

function threadPreview(content: string, kind?: string | null): string | null {
  const parsed = parseChatContent(content || "");
  if (parsed.voice || kind === "audio") return "Voice note";
  if (parsed.project && !parsed.text.trim()) return `Shared ${parsed.project.title}`;
  const text = parsed.text.trim();
  if (text) return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  if (kind === "video") return "Video";
  if (kind === "image") return "Photo";
  if (kind === "file") return "File";
  return null;
}

function fileForForward(message: Message, blob: Blob): File {
  const parsed = parseChatContent(message.content || "");
  const type = (blob.type || "").split(";")[0];
  if (message.mediaKind === "audio" || parsed.voice) {
    const mp4 = type.includes("mp4");
    return new File([blob], mp4 ? "voice.mp4" : "voice.webm", { type: mp4 ? "video/mp4" : "video/webm" });
  }
  if (message.mediaKind === "file") {
    return new File([blob], message.mediaName || "file", { type: type || "application/octet-stream" });
  }
  const ext = type.includes("webm") ? "webm"
    : type.includes("png") ? "png"
    : type.includes("gif") ? "gif"
    : type.includes("webp") ? "webp"
    : type.includes("jpeg") || type.includes("jpg") ? "jpg"
    : message.mediaKind === "video" ? "mp4"
    : "jpg";
  const mime = type || (ext === "mp4" || ext === "webm" ? `video/${ext}` : ext === "jpg" ? "image/jpeg" : `image/${ext}`);
  return new File([blob], `forward.${ext}`, { type: mime });
}

const LIMIT_MB: Record<AttachmentKind, number> = { image: 8, video: 25, file: 15, audio: 15 };
const KIND_LABEL: Record<AttachmentKind, string> = { image: "Photo", video: "Video", file: "File", audio: "Voice note" };

function guessKind(file: File): AttachmentKind {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("audio/") || name.startsWith("voice.")) return "audio";
  if (file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|avi|mkv)$/.test(name)) return "video";
  if (file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/.test(name)) return "image";
  return "file";
}

function unsupportedVideo(file: File): string | null {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (/\.(mov|m4v|avi|mkv|qt)$/.test(name) || type.includes("quicktime") || type === "video/x-msvideo") {
    return "Videos must be MP4 or WebM (max 25 MB). Phone clips in MOV/HEVC aren’t supported yet.";
  }
  if (guessKind(file) === "video" && !(/\.(mp4|webm)$/.test(name) || type === "video/mp4" || type === "video/webm" || !type)) {
    return "Videos must be MP4 or WebM (max 25 MB).";
  }
  return null;
}

const NO_SAFETY: PersonSafety = { relation: null, blockedMe: false, muted: false };

type PersonRow = { person: ConnectionUserSummary; preview: string | null; unread: number; safety: PersonSafety; lastAt?: string | null };
type Pane = { kind: "dm"; person: ConnectionUserSummary } | { kind: "room"; room: ChatRoomSummary };

export function MessagesPage() {
  const [searchParams] = useSearchParams();
  const targetUserParam = searchParams.get("user");
  const targetRoomParam = searchParams.get("room");
  const { user } = useAuth();
  const { prefs, update, toggle } = useChatPrefs(user?.id ? String(user.id) : undefined);

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
  const [mediaIndex, setMediaIndex] = useState<number | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [viewOnce, setViewOnce] = useState(false);
  const [onceView, setOnceView] = useState<{ message: Message; roomId?: string } | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [commonGroups, setCommonGroups] = useState<{ id: string; title: string }[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [exitedOpen, setExitedOpen] = useState<{ id: string; title: string } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [forwarding, setForwarding] = useState(false);
  const [forwardError, setForwardError] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [infoMsg, setInfoMsg] = useState<Message | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const openInfoOnLoad = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const focusComposer = useCallback(() => {
    const field = composerRef.current;
    if (!field) return;
    field.focus();
    const end = field.value.length;
    field.setSelectionRange(end, end);
  }, []);

  useLayoutEffect(() => {
    if (!replyTo) return;
    focusComposer();
  }, [replyTo, focusComposer]);

  const mediaItems = useMemo<ChatMediaItem[]>(
    () =>
      messages.flatMap((msg) => {
        if (!msg.mediaUrl || (msg.mediaKind !== "image" && msg.mediaKind !== "video")) return [];
        const sender = msg.senderName || msg.senderUsername || "Member";
        return [{
          id: msg.id,
          url: msg.mediaUrl,
          kind: msg.mediaKind,
          label: `${msg.mediaKind === "video" ? "Video" : "Photo"} from ${sender}`,
          senderName: sender,
          createdAt: msg.createdAt,
        }];
      }),
    [messages],
  );

  const loadLists = useCallback(async (openUserId?: string, openRoomId?: string) => {
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
          preview: rowPreview(conversation.lastMessage),
          lastAt: conversation.lastMessage.createdAt,
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

      const openedRoom = openRoomId ? groups.find((room) => room.id === openRoomId) : undefined;
      if (openedRoom) setPane({ kind: "room", room: openedRoom });
      else if (openUserId) {
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
    void loadLists(targetUserParam || undefined, targetRoomParam || undefined);
    const refresh = () => void loadLists();
    window.addEventListener("devzgo:messages-updated", refresh);
    return () => window.removeEventListener("devzgo:messages-updated", refresh);
  }, [loadLists, targetUserParam, targetRoomParam]);

  useEffect(() => {
    if (!pane) return;
    let cancelled = false;
    setLoadingThread(true);
    setMessages([]);
    setAttachment(null);
    setMediaIndex(null);
    setEmojiOpen(false);
    setViewOnce(false);
    setOnceView(null);
    setReplyTo(null);
    setInfoOpen(openInfoOnLoad.current);
    openInfoOnLoad.current = false;
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

  useEffect(() => {
    if (!infoOpen || pane?.kind !== "dm") {
      setCommonGroups([]);
      return;
    }
    const personId = pane.person.id;
    let cancelled = false;
    void Promise.all(rooms.map((room) => fetchGroupDetails(room.id).then((details) => ({ details })).catch(() => null))).then((rows) => {
      if (cancelled) return;
      setCommonGroups(
        rows.flatMap((row) => (
          row && row.details.members.some((member) => String(member.user_id) === personId)
            ? [{ id: row.details.id, title: row.details.title }]
            : []
        )),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [infoOpen, pane, rooms]);

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
    } else if (event.type === "message.updated" || event.type === "message.reaction") {
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
          ? await sendMessage(pane.person.id, replyTo ? replyBody(replyTo.id, replyTo.senderName || "Message", visibleText(replyTo.content || "") || replyTo.mediaKind || "Attachment", content) : content, attachment ?? undefined, viewOnce && (attachment?.mediaKind === "image" || attachment?.mediaKind === "video"))
          : await sendGroupMessage(pane.room.id, replyTo ? replyBody(replyTo.id, replyTo.senderName || "Message", visibleText(replyTo.content || "") || replyTo.mediaKind || "Attachment", content) : content, attachment ?? undefined, viewOnce && (attachment?.mediaKind === "image" || attachment?.mediaKind === "video"));
      setInputContent("");
      if (composerRef.current) composerRef.current.style.height = "";
      setAttachment(null);
      setViewOnce(false);
      setReplyTo(null);
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
    const blocked = unsupportedVideo(file);
    if (blocked) {
      setSendError(blocked);
      return;
    }
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
      const message = getApiErrorMessage(err);
      setSendError(
        message === "Network Error"
          ? "Upload failed. Use an MP4 or WebM under 25 MB and try again."
          : message,
      );
    } finally {
      setUploading(false);
    }
  }

  function applySafety(personId: string, safety: PersonSafety) {
    if (pane?.kind === "dm" && pane.person.id === personId) setPaneSafety(safety);
    setPeople((prev) => prev.map((row) => (row.person.id === personId ? { ...row, safety } : row)));
    announceUnreadChange();
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

  async function muteChat(kind: "dm" | "room", id: string, duration: "1h" | "8h" | "1w" | "always" | "off") {
    const key = chatKey(kind, id);
    setSafetyBusy(true);
    try {
      const muted = duration !== "off";
      if (kind === "dm") {
        const safety = await setPersonMuted(id, muted);
        applySafety(id, safety);
        if (pane?.kind === "dm" && pane.person.id === id) setPaneSafety(safety);
      } else {
        await setGroupMuted(id, muted);
        setRooms((prev) => prev.map((item) => (item.id === id ? { ...item, muted } : item)));
      }
      update((current) => {
        const muteUntil = { ...current.muteUntil };
        if (!muted || duration === "always") delete muteUntil[key];
        else muteUntil[key] = Date.now() + (duration === "1h" ? 3_600_000 : duration === "8h" ? 28_800_000 : 604_800_000);
        return { ...current, muteUntil };
      });
    } catch (err) {
      setSendError(getApiErrorMessage(err));
    } finally {
      setSafetyBusy(false);
    }
  }

  async function openAttachment(message: Message) {
    if (!message.mediaUrl) return;
    const res = await api.get(message.mediaUrl, { responseType: "blob" });
    const objectUrl = URL.createObjectURL(res.data);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }

  async function saveMedia(message: Message) {
    if (!message.mediaUrl) return;
    const res = await api.get(message.mediaUrl, { responseType: "blob" });
    const objectUrl = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = message.mediaName || "devzgo-chat";
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function sendPlain(target: Pane, content: string, media?: { mediaKey: string; mediaName?: string | null }) {
    if (target.kind === "dm") await sendMessage(target.person.id, content, media);
    else await sendGroupMessage(target.room.id, content, media);
    if (pane && ((target.kind === "dm" && pane.kind === "dm" && target.person.id === pane.person.id) || (target.kind === "room" && pane.kind === "room" && target.room.id === pane.room.id))) {
      const thread = target.kind === "dm" ? await fetchConversationThread(target.person.id) : await fetchGroupThread(target.room.id);
      setMessages(thread);
    }
    void loadLists();
  }

  async function toggleVoice() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    if (!pane) return;
    const target = pane;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const recorded = (rec.mimeType || mime || "audio/webm").split(";")[0];
        const mp4 = recorded.includes("mp4");
        const file = new File(chunks, mp4 ? "voice.mp4" : "voice.webm", { type: mp4 ? "video/mp4" : "video/webm" });
        if (file.size < 16) {
          setSendError("That voice note was too short. Hold the microphone a little longer.");
          return;
        }
        void (async () => {
          setUploading(true);
          setSendError(null);
          try {
            const stored = await uploadChatAttachment(file);
            const sentRaw = target.kind === "dm"
              ? await sendMessage(target.person.id, "⟦voice⟧", { mediaKey: stored.mediaKey, mediaName: "Voice note" })
              : await sendGroupMessage(target.room.id, "⟦voice⟧", { mediaKey: stored.mediaKey, mediaName: "Voice note" });
            const sent = { ...sentRaw, mediaKind: "audio" as const, content: "⟦voice⟧" };
            setMessages((prev) => (prev.some((item) => item.id === sent.id) ? prev : [...prev, sent]));
            void loadLists();
          } catch (err) {
            setSendError(getApiErrorMessage(err));
          } finally {
            setUploading(false);
          }
        })();
      };
      rec.start(200);
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      setSendError("Microphone access is needed for a voice note.");
    }
  }

  async function handleDelete(messageId: string) {
    if (!pane) return;
    update((current) => {
      const deleted = current.deleted ?? [];
      return { ...current, deleted: deleted.includes(messageId) ? deleted : [...deleted, messageId] };
    });
    try {
      await hideMessage(messageId, pane.kind === "room" ? pane.room.id : undefined);
    } catch {
      /* kept on this account even if the server has not caught up */
    }
  }

  function jumpToReply(reply: { id?: string; snippet: string }) {
    const id = (reply.id && messages.some((item) => item.id === reply.id))
      ? reply.id
      : messages.find((item) => {
          const text = visibleText(item.content || "") || item.mediaKind || "";
          return Boolean(reply.snippet) && text.startsWith(reply.snippet.slice(0, 24));
        })?.id;
    if (!id) return;
    document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashId(id);
    window.setTimeout(() => setFlashId((current) => (current === id ? null : current)), 900);
  }

  async function handleUnsend(messageId: string) {
    if (!pane) return;
    try {
      await unsendMessage(messageId, pane.kind === "room" ? pane.room.id : undefined);
      setMessages((prev) => prev.filter((item) => item.id !== messageId));
      void loadLists();
    } catch (err) {
      setSendError(getApiErrorMessage(err));
    }
  }

  async function handleOpenOnce(message: Message) {
    if (!pane) return;
    const roomId = pane.kind === "room" ? pane.room.id : undefined;
    try {
      const full = await openViewOnce(message.id, roomId);
      setOnceView({ message: full, roomId });
      setMessages((prev) => prev.map((item) => (
        item.id === message.id ? { ...item, opened: true, content: "", mediaUrl: null, mediaName: null } : item
      )));
    } catch (err) {
      setSendError(getApiErrorMessage(err));
    }
  }

  async function handleCloseOnce() {
    if (!onceView) return;
    const { message, roomId } = onceView;
    setOnceView(null);
    try {
      const updated = await consumeViewOnce(message.id, roomId);
      setMessages((prev) => prev.map((item) => (item.id === message.id ? updated : item)));
    } catch {
      setMessages((prev) => prev.map((item) => (
        item.id === message.id ? { ...item, opened: true, content: "", mediaUrl: null } : item
      )));
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

  const paneKey = pane ? chatKey(pane.kind, pane.kind === "dm" ? pane.person.id : pane.room.id) : "";
  const deletedIds = prefs.deleted ?? [];
  const exitedGroups = prefs.exited ?? [];
  const reportedIds = prefs.reported ?? [];
  const disappearHours = prefs.disappear?.[paneKey] || 0;
  const keepChat = (key: string, lastAt?: string | null) => {
    const hidden = prefs.hiddenAt[key];
    if (hidden && (!lastAt || lastAt <= hidden)) return false;
    return true;
  };
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
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-0 pb-0 pt-16 sm:px-4 sm:pb-4 sm:pt-20 lg:min-h-0 lg:px-8 lg:pb-3">
        <div className="grid h-[calc(100dvh-4rem)] min-h-[420px] grid-cols-1 overflow-hidden border-[#eadfce] bg-white sm:h-[calc(100dvh-7rem)] sm:rounded-2xl sm:border sm:shadow-[0_12px_40px_rgba(61,10,20,0.08)] md:grid-cols-[minmax(280px,360px)_1fr] lg:h-auto lg:min-h-0 lg:flex-1">
          <div data-tour="messages-list" className={`flex h-full flex-col border-r border-[#eadfce] bg-white ${pane ? "hidden md:flex" : "flex"}`}>
            <div className="bg-[#721c2a] px-4 pb-3 pt-4 text-[#fffdf8]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-serif" style={{ color: "#fffdf8", margin: 0, fontSize: "1.7rem", lineHeight: 1.1 }}>Chats</h2>
                <button
                  type="button"
                  onClick={() => setMakingGroup((open) => !open)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#fced96] px-3 py-1.5 text-xs font-semibold text-stone-900"
                >
                  <Plus className="h-3.5 w-3.5" /> New group
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#a67c86]" />
                <input
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search or start a chat"
                  aria-label="Search people or groups"
                  className="w-full rounded-full border border-white/20 bg-[#fffdf8] py-2 pl-9 pr-3 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-[#fced96]"
                />
              </div>
            </div>
            {makingGroup && (
              <div className="border-b border-[#eadfce] bg-[#fffdf8] px-3 py-3">
                <form onSubmit={handleCreateGroup} className="space-y-2 rounded-2xl border border-[#eadfce] bg-white p-3">
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
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {loadingList ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                </div>
              ) : (
                <>
                  {shownRooms.filter((room) => keepChat(chatKey("room", room.id), room.lastAt)).length === 0 ? null : (
                    shownRooms.filter((room) => keepChat(chatKey("room", room.id), room.lastAt)).map((room) => (
                      <div
                        key={room.id}
                        className={`group flex items-center border-b border-[#f3eadc] ${prefs.pinned.includes(chatKey("room", room.id)) ? "order-first" : ""} ${pane?.kind === "room" && pane.room.id === room.id ? "bg-[#f8efe6]" : "hover:bg-[#fbf7f1]"}`}
                      >
                      <button
                        type="button"
                        onClick={() => {
                          setDetailsFor(null);
                          setExitedOpen(null);
                          setPane({ kind: "room", room });
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left"
                      >
                        <MemberAvatar name={room.title} src={room.avatarUrl} size="md" className="!h-10 !w-10" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1 break-words font-serif text-base text-stone-900">{prefs.pinned.includes(chatKey("room", room.id)) && <Pin className="h-3 w-3 shrink-0 text-maroon-800" aria-label="Pinned" />}{room.title}</span>
                          <span className="block truncate text-xs text-stone-500">
                            {room.projectId ? "Collaboration" : "Group"} · {room.memberCount}
                            {room.lastMessage ? ` · ${room.lastMessage === "⟦voice⟧" ? "Voice note" : room.lastMessage}` : ""}
                          </span>
                        </span>
                        {room.muted && <BellOff className="mt-1 h-3.5 w-3.5 shrink-0 text-stone-400" aria-label="Muted" />}
                        {room.unreadCount > 0 && (
                          <span className={`rounded-full px-1.5 text-[10px] font-bold ${room.muted ? "bg-stone-200 text-stone-600" : "bg-maroon-800 text-white"}`}>
                            {room.unreadCount}
                          </span>
                        )}
                      </button>
                      <div className="pr-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                          <ChatActionsMenu
                            kind="room"
                            name={room.title}
                            muted={Boolean(room.muted)}
                            busy={safetyBusy}
                            pinned={prefs.pinned.includes(chatKey("room", room.id))}
                            markedUnread={prefs.unread.includes(chatKey("room", room.id))}
                            onMute={(value) => void muteChat("room", room.id, value ? "always" : "off")}
                            onMuteFor={(duration) => void muteChat("room", room.id, duration)}
                            onGroupInfo={() => { setExitedOpen(null); setPane({ kind: "room", room }); setDetailsFor(room.id); }}
                            onCloseChat={() => { if (pane?.kind === "room" && pane.room.id === room.id) setPane(null); }}
                            onUserInfo={() => { openInfoOnLoad.current = true; setExitedOpen(null); setPane({ kind: "room", room }); }}
                            onPin={() => toggle("pinned", chatKey("room", room.id))}
                            onDeleteChat={() => update((current) => ({ ...current, hiddenAt: { ...current.hiddenAt, [chatKey("room", room.id)]: new Date().toISOString() } }))}
                            onMarkUnread={() => toggle("unread", chatKey("room", room.id))}
                            onExitGroup={() => {
                              const title = room.title;
                              void leaveGroup(room.id).then(() => {
                                update((current) => ({ ...current, exited: [...current.exited.filter((item) => item.id !== room.id), { id: room.id, title }] }));
                                if (pane?.kind === "room" && pane.room.id === room.id) setPane(null);
                                setRooms((prev) => prev.filter((item) => item.id !== room.id));
                                setExitedOpen({ id: room.id, title });
                              }).catch((err) => setSendError(getApiErrorMessage(err)));
                            }}
                          />
                      </div>
                      </div>
                    ))
                  )}

                  {shownRooms.length === 0 && shownPeople.length === 0 && (
                    <p className="px-4 py-10 text-center text-sm text-stone-500">
                      {query ? "No chats match that search." : "No conversations yet."}
                    </p>
                  )}
                  {shownPeople.filter((row) => keepChat(chatKey("dm", row.person.id), row.lastAt)).length === 0 ? null : (
                    shownPeople.filter((row) => keepChat(chatKey("dm", row.person.id), row.lastAt)).map((row) => (
                      <div
                        key={row.person.id}
                        className={`group flex items-center border-b border-[#f3eadc] ${prefs.pinned.includes(chatKey("dm", row.person.id)) ? "order-first" : ""} ${pane?.kind === "dm" && pane.person.id === row.person.id ? "bg-[#f8efe6]" : "hover:bg-[#fbf7f1]"}`}
                      >
                      <button
                        type="button"
                        onClick={() => {
                          setDetailsFor(null);
                          setExitedOpen(null);
                          update((current) => ({ ...current, unread: current.unread.filter((id) => id !== chatKey("dm", row.person.id)) }));
                          setPane({ kind: "dm", person: row.person });
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left"
                      >
                        <MemberAvatar name={row.person.fullName || row.person.username} src={row.person.avatarUrl} size="md" className="!h-10 !w-10" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1 break-words font-medium text-stone-900">{prefs.pinned.includes(chatKey("dm", row.person.id)) && <Pin className="h-3 w-3 shrink-0 text-maroon-800" aria-label="Pinned" />}{row.person.fullName || row.person.username}</span>
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
                      <div className="pr-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                          <ChatActionsMenu
                            kind="dm"
                            name={row.person.fullName || `@${row.person.username}`}
                            profileHref={`/profile/${row.person.id}`}
                            muted={row.safety.muted}
                            relation={row.safety.relation}
                            busy={safetyBusy}
                            pinned={prefs.pinned.includes(chatKey("dm", row.person.id))}
                            markedUnread={prefs.unread.includes(chatKey("dm", row.person.id))}
                            onMute={(value) => void muteChat("dm", row.person.id, value ? "always" : "off")}
                            onMuteFor={(duration) => void muteChat("dm", row.person.id, duration)}
                            onRelation={(value) => {
                              void (async () => {
                                const safety = value ? await setPersonSafety(row.person.id, value) : await clearPersonSafety(row.person.id);
                                applySafety(row.person.id, safety);
                              })();
                            }}
                            onCloseChat={() => { if (pane?.kind === "dm" && pane.person.id === row.person.id) setPane(null); }}
                            onUserInfo={() => { openInfoOnLoad.current = true; setExitedOpen(null); setPane({ kind: "dm", person: row.person }); }}
                            onPin={() => toggle("pinned", chatKey("dm", row.person.id))}
                            onDeleteChat={() => update((current) => ({ ...current, hiddenAt: { ...current.hiddenAt, [chatKey("dm", row.person.id)]: new Date().toISOString() } }))}
                            onMarkUnread={() => toggle("unread", chatKey("dm", row.person.id))}
                          />
                      </div>
                      </div>
                    ))
                  )}
                  {exitedGroups.filter((group) => !query || group.title.toLowerCase().includes(query)).map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => { setPane(null); setExitedOpen(group); }}
                      className="flex w-full items-center gap-3 border-b border-[#f3eadc] px-4 py-2.5 text-left hover:bg-[#fbf7f1]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-base text-stone-900">{group.title}</span>
                        <span className="block text-xs text-stone-500">Exited · delete when you are ready</span>
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className={`relative flex h-full min-h-0 flex-col bg-[#efe6d6] ${pane || exitedOpen ? "flex" : "hidden md:flex"}`}>
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
                <div className="flex items-center justify-between gap-3 border-b border-[#eadfce] bg-[#fffdf8] px-3 py-2.5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button type="button" onClick={() => setPane(null)} className="md:hidden" aria-label="Back to conversations">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInfoOpen(true)}
                      aria-label={pane.kind === "dm" ? "User info" : "Group info"}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left hover:bg-[#f6efe2]"
                    >
                      <MemberAvatar name={title || "Chat"} src={pane.kind === "dm" ? pane.person.avatarUrl : room?.avatarUrl} size="sm" />
                      <span className="min-w-0">
                        <span className={`block break-words font-serif text-lg ${pane.kind === "dm" ? "text-maroon-800" : "text-stone-900"}`}>{title}</span>
                        <span className="block break-all font-mono text-[11px] text-stone-500">{subtitle}</span>
                      </span>
                    </button>
                  </div>
                </div>
                {pane.kind === "dm" && paneSafety.relation === "restrict" && (
                  <p className="border-b border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-600">
                    You restricted this person. Neither of you can send DMs until you remove the restrict. Their public work stays findable.
                  </p>
                )}
                {pane.kind !== "dm" && room?.muted && (
                  <p className="border-b border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-600">
                    This group is muted. New messages won't add to your unread count.
                  </p>
                )}
                <div
                  className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-3 sm:px-4 sm:py-4"
                  style={{
                    backgroundColor: "#efe6d6",
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(114,28,42,0.08) 1px, transparent 0)",
                    backgroundSize: "22px 22px",
                  }}
                >
                  {loadingThread ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="mx-auto mt-16 w-fit rounded-lg bg-white/80 px-3 py-1.5 text-center text-xs text-stone-600 shadow-sm">
                      No messages yet. Say hello.
                    </p>
                  ) : (
                    messages.filter((msg) => {
                      if (msg.unsent || deletedIds.includes(msg.id)) return false;
                      if (prefs.clearedAt[paneKey] && msg.createdAt <= prefs.clearedAt[paneKey]) return false;
                      if (disappearHours && Date.now() - new Date(msg.createdAt).getTime() > disappearHours * 3_600_000) return false;
                      return true;
                    }).map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        grouped={pane.kind === "room"}
                        starred={prefs.stars.includes(msg.id)}
                        mine={Boolean(msg.isOutgoing || msg.senderId === user?.id)}
                        highlighted={flashId === msg.id}
                        onReact={(emoji) => void handleReact(msg.id, emoji)}
                        onJumpToReply={jumpToReply}
                        onUnsend={msg.isOutgoing || msg.senderId === user?.id ? () => void handleUnsend(msg.id) : undefined}
                        onDelete={() => void handleDelete(msg.id)}
                        onOpenOnce={() => void handleOpenOnce(msg)}
                        onReply={() => {
                          setReplyTo(msg);
                          focusComposer();
                        }}
                        onToggleStar={() => toggle("stars", msg.id)}
                        onForward={() => setForwardMsg(msg)}
                        onSave={() => void saveMedia(msg)}
                        onInfo={() => setInfoMsg(msg)}
                        onOpenMedia={() => {
                          if (msg.mediaKind === "video") toggle("played", msg.id);
                          const i = mediaItems.findIndex((item) => item.id === msg.id);
                          if (i >= 0) setMediaIndex(i);
                        }}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {mediaIndex != null && mediaItems[mediaIndex] && (
                  <ChatMediaViewer
                    items={mediaItems}
                    index={mediaIndex}
                    onIndex={setMediaIndex}
                    onClose={() => setMediaIndex(null)}
                  />
                )}
                {onceView && (onceView.message.mediaKind === "image" || onceView.message.mediaKind === "video") && onceView.message.mediaUrl && (
                  <ChatMediaViewer
                    items={[{
                      id: onceView.message.id,
                      url: onceView.message.mediaUrl,
                      kind: onceView.message.mediaKind,
                      label: onceView.message.content || "View once",
                      senderName: onceView.message.senderName || onceView.message.senderUsername || "Member",
                      createdAt: onceView.message.createdAt,
                    }]}
                    index={0}
                    onIndex={() => undefined}
                    onClose={() => void handleCloseOnce()}
                  />
                )}
                {onceView && onceView.message.mediaKind !== "image" && onceView.message.mediaKind !== "video" && (
                  <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#3d0a14]/45 p-4 sm:items-center" role="dialog" aria-label="View once">
                    <div className="w-full max-w-sm rounded-3xl bg-[#fffdf8] p-5 shadow-xl">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-maroon-800">View once</p>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-stone-900">
                        {onceView.message.content || onceView.message.mediaName || "Opened"}
                      </p>
                      <p className="mt-2 text-xs text-stone-500">This disappears when you close it.</p>
                      <button type="button" onClick={() => void handleCloseOnce()} className="mt-4 w-full rounded-full bg-[#721c2a] py-2.5 text-sm font-semibold text-white">
                        Close
                      </button>
                    </div>
                  </div>
                )}
                {sendError && <p className="px-4 text-xs text-rose-700">{sendError}</p>}
                {attachment && (
                  <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
                    <span className="min-w-0 truncate">{KIND_LABEL[attachment.mediaKind]} · {attachment.name}</span>
                    <button type="button" aria-label="Remove attachment" onClick={() => setAttachment(null)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {pane.kind === "dm" && (paneSafety.relation === "block" || paneSafety.relation === "restrict" || paneSafety.blockedMe) ? (
                  <div className="flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                    <span>
                      {paneSafety.relation === "block"
                        ? `You blocked @${pane.person.username}. Unblock them to send a message.`
                        : paneSafety.relation === "restrict"
                          ? `You restricted @${pane.person.username}. Remove the restrict to message them.`
                          : "You can't reply to this conversation."}
                    </span>
                    {(paneSafety.relation === "block" || paneSafety.relation === "restrict") && (
                      <button
                        type="button"
                        disabled={safetyBusy}
                        onClick={() => void handleRelation(null)}
                        className="shrink-0 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-maroon-800 hover:bg-amber-50 disabled:opacity-50"
                      >
                        {paneSafety.relation === "block" ? "Unblock" : "Unrestrict"}
                      </button>
                    )}
                  </div>
                ) : (
                <form onSubmit={handleSend} className="border-t border-[#eadfce] bg-[#f6efe2] px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                  {replyTo && (
                    <div className="mb-1 flex items-center justify-between rounded-xl bg-white px-3 py-1.5 text-xs">
                      <span className="min-w-0 truncate">Reply to {replyTo.senderName || "message"} · {visibleText(replyTo.content || "") || replyTo.mediaKind}</span>
                      <button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)}><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                  {viewOnce && (attachment?.mediaKind === "image" || attachment?.mediaKind === "video") && (
                    <p className="mb-1 px-2 text-[11px] font-medium text-maroon-800">View once · the photo or video can be opened a single time</p>
                  )}
                  <div className="flex items-end gap-1 sm:gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    className="hidden"
                    onChange={(e) => {
                      void handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={docRef}
                    type="file"
                    accept=".pdf,.txt,.md,.csv,.json,.docx,.xlsx,.pptx,.zip"
                    className="hidden"
                    onChange={(e) => {
                      void handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  {(attachment?.mediaKind === "image" || attachment?.mediaKind === "video") && (
                    <button
                      type="button"
                      aria-pressed={viewOnce}
                      aria-label={viewOnce ? "Turn off view once" : "Send this photo or video once"}
                      title="View once"
                      onClick={() => setViewOnce((on) => !on)}
                      className={`rounded-full p-2.5 ${viewOnce ? "bg-[#721c2a] text-[#fced96]" : "text-stone-600 hover:bg-white/70 hover:text-maroon-800"}`}
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  )}
                  <div className="relative">
                    <button type="button" aria-label="Attach" aria-expanded={attachOpen} onClick={() => setAttachOpen((open) => !open)} className="rounded-full p-2.5 text-stone-600 hover:bg-white/70 hover:text-maroon-800">
                      <Plus className="h-5 w-5" />
                    </button>
                    {attachOpen && (
                      <div className="absolute bottom-full left-0 z-20 mb-2 w-52 rounded-2xl border border-[#eadfce] bg-white p-1 shadow-lg">
                        <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-[#f6efe2]" onClick={() => { setAttachOpen(false); setCameraOpen(true); }}><Camera className="h-4 w-4" /> Camera</button>
                        <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-[#f6efe2]" onClick={() => { setAttachOpen(false); fileRef.current?.click(); }}><ImageIcon className="h-4 w-4" /> Photos and videos</button>
                        <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-[#f6efe2]" onClick={() => { setAttachOpen(false); docRef.current?.click(); }}><FileText className="h-4 w-4" /> Document</button>
                        <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-[#f6efe2]" onClick={() => { setAttachOpen(false); setContactOpen(true); }}><UserRound className="h-4 w-4" /> Contact or profile</button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Add an emoji"
                      aria-expanded={emojiOpen}
                      data-emoji-toggle
                      onClick={() => setEmojiOpen((open) => !open)}
                      className="rounded-full p-2.5 text-stone-600 hover:bg-white/70 hover:text-maroon-800"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    {emojiOpen && (
                      <EmojiPicker
                        onClose={() => setEmojiOpen(false)}
                        onPick={(emoji) => {
                          const field = composerRef.current;
                          const start = field?.selectionStart ?? inputContent.length;
                          const end = field?.selectionEnd ?? inputContent.length;
                          const next = inputContent.slice(0, start) + emoji + inputContent.slice(end);
                          setInputContent(next);
                          setEmojiOpen(false);
                          requestAnimationFrame(() => {
                            field?.focus();
                            const pos = start + emoji.length;
                            field?.setSelectionRange(pos, pos);
                          });
                        }}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={recording ? "Stop voice note" : "Record a voice note"}
                    aria-pressed={recording}
                    disabled={uploading || sending}
                    onClick={() => void toggleVoice()}
                    className={`rounded-full p-2.5 disabled:opacity-50 ${recording ? "bg-[#721c2a] text-[#fced96]" : "text-stone-600 hover:bg-white/70 hover:text-maroon-800"}`}
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <textarea
                    ref={composerRef}
                    value={inputContent}
                    rows={1}
                    onChange={(e) => {
                      setInputContent(e.target.value);
                      e.target.style.height = "0px";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="Type a message"
                    aria-label="Message"
                    className="mb-0.5 max-h-32 min-w-0 flex-1 resize-none rounded-3xl border border-[#eadfce] bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#fced96]"
                  />
                  <button
                    type="submit"
                    disabled={(!inputContent.trim() && !attachment) || sending || uploading}
                    className="mb-0.5 rounded-full bg-[#721c2a] p-3 text-white disabled:opacity-50"
                    aria-label="Send"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                  </div>
                </form>
                )}
                {infoOpen && pane && (
                  <ChatInfoPanel
                    title={title || "Chat"}
                    username={pane.kind === "dm" ? pane.person.username : undefined}
                    subtitle={subtitle}
                    avatarUrl={pane.kind === "dm" ? pane.person.avatarUrl : room?.avatarUrl}
                    profileHref={pane.kind === "dm" ? `/profile/${pane.person.id}` : undefined}
                    messages={messages.filter((msg) => !msg.unsent && !deletedIds.includes(msg.id))}
                    starredIds={prefs.stars}
                    groups={commonGroups}
                    favourite={prefs.favourite.includes(paneKey)}
                    muted={pane.kind === "dm" ? paneSafety.muted : Boolean(room?.muted)}
                    disappearHours={disappearHours}
                    reported={pane.kind === "dm" && reportedIds.includes(pane.person.id)}
                    isGroup={pane.kind === "room"}
                    canDeleteGroup={pane.kind === "room" && exitedGroups.some((group) => group.id === pane.room.id)}
                    onClose={() => setInfoOpen(false)}
                    onMuteFor={(duration) => void muteChat(pane.kind, pane.kind === "dm" ? pane.person.id : pane.room.id, duration)}
                    onBlock={pane.kind === "dm" ? () => void handleRelation(paneSafety.relation === "block" ? null : "block") : undefined}
                    onRestrict={pane.kind === "dm" ? () => void handleRelation(paneSafety.relation === "restrict" ? null : "restrict") : undefined}
                    onFavourite={() => toggle("favourite", paneKey)}
                    onShare={() => { setInfoOpen(false); setShareOpen(true); }}
                    onClear={() => update((current) => ({ ...current, clearedAt: { ...current.clearedAt, [paneKey]: new Date().toISOString() } }))}
                    onReport={pane.kind === "dm" ? () => update((current) => ({ ...current, reported: current.reported.includes(pane.person.id) ? current.reported : [...current.reported, pane.person.id] })) : undefined}
                    onDisappear={(hours) => update((current) => ({ ...current, disappear: { ...current.disappear, [paneKey]: hours } }))}
                    onExit={pane.kind === "room" ? () => {
                      const left = pane.room;
                      void leaveGroup(left.id).then(() => {
                        update((current) => ({ ...current, exited: [...current.exited.filter((item) => item.id !== left.id), { id: left.id, title: left.title }] }));
                        setInfoOpen(false);
                        setPane(null);
                        setRooms((prev) => prev.filter((item) => item.id !== left.id));
                        setExitedOpen({ id: left.id, title: left.title });
                      }).catch((err) => setSendError(getApiErrorMessage(err)));
                    } : undefined}
                    onDeleteGroup={pane.kind === "room" ? () => {
                      const id = pane.room.id;
                      update((current) => ({ ...current, exited: current.exited.filter((item) => item.id !== id) }));
                      setInfoOpen(false);
                      setPane(null);
                    } : undefined}
                    onOpenMedia={(message) => {
                      if (message.mediaKind === "video") toggle("played", message.id);
                      const index = mediaItems.findIndex((item) => item.id === message.id);
                      if (index >= 0) setMediaIndex(index);
                    }}
                    onOpenFile={(message) => void openAttachment(message)}
                    onOpenGroup={(groupId) => {
                      const found = rooms.find((item) => item.id === groupId);
                      if (!found) return;
                      setInfoOpen(false);
                      setDetailsFor(null);
                      setPane({ kind: "room", room: found });
                    }}
                  />
                )}
                {infoMsg && (
                  <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#3d0a14]/40 p-4 sm:items-center" role="dialog">
                    <div className="w-full max-w-sm rounded-3xl bg-[#fffdf8] p-5">
                      <p className="font-serif text-2xl text-[#3d0a14]">Message info</p>
                      <p className="mt-3 text-sm">Sent {new Date(infoMsg.createdAt).toLocaleString()}</p>
                      <p className="text-sm">
                        {infoMsg.isOutgoing || infoMsg.senderId === user?.id
                          ? infoMsg.read ? "Seen" : "Delivered, not seen yet"
                          : "Received"}
                      </p>
                      {infoMsg.mediaKind === "video" && (
                        <p className="text-sm">{prefs.played.includes(infoMsg.id) ? "Video played" : "Video not played"}</p>
                      )}
                      <button type="button" onClick={() => setInfoMsg(null)} className="mt-4 w-full rounded-full bg-[#721c2a] py-2 text-sm font-semibold text-white">Close</button>
                    </div>
                  </div>
                )}
                {forwardMsg && (
                  <ForwardSheet
                    people={contacts}
                    rooms={rooms}
                    busy={forwarding}
                    error={forwardError}
                    onClose={() => { if (!forwarding) { setForwardError(null); setForwardMsg(null); } }}
                    onSend={(targets) => {
                      const source = forwardMsg;
                      void (async () => {
                        setForwarding(true);
                        setForwardError(null);
                        try {
                          const parsed = parseChatContent(source.content || "");
                          const voice = source.mediaKind === "audio" || parsed.voice;
                          const body = voice ? `⟦voice⟧\n${forwardBody(parsed.text.trim())}` : forwardBody(parsed.text.trim());
                          const file = source.mediaUrl
                            ? fileForForward(source, (await api.get(source.mediaUrl, { responseType: "blob", timeout: 120_000 })).data as Blob)
                            : null;
                          for (const target of targets) {
                            const stored = file ? await uploadChatAttachment(file) : null;
                            const media = stored ? { mediaKey: stored.mediaKey, mediaName: source.mediaName || stored.mediaName } : undefined;
                            if (target.kind === "dm") {
                              const person = contacts.find((item) => item.id === target.id);
                              if (person) await sendPlain({ kind: "dm", person }, body, media);
                            } else {
                              const room = rooms.find((item) => item.id === target.id);
                              if (room) await sendPlain({ kind: "room", room }, body, media);
                            }
                          }
                          setForwardMsg(null);
                        } catch (err) {
                          setForwardError(getApiErrorMessage(err));
                        } finally {
                          setForwarding(false);
                        }
                      })();
                    }}
                  />
                )}
                {shareOpen && pane && (
                  <Picker title="Share this profile" onClose={() => setShareOpen(false)} people={people} rooms={rooms} onPick={(target) => {
                    const body = pane.kind === "dm"
                      ? contactBody(`/profile/${pane.person.id}`, pane.person.fullName || pane.person.username, pane.person.username)
                      : `Group · ${pane.room.title}`;
                    void sendPlain(target, body);
                    setShareOpen(false);
                  }} />
                )}
                {contactOpen && (
                  <Picker title="Share a profile" onClose={() => setContactOpen(false)} people={people} rooms={[]} onPick={(target) => {
                    if (target.kind !== "dm") return;
                    const person = target.person;
                    void sendPlain(pane, contactBody(`/profile/${person.id}`, person.fullName || person.username, person.username));
                    setContactOpen(false);
                  }} />
                )}
                {cameraOpen && (
                  <CameraSheet
                    onClose={() => setCameraOpen(false)}
                    onShot={(file) => {
                      setCameraOpen(false);
                      void handleFile(file);
                    }}
                  />
                )}
              </>
            ) : exitedOpen ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <h3 className="font-serif text-3xl text-[#3d0a14]" style={{ color: "#3d0a14" }}>{exitedOpen.title}</h3>
                <p className="mt-2 max-w-sm text-sm text-stone-600">You left this group. Delete it from your chats when you are ready.</p>
                <button
                  type="button"
                  onClick={() => {
                    const id = exitedOpen.id;
                    update((current) => ({ ...current, exited: current.exited.filter((item) => item.id !== id) }));
                    setExitedOpen(null);
                  }}
                  className="mt-4 rounded-full bg-[#721c2a] px-4 py-2 text-sm font-semibold text-white"
                >
                  Delete group
                </button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#721c2a] text-[#fced96] shadow-sm">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <h3 className="font-serif text-3xl text-[#3d0a14]">DevZ-Go chats</h3>
                <p className="mt-2 max-w-sm text-sm text-stone-600">Pick a conversation to send a message, a photo, or an emoji.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ForwardSheet({ people, rooms, busy, error, onClose, onSend }: {
  people: ConnectionUserSummary[];
  rooms: ChatRoomSummary[];
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSend: (targets: { kind: "dm" | "room"; id: string }[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const needle = query.trim().toLowerCase();
  const shownRooms = rooms.filter((room) => !needle || room.title.toLowerCase().includes(needle));
  const shownPeople = people.filter((person) => {
    const name = `${person.fullName || ""} ${person.username}`.toLowerCase();
    return !needle || name.includes(needle);
  });
  function keyFor(kind: "dm" | "room", id: string) {
    return `${kind}:${id}`;
  }
  function toggle(kind: "dm" | "room", id: string) {
    const key = keyFor(kind, id);
    setPicked((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#3d0a14]/40 p-4 sm:items-center" role="dialog" aria-label="Forward message">
      <div className="flex max-h-[75vh] w-full max-w-sm flex-col rounded-3xl bg-[#fffdf8] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-serif text-2xl">Forward to</p>
          <button type="button" aria-label="Close" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people and groups"
          aria-label="Search people and groups"
          className="mb-2 w-full rounded-full border border-[#eadfce] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#fced96]"
        />
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {shownRooms.length === 0 && shownPeople.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-stone-500">Nothing matches.</p>
          ) : (
            <>
              {shownRooms.length > 0 && <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Groups</p>}
              {shownRooms.map((room) => (
                <label key={room.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 hover:bg-[#f6efe2]">
                  <input type="checkbox" checked={picked.includes(keyFor("room", room.id))} onChange={() => toggle("room", room.id)} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{room.title}</span>
                    <span className="block truncate text-[11px] text-stone-500">{room.projectId ? "Collaboration" : "Group"} · {room.memberCount}</span>
                  </span>
                </label>
              ))}
              {shownPeople.length > 0 && <p className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">People</p>}
              {shownPeople.map((person) => (
                <label key={person.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 hover:bg-[#f6efe2]">
                  <input type="checkbox" checked={picked.includes(keyFor("dm", person.id))} onChange={() => toggle("dm", person.id)} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{person.fullName || person.username}</span>
                    <span className="block truncate font-mono text-[11px] text-stone-500">@{person.username}</span>
                  </span>
                </label>
              ))}
            </>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
        <button
          type="button"
          disabled={busy || picked.length === 0}
          onClick={() => onSend(picked.map((key) => {
            const split = key.indexOf(":");
            return { kind: key.slice(0, split) as "dm" | "room", id: key.slice(split + 1) };
          }))}
          className="mt-3 rounded-full bg-[#721c2a] py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Sending…" : `Forward${picked.length ? ` · ${picked.length}` : ""}`}
        </button>
      </div>
    </div>
  );
}

function Picker({ title, people, rooms, onClose, onPick }: {
  title: string;
  people: PersonRow[];
  rooms: ChatRoomSummary[];
  onClose: () => void;
  onPick: (target: Pane) => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#3d0a14]/40 p-4 sm:items-center" role="dialog">
      <div className="max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-[#fffdf8] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-serif text-2xl">{title}</p>
          <button type="button" aria-label="Close" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        {rooms.map((room) => (
          <button key={room.id} type="button" className="block w-full rounded-xl px-2 py-2 text-left text-sm hover:bg-[#f6efe2]" onClick={() => onPick({ kind: "room", room })}>
            {room.title}
          </button>
        ))}
        {people.map((row) => (
          <button key={row.person.id} type="button" className="block w-full rounded-xl px-2 py-2 text-left text-sm hover:bg-[#f6efe2]" onClick={() => onPick({ kind: "dm", person: row.person })}>
            {row.person.fullName || row.person.username}
            <span className="ml-1 font-mono text-[11px] text-stone-500">@{row.person.username}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CameraSheet({ onClose, onShot }: { onClose: () => void; onShot: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((next) => {
      stream = next;
      if (videoRef.current) videoRef.current.srcObject = next;
    }).catch(() => setFailed(true));
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, []);

  function snap() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onShot(new File([blob], "camera.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#1a0a0e] p-4 sm:items-center" role="dialog" aria-label="Camera">
      <div className="w-full max-w-md">
        {failed ? <p className="text-center text-sm text-white">Camera permission is needed.</p> : (
          <video ref={videoRef} autoPlay playsInline muted className="max-h-[70vh] w-full rounded-3xl bg-black object-cover" />
        )}
        <div className="mt-3 flex justify-center gap-3">
          <button type="button" onClick={onClose} className="rounded-full bg-white/15 px-4 py-2 text-sm text-white">Cancel</button>
          {!failed && <button type="button" onClick={snap} className="rounded-full bg-[#fced96] px-4 py-2 text-sm font-semibold text-[#3d0a14]">Take photo</button>}
        </div>
      </div>
    </div>
  );
}
