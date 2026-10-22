import { api } from "./client";
import { demoFallback, assetUrlOrNull } from "./config";
import type { CollabPermissions, CollaborationRequest, ProjectCollaborator } from "../types/network";
import { INITIAL_PROJECT_COLLABORATORS, INITIAL_DEMO_USERS } from "../data/networkDemoData";

const STORAGE_KEY_COLLABORATORS = "devzgo_collaborators_v1";
const STORAGE_KEY_COLLAB_REQUESTS = "devzgo_collab_requests_v1";

function getLocalCollaborators(): Record<string, ProjectCollaborator[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COLLABORATORS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_COLLABORATORS, JSON.stringify(INITIAL_PROJECT_COLLABORATORS));
      return INITIAL_PROJECT_COLLABORATORS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROJECT_COLLABORATORS;
  }
}

function saveLocalCollaborators(data: Record<string, ProjectCollaborator[]>) {
  try {
    localStorage.setItem(STORAGE_KEY_COLLABORATORS, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("devzgo:collaborations-updated"));
  } catch {
    // Ignore
  }
}

function getLocalRequests(): CollaborationRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COLLAB_REQUESTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalRequests(requests: CollaborationRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY_COLLAB_REQUESTS, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent("devzgo:collaborations-updated"));
  } catch {
    // Ignore
  }
}

function mapCollaborator(c: Record<string, unknown>): ProjectCollaborator {
  const u = (c.user as Record<string, unknown>) || {};
  return {
    id: String(c.id),
    projectId: (c.project_id || c.projectId || "") as string,
    userId: (c.user_id || c.userId || String(u.id || "")) as string,
    username: (u.username || c.username || "developer") as string,
    fullName: (u.full_name || u.fullName || c.full_name || c.fullName || u.username || c.username || "Developer") as string,
    headline: (u.headline || c.headline || null) as string | null,
    avatarUrl: assetUrlOrNull(u.avatar_url || u.avatarUrl || c.avatar_url || c.avatarUrl),
    role: (c.role || "Collaborator") as string,
    createdAt: (c.created_at || c.joined_at || c.createdAt || new Date().toISOString()) as string,
    isOwner: Boolean(c.is_owner),
    permissions: (c.permissions as CollabPermissions | undefined) ?? NO_PERMISSIONS,
  };
}

export const NO_PERMISSIONS: CollabPermissions = { can_edit_details: false, can_manage_files: false, can_view_secrets: false };

type RawUser = { id: string; username: string; full_name?: string | null; headline?: string | null; avatar_url?: string | null };
export type MyCollabStatus = {
  status: "owner" | "member" | "requested" | "invited" | "none";
  request_id?: string | null;
  invitation_id?: string | null;
  permissions: CollabPermissions;
};
export type Invitation = {
  id: string;
  project_id: string;
  project_title: string;
  inviter: RawUser;
  invitee: RawUser;
  role: string;
  message?: string | null;
  permissions: CollabPermissions;
  expires_at: string;
};
export type Invitee = RawUser & { status: "member" | "invited" | "requested" | "none" };

const base = (projectId: string) => `/collaborations/projects/${projectId}`;
const get = async <T,>(url: string, params?: object): Promise<T> => (await api.get(url, { params })).data;

export const fetchMyCollabStatus = (projectId: string) => get<MyCollabStatus>(`${base(projectId)}/me`);
export const fetchProjectInvitations = (projectId: string) => get<Invitation[]>(`${base(projectId)}/invitations`);
export const fetchMyInvitations = () => get<Invitation[]>("/collaborations/invitations/mine");
export const searchInvitees = (projectId: string, q: string) => get<Invitee[]>(`${base(projectId)}/invitee-search`, { q });
export const fetchUserCollaborations = (userId: string) =>
  get<{ id: string; title: string; contribution_info?: string | null; owner_username?: string | null }[]>(`/profiles/${userId}/collaborations`);

export const inviteCollaborator = (projectId: string, body: { username: string; role: string; permissions: CollabPermissions }) =>
  api.post(`${base(projectId)}/invitations`, body);
export const answerInvitation = (id: string, answer: "accept" | "decline") => api.put(`/collaborations/invitations/${id}/${answer}`);
export const revokeInvitation = (id: string) => api.delete(`/collaborations/invitations/${id}`);
export const withdrawCollabRequest = (id: string) => api.delete(`/collaborations/requests/${id}`);
export const leaveProject = (projectId: string) => api.delete(`${base(projectId)}/members/me`);
export const removeMember = (projectId: string, userId: string) => api.delete(`${base(projectId)}/members/${userId}`);
export const updateMemberPermissions = (projectId: string, userId: string, permissions: CollabPermissions) =>
  api.patch(`${base(projectId)}/members/${userId}`, permissions);

