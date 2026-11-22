import { api } from "./client";
import { demoFallback, assetUrlOrNull } from "./config";
import type { FeedActivity, ActivityComment } from "../types/network";

export function mapFeedActivity(a: Record<string, unknown>): FeedActivity {
  const proj = (a.project as Record<string, unknown>) || null;
  return {
    id: String(a.id),
    userId: (a.user_id || a.userId || "") as string,
    authorName: (a.author_name || a.authorName || "Developer") as string,
    authorUsername: (a.author_username || a.authorUsername || "developer") as string,
    authorAvatar: assetUrlOrNull(a.author_avatar || a.authorAvatar),
    authorHeadline: (a.author_headline || a.authorHeadline || null) as string | null,
    activityType: ((a.activity_type || a.activityType || "post") as FeedActivity["activityType"]),
    title: (a.title || null) as string | null,
    content: (a.content || "") as string,
    mediaUrl: assetUrlOrNull(a.media_url || a.mediaUrl),
    isDemo: Boolean(a.is_demo ?? a.isDemo ?? false),
    createdAt: (a.created_at || a.createdAt || new Date().toISOString()) as string,
    likesCount:
      typeof a.likes_count === "number"
        ? a.likes_count
        : typeof a.likesCount === "number"
          ? a.likesCount
          : 0,
    isLiked: Boolean(a.is_liked ?? a.isLiked ?? false),
    isSaved: Boolean(a.is_saved ?? a.isSaved ?? false),
    commentsCount:
      typeof a.comments_count === "number"
        ? a.comments_count
        : Array.isArray(a.comments)
          ? a.comments.length
          : 0,
    comments: Array.isArray(a.comments)
      ? (a.comments as Record<string, unknown>[]).map((c) => mapComment(c, String(a.id)))
      : [],
    canEdit: Boolean(a.can_edit),
    project: proj
      ? {
          id: String(proj.id),
          title: (proj.title || "") as string,
          shortDescription:
            (proj.short_description || proj.shortDescription || null) as string | null,
          coverImageUrl:
            assetUrlOrNull(proj.cover_image_url || proj.coverImageUrl),
          techStacks: (proj.tech_stacks || proj.techStacks || []) as string[],
          likesCount: Number(proj.likes_count ?? 0),
          isLiked: Boolean(proj.is_liked),
          commentsCount: Number(proj.comments_count ?? 0),
          likesHidden: Boolean(proj.likes_hidden),
          category: (proj.category || null) as string | null,
          githubUrl: (proj.github_url || proj.githubUrl || null) as string | null,
          complexity: (proj.complexity || null) as string | null,
          contributionInfo:
            (proj.contribution_info || proj.contributionInfo || null) as string | null,
          ownerUsername:
            (proj.owner_username || proj.ownerUsername || null) as string | null,
        }
      : null,
  };
}

function mapComment(c: Record<string, unknown>, activityId: string): ActivityComment {
  return {
    id: String(c.id),
    activityId: (c.activity_id || c.activityId || activityId) as string,
    authorId: (c.author_id || c.authorId || "") as string,
    authorName: (c.author_name || c.authorName || "Developer") as string,
    authorUsername: (c.author_username || c.authorUsername || "dev") as string,
    authorAvatar: assetUrlOrNull(c.author_avatar || c.authorAvatar),
    commentText: (c.comment_text || c.commentText || "") as string,
    createdAt: (c.created_at || c.createdAt || new Date().toISOString()) as string,
    canDelete: Boolean(c.can_delete),
  };
}

export type Page<T> = { items: T[]; nextPage: string | null };

/** One page of the feed, newest first. */
export async function fetchFeedPage(
  filter: string,
  search: string,
  page: string | null,
  userId?: string
): Promise<Page<FeedActivity>> {
  try {
    const params = { filter, search: search.trim() || undefined, page: page ?? undefined, user_id: userId };
    const { data } = await api.get("/network/feed", { params });
    return { items: (data.items as Record<string, unknown>[]).map(mapFeedActivity), nextPage: data.next_page ?? null };
  } catch (err) {
    demoFallback(err);
    throw err;
  }
}

export const fetchActivity = async (id: string) => mapFeedActivity((await api.get(`/network/activities/${id}`)).data);
export const updatePost = (id: string, body: { title?: string | null; content?: string }) => api.patch(`/network/activities/${id}`, body);
export const deletePost = (id: string) => api.delete(`/network/activities/${id}`);
export async function fetchActivityComments(id: string, page: string | null): Promise<Page<ActivityComment>> {
  const { data } = await api.get(`/network/activities/${id}/comments`, { params: { page: page ?? undefined } });
  return { items: (data.items as Record<string, unknown>[]).map((c) => mapComment(c, id)), nextPage: data.next_page ?? null };
}

export async function fetchFeed(filter: string = "all", search?: string, userId?: string): Promise<FeedActivity[]> {
  const page = await fetchFeedPage(filter, search || "", null, userId);
  return page.items;
}

export async function createPost(payload: {
  title?: string;
  content: string;
  activity_type?: string;
  project_id?: string;
}): Promise<FeedActivity> {
  const res = await api.post("/network/posts", payload);
  return mapFeedActivity(res.data);
}

export async function shareActivity(activityId: string): Promise<void> {
  await api.post(`/network/activities/${activityId}/share`);
}

export async function toggleActivityLike(
  activityId: string
): Promise<{ likesCount: number; isLiked: boolean }> {
  const res = await api.post(`/network/activities/${activityId}/like`);
  return {
    likesCount: res.data.likes_count ?? res.data.likesCount ?? 0,
    isLiked: Boolean(res.data.is_liked ?? res.data.isLiked),
  };
}

export async function toggleActivitySave(
  activityId: string
): Promise<{ isSaved: boolean }> {
  const res = await api.post(`/network/activities/${activityId}/save`);
  return { isSaved: Boolean(res.data.is_saved ?? res.data.isSaved) };
}

export async function addActivityComment(
  activityId: string,
  commentText: string
): Promise<ActivityComment> {
  const res = await api.post(`/network/activities/${activityId}/comments`, {
    comment_text: commentText,
  });
  return mapComment(res.data, activityId);
}

export async function deleteActivityComment(commentId: string): Promise<void> {
  await api.delete(`/network/comments/${commentId}`);
}

export type MyActivityTab = "liked" | "comments" | "saved";

export type MyActivityItem = {
  kind: string;
  id: string;
  createdAt: string;
  title?: string | null;
  preview?: string | null;
  href: string;
  meta?: Record<string, unknown>;
};

export async function fetchMyActivity(tab: MyActivityTab): Promise<MyActivityItem[]> {
  const { data } = await api.get("/me/activity", { params: { tab } });
  return (data.items || []).map((row: Record<string, unknown>) => ({
    kind: String(row.kind || ""),
    id: String(row.id),
    createdAt: String(row.created_at || row.createdAt || ""),
    title: (row.title as string) || null,
    preview: (row.preview as string) || null,
    href: String(row.href || "/"),
    meta: (row.meta as Record<string, unknown>) || {},
  }));
}

export type LinkPreview = {
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  domain?: string | null;
  kind?: "external" | "project" | "internal";
  projectId?: string | null;
};

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const { data } = await api.post("/network/link-preview", { url });
  return {
    url: String(data.url || url),
    title: data.title ?? null,
    description: data.description ?? null,
    imageUrl: assetUrlOrNull(data.image_url || data.imageUrl),
    domain: data.domain ?? null,
    kind: data.kind || "external",
    projectId: data.project_id || data.projectId || null,
  };
}
