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

export async function fetchUserProfile(userIdOrUsername: string): Promise<DeveloperProfile> {
  try {
    const res = await api.get(`/profiles/${userIdOrUsername}`);
    if (res.data) {
      return res.data;
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
    return res.data;
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
      return res.data;
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
