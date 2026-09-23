import { api } from "./client";
import type { FeedActivity, ActivityComment } from "../types/network";
import { INITIAL_DEMO_ACTIVITIES } from "../data/networkDemoData";

const STORAGE_KEY_FEED = "devzgo_network_feed_v1";

function getLocalFeed(): FeedActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEED);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FEED, JSON.stringify(INITIAL_DEMO_ACTIVITIES));
      return INITIAL_DEMO_ACTIVITIES;
    }
    return JSON.parse(raw) as FeedActivity[];
  } catch {
    return INITIAL_DEMO_ACTIVITIES;
  }
}

function saveLocalFeed(feed: FeedActivity[]) {
  try {
    localStorage.setItem(STORAGE_KEY_FEED, JSON.stringify(feed));
    window.dispatchEvent(new CustomEvent("devzgo:feed-updated"));
  } catch {
    // Ignore storage quota
  }
}

export function mapFeedActivity(a: Record<string, unknown>): FeedActivity {
  const proj = (a.project as Record<string, unknown>) || null;
  return {
    id: String(a.id),
    userId: (a.user_id || a.userId || "") as string,
    authorName: (a.author_name || a.authorName || "Developer") as string,
    authorUsername: (a.author_username || a.authorUsername || "developer") as string,
    authorAvatar: (a.author_avatar || a.authorAvatar || null) as string | null,
    authorHeadline: (a.author_headline || a.authorHeadline || null) as string | null,
    activityType: ((a.activity_type || a.activityType || "post") as FeedActivity["activityType"]),
    title: (a.title || null) as string | null,
    content: (a.content || "") as string,
    mediaUrl: (a.media_url || a.mediaUrl || null) as string | null,
    isDemo: Boolean(a.is_demo ?? a.isDemo ?? false),
    createdAt: (a.created_at || a.createdAt || new Date().toISOString()) as string,
    likesCount:
      typeof a.likes_count === "number"
        ? a.likes_count
        : typeof a.likesCount === "number"
          ? a.likesCount
          : 0,
    isLiked: Boolean(a.is_liked ?? a.isLiked ?? false),
    commentsCount:
      typeof a.comments_count === "number"
        ? a.comments_count
        : Array.isArray(a.comments)
          ? a.comments.length
          : 0,
    comments: Array.isArray(a.comments)
      ? (a.comments as Record<string, unknown>[]).map((c) => ({
          id: String(c.id),
          activityId: (c.activity_id || c.activityId || String(a.id)) as string,
          authorId: (c.author_id || c.authorId || "") as string,
          authorName: (c.author_name || c.authorName || "Developer") as string,
          authorUsername: (c.author_username || c.authorUsername || "dev") as string,
          authorAvatar: (c.author_avatar || c.authorAvatar || null) as string | null,
          commentText: (c.comment_text || c.commentText || "") as string,
          createdAt: (c.created_at || c.createdAt || new Date().toISOString()) as string,
        }))
      : [],
    project: proj
      ? {
          id: String(proj.id),
          title: (proj.title || "") as string,
          shortDescription:
            (proj.short_description || proj.shortDescription || null) as string | null,
          coverImageUrl:
            (proj.cover_image_url || proj.coverImageUrl || null) as string | null,
          techStacks: (proj.tech_stacks || proj.techStacks || []) as string[],
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

export async function fetchFeed(filter: string = "all", search?: string): Promise<FeedActivity[]> {
  try {
    const params: Record<string, string> = { filter };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const res = await api.get("/network/feed", { params });
    if (Array.isArray(res.data)) {
      return res.data.map(mapFeedActivity);
    }
    if (res.data?.activities && Array.isArray(res.data.activities)) {
      return res.data.activities.map(mapFeedActivity);
    }
  } catch (err) {
    console.warn("Backend unavailable, using local interactive store:", err);
  }

  // Fallback to local store with filter & search
  let feed = getLocalFeed();
  if (filter === "projects") {
    feed = feed.filter((a) => a.activityType === "project_added" || a.activityType === "project_analyzed" || a.activityType === "project_completed" || Boolean(a.project));
  } else if (filter === "developers") {
    feed = feed.filter((a) => a.activityType === "profile_updated" || a.activityType === "post");
  } else if (filter === "collaboration") {
    feed = feed.filter((a) => a.activityType === "collaboration" || Boolean(a.project));
  } else if (filter === "following") {
    // Show activities from Chan, Khushbu, Manasi
    feed = feed.filter((a) => a.authorUsername === "chan" || a.authorUsername === "khushbu" || a.authorUsername === "manasi");
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    feed = feed.filter((a) =>
      a.authorName.toLowerCase().includes(q) ||
      a.authorUsername.toLowerCase().includes(q) ||
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.content && a.content.toLowerCase().includes(q)) ||
      (a.project?.title && a.project.title.toLowerCase().includes(q)) ||
      (a.project?.techStacks && a.project.techStacks.some((t) => t.toLowerCase().includes(q)))
    );
  }

  return feed;
}

export async function createPost(payload: {
  title?: string;
  content: string;
  activity_type?: string;
  project_id?: string;
}): Promise<FeedActivity> {
  try {
    const res = await api.post("/network/posts", payload);
    if (res.data) {
      return mapFeedActivity(res.data);
    }
  } catch (err) {
    console.warn("Backend unavailable, creating post locally:", err);
  }

  const feed = getLocalFeed();
  const newActivity: FeedActivity = {
    id: `act-${Date.now()}`,
    userId: "usr-current",
    authorName: "Janasi Rajput",
    authorUsername: "janasi",
    authorHeadline: "Backend & Network Lead | DevZ-Go",
    authorAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
    activityType:
      (payload.activity_type as FeedActivity["activityType"]) || "post",
    title: payload.title || null,
    content: payload.content,
    mediaUrl: null,
    isDemo: false,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    isLiked: false,
    commentsCount: 0,
    comments: [],
  };

  saveLocalFeed([newActivity, ...feed]);
  return newActivity;
}

export async function toggleActivityLike(
  activityId: string
): Promise<{ likesCount: number; isLiked: boolean }> {
  try {
    const res = await api.post(`/network/activities/${activityId}/like`);
    if (res.data) {
      return {
        likesCount: res.data.likes_count ?? res.data.likesCount ?? 0,
        isLiked: Boolean(res.data.is_liked ?? res.data.isLiked),
      };
    }
  } catch (err) {
    console.warn("Backend unavailable, toggling like locally:", err);
  }

  const feed = getLocalFeed();
  let updatedLikeState = { likesCount: 0, isLiked: false };

  const updatedFeed = feed.map((act) => {
    if (act.id === activityId) {
      const willBeLiked = !act.isLiked;
      const newCount = willBeLiked ? act.likesCount + 1 : Math.max(0, act.likesCount - 1);
      updatedLikeState = { likesCount: newCount, isLiked: willBeLiked };
      return {
        ...act,
        isLiked: willBeLiked,
        likesCount: newCount,
      };
    }
    return act;
  });

  saveLocalFeed(updatedFeed);
  return updatedLikeState;
}

export async function addActivityComment(
  activityId: string,
  commentText: string
): Promise<ActivityComment> {
  try {
    const res = await api.post(`/network/activities/${activityId}/comments`, {
      comment_text: commentText,
    });
    if (res.data) {
      return {
        id: String(res.data.id),
        activityId: res.data.activity_id || res.data.activityId || activityId,
        authorId: res.data.author_id || res.data.authorId || "",
        authorName: res.data.author_name || res.data.authorName || "Janasi Rajput",
        authorUsername: res.data.author_username || res.data.authorUsername || "janasi",
        authorAvatar: res.data.author_avatar || res.data.authorAvatar || null,
        commentText: res.data.comment_text || res.data.commentText || commentText,
        createdAt: res.data.created_at || res.data.createdAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn("Backend unavailable, adding comment locally:", err);
  }

  const feed = getLocalFeed();
  const newComment: ActivityComment = {
    id: `c-${Date.now()}`,
    activityId,
    authorId: "usr-current",
    authorName: "Janasi Rajput",
    authorUsername: "janasi",
    authorAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
    commentText,
    createdAt: new Date().toISOString(),
  };

  const updatedFeed = feed.map((act) => {
    if (act.id === activityId) {
      return {
        ...act,
        commentsCount: act.commentsCount + 1,
        comments: [...act.comments, newComment],
      };
    }
    return act;
  });

  saveLocalFeed(updatedFeed);
  return newComment;
}

export async function deleteActivityComment(commentId: string): Promise<void> {
  try {
    await api.delete(`/network/comments/${commentId}`);
    return;
  } catch (err) {
    console.warn("Backend unavailable, deleting comment locally:", err);
  }

  const feed = getLocalFeed();
  const updatedFeed = feed.map((act) => {
    const filteredComments = act.comments.filter((c) => c.id !== commentId);
    if (filteredComments.length !== act.comments.length) {
      return {
        ...act,
        commentsCount: filteredComments.length,
        comments: filteredComments,
      };
    }
    return act;
  });

  saveLocalFeed(updatedFeed);
}
