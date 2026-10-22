import { api } from "./client";
import { demoFallback, USE_MOCK, assetUrlOrNull } from "./config";
import type { Conversation, Message } from "../types/network";
import { INITIAL_DEMO_MESSAGES, INITIAL_DEMO_USERS } from "../data/networkDemoData";

const STORAGE_KEY_MESSAGES = "devzgo_messages_v1";

function getLocalMessages(): Record<string, Message[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(INITIAL_DEMO_MESSAGES));
      return INITIAL_DEMO_MESSAGES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_MESSAGES;
  }
}

function saveLocalMessages(messages: Record<string, Message[]>) {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent("devzgo:messages-updated"));
  } catch {
    // Ignore
  }
}

export function mapMessage(m: Record<string, unknown>): Message {
  return {
    id: String(m.id),
    senderId: (m.sender_id || m.senderId || "") as string,
    receiverId: (m.receiver_id || m.receiverId || "") as string,
    content: (m.content || "") as string,
    read: Boolean(m.read),
    createdAt: (m.created_at || m.createdAt || new Date().toISOString()) as string,
    isOutgoing: Boolean(m.is_outgoing ?? m.isOutgoing ?? false),
    senderUsername: (m.sender_username || m.senderUsername || undefined) as string | undefined,
    senderName: (m.sender_name || m.senderName || undefined) as string | undefined,
    roomId: (m.room_id || m.roomId || undefined) as string | undefined,
  };
}

export interface ChatRoomSummary {
  id: string;
  title: string;
  avatarUrl: string | null;
  projectId: string | null;
  memberCount: number;
  unreadCount: number;
  lastMessage: string | null;
  lastAt: string | null;
}

function mapRoom(raw: Record<string, unknown>): ChatRoomSummary {
  return {
    id: String(raw.id),
    title: String(raw.title || "Group"),
    avatarUrl: assetUrlOrNull(raw.avatar_url ?? raw.avatarUrl),
    projectId: raw.project_id ? String(raw.project_id) : raw.projectId ? String(raw.projectId) : null,
    memberCount: Number(raw.member_count ?? raw.memberCount ?? 0),
    unreadCount: Number(raw.unread_count ?? raw.unreadCount ?? 0),
    lastMessage: (raw.last_message || raw.lastMessage || null) as string | null,
    lastAt: (raw.last_at || raw.lastAt || null) as string | null,
  };
}

export async function fetchGroups(): Promise<ChatRoomSummary[]> {
  const res = await api.get("/messages/groups");
  return Array.isArray(res.data) ? res.data.map(mapRoom) : [];
}

export async function createGroup(title: string, memberIds: string[]): Promise<ChatRoomSummary> {
  const res = await api.post("/messages/groups", { title, member_ids: memberIds });
  return mapRoom(res.data);
}

export interface ChatRoomMember {
  user_id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  is_admin: boolean;
  team_role?: string | null;
  joined_at?: string | null;
}

export interface ChatRoomDetails {
  id: string;
  title: string;
  avatar_url?: string | null;
  project_id?: string | null;
  project_title?: string | null;
  created_at?: string | null;
  is_admin: boolean;
  members: ChatRoomMember[];
}

const groupUrl = (roomId: string) => `/messages/groups/${roomId}`;

export const fetchGroupDetails = async (roomId: string): Promise<ChatRoomDetails> =>
  (await api.get(`${groupUrl(roomId)}/details`)).data;
export const renameGroup = async (roomId: string, title: string): Promise<ChatRoomDetails> =>
  (await api.patch(groupUrl(roomId), { title })).data;
export const addGroupMembers = async (roomId: string, memberIds: string[]): Promise<ChatRoomDetails> =>
  (await api.post(`${groupUrl(roomId)}/members`, { member_ids: memberIds })).data;
export const removeGroupMember = async (roomId: string, userId: string): Promise<ChatRoomDetails> =>
  (await api.delete(`${groupUrl(roomId)}/members/${userId}`)).data;
export const leaveGroup = (roomId: string) => api.post(`${groupUrl(roomId)}/leave`);
export async function setGroupPhoto(roomId: string, file: File): Promise<ChatRoomDetails> {
  const body = new FormData();
  body.append("file", file);
  return (await api.post(`${groupUrl(roomId)}/photo`, body)).data;
}

export async function fetchGroupThread(roomId: string): Promise<Message[]> {
  const res = await api.get(`/messages/groups/${roomId}`);
  return Array.isArray(res.data) ? res.data.map(mapMessage) : [];
}

