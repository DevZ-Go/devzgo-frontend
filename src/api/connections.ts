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

function mapConnection(raw: Record<string, unknown>): Connection {
  const partner = (raw.partner as Record<string, unknown>) || null;
  return {
    id: String(raw.id),
    requesterId: (raw.requester_id || raw.requesterId || "") as string,
    receiverId: (raw.receiver_id || raw.receiverId || "") as string,
    status: (raw.status || "pending") as Connection["status"],
    createdAt: (raw.created_at || raw.createdAt || new Date().toISOString()) as string,
    updatedAt: (raw.updated_at || raw.updatedAt || null) as string | null,
    partner: partner
      ? {
          id: String(partner.id),
          username: (partner.username || "developer") as string,
          fullName: (partner.full_name || partner.fullName || partner.username || "Developer") as string,
          headline: (partner.headline || null) as string | null,
          avatarUrl: (partner.avatar_url || partner.avatarUrl || null) as string | null,
        }
      : {
          id: String(raw.id),
          username: "developer",
          fullName: "Developer",
          headline: null,
          avatarUrl: null,
        },
  };
}

export async function fetchConnections(): Promise<{
  accepted: Connection[];
  pendingIncoming: Connection[];
  pendingOutgoing: Connection[];
}> {
  try {
    const res = await api.get("/connections?status_filter=");
    if (res.data) {
      if (Array.isArray(res.data)) {
        const accepted: Connection[] = [];
        const pendingIncoming: Connection[] = [];
        const pendingOutgoing: Connection[] = [];

        for (const item of res.data) {
          const conn = mapConnection(item);
          if (conn.status === "accepted") {
            accepted.push(conn);
          } else if (conn.status === "pending") {
            if (item.receiver_id && item.partner && item.receiver_id === item.partner.id) {
              pendingOutgoing.push(conn);
            } else {
              pendingIncoming.push(conn);
            }
          }
        }
        return { accepted, pendingIncoming, pendingOutgoing };
      } else if (typeof res.data === "object") {
        return {
          accepted: Array.isArray(res.data.accepted) ? res.data.accepted.map(mapConnection) : [],
          pendingIncoming: Array.isArray(res.data.pendingIncoming)
            ? res.data.pendingIncoming.map(mapConnection)
            : [],
          pendingOutgoing: Array.isArray(res.data.pendingOutgoing)
            ? res.data.pendingOutgoing.map(mapConnection)
            : [],
        };
      }
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
    if (Array.isArray(res.data)) {
      return (res.data as Record<string, unknown>[]).map((u) => ({
        id: String(u.id),
        username: (u.username || "") as string,
        fullName: (u.full_name || u.fullName || u.username || "Developer") as string,
        headline: (u.headline || null) as string | null,
        avatarUrl: (u.avatar_url || u.avatarUrl || null) as string | null,
      }));
    }
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
