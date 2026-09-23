import { api } from "./client";
import type { Connection, ConnectionUserSummary } from "../types/network";
import { INITIAL_DEMO_CONNECTIONS, INITIAL_DEMO_USERS } from "../data/networkDemoData";

const STORAGE_KEY_CONNECTIONS = "devzgo_connections_v1";

function getLocalConnections(): Connection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONNECTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(INITIAL_DEMO_CONNECTIONS));
      return INITIAL_DEMO_CONNECTIONS;
    }
    return JSON.parse(raw) as Connection[];
  } catch {
    return INITIAL_DEMO_CONNECTIONS;
  }
}

function saveLocalConnections(connections: Connection[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(connections));
    window.dispatchEvent(new CustomEvent("devzgo:connections-updated"));
  } catch {
    // Ignore
  }
}

export async function fetchConnections(): Promise<{
  accepted: Connection[];
  pendingIncoming: Connection[];
  pendingOutgoing: Connection[];
}> {
  try {
    const res = await api.get("/connections");
    if (res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn("Backend unavailable, using local connections:", err);
  }

  const list = getLocalConnections();
  const accepted = list.filter((c) => c.status === "accepted");
  const pendingIncoming = list.filter(
    (c) => c.status === "pending" && c.receiverId === "usr-janasi"
  );
  const pendingOutgoing = list.filter(
    (c) => c.status === "pending" && c.requesterId === "usr-janasi"
  );

  return { accepted, pendingIncoming, pendingOutgoing };
}

export async function sendConnectionRequest(targetUserId: string): Promise<Connection> {
  try {
    const res = await api.post("/connections/request", { target_user_id: targetUserId });
    return res.data;
  } catch (err) {
    console.warn("Backend unavailable, sending connection request locally:", err);
  }

  const list = getLocalConnections();
  const targetUser = INITIAL_DEMO_USERS.find(
    (u) => u.userId === targetUserId || u.id === targetUserId || u.username === targetUserId
  );

  const newConn: Connection = {
    id: `conn-${Date.now()}`,
    requesterId: "usr-janasi",
    receiverId: targetUserId,
    status: "pending",
    createdAt: new Date().toISOString(),
    partner: {
      id: targetUser ? targetUser.userId : targetUserId,
      username: targetUser ? targetUser.username : "developer",
      fullName: targetUser ? targetUser.fullName : "Developer",
      headline: targetUser ? targetUser.headline : null,
      avatarUrl: targetUser ? targetUser.avatarUrl : null,
    },
  };

  saveLocalConnections([...list, newConn]);
  return newConn;
}

export async function acceptConnection(connectionId: string): Promise<Connection> {
  try {
    const res = await api.put(`/connections/${connectionId}/accept`);
    return res.data;
  } catch (err) {
    console.warn("Backend unavailable, accepting connection locally:", err);
  }

  const list = getLocalConnections();
  let updatedConn: Connection | null = null;
  const updatedList = list.map((c) => {
    if (c.id === connectionId) {
      updatedConn = { ...c, status: "accepted" as const, updatedAt: new Date().toISOString() };
      return updatedConn;
    }
    return c;
  });

  saveLocalConnections(updatedList);
  return updatedConn || list[0]!;
}

export async function declineConnection(connectionId: string): Promise<void> {
  try {
    await api.put(`/connections/${connectionId}/decline`);
    return;
  } catch (err) {
    console.warn("Backend unavailable, declining connection locally:", err);
  }

  const list = getLocalConnections();
  const updatedList = list.filter((c) => c.id !== connectionId);
  saveLocalConnections(updatedList);
}

export async function removeConnection(connectionId: string): Promise<void> {
  try {
    await api.delete(`/connections/${connectionId}`);
    return;
  } catch (err) {
    console.warn("Backend unavailable, removing connection locally:", err);
  }

  const list = getLocalConnections();
  const updatedList = list.filter((c) => c.id !== connectionId);
  saveLocalConnections(updatedList);
}

export async function fetchConnectionStatus(targetUserId: string): Promise<{
  status: "none" | "pending_sent" | "pending_received" | "connected";
  connectionId?: string;
}> {
  try {
    const res = await api.get(`/connections/status/${targetUserId}`);
    return res.data;
  } catch (err) {
    console.warn("Backend unavailable, checking status locally:", err);
  }

  const list = getLocalConnections();
  const match = list.find(
    (c) =>
      (c.requesterId === "usr-janasi" && c.receiverId === targetUserId) ||
      (c.receiverId === "usr-janasi" && c.requesterId === targetUserId) ||
      c.partner.id === targetUserId ||
      c.partner.username === targetUserId
  );

  if (!match) return { status: "none" };
  if (match.status === "accepted") return { status: "connected", connectionId: match.id };
  if (match.requesterId === "usr-janasi") return { status: "pending_sent", connectionId: match.id };
  return { status: "pending_received", connectionId: match.id };
}

export async function fetchSuggestedDevelopers(): Promise<ConnectionUserSummary[]> {
  try {
    const res = await api.get("/connections/suggested");
    if (Array.isArray(res.data)) return res.data;
  } catch (err) {
    console.warn("Backend unavailable, returning suggested peers locally:", err);
  }

  return INITIAL_DEMO_USERS.filter((u) => u.username !== "janasi").map((u) => ({
    id: u.userId,
    username: u.username,
    fullName: u.fullName,
    headline: u.headline,
    avatarUrl: u.avatarUrl,
  }));
}
