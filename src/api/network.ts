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

export async function fetchFeed(filter: string = "all", search?: string): Promise<FeedActivity[]> {
  try {
    const params: Record<string, string> = { filter };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const res = await api.get("/network/feed", { params });
    if (Array.isArray(res.data)) {
      return res.data;
    }
    if (res.data?.activities && Array.isArray(res.data.activities)) {
      return res.data.activities;
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
    return res.data;
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
    return res.data;
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
    return res.data;
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
