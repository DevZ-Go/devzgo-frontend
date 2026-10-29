import { api } from "./client";
import { assetUrlOrNull } from "./config";
import type { ConnectionUserSummary, SafetyRelation } from "../types/network";

export interface PersonSafety {
  relation: SafetyRelation | null;
  blockedMe: boolean;
  muted: boolean;
}

export interface SafetyPerson {
  user: ConnectionUserSummary;
  kind: SafetyRelation;
  since: string;
}

export interface MutedChat {
  user: ConnectionUserSummary | null;
  roomId: string | null;
  roomTitle: string | null;
  since: string;
}

export interface SafetyOverview {
  blocked: SafetyPerson[];
  restricted: SafetyPerson[];
  muted: MutedChat[];
}

function mapUser(raw: Record<string, unknown>): ConnectionUserSummary {
  return {
    id: String(raw.id),
    username: String(raw.username || "developer"),
    fullName: String(raw.full_name || raw.username || "Developer"),
    headline: (raw.headline || null) as string | null,
    avatarUrl: assetUrlOrNull(raw.avatar_url),
  };
}

function mapPerson(raw: Record<string, unknown>): PersonSafety {
  const rel = raw.relation;
  return {
    relation: rel === "block" || rel === "restrict" ? rel : null,
    blockedMe: Boolean(raw.blocked_me),
    muted: Boolean(raw.muted),
  };
}

function mapListed(raw: Record<string, unknown>): SafetyPerson {
  return {
    user: mapUser(raw.user as Record<string, unknown>),
    kind: raw.kind === "restrict" ? "restrict" : "block",
    since: String(raw.since),
  };
}

export async function fetchSafety(): Promise<SafetyOverview> {
  const { data } = await api.get("/safety");
  return {
    blocked: (data?.blocked ?? []).map(mapListed),
    restricted: (data?.restricted ?? []).map(mapListed),
    muted: (data?.muted ?? []).map((row: Record<string, unknown>) => ({
      user: row.user ? mapUser(row.user as Record<string, unknown>) : null,
      roomId: row.room_id ? String(row.room_id) : null,
      roomTitle: (row.room_title || null) as string | null,
      since: String(row.since),
    })),
  };
}

export const fetchPersonSafety = async (userId: string) => mapPerson((await api.get(`/safety/people/${userId}`)).data);

export const setPersonSafety = async (userId: string, kind: SafetyRelation) =>
  mapPerson((await api.put(`/safety/people/${userId}`, { kind })).data);

export const setPersonSafetyByUsername = async (username: string, kind: SafetyRelation) =>
  mapPerson((await api.post("/safety/people", { username, kind })).data);

export const clearPersonSafety = async (userId: string) => mapPerson((await api.delete(`/safety/people/${userId}`)).data);

export async function setPersonMuted(userId: string, muted: boolean): Promise<PersonSafety> {
  const url = `/safety/mutes/people/${userId}`;
  return mapPerson((muted ? await api.put(url) : await api.delete(url)).data);
}

export async function setGroupMuted(roomId: string, muted: boolean): Promise<void> {
  const url = `/safety/mutes/groups/${roomId}`;
  if (muted) await api.put(url);
  else await api.delete(url);
}
