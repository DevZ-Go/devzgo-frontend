import { api } from "./client";
import type { CollaborationRequest, ProjectCollaborator } from "../types/network";
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
    fullName: (u.full_name || u.fullName || c.fullName || u.username || "Developer") as string,
    headline: (u.headline || c.headline || null) as string | null,
    avatarUrl: (u.avatar_url || u.avatarUrl || c.avatarUrl || null) as string | null,
    role: (c.role || "Collaborator") as string,
    createdAt: (c.joined_at || c.createdAt || new Date().toISOString()) as string,
  };
}

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
      avatarUrl: (u.avatar_url || u.avatarUrl || null) as string | null,
    },
    projectOwnerId: (r.project_owner_id || r.projectOwnerId || "") as string,
    role: (r.role || "Collaborator") as string,
    message: (r.message || null) as string | null,
    status: (r.status || "pending") as CollaborationRequest["status"],
    createdAt: (r.created_at || r.createdAt || new Date().toISOString()) as string,
  };
}

export async function fetchProjectCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
  try {
    const res = await api.get(`/projects/${projectId}/collaborators`);
    if (Array.isArray(res.data)) {
      return res.data.map(mapCollaborator);
    }
  } catch (err) {
    console.warn("Backend unavailable, loading local collaborators:", err);
  }

  const all = getLocalCollaborators();
  return all[projectId] || [];
}

export async function fetchProjectCollaborationRequests(
  projectId: string
): Promise<CollaborationRequest[]> {
  try {
    const res = await api.get(`/projects/${projectId}/collaboration-requests`);
    if (Array.isArray(res.data)) {
      return res.data.map(mapCollabRequest);
    }
  } catch (err) {
    console.warn("Backend unavailable, loading local collaboration requests:", err);
  }

  const reqs = getLocalRequests();
  return reqs.filter((r) => r.projectId === projectId && r.status === "pending");
}

export async function requestCollaboration(
  projectId: string,
  payload: { role: string; message?: string }
): Promise<CollaborationRequest> {
  try {
    const res = await api.post(`/projects/${projectId}/collaboration-requests`, payload);
    if (res.data) {
      return mapCollabRequest(res.data);
    }
  } catch (err) {
    console.warn("Backend unavailable, creating collaboration request locally:", err);
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
    console.warn("Backend unavailable, accepting collaboration locally:", err);
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
    console.warn("Backend unavailable, declining collaboration locally:", err);
  }

  const reqs = getLocalRequests();
  const updated = reqs.map((r) => (r.id === requestId ? { ...r, status: "declined" as const } : r));
  saveLocalRequests(updated);
}
