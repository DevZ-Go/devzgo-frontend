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
  bio?: string | null;
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
    | "like";
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
