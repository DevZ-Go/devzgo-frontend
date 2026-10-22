import { api } from "./client";
import { demoFallback, USE_MOCK, assetUrlOrNull } from "./config";
import type { DeveloperProfile } from "../types/network";
import type { ApiProject } from "../types/project";
import type { TeamMember } from "./collaborations";
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
    role: (p.role || null) as string | null,
    company: (p.company || null) as string | null,
    guideSeen: p.guide_seen === true || p.guideSeen === true,
    timezone: (p.timezone || null) as string | null,
    bio: (p.bio || null) as string | null,
    avatarUrl: assetUrlOrNull(p.avatar_url || p.avatarUrl),
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
    restricted: Boolean(p.restricted),
    canMessage: p.can_message !== false && p.canMessage !== false,
    acceptsConnections: p.accepts_connections !== false && p.acceptsConnections !== false,
    profileVisibility: (p.profile_visibility || p.profileVisibility || null) as DeveloperProfile["profileVisibility"],
    messagePolicy: (p.message_policy || p.messagePolicy || null) as DeveloperProfile["messagePolicy"],
    commentPolicy: (p.comment_policy || p.commentPolicy || null) as DeveloperProfile["commentPolicy"],
    activityVisibility: (p.activity_visibility || p.activityVisibility || null) as DeveloperProfile["activityVisibility"],
    discoverable: p.discoverable === false ? false : p.discoverable === true ? true : null,
    allowConnectionRequests: p.allow_connection_requests === false || p.allowConnectionRequests === false ? false : true,
    connectionVisibility: (p.connection_visibility || p.connectionVisibility || null) as DeveloperProfile["connectionVisibility"],
    collaborationPolicy: (p.collaboration_policy || p.collaborationPolicy || null) as DeveloperProfile["collaborationPolicy"],
    emailVisibility: (p.email_visibility || p.emailVisibility || null) as DeveloperProfile["emailVisibility"],
    resumeUrl: assetUrlOrNull(p.resume_url || p.resumeUrl),
    resumeVisibility: (p.resume_visibility || p.resumeVisibility || null) as DeveloperProfile["resumeVisibility"],
    connectionsVisible: p.connections_visible !== false && p.connectionsVisible !== false,
    notifyLikes: p.notify_likes !== false && p.notifyLikes !== false,
    notifyComments: p.notify_comments !== false && p.notifyComments !== false,
    notifyShares: p.notify_shares !== false && p.notifyShares !== false,
    notifyConnections: p.notify_connections !== false && p.notifyConnections !== false,
    notifyMessages: p.notify_messages !== false && p.notifyMessages !== false,
    notifyCollaborations: p.notify_collaborations !== false && p.notifyCollaborations !== false,
    accountType: p.account_type === "recruiter" ? "recruiter" : "developer",
    tourVersion: typeof p.tour_version === "number" ? p.tour_version : null,
    tourState: (p.tour_state || null) as string | null,
    openToWork: p.open_to_work === true || p.openToWork === true,
    workTypes: (Array.isArray(p.work_types) ? p.work_types : p.workTypes ?? []) as string[],
    workArrangements: (Array.isArray(p.work_arrangements) ? p.work_arrangements : p.workArrangements ?? []) as string[],
    availabilityNote: (p.availability_note || p.availabilityNote || null) as string | null,
  };
}

export { mapProfile };

export async function fetchUserProfile(userIdOrUsername: string): Promise<DeveloperProfile> {
  try {
    const res = await api.get(`/profiles/${userIdOrUsername}`);
    if (res.data) {
      return mapProfile(res.data);
    }
  } catch (err) {
    demoFallback(err);
  }

  const list = getLocalProfiles();
  const match = list.find(
    (u) =>
      u.userId === userIdOrUsername ||
      u.id === userIdOrUsername ||
      u.username.toLowerCase() === userIdOrUsername.toLowerCase()
  );

  if (!match) throw new Error("Profile not found");
  return match;
}

export async function fetchMyProfile(): Promise<DeveloperProfile> {
  if (USE_MOCK) return fetchUserProfile("janasi");
  return mapProfile((await api.get("/profiles/me")).data);
}

