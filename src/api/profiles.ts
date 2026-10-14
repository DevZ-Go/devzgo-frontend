import { api } from "./client";
import type { DeveloperProfile } from "../types/network";
import { INITIAL_DEMO_USERS } from "../data/networkDemoData";

const STORAGE_KEY_PROFILES = "devzgo_profiles_v1";

function getLocalProfiles(): DeveloperProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(INITIAL_DEMO_USERS));
      return INITIAL_DEMO_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_USERS;
  }
}

function saveLocalProfiles(profiles: DeveloperProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    window.dispatchEvent(new CustomEvent("devzgo:profiles-updated"));
  } catch {
    // Ignore
  }
}

function mapProfile(p: Record<string, unknown>): DeveloperProfile {
  return {
    id: String(p.id),
    userId: String(p.user_id || p.userId || p.id),
    username: (p.username || "") as string,
    email: (p.email || "") as string,
    fullName: (p.full_name || p.fullName || p.username || "") as string,
    headline: (p.headline || null) as string | null,
    bio: (p.bio || null) as string | null,
    avatarUrl: (p.avatar_url || p.avatarUrl || null) as string | null,
    githubUrl: (p.github_url || p.githubUrl || null) as string | null,
    linkedinUrl: (p.linkedin_url || p.linkedinUrl || null) as string | null,
    websiteUrl: (p.website_url || p.websiteUrl || null) as string | null,
    skills: (p.skills || null) as string | null,
    location: (p.location || null) as string | null,
    createdAt: (p.created_at || p.createdAt) as string | undefined,
    projectsCount: (p.projects_count ?? p.projectsCount ?? 0) as number,
    connectionsCount: (p.connections_count ?? p.connectionsCount ?? 0) as number,
    collaborationsCount: (p.collaborations_count ?? p.collaborationsCount ?? 0) as number,
    connectionStatus: (p.connection_status ?? p.connectionStatus ?? null) as DeveloperProfile["connectionStatus"],
  };
}

export async function fetchUserProfile(userIdOrUsername: string): Promise<DeveloperProfile> {
  try {
    const res = await api.get(`/profiles/${userIdOrUsername}`);
    if (res.data) {
      return mapProfile(res.data);
    }
  } catch (err) {
    console.warn("Backend unavailable, loading local profile:", err);
  }

  const list = getLocalProfiles();
  const match = list.find(
    (u) =>
      u.userId === userIdOrUsername ||
      u.id === userIdOrUsername ||
      u.username.toLowerCase() === userIdOrUsername.toLowerCase()
  );

  if (match) return match;

  // Fallback profile if not found
  return {
    id: userIdOrUsername,
    userId: userIdOrUsername,
    username: userIdOrUsername,
    email: `${userIdOrUsername}@devzgo.com`,
    fullName: userIdOrUsername.charAt(0).toUpperCase() + userIdOrUsername.slice(1),
    headline: "DevZ-Go Developer",
    bio: "Passionate developer showcasing work on DevZ-Go.",
    projectsCount: 1,
    connectionsCount: 5,
    collaborationsCount: 1,
    connectionStatus: "none",
  };
}

export async function updateMyProfile(
  payload: Partial<DeveloperProfile>
): Promise<DeveloperProfile> {
  try {
    const res = await api.put("/profiles/me", payload);
    if (res.data) {
      return mapProfile(res.data);
    }
  } catch (err) {
    console.warn("Backend unavailable, updating profile locally:", err);
  }

  const list = getLocalProfiles();
  const currentUserIndex = list.findIndex(
    (u) => u.username === "janasi" || u.userId === "usr-janasi"
  );
  if (currentUserIndex >= 0) {
    const updated = { ...list[currentUserIndex]!, ...payload };
    list[currentUserIndex] = updated;
    saveLocalProfiles(list);
    return updated;
  }

  return list[0]!;
}

export async function searchDevelopers(query: string): Promise<DeveloperProfile[]> {
  try {
    const res = await api.get("/profiles/search", { params: { q: query } });
    if (Array.isArray(res.data)) {
      return res.data.map(mapProfile);
    }
  } catch (err) {
    console.warn("Backend unavailable, searching developers locally:", err);
  }

  const list = getLocalProfiles();
  const q = query.toLowerCase().trim();
  if (!q) return list;

  return list.filter(
    (u) =>
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      u.username.toLowerCase().includes(q) ||
      (u.headline && u.headline.toLowerCase().includes(q)) ||
      (u.skills && u.skills.toLowerCase().includes(q))
  );
}
