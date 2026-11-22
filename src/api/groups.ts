import { api } from "./client";
import { assetUrlOrNull } from "./config";
import type {
  NetworkGroup,
  GroupAnnouncement,
  GroupProjectShowcase,
  GroupCategory,
  ProjectKind,
  ClubMemberRole,
  ClubCustomRole,
} from "../types/groups";
import { getApiErrorMessage } from "../utils/apiError";

function mapClub(g: NetworkGroup): NetworkGroup {
  return {
    ...g,
    bannerUrl: assetUrlOrNull(g.bannerUrl) ?? g.bannerUrl ?? null,
    avatarUrl: assetUrlOrNull(g.avatarUrl) ?? g.avatarUrl ?? null,
    pendingAvatarUrl: assetUrlOrNull(g.pendingAvatarUrl) ?? g.pendingAvatarUrl ?? null,
    members: (g.members || []).map((m) => ({
      ...m,
      avatarUrl: assetUrlOrNull(m.avatarUrl) ?? m.avatarUrl ?? null,
    })),
  };
}

/** Multipart POST — browser must set Content-Type with boundary (do not force JSON/multipart). */
async function postMultipart<T>(url: string, body: FormData, params?: Record<string, string | undefined>) {
  return api.post<T>(url, body, {
    params,
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData && headers && typeof headers === "object") {
          const h = headers as { delete?: (key: string) => void } & Record<string, unknown>;
          if (typeof h.delete === "function") h.delete("Content-Type");
          else delete h["Content-Type"];
        }
        return data;
      },
    ],
  });
}

export type GroupDiscoveryFilters = {
  query?: string;
  category?: string;
  institution?: string;
  verified?: boolean;
  joined?: boolean;
  openToJoin?: boolean;
  upcomingEvents?: boolean;
  page?: number;
  limit?: number;
};

export async function fetchGroups(
  query?: string,
  category?: string,
  extra?: Omit<GroupDiscoveryFilters, "query" | "category">
): Promise<NetworkGroup[]> {
  try {
    const res = await api.get<NetworkGroup[] | { items: NetworkGroup[] }>("/groups", {
      params: {
        q: query || undefined,
        category: category && category !== "all" ? category : undefined,
        institution: extra?.institution || undefined,
        verified: extra?.verified,
        joined: extra?.joined,
        openToJoin: extra?.openToJoin,
        upcomingEvents: extra?.upcomingEvents,
        page: extra?.page,
        limit: extra?.limit,
      },
    });
    const raw = res.data;
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return list.map(mapClub);
  } catch (err) {
    console.warn("fetchGroups failed", err);
    return [];
  }
}

export async function fetchGroup(groupIdOrSlug: string, _currentUserId?: string): Promise<NetworkGroup> {
    const res = await api.get<NetworkGroup>(`/groups/${encodeURIComponent(groupIdOrSlug)}`);
  if (!res.data?.id) throw new Error("Group not found");
  return mapClub(res.data);
}

export async function joinGroup(
  groupId: string,
  _user?: { id: string; name: string; username: string; headline?: string }
): Promise<NetworkGroup> {
  try {
    const res = await api.post<NetworkGroup>(`/groups/${groupId}/join`);
    if (res.data?.id) return mapClub(res.data);
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to join club");
  }
  throw new Error("Failed to join club");
}

export async function leaveGroup(groupId: string, _userId?: string): Promise<NetworkGroup> {
  const res = await api.post<NetworkGroup>(`/groups/${groupId}/leave`);
  return mapClub(res.data);
}

export async function updateMemberRole(
  groupId: string,
  targetUserId: string,
  role: ClubMemberRole,
  customTitle?: string,
  confirmation?: string
): Promise<NetworkGroup> {
  try {
    const res = await api.put<NetworkGroup>(`/groups/${groupId}/members/${targetUserId}/role`, {
      role,
      customTitle,
      confirmation,
    });
    return mapClub(res.data);
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to update role");
  }
}

export async function transferPresidency(
  groupId: string,
  targetUserId: string,
  confirmation: string
): Promise<NetworkGroup> {
  const res = await api.post<NetworkGroup>(`/groups/${groupId}/transfer-presidency`, {
    targetUserId,
    confirmation,
  });
  return mapClub(res.data);
}

export async function fetchUserClubs(userId: string): Promise<NetworkGroup[]> {
  const res = await api.get<NetworkGroup[]>(`/groups/users/${userId}/clubs`);
  return (res.data || []).map(mapClub);
}

export async function fetchMyClubs(): Promise<NetworkGroup[]> {
  const res = await api.get<NetworkGroup[]>("/groups/mine");
  return (res.data || []).map(mapClub);
}

