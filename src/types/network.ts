/**
 * Type definitions for DevZ-Go Network, Messaging, Developer Collaboration,
 * Connections, and Notification modules.
 */

export interface DeveloperProfile {
  id: string;
  userId: string;
  username: string;
  email: string;
  fullName?: string | null;
  headline?: string | null;
  role?: string | null;
  company?: string | null;
  guideSeen?: boolean;
  bio?: string | null;
  timezone?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  skills?: string | null;
  location?: string | null;
  createdAt?: string;
  projectsCount: number;
  connectionsCount: number;
  collaborationsCount: number;
  connectionStatus?: "none" | "pending_sent" | "pending_received" | "connected" | null;
  restricted?: boolean;
  canMessage?: boolean;
  acceptsConnections?: boolean;
  profileVisibility?: "public" | "connections" | null;
  messagePolicy?: "anyone" | "connections" | null;
  commentPolicy?: "anyone" | "connections" | null;
  activityVisibility?: "public" | "connections" | null;
  discoverable?: boolean | null;
  allowConnectionRequests?: boolean | null;
  connectionVisibility?: "public" | "connections" | "private" | null;
  collaborationPolicy?: "anyone" | "connections" | "none" | null;
  emailVisibility?: "public" | "connections" | "private" | null;
  resumeUrl?: string | null;
  resumeVisibility?: "public" | "connections" | "private" | null;
  connectionsVisible?: boolean;
  notifyLikes?: boolean | null;
  notifyComments?: boolean | null;
  notifyShares?: boolean | null;
  notifyConnections?: boolean | null;
  notifyMessages?: boolean | null;
  notifyCollaborations?: boolean | null;
}

export interface ProjectPreview {
  id: string;
  title: string;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  techStacks: string[];
  category?: string | null;
  githubUrl?: string | null;
  complexity?: string | null;
  contributionInfo?: string | null;
  ownerUsername?: string | null;
  /** The project's own likes and comments, separate from the post's. */
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
}

export interface ActivityComment {
  id: string;
  activityId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  commentText: string;
  createdAt: string;
  canDelete?: boolean;
}

export interface FeedActivity {
  id: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  authorHeadline?: string | null;
  activityType:
    | "post"
    | "milestone"
    | "collab_call"
    | "project_update"
    | "project_added"
    | "project_analyzed"
    | "profile_updated"
    | "wrap_up_published"
    | "project_completed"
    | "collaboration";
  title?: string | null;
  content?: string | null;
  mediaUrl?: string | null;
  isDemo?: boolean;
  createdAt: string;
  project?: ProjectPreview | null;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  comments: ActivityComment[];
  canEdit?: boolean;
}

export interface ConnectionUserSummary {
  id: string;
  username: string;
  fullName?: string | null;
  headline?: string | null;
  avatarUrl?: string | null;
}

export interface Connection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "pending" | "accepted" | "declined" | "removed";
  createdAt: string;
  updatedAt?: string | null;
  acceptedAt?: string | null;
  mutualCount?: number;
  partner: ConnectionUserSummary;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  isOutgoing?: boolean;
  senderUsername?: string;
  senderName?: string;
  roomId?: string;
}

export interface Conversation {
  otherUser: ConnectionUserSummary;
  lastMessage: Message;
  unreadCount: number;
}

export interface CollaborationRequest {
  id: string;
  projectId: string;
  projectTitle: string;
  requesterId: string;
  requester: ConnectionUserSummary;
  projectOwnerId: string;
  message?: string | null;
  role: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface ProjectCollaborator {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  fullName?: string | null;
  headline?: string | null;
  avatarUrl?: string | null;
  role: string;
  createdAt: string;
  isOwner?: boolean;
  permissions?: CollabPermissions;
}

export interface CollabPermissions {
  can_edit_details: boolean;
  can_manage_files: boolean;
  can_view_secrets: boolean;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorAvatar?: string | null;
  type:
    | "connection_request"
    | "connection_accepted"
    | "new_message"
    | "collaboration_request"
    | "collaboration_accepted"
    | "comment"
    | "project_comment"
    | "like"
    | "project_like"
    | "share"
    | "project_share"
    | "achievement"
    | "collaboration_invitation"
    | "collaboration_joined"
    | "collaboration_left"
    | "collaboration_removed";
  relatedId?: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardAnalytics {
  totalPosts: number;
  likesReceived: number;
  commentsReceived: number;
  totalConnections: number;
  pendingConnections: number;
  collaborationRequestsSent: number;
  collaborationRequestsReceived: number;
  acceptedCollaborations: number;
  messagesSent: number;
  messagesReceived: number;
  projectsShared: number;
  activityTimeline: { date: string; count: number }[];
}