export async function sendGroupMessage(roomId: string, content: string): Promise<Message> {
  const res = await api.post(`/messages/groups/${roomId}`, { content });
  return mapMessage(res.data);
}

function mapConversation(c: Record<string, unknown>): Conversation {
  const other = ((c.other_user || c.otherUser) as Record<string, unknown>) || {};
  const last = ((c.last_message || c.lastMessage) as Record<string, unknown>) || {};
  return {
    otherUser: {
      id: String(other.id),
      username: (other.username || "developer") as string,
      fullName: (other.full_name || other.fullName || other.username || "Developer") as string,
      headline: (other.headline || null) as string | null,
      avatarUrl: assetUrlOrNull(other.avatar_url || other.avatarUrl),
    },
    lastMessage: mapMessage(last),
    unreadCount: (c.unread_count ?? c.unreadCount ?? 0) as number,
  };
}

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const res = await api.get("/messages/conversations");
    if (Array.isArray(res.data)) {
      return res.data.map(mapConversation);
    }
  } catch (err) {
    demoFallback(err);
  }

  const allMsgs = getLocalMessages();
  const conversations: Conversation[] = [];

  for (const [userId, thread] of Object.entries(allMsgs)) {
    if (!thread || thread.length === 0) continue;
    const otherUser = INITIAL_DEMO_USERS.find(
      (u) => u.userId === userId || u.username === userId || u.id === userId
    );
    const lastMsg = thread[thread.length - 1]!;
    const unreadCount = thread.filter((m) => !m.read && !m.isOutgoing).length;

    conversations.push({
      otherUser: {
        id: otherUser ? otherUser.userId : userId,
        username: otherUser ? otherUser.username : "developer",
        fullName: otherUser ? otherUser.fullName : "Developer",
        headline: otherUser ? otherUser.headline : null,
        avatarUrl: otherUser ? otherUser.avatarUrl : null,
      },
      lastMessage: lastMsg,
      unreadCount,
    });
  }

  conversations.sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );

  return conversations;
}

export async function fetchConversationThread(otherUserId: string): Promise<Message[]> {
  try {
    const res = await api.get(`/messages/conversations/${otherUserId}`);
    if (Array.isArray(res.data)) {
      return res.data.map(mapMessage);
    }
  } catch (err) {
    demoFallback(err);
  }

  const allMsgs = getLocalMessages();
  const thread = allMsgs[otherUserId] || [];
  return thread;
}

export async function sendMessage(receiverId: string, content: string): Promise<Message> {
  try {
    const res = await api.post("/messages", {
      receiver_id: receiverId,
      content,
    });
    if (res.data) {
      return mapMessage(res.data);
    }
  } catch (err) {
    demoFallback(err);
  }

  const allMsgs = getLocalMessages();
  const thread = allMsgs[receiverId] ? [...allMsgs[receiverId]] : [];

  const newMsg: Message = {
    id: `msg-${Date.now()}`,
    senderId: "usr-janasi",
    receiverId,
    content,
    read: false,
    createdAt: new Date().toISOString(),
    isOutgoing: true,
  };

  thread.push(newMsg);
  allMsgs[receiverId] = thread;
  saveLocalMessages(allMsgs);

  return newMsg;
}

/** Tells the navbar to recount unread messages. */
export const announceUnreadChange = () => window.dispatchEvent(new CustomEvent("devzgo:unread-changed"));

export async function markGroupRead(roomId: string): Promise<void> {
  await api.put(`/messages/groups/${roomId}/read`);
  announceUnreadChange();
}

export async function markConversationRead(otherUserId: string): Promise<void> {
  try {
    await api.put(`/messages/read/${otherUserId}`);
    announceUnreadChange();
    return;
  } catch (err) {
    demoFallback(err);
  }

  const allMsgs = getLocalMessages();
  if (allMsgs[otherUserId]) {
    allMsgs[otherUserId] = allMsgs[otherUserId]!.map((m) => ({
      ...m,
      read: true,
    }));
    saveLocalMessages(allMsgs);
  }
}

export async function fetchUnreadMessagesCount(): Promise<number> {
  try {
    const res = await api.get("/messages/unread-count");
    if (typeof res.data?.unread_count === "number") {
      return res.data.unread_count;
    }
  } catch {
    if (!USE_MOCK) return 0;
  }

  const allMsgs = getLocalMessages();
  let count = 0;
  for (const thread of Object.values(allMsgs)) {
    count += thread.filter((m) => !m.read && !m.isOutgoing).length;
  }
  return count;
}