export async function updateMyProfile(
  payload: Partial<DeveloperProfile>
): Promise<DeveloperProfile> {
  try {
    const res = await api.put("/profiles/me", {
      full_name: payload.fullName,
      headline: payload.headline,
      role: payload.role,
      company: payload.company,
      timezone: payload.timezone,
      bio: payload.bio,
      avatar_url: payload.avatarUrl,
      github_url: payload.githubUrl,
      linkedin_url: payload.linkedinUrl,
      website_url: payload.websiteUrl,
      skills: payload.skills,
      location: payload.location,
      profile_visibility: payload.profileVisibility,
      message_policy: payload.messagePolicy,
      comment_policy: payload.commentPolicy,
      activity_visibility: payload.activityVisibility,
      discoverable: payload.discoverable,
      allow_connection_requests: payload.allowConnectionRequests,
      connection_visibility: payload.connectionVisibility,
      collaboration_policy: payload.collaborationPolicy,
      email_visibility: payload.emailVisibility,
      resume_visibility: payload.resumeVisibility,
      notify_likes: payload.notifyLikes,
      notify_comments: payload.notifyComments,
      notify_shares: payload.notifyShares,
      notify_connections: payload.notifyConnections,
      notify_messages: payload.notifyMessages,
      notify_collaborations: payload.notifyCollaborations,
      open_to_work: payload.openToWork,
      work_types: payload.workTypes,
      work_arrangements: payload.workArrangements,
      availability_note: payload.availabilityNote,
    });
    if (res.data) {
      return mapProfile(res.data);
    }
  } catch (err) {
    demoFallback(err);
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

export async function uploadAvatar(file: File): Promise<DeveloperProfile> {
  const body = new FormData();
  body.append("file", file);
  const res = await api.post("/profiles/me/avatar", body);
  return mapProfile(res.data);
}

export async function uploadResume(file: File): Promise<DeveloperProfile> {
  const body = new FormData();
  body.append("file", file);
  const res = await api.post("/profiles/me/resume", body);
  return mapProfile(res.data);
}

export const PROFILE_ROLES = ["Developer", "Designer", "Tester", "Student", "Researcher", "Data", "Security", "Product", "Recruiter"] as const;
export const MEMBER_ROLES = PROFILE_ROLES.filter((role) => role !== "Recruiter");

export type CollabGroup = {
  project_id: string;
  title: string;
  visibility: string;
  role: string;
  members: TeamMember[];
};

export type Standing = {
  projects: number;
  commits: number;
  pushes: number;
  connections: number | null;
  activity: number | null;
  last_push: string | null;
  languages: { name: string; percentage: number }[];
  tech: { name: string; count: number }[];
  contributions: { project_id: string; title: string; owned: boolean; commits: number; pushes: number; share: number }[];
  weekly: [number, number][];
  top: Partial<Record<"projects" | "commits" | "pushes" | "connections" | "activity", number>>;
};

export type TalentCard = {
  id: string;
  username: string;
  full_name: string | null;
  headline: string | null;
  role: string | null;
  company: string | null;
  avatar_url: string | null;
  location: string | null;
  skills: string | null;
  projects: number;
  relevant_projects: number;
  source_projects: number;
  commits: number;
  pushes: number;
  github_history: boolean;
  connections: number | null;
  activity: number | null;
  last_push: string | null;
  tech: string[];
  open_to_work: boolean;
  work_types: string[];
  work_arrangements: string[];
  restricted: boolean;
  match: string[];
};

/** Each sort is one visible measure; there is no combined score. */
export const TALENT_SORTS = [
  ["relevance", "Best evidence for the tech", "Project use of the tech you picked counts more than a listed skill, then source code and GitHub history."],
  ["recent", "Most recent GitHub push", "People without imported GitHub history come after, without counting as inactive."],
  ["projects", "Most projects", "Public projects you are allowed to see."],
  ["commits", "Most commits", "Commits credited from imported GitHub repositories."],
  ["pushes", "Most pushes", "Pushes recorded from imported GitHub repositories."],
  ["connections", "Most connections", "Hidden connection counts are left out."],
  ["activity", "Most active", "Hidden activity is left out."],
] as const;

export type TalentFilters = {
  q?: string;
  tech?: string[];
  sort?: string;
  evidence?: "any" | "projects";
  minProjects?: number;
  github?: boolean;
  source?: boolean;
  openToWork?: boolean;
  workType?: string;
  arrangement?: string;
};

export async function fetchProfileProjects(userId: string): Promise<ApiProject[]> {
  const { data } = await api.get<ApiProject[]>(`/profiles/${userId}/projects`);
  return data;
}

export async function fetchProfileGroups(userId: string): Promise<CollabGroup[]> {
  const { data } = await api.get<CollabGroup[]>(`/profiles/${userId}/groups`);
  return data;
}

export async function fetchStanding(userId: string): Promise<Standing> {
  const { data } = await api.get<Standing>(`/profiles/${userId}/snapshot`);
  return data;
}

export async function fetchTalent(params: TalentFilters): Promise<TalentCard[]> {
  const { data } = await api.get<TalentCard[]>("/profiles/talent", {
    params: {
      q: params.q || undefined,
      tech: params.tech?.join(",") || undefined,
      sort: params.sort || "relevance",
      evidence: params.evidence === "projects" ? "projects" : undefined,
      min_projects: params.minProjects || undefined,
      github: params.github || undefined,
      source: params.source || undefined,
      open_to_work: params.openToWork || undefined,
      work_type: params.workType || undefined,
      arrangement: params.arrangement || undefined,
    },
  });
  return data.map((card) => ({ ...card, avatar_url: assetUrlOrNull(card.avatar_url) }));
}

export async function saveTourState(version: number, state: "completed" | "skipped"): Promise<void> {
  await api.put("/profiles/me/tour", { version, state });
}

export async function searchDevelopers(query: string): Promise<DeveloperProfile[]> {
  try {
    const res = await api.get("/profiles/search", { params: { query } });
    if (Array.isArray(res.data)) {
      return res.data.map(mapProfile);
    }
  } catch (err) {
    demoFallback(err);
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