function mapCollabRequest(r: Record<string, unknown>): CollaborationRequest {
  const u = ((r.requester || r.user) as Record<string, unknown>) || {};
  return {
    id: String(r.id),
    projectId: (r.project_id || r.projectId || "") as string,
    projectTitle: (r.project_title || r.projectTitle || "Project Collaboration") as string,
    requesterId: (r.requester_id || r.requesterId || r.user_id || r.userId || String(u.id || "")) as string,
    requester: {
      id: String(u.id || r.requester_id || r.requesterId || r.user_id || r.userId || ""),
      username: (u.username || "developer") as string,
      fullName: (u.full_name || u.fullName || u.username || "Developer") as string,
      headline: (u.headline || null) as string | null,
      avatarUrl: assetUrlOrNull(u.avatar_url || u.avatarUrl),
    },
    projectOwnerId: (r.project_owner_id || r.projectOwnerId || "") as string,
    role: (r.role || "Collaborator") as string,
    message: (r.message || null) as string | null,
    status: (r.status || "pending") as CollaborationRequest["status"],
    createdAt: (r.created_at || r.createdAt || new Date().toISOString()) as string,
  };
}

export async function fetchIncomingCollabRequests(): Promise<CollaborationRequest[]> {
  return (await get<Record<string, unknown>[]>("/collaborations/requests/incoming")).map(mapCollabRequest);
}

export async function fetchMyCollabRequests(): Promise<CollaborationRequest[]> {
  return (await get<Record<string, unknown>[]>("/collaborations/requests/mine")).map(mapCollabRequest);
}

export async function fetchProjectCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
  try {
    const res = await api.get(`/collaborations/projects/${projectId}/collaborators`);
    if (Array.isArray(res.data)) {
      return res.data.map(mapCollaborator);
    }
  } catch (err) {
    demoFallback(err);
  }

  const all = getLocalCollaborators();
  return all[projectId] || [];
}

export async function fetchProjectCollaborationRequests(
  projectId: string
): Promise<CollaborationRequest[]> {
  try {
    const res = await api.get(`/collaborations/projects/${projectId}/requests`);
    if (Array.isArray(res.data)) {
      return res.data.map(mapCollabRequest);
    }
  } catch (err) {
    demoFallback(err);
  }

  const reqs = getLocalRequests();
  return reqs.filter((r) => r.projectId === projectId && r.status === "pending");
}

export async function requestCollaboration(
  projectId: string,
  payload: { role: string; message?: string }
): Promise<CollaborationRequest> {
  try {
    const res = await api.post(`/collaborations/projects/${projectId}/requests`, payload);
    if (res.data) {
      return mapCollabRequest(res.data);
    }
  } catch (err) {
    demoFallback(err);
  }

  const reqs = getLocalRequests();
  const currentUser = INITIAL_DEMO_USERS[0]!;
  const newReq: CollaborationRequest = {
    id: `creq-${Date.now()}`,
    projectId,
    projectTitle: "Project Collaboration",
    requesterId: currentUser.userId,
    requester: {
      id: currentUser.userId,
      username: currentUser.username,
      fullName: currentUser.fullName,
      headline: currentUser.headline,
      avatarUrl: currentUser.avatarUrl,
    },
    projectOwnerId: "usr-owner",
    message: payload.message || null,
    role: payload.role,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  saveLocalRequests([...reqs, newReq]);
  return newReq;
}

export async function acceptCollaborationRequest(
  requestId: string,
  projectId?: string
): Promise<void> {
  try {
    await api.put(`/collaborations/requests/${requestId}/accept`);
    return;
  } catch (err) {
    demoFallback(err);
  }

  const reqs = getLocalRequests();
  const req = reqs.find((r) => r.id === requestId);
  if (!req) return;

  req.status = "accepted";
  saveLocalRequests(reqs);

  // Add to project collaborators
  const pId = projectId || req.projectId;
  const allCollabs = getLocalCollaborators();
  const list = allCollabs[pId] ? [...allCollabs[pId]] : [];

  const newCollab: ProjectCollaborator = {
    id: `collab-${Date.now()}`,
    projectId: pId,
    userId: req.requesterId,
    username: req.requester.username,
    fullName: req.requester.fullName,
    headline: req.requester.headline,
    avatarUrl: req.requester.avatarUrl,
    role: req.role,
    createdAt: new Date().toISOString(),
  };

  list.push(newCollab);
  allCollabs[pId] = list;
  saveLocalCollaborators(allCollabs);
}

export async function declineCollaborationRequest(requestId: string): Promise<void> {
  try {
    await api.put(`/collaborations/requests/${requestId}/decline`);
    return;
  } catch (err) {
    demoFallback(err);
  }

  const reqs = getLocalRequests();
  const updated = reqs.map((r) => (r.id === requestId ? { ...r, status: "declined" as const } : r));
  saveLocalRequests(updated);
}
