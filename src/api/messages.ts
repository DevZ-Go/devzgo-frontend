import { api } from "./client";
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

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const res = await api.get("/messages/conversations");
    if (Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn("Backend unavailable, using local conversations:", err);
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
      return res.data;
    }
  } catch (err) {
    console.warn("Backend unavailable, loading local thread:", err);
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
    return res.data;
  } catch (err) {
    console.warn("Backend unavailable, sending message locally:", err);
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

export async function markConversationRead(otherUserId: string): Promise<void> {
  try {
    await api.put(`/messages/read/${otherUserId}`);
    return;
  } catch (err) {
    console.warn("Backend unavailable, marking conversation read locally:", err);
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
    // fallback
  }

  const allMsgs = getLocalMessages();
  let count = 0;
  for (const thread of Object.values(allMsgs)) {
    count += thread.filter((m) => !m.read && !m.isOutgoing).length;
  }
  return count;
}
