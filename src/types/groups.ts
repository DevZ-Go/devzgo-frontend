/**
 * Type definitions for DevZ-Go Network Groups, Clubs, Announcements,
 * and Devpost-style Project Showcases.
 */

export type GroupCategory =
  | "robotics"
  | "ai_ml"
  | "web_cloud"
  | "game_dev"
  | "open_source"
  | "general";

export type ProjectKind = "embedded_hardware" | "software";

export interface GroupMember {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  headline?: string | null;
  role: "host" | "executive" | "member";
  customTitle?: string | null; // e.g. "Lead Hardware Architect", "VP of Software", "Team Captain"
  joinedAt: string;
}

export interface GroupComment {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  text: string;
  createdAt: string;
}

export interface GroupAnnouncement {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  authorRole: "host" | "executive";
  authorTitle?: string | null;
  badge: "Official Announcement" | "Meeting & Workshop" | "Project Call" | "General Update";
  title: string;
  content: string;
  pinned?: boolean;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments?: GroupComment[];
}

export interface EmbeddedSpecs {
  microcontroller?: string; // e.g., "ESP32-S3", "STM32F4", "Raspberry Pi 4", "Arduino Mega"
  sensorsActuators?: string[]; // e.g., ["LiDAR RPLIDAR A1", "IMU MPU6050", "MG996R Servos"]
  powerSupply?: string; // e.g., "3S 11.1V 2200mAh LiPo"
  cadTool?: string; // e.g., "Onshape", "SolidWorks", "Fusion 360"
}

export interface ProjectContributor {
  userId?: string;
  name: string;
  roleInProject: string;
}

export interface GroupProjectShowcase {
  id: string;
  groupId: string;
  projectId?: string | null; // links to existing DevZ-Go project if reused
  title: string;
  tagline: string;
  description: string;
  howWeBuiltIt?: string;
  challengesAccomplishments?: string;
  kind: ProjectKind; // "embedded_hardware" | "software"
  subCategory?: string; // e.g., "Autonomous Robotics", "IoT & Microcontrollers", "Computer Vision"
  coverImageUrl?: string | null;
  galleryImages?: string[];
  techStacks: string[];
  ownerId: string;
  ownerName: string;
  ownerUsername: string;
  ownerAvatar?: string | null;
  teamMembers?: ProjectContributor[];
  githubUrl?: string | null;
  liveUrl?: string | null;
  hardwareCadUrl?: string | null; // CAD, schematics, 3D files (Thingiverse/Onshape/GrabCAD)
  demoVideoUrl?: string | null;
  embeddedSpecs?: EmbeddedSpecs;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments?: GroupComment[];
  createdAt: string;
}

export interface NetworkGroup {
  id: string;
  slug: string; // e.g., "robotics-club"
  name: string;
  tagline: string;
  about: string;
  category: GroupCategory;
  bannerUrl?: string | null;
  avatarUrl?: string | null;
  hostId: string;
  hostName: string;
  hostUsername: string;
  hostTitle?: string;
  memberCount: number;
  projectCount: number;
  announcementCount: number;
  isMember?: boolean;
  userRole?: "host" | "executive" | "member" | null;
  userCustomTitle?: string | null;
  members: GroupMember[];
  tags: string[];
  createdAt: string;
}