export async function addClubCustomRole(groupId: string, title: string): Promise<ClubCustomRole> {
  const res = await api.post<ClubCustomRole>(`/groups/${groupId}/custom-roles`, { title });
  return res.data;
}

export async function deleteClubCustomRole(groupId: string, roleId: string): Promise<void> {
  await api.delete(`/groups/${groupId}/custom-roles/${roleId}`);
}

export async function patchClub(
  groupId: string,
  data: Partial<{
    name: string;
    tagline: string;
    about: string;
    policies: string;
    tags: string[];
    category: string;
    institution: string;
    joinPolicy: string;
    purpose: string;
    contactSocials: Record<string, string>;
    fundsVisibility: "members" | "executives";
  }>
): Promise<NetworkGroup> {
  const res = await api.patch<NetworkGroup>(`/groups/${groupId}`, data);
  return mapClub(res.data);
}

export async function fetchGroupAnnouncements(groupId: string): Promise<GroupAnnouncement[]> {
  try {
    const res = await api.get<GroupAnnouncement[]>(`/groups/${groupId}/announcements`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function createGroupAnnouncement(
  groupId: string,
  payload: {
    title: string;
    content: string;
    badge: GroupAnnouncement["badge"];
    pinned?: boolean;
    status?: "draft" | "published";
    audience?: "public" | "members";
    eventId?: string | null;
    mediaUrls?: Array<string | { url: string; type?: string; source?: string }>;
    pollQuestion?: string;
    pollOptions?: string[];
    pollDurationDays?: number;
    pollClosesAt?: string;
    author?: {
      id: string;
      name: string;
      username: string;
      role: ClubMemberRole;
      customTitle?: string;
    };
  }
): Promise<GroupAnnouncement> {
  try {
    const res = await api.post<GroupAnnouncement>(`/groups/${groupId}/announcements`, {
    title: payload.title,
    content: payload.content,
      badge: payload.badge,
    pinned: Boolean(payload.pinned),
      status: payload.status || "published",
      audience: payload.audience || "members",
      eventId: payload.eventId || undefined,
      mediaUrls: payload.mediaUrls || [],
      pollQuestion: payload.pollQuestion,
      pollOptions: payload.pollOptions,
      pollDurationDays: payload.pollDurationDays,
      pollClosesAt: payload.pollClosesAt,
    });
    return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to publish announcement");
  }
}

export async function fetchGroupEvents(
  groupId: string,
  when?: "upcoming" | "past" | "all"
): Promise<
  Array<{
    id: string;
    title: string;
    description: string;
    location?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    status: string;
    academicTerm?: string | null;
    academicYear?: string | null;
  }>
> {
  const res = await api.get(`/groups/${groupId}/events`, {
    params: { when: when && when !== "all" ? when : undefined },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export type ClubEventPayload = {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  timezone?: string;
  modality?: "in_person" | "virtual" | "hybrid";
  venueName?: string;
  venueAddress?: string;
  roomNumber?: string;
  meetingUrl?: string;
  meetingPlatform?: string;
  posterUrl?: string | null;
  posterFormat?: "letter" | "tabloid" | "custom" | null;
  posterOrientation?: "portrait" | "landscape" | null;
  rsvpUrl?: string;
  attractions?: string;
  notifyEmail?: boolean;
  status?: "draft" | "published" | "cancelled";
  academicTerm?: string;
  academicYear?: string;
};

export async function createGroupEvent(groupId: string, data: ClubEventPayload) {
  const res = await api.post(`/groups/${groupId}/events`, data);
  return res.data;
}

export async function patchGroupEvent(groupId: string, eventId: string, data: ClubEventPayload) {
  const res = await api.patch(`/groups/${groupId}/events/${eventId}`, data);
  return res.data;
}

export async function deleteGroupEvent(groupId: string, eventId: string): Promise<void> {
  try {
    await api.delete(`/groups/${groupId}/events/${eventId}`);
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to delete event");
  }
}

export async function cancelGroupEvent(groupId: string, eventId: string) {
  try {
    const res = await api.post(`/groups/${groupId}/events/${eventId}/cancel`);
    return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to cancel event");
  }
}

export async function uploadEventPoster(groupId: string, eventId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  try {
    const res = await postMultipart(`/groups/${groupId}/events/${eventId}/poster`, body);
    return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to upload poster");
  }
}

export async function uploadEventMedia(
  groupId: string,
  eventId: string,
  file: File,
  opts?: { academicTerm?: string; academicYear?: string }
) {
  const body = new FormData();
  body.append("file", file);
  try {
    const res = await postMultipart(`/groups/${groupId}/events/${eventId}/media`, body, {
      academicTerm: opts?.academicTerm,
      academicYear: opts?.academicYear,
    });
    const data = res.data as {
      id: string;
      eventId: string;
      url: string;
      mediaType: string;
      academicTerm?: string;
      academicYear?: string;
    };
    return { ...data, url: assetUrlOrNull(data.url) || data.url };
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to upload gallery media");
  }
}

export async function uploadAnnouncementMedia(groupId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  try {
    const res = await postMultipart<{ url: string; type: string; source: string }>(
      `/groups/${groupId}/announcements/media`,
      body
    );
    return {
      ...res.data,
      url: assetUrlOrNull(res.data.url) || res.data.url,
    };
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to upload media");
  }
}

export async function fetchMyClubPermissions(groupId: string) {
  const res = await api.get<Record<string, boolean | string>>(`/groups/${groupId}/my-permissions`);
  return res.data;
}

export async function broadcastClubEmail(groupId: string, subject: string, body: string) {
  const res = await api.post(`/groups/${groupId}/broadcast-email`, { subject, body });
  return res.data as { queued: number };
}

export async function fetchClubEmailPreferences() {
  const res = await api.get<
    Array<{ clubId: string; clubName: string; clubSlug: string; emailBroadcastOptIn: boolean }>
  >(`/groups/me/club-email-preferences`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function patchClubEmailOptIn(groupId: string, emailBroadcastOptIn: boolean) {
  const res = await api.patch(`/groups/${groupId}/membership/email-opt-in`, { emailBroadcastOptIn });
  return res.data as { emailBroadcastOptIn: boolean };
}

export async function voteClubPoll(groupId: string, pollId: string, optionId: string) {
  const res = await api.post(`/groups/${groupId}/polls/${pollId}/vote`, { optionId });
  return res.data;
}

export async function closeClubPoll(groupId: string, pollId: string) {
  const res = await api.post(`/groups/${groupId}/polls/${pollId}/close`);
  return res.data;
}

export async function verifyClubAdmin(groupId: string) {
  const res = await api.post(`/groups/${groupId}/verify`);
  return mapClub(res.data);
}

export async function rejectClubVerification(groupId: string, note?: string) {
  const res = await api.post(`/groups/${groupId}/verify/reject`, { note });
  return mapClub(res.data);
}

export async function revokeClubVerification(groupId: string) {
  const res = await api.delete(`/groups/${groupId}/verify`);
  return mapClub(res.data);
}

export async function addClubFundEntry(
  groupId: string,
  data: {
    amount: number;
    currency?: string;
    note?: string;
    entryType: "income" | "expense";
    publicDisclosure?: boolean;
  }
) {
  const res = await api.post(`/groups/${groupId}/funds`, data);
  return res.data;
}

export async function fetchClubFunds(groupId: string) {
  const res = await api.get(`/groups/${groupId}/funds`);
  return res.data as {
    summary: { income: number; expense: number; balance: number };
    entries: Array<{
      id: string;
      amount: number;
      currency: string;
      note: string;
      entryType: string;
      createdAt?: string;
    }>;
  };
}

export async function fetchClubGallery(
  groupId: string,
  filters?: { term?: string; year?: string; eventId?: string; mediaType?: string }
) {
  const res = await api.get(`/groups/${groupId}/gallery`, {
    params: {
      term: filters?.term,
      year: filters?.year,
      eventId: filters?.eventId,
      mediaType: filters?.mediaType,
    },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchClubPermissions(groupId: string) {
  const res = await api.get<Record<string, Record<string, boolean>>>(`/groups/${groupId}/permissions`);
  return res.data;
}

export async function updateClubPermissions(
  groupId: string,
  role: string,
  permissions: Record<string, boolean>
) {
  const res = await api.put(`/groups/${groupId}/permissions`, { role, permissions });
  return res.data;
}

export async function patchMembershipPrivacy(groupId: string, hideOnProfile: boolean) {
  const res = await api.patch(`/groups/${groupId}/membership/privacy`, { hideOnProfile });
  return res.data as { hideOnProfile: boolean };
}

export async function fetchGroupProjects(
  groupId: string,
  kindFilter?: ProjectKind | "all"
): Promise<GroupProjectShowcase[]> {
  try {
    const res = await api.get<GroupProjectShowcase[]>(`/groups/${groupId}/projects`, {
      params: { kind: kindFilter && kindFilter !== "all" ? kindFilter : undefined },
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function uploadShowcaseCover(groupId: string, file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  try {
    const res = await postMultipart<{ url: string }>(`/groups/${groupId}/projects/cover`, body);
    return assetUrlOrNull(res.data.url) || res.data.url;
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to upload cover");
  }
}

export async function showcaseProjectInGroup(
  groupId: string,
  projectData: Omit<GroupProjectShowcase, "id" | "groupId" | "createdAt" | "likesCount" | "commentsCount">
): Promise<GroupProjectShowcase> {
  try {
    const res = await api.post<GroupProjectShowcase>(`/groups/${groupId}/projects`, projectData);
    return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to showcase project");
  }
}

export async function toggleLikeGroupProject(
  _groupId: string,
  _projectId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  return { isLiked: false, likesCount: 0 };
}

export async function addGroupProjectComment(
  _groupId: string,
  _projectId: string,
  _comment: { authorId: string; authorName: string; authorUsername: string; text: string }
): Promise<GroupProjectShowcase> {
  throw new Error("Project comments are not available yet");
}

export async function toggleLikeAnnouncement(
  _groupId: string,
  _announcementId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  return { isLiked: false, likesCount: 0 };
}

export async function addAnnouncementComment(
  _groupId: string,
  _announcementId: string,
  _comment: { authorId: string; authorName: string; authorUsername: string; text: string }
): Promise<GroupAnnouncement> {
  throw new Error("Announcement comments are not available yet");
}

export async function uploadClubBanner(groupId: string, file: File): Promise<NetworkGroup> {
  const body = new FormData();
  body.append("file", file);
  try {
    const res = await postMultipart<NetworkGroup>(
      `/groups/${encodeURIComponent(groupId)}/banner`,
      body
    );
    return mapClub(res.data);
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to upload banner");
  }
}

export async function approveClubAvatar(groupId: string): Promise<NetworkGroup> {
  const res = await api.post<NetworkGroup>(`/groups/${encodeURIComponent(groupId)}/avatar/approve`);
  return mapClub(res.data);
}

export async function cancelPendingClubAvatar(groupId: string): Promise<NetworkGroup> {
  const res = await api.delete<NetworkGroup>(`/groups/${encodeURIComponent(groupId)}/avatar/pending`);
  return mapClub(res.data);
}

export async function uploadClubAvatar(groupId: string, file: File): Promise<NetworkGroup> {
  const body = new FormData();
  body.append("file", file);
  try {
    const res = await postMultipart<NetworkGroup>(
      `/groups/${encodeURIComponent(groupId)}/avatar`,
      body
    );
    return mapClub(res.data);
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to upload logo");
  }
}

export async function approveClubJoinRequest(
  groupId: string,
  targetUserId: string
): Promise<NetworkGroup> {
  const res = await api.post<NetworkGroup>(
    `/groups/${encodeURIComponent(groupId)}/requests/${encodeURIComponent(targetUserId)}/approve`
  );
  return mapClub(res.data);
}

export async function declineClubJoinRequest(
  groupId: string,
  targetUserId: string
): Promise<NetworkGroup> {
  const res = await api.post<NetworkGroup>(
    `/groups/${encodeURIComponent(groupId)}/requests/${encodeURIComponent(targetUserId)}/decline`
  );
  return mapClub(res.data);
}

export async function createNetworkGroup(data: {
  name: string;
  tagline: string;
  about: string;
  category: GroupCategory;
  visibility?: "public" | "private";
  joinPolicy?: "open" | "request" | "invite";
    institution?: string;
    purpose?: string;
    fundsVisibility?: "members" | "executives";
  tags: string[];
    policies?: string;
  bannerUrl?: string;
    bannerFile?: File | null;
  avatarUrl?: string;
    avatarFile?: File | null;
  host: { id: string; name: string; username: string; headline?: string };
    hostRole?: ClubMemberRole;
  hostTitle?: string;
}): Promise<NetworkGroup> {
  try {
    const joinPolicy =
      data.joinPolicy ||
      (data.visibility === "private" ? "request" : "open");
    if (!data.avatarFile && !data.avatarUrl) {
      throw new Error("Every club needs a logo before it can be published.");
    }
    const res = await api.post<NetworkGroup>("/groups", {
    name: data.name,
    tagline: data.tagline,
    about: data.about,
    category: data.category,
    tags: data.tags,
      policies: data.policies || "",
      bannerUrl: data.bannerUrl || undefined,
      avatarUrl: data.avatarUrl || undefined,
      hostTitle: data.hostTitle || undefined,
      institution: data.institution || undefined,
      joinPolicy,
      purpose: data.purpose || undefined,
      fundsVisibility: data.fundsVisibility || "members",
    });
    if (res.data?.id) {
      let club = mapClub(res.data);
      if (data.avatarFile) {
        club = await uploadClubAvatar(res.data.id, data.avatarFile);
      }
      if (data.bannerFile) {
        try {
          club = await uploadClubBanner(res.data.id, data.bannerFile);
        } catch {
          /* banner optional */
        }
      }
      return club;
    }
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to create club");
  }
  throw new Error("Failed to create club");
}
