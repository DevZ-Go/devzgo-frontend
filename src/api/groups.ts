import { api } from "./client";
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

const STORAGE_KEY_GROUPS = "devzgo_network_groups_v2";
const STORAGE_KEY_ANNOUNCEMENTS = "devzgo_group_announcements_v2";
const STORAGE_KEY_PROJECTS = "devzgo_group_showcase_projects_v2";

const INITIAL_GROUPS: NetworkGroup[] = [
  {
    id: "grp-robotics",
    slug: "robotics-club",
    name: "Robotics Club",
    tagline: "Building autonomous rovers, hexapods, drone flight controllers, and ROS 2 hardware.",
    about:
      "We are a community of student engineers, roboticists, and makers who build real hardware and software systems. From custom PCB layouts and 3D-printed chassis to ROS 2 navigation stacks and computer vision telemetry, our teams take projects from concept to physical test drives.",
    category: "robotics",
    bannerUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=300&q=80",
    hostId: "usr-janasi",
    hostName: "Janasi Rajput",
    hostUsername: "janasi",
    hostTitle: "Club President & Lead Systems Architect",
    memberCount: 38,
    projectCount: 4,
    announcementCount: 2,
    tags: ["Robotics", "ROS 2", "ESP32", "Computer Vision", "CAD / 3D Printing", "Autonomous Systems"],
    createdAt: "2026-09-15T10:00:00Z",
    members: [
      {
        userId: "usr-janasi",
        name: "Janasi Rajput",
        username: "janasi",
        avatarUrl: null,
        headline: "Robotics & Full-Stack UI Architect",
        role: "host",
        customTitle: "Club President & Lead Systems Architect",
        joinedAt: "2026-09-15T10:00:00Z",
      },
      {
        userId: "usr-chan",
        name: "Chan S.",
        username: "chan",
        avatarUrl: null,
        headline: "Hardware Power Systems & Embedded C++",
        role: "executive",
        customTitle: "VP of Hardware & Power Systems",
        joinedAt: "2026-09-16T14:20:00Z",
      },
      {
        userId: "usr-khushbu",
        name: "Khushbu Patel",
        username: "khushbu",
        avatarUrl: null,
        headline: "Firmware Engineer & Kinematics Specialist",
        role: "executive",
        customTitle: "Lead Firmware Engineer",
        joinedAt: "2026-09-18T09:15:00Z",
      },
      {
        userId: "usr-manasi",
        name: "Manasi Sharma",
        username: "manasi",
        avatarUrl: null,
        headline: "Perception & Edge Computer Vision",
        role: "member",
        customTitle: "Perception & Vision Lead",
        joinedAt: "2026-09-22T16:00:00Z",
      },
    ],
  },
  {
    id: "grp-ai-lab",
    slug: "ai-vision-guild",
    name: "AI & Machine Learning Guild",
    tagline: "Exploring autonomous agents, multimodal transformers, edge inference, and synthetic data.",
    about:
      "A collective of students and researchers experimenting with modern AI architectures. We share open models, train edge vision pipelines, and organize hack nights to integrate intelligent models into web apps and embedded devices.",
    category: "ai_ml",
    bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=300&q=80",
    hostId: "usr-manasi",
    hostName: "Manasi Sharma",
    hostUsername: "manasi",
    hostTitle: "Director of Research",
    memberCount: 54,
    projectCount: 3,
    announcementCount: 2,
    tags: ["PyTorch", "Transformers", "Edge AI", "Computer Vision", "LLMs"],
    createdAt: "2026-09-20T12:00:00Z",
    members: [
      {
        userId: "usr-manasi",
        name: "Manasi Sharma",
        username: "manasi",
        headline: "AI & Vision Researcher",
        role: "host",
        customTitle: "Director of Research",
        joinedAt: "2026-09-20T12:00:00Z",
      },
      {
        userId: "usr-chan",
        name: "Chan S.",
        username: "chan",
        headline: "Distributed Systems & Model Serving",
        role: "executive",
        customTitle: "MLOps & Infra Lead",
        joinedAt: "2026-09-22T11:00:00Z",
      },
    ],
  },
  {
    id: "grp-open-source",
    slug: "open-source-collective",
    name: "Open Source Collective",
    tagline: "Crafting community-driven developer tooling, CLI utilities, and open standards.",
    about:
      "From terminal utilities to web SDKs, we build developer tools in public. We run weekly code reviews, mentor beginners making their first pull requests, and curate collaborative project teams.",
    category: "open_source",
    bannerUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=300&q=80",
    hostId: "usr-chan",
    hostName: "Chan S.",
    hostUsername: "chan",
    hostTitle: "Maintainer-in-Chief",
    memberCount: 62,
    projectCount: 5,
    announcementCount: 1,
    tags: ["TypeScript", "Rust", "Go", "Git", "DevTools"],
    createdAt: "2026-10-01T08:00:00Z",
    members: [
      {
        userId: "usr-chan",
        name: "Chan S.",
        username: "chan",
        role: "host",
        customTitle: "Maintainer-in-Chief",
        joinedAt: "2026-10-01T08:00:00Z",
      },
      {
        userId: "usr-janasi",
        name: "Janasi Rajput",
        username: "janasi",
        role: "executive",
        customTitle: "Design Systems Steward",
        joinedAt: "2026-10-02T10:00:00Z",
      },
    ],
  },
  {
    id: "grp-game-dev",
    slug: "game-dev-guild",
    name: "Game Dev & Shaders Guild",
    tagline: "Designing retro indie mechanics, WebGL procedural graphics, and interactive audio.",
    about:
      "Dedicated to playful computing. We collaborate on game jam entries, write custom shaders in GLSL, compose chiptune audio, and build game prototypes in Godot, Unity, and custom web engines.",
    category: "game_dev",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80",
    hostId: "usr-khushbu",
    hostName: "Khushbu Patel",
    hostUsername: "khushbu",
    hostTitle: "Game Jam Lead",
    memberCount: 41,
    projectCount: 2,
    announcementCount: 1,
    tags: ["Godot", "GLSL", "C#", "Pixel Art", "Chiptune"],
    createdAt: "2026-10-10T15:00:00Z",
    members: [
      {
        userId: "usr-khushbu",
        name: "Khushbu Patel",
        username: "khushbu",
        role: "host",
        customTitle: "Game Jam Lead",
        joinedAt: "2026-10-10T15:00:00Z",
      },
    ],
  },
];

const INITIAL_ANNOUNCEMENTS: Record<string, GroupAnnouncement[]> = {
  "grp-robotics": [
    {
      id: "anc-1",
      groupId: "grp-robotics",
      authorId: "usr-janasi",
      authorName: "Janasi Rajput",
      authorUsername: "janasi",
      authorRole: "host",
      authorTitle: "Club President & Lead Systems Architect",
      badge: "Official Announcement",
      title: "Spring Autonomous Rover Challenge: Navigation Phase 1",
      content:
        "Excited to announce that hardware builds for the Hexapod v2 and 4-wheel rover platforms have passed initial bench tests! We are officially opening up project slots for perception (LiDAR slam), power telemetry, and the web-based mission control interface. Check the Showcase tab to inspect the current CAD and codebase.",
      pinned: true,
      createdAt: "2026-11-15T14:30:00Z",
      likesCount: 14,
      isLiked: false,
      commentsCount: 3,
      comments: [
        {
          id: "ac-1",
          authorId: "usr-chan",
          authorName: "Chan S.",
          authorUsername: "chan",
          text: "The new 3S LiPo power distribution boards just arrived from fabrication. Ready for soldering this Thursday!",
          createdAt: "2026-11-15T15:00:00Z",
        },
        {
          id: "ac-2",
          authorId: "usr-khushbu",
          authorName: "Khushbu Patel",
          authorUsername: "khushbu",
          text: "I've pushed the updated 18-DOF inverse kinematics library to the Hexapod repo for anyone wanting to test gait cycles.",
          createdAt: "2026-11-15T16:20:00Z",
        },
      ],
    },
    {
      id: "anc-2",
      groupId: "grp-robotics",
      authorId: "usr-khushbu",
      authorName: "Khushbu Patel",
      authorUsername: "khushbu",
      authorRole: "executive",
      authorTitle: "Lead Firmware Engineer",
      badge: "Meeting & Workshop",
      title: "Hands-on Workshop: Micro-ROS on ESP32-S3 over Wi-Fi & Serial",
      content:
        "Join us this Saturday at 2:00 PM for a live hands-on build session. We will cover publishing sensor transforms (TF2) from an ESP32 microcontroller into a desktop ROS 2 Humble node. Bring your laptop and an ESP32 board (extra boards provided for newcomers)!",
      pinned: false,
      createdAt: "2026-11-17T09:00:00Z",
      likesCount: 9,
      isLiked: false,
      commentsCount: 1,
      comments: [
        {
          id: "ac-3",
          authorId: "usr-manasi",
          authorName: "Manasi Sharma",
          authorUsername: "manasi",
          text: "Can we also test streaming OpenCV bounding boxes over micro-ROS topics during the second half?",
          createdAt: "2026-11-17T11:45:00Z",
        },
      ],
    },
  ],
  "grp-ai-lab": [
    {
      id: "anc-3",
      groupId: "grp-ai-lab",
      authorId: "usr-manasi",
      authorName: "Manasi Sharma",
      authorUsername: "manasi",
      authorRole: "host",
      authorTitle: "Director of Research",
      badge: "Official Announcement",
      title: "Edge Vision Transformer Benchmark Results Published",
      content:
        "Our quantized MobileViT model running on Raspberry Pi 5 with Coral TPU acceleration reached 48 FPS at 640x480 resolution! The full benchmark logs and ONNX export scripts have been uploaded to the group showcase.",
      pinned: true,
      createdAt: "2026-11-16T18:00:00Z",
      likesCount: 18,
      isLiked: false,
      commentsCount: 2,
    },
  ],
};

const INITIAL_PROJECTS: Record<string, GroupProjectShowcase[]> = {
  "grp-robotics": [
    {
      id: "shw-1",
      groupId: "grp-robotics",
      title: "Hexapod Autonomous All-Terrain Walker v2",
      tagline: "18-DOF hexapod robot powered by ESP32-S3 and ROS 2 with RPLIDAR slam navigation.",
      kind: "embedded_hardware",
      subCategory: "Autonomous Robotics & Kinematics",
      description:
        "The Hexapod v2 is our flagship club robot. It features 18 high-torque metal gear servos driven through a PCA9685 I2C multiplexer and coordinated by an ESP32-S3 microcontroller. The onboard compute communicates with ROS 2 over Wi-Fi micro-ROS, enabling dynamic wave, ripple, and tripod gaits across irregular terrain.",
      howWeBuiltIt:
        "Chassis: Designed in Onshape and 3D printed with PETG carbon fiber. Embedded Electronics: Custom PCB breakout for ESP32-S3, dual buck converters, and 3S 2200mAh LiPo. Software Stack: C++ micro-ROS client on FreeRTOS, Python gait engine, and Nav2 mapping on desktop.",
      challengesAccomplishments:
        "Calibrating servo neutral positions and calculating analytical inverse kinematics for uneven foot placement without tipping over.",
      coverImageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
      galleryImages: [
        "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      ],
      techStacks: ["C++", "ROS 2", "ESP32", "FreeRTOS", "Onshape CAD", "3D Printing", "Python"],
      ownerId: "usr-janasi",
      ownerName: "Janasi Rajput",
      ownerUsername: "janasi",
      teamMembers: [
        { name: "Janasi Rajput", roleInProject: "Chassis Design & ROS 2 Navigation" },
        { name: "Chan S.", roleInProject: "Power Distribution & PCB Layout" },
        { name: "Khushbu Patel", roleInProject: "18-DOF Inverse Kinematics Gait Engine" },
      ],
      githubUrl: "https://github.com/DevZ-Go/hexapod-autonomous-v2",
      liveUrl: "https://robotics.devzgo.internal/hexapod",
      hardwareCadUrl: "https://onshape.com/hexapod-v2-cad",
      embeddedSpecs: {
        microcontroller: "ESP32-S3 Dual-Core Xtensa LX7 (240 MHz)",
        sensorsActuators: ["18x MG996R Metal Servos", "RPLIDAR A1M8 360° LiDAR", "MPU-6050 6-Axis IMU"],
        powerSupply: "3S 11.1V 2200mAh 35C LiPo Battery + 5V 15A Step-Down Buck Converter",
        cadTool: "Onshape & Fusion 360 (Carbon PETG 3D Printed)",
      },
      likesCount: 34,
      isLiked: false,
      commentsCount: 6,
      createdAt: "2026-11-12T10:00:00Z",
    },
    {
      id: "shw-2",
      groupId: "grp-robotics",
      title: "ROS 2 Mission Control Telemetry Dashboard",
      tagline: "Real-time WebGL 3D robot twin, sensor streaming, and teleoperation control surface.",
      kind: "software",
      subCategory: "Web Teleoperation & Data Visualization",
      description:
        "A low-latency web cockpit built for monitoring multiple field robots. Streams live camera feeds, visualizes LiDAR point clouds via Three.js / WebGL, tracks battery voltage and temperature graphs, and provides emergency virtual gamepad control.",
      howWeBuiltIt:
        "Built with React 19, TypeScript, Tailwind CSS, Three.js, and ROSBridge WebSockets connected to our backend FastAPI relay.",
      challengesAccomplishments:
        "Maintaining 60 FPS 3D point cloud rendering while parsing 200 Hz IMU telemetry packets over erratic Wi-Fi links.",
      coverImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      galleryImages: [
        "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80",
      ],
      techStacks: ["React", "TypeScript", "Three.js", "WebSockets", "ROSBridge", "Tailwind CSS"],
      ownerId: "usr-chan",
      ownerName: "Chan S.",
      ownerUsername: "chan",
      teamMembers: [
        { name: "Chan S.", roleInProject: "Full-Stack WebSockets & React UI" },
        { name: "Manasi Sharma", roleInProject: "WebGL 3D Point Cloud Shader" },
      ],
      githubUrl: "https://github.com/DevZ-Go/ros2-telemetry-cockpit",
      liveUrl: "https://telemetry.devzgo.internal",
      likesCount: 22,
      isLiked: false,
      commentsCount: 3,
      createdAt: "2026-11-14T15:00:00Z",
    },
    {
      id: "shw-3",
      groupId: "grp-robotics",
      title: "Autonomous Agricultural Quadcopter & Soil Sensor Node",
      tagline: "Drone payload with multispectral camera and LoRa long-range telemetry for crop analysis.",
      kind: "embedded_hardware",
      subCategory: "UAV & Environmental Sensing",
      description:
        "A custom carbon fiber drone platform equipped with a Pixhawk 6C flight controller, ArduPilot firmware, and ground sensor nodes transmitting environmental data over 915MHz LoRa.",
      howWeBuiltIt:
        "Carbon fiber 450mm frame, brushless 920KV motors, Raspberry Pi 4 companion computer running OpenCV vegetation indexing algorithms.",
      coverImageUrl: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80",
      techStacks: ["ArduPilot", "Pixhawk 6C", "C++", "Python", "LoRa 915MHz", "OpenCV"],
      ownerId: "usr-khushbu",
      ownerName: "Khushbu Patel",
      ownerUsername: "khushbu",
      teamMembers: [
        { name: "Khushbu Patel", roleInProject: "Flight Controller Tuning & LoRa Network" },
        { name: "Janasi Rajput", roleInProject: "Companion Computer Payload Integration" },
      ],
      githubUrl: "https://github.com/DevZ-Go/agri-drone-payload",
      hardwareCadUrl: "https://grabcad.com/library/agri-drone-frame",
      embeddedSpecs: {
        microcontroller: "Holybro Pixhawk 6C + Raspberry Pi 4 Companion",
        sensorsActuators: ["4x 2212 920KV Brushless Motors", "NoIR Multispectral Cam", "SX1276 LoRa Transceiver"],
        powerSupply: "4S 14.8V 5200mAh LiPo",
        cadTool: "Fusion 360",
      },
      likesCount: 29,
      isLiked: false,
      commentsCount: 4,
      createdAt: "2026-11-16T12:00:00Z",
    },
  ],
  "grp-ai-lab": [
    {
      id: "shw-4",
      groupId: "grp-ai-lab",
      title: "Edge Vision Sentry: Real-Time On-Device Object Tracking",
      tagline: "YOLOv8 nano quantized to INT8 running on Raspberry Pi with Coral Edge TPU.",
      kind: "software",
      subCategory: "Edge AI & Computer Vision",
      description:
        "A zero-cloud privacy-preserving camera system that tracks moving objects, generates thermal heatmaps of foot traffic, and classifies activity in real time with sub-15ms inference latency.",
      coverImageUrl: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=800&q=80",
      techStacks: ["PyTorch", "ONNX Runtime", "Python", "FastAPI", "OpenCV"],
      ownerId: "usr-manasi",
      ownerName: "Manasi Sharma",
      ownerUsername: "manasi",
      githubUrl: "https://github.com/DevZ-Go/edge-sentry-vision",
      likesCount: 19,
      isLiked: false,
      commentsCount: 2,
      createdAt: "2026-11-15T11:00:00Z",
    },
  ],
};

function getStoredGroups(): NetworkGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(INITIAL_GROUPS));
      return INITIAL_GROUPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_GROUPS;
  } catch {
    return INITIAL_GROUPS;
  }
}

function saveStoredGroups(groups: NetworkGroup[]) {
  try {
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
  } catch {
    // quota error
  }
}

function getStoredAnnouncements(): Record<string, GroupAnnouncement[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      return INITIAL_ANNOUNCEMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ANNOUNCEMENTS;
  }
}

function saveStoredAnnouncements(map: Record<string, GroupAnnouncement[]>) {
  try {
    localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function getStoredProjects(): Record<string, GroupProjectShowcase[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROJECTS;
  }
}

function saveStoredProjects(map: Record<string, GroupProjectShowcase[]>) {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * Fetch all network groups/clubs with optional search and category filters.
 */
export async function fetchGroups(query?: string, category?: string): Promise<NetworkGroup[]> {
  try {
    const res = await api.get<NetworkGroup[]>("/groups", {
      params: { q: query || undefined, category: category || undefined },
    });
    if (Array.isArray(res.data) && res.data.length > 0) return res.data;
  } catch {
    // fallback to local data
  }

  let list = getStoredGroups();
  if (category && category !== "all") {
    list = list.filter((g) => g.category === category);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return list;
}

/**
 * Fetch a single group by its ID or slug (e.g. "robotics-club").
 */
export async function fetchGroup(groupIdOrSlug: string, currentUserId?: string): Promise<NetworkGroup> {
  try {
    const res = await api.get<NetworkGroup>(`/groups/${encodeURIComponent(groupIdOrSlug)}`);
    if (res.data?.id) return res.data;
  } catch {
    // fallback
  }

  const list = getStoredGroups();
  const group =
    list.find((g) => g.id === groupIdOrSlug || g.slug === groupIdOrSlug) ||
    list[0];

  if (!group) throw new Error("Group not found");

  // Determine membership for current user
  if (currentUserId) {
    const memberRecord = group.members.find((m) => m.userId === currentUserId);
    return {
      ...group,
      isMember: Boolean(memberRecord || group.hostId === currentUserId),
      userRole: memberRecord?.role || (group.hostId === currentUserId ? "host" : null),
      userCustomTitle: memberRecord?.customTitle || (group.hostId === currentUserId ? group.hostTitle : null),
    };
  }

  return group;
}

/**
 * Join a group as a member.
 */
export async function joinGroup(
  groupId: string,
  user: { id: string; name: string; username: string; headline?: string }
): Promise<NetworkGroup> {
  try {
    const res = await api.post<NetworkGroup>(`/groups/${groupId}/join`);
    if (res.data?.id) return res.data;
  } catch {
    // offline handling
  }

  const list = getStoredGroups();
  const group = list.find((g) => g.id === groupId || g.slug === groupId);
  if (!group) throw new Error("Group not found");

  if (!group.members.some((m) => m.userId === user.id)) {
    group.members.push({
      userId: user.id,
      name: user.name,
      username: user.username,
      headline: user.headline,
      role: "member",
      customTitle: "Member",
      joinedAt: new Date().toISOString(),
    });
    group.memberCount += 1;
    saveStoredGroups(list);
  }

  return {
    ...group,
    isMember: true,
    userRole: "member",
    userCustomTitle: "Member",
  };
}

/**
 * Leave a group.
 */
export async function leaveGroup(groupId: string, userId: string): Promise<NetworkGroup> {
  try {
    const res = await api.post<NetworkGroup>(`/groups/${groupId}/leave`);
    if (res.data?.id) return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to leave club");
  }

  const list = getStoredGroups();
  const group = list.find((g) => g.id === groupId || g.slug === groupId);
  if (!group) throw new Error("Group not found");

  group.members = group.members.filter((m) => m.userId !== userId);
  group.memberCount = Math.max(1, group.memberCount - 1);
  saveStoredGroups(list);

  return {
    ...group,
    isMember: false,
    userRole: null,
    userCustomTitle: null,
  };
}

/**
 * President can assign club positions (including transferring presidency) and custom titles.
 */
export async function updateMemberRole(
  groupId: string,
  targetUserId: string,
  role: ClubMemberRole,
  customTitle?: string
): Promise<NetworkGroup> {
  try {
    const res = await api.put<NetworkGroup>(`/groups/${groupId}/members/${targetUserId}/role`, {
      role,
      customTitle,
    });
    if (res.data?.id) return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to update role");
  }

  const list = getStoredGroups();
  const group = list.find((g) => g.id === groupId || g.slug === groupId);
  if (!group) throw new Error("Group not found");

  const member = group.members.find((m) => m.userId === targetUserId);
  if (member) {
    member.role = role === "president" ? "host" : role;
    if (customTitle !== undefined) {
      member.customTitle = customTitle.trim() || "Member";
    }
    if (role === "president" || role === "host") {
      group.hostId = member.userId;
      group.hostName = member.name;
      group.hostUsername = member.username;
      group.hostTitle = member.customTitle || "President";
      group.members = group.members.map((m) =>
        m.userId !== member.userId && (m.role === "host" || m.role === "president")
          ? { ...m, role: "executive", customTitle: m.customTitle === "President" ? "Executive" : m.customTitle }
          : m
      );
    }
    saveStoredGroups(list);
  }

  return group;
}

export async function fetchUserClubs(userId: string): Promise<NetworkGroup[]> {
  const res = await api.get<NetworkGroup[]>(`/groups/users/${encodeURIComponent(userId)}/clubs`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchMyClubs(): Promise<NetworkGroup[]> {
  const res = await api.get<NetworkGroup[]>("/groups/mine");
  return Array.isArray(res.data) ? res.data : [];
}

export async function addClubCustomRole(groupId: string, title: string): Promise<ClubCustomRole> {
  const res = await api.post<ClubCustomRole>(`/groups/${groupId}/custom-roles`, { title });
  return res.data;
}

export async function deleteClubCustomRole(groupId: string, roleId: string): Promise<void> {
  await api.delete(`/groups/${groupId}/custom-roles/${encodeURIComponent(roleId)}`);
}

export async function patchClub(
  groupId: string,
  data: Partial<{ name: string; tagline: string; about: string; policies: string; tags: string[]; category: string }>,
): Promise<NetworkGroup> {
  const res = await api.patch<NetworkGroup>(`/groups/${groupId}`, data);
  return res.data;
}

/**
 * Fetch announcements and updates for a group.
 */
export async function fetchGroupAnnouncements(groupId: string): Promise<GroupAnnouncement[]> {
  try {
    const res = await api.get<GroupAnnouncement[]>(`/groups/${groupId}/announcements`);
    if (Array.isArray(res.data)) return res.data;
  } catch {
    // offline
  }

  const map = getStoredAnnouncements();
  return map[groupId] || map["grp-robotics"] || [];
}

/**
 * Publish an announcement (Executives & Host only).
 */
export async function createGroupAnnouncement(
  groupId: string,
  payload: {
    title: string;
    content: string;
    badge: GroupAnnouncement["badge"];
    pinned?: boolean;
    author: {
      id: string;
      name: string;
      username: string;
      role: ClubMemberRole;
      customTitle?: string;
    };
  }
): Promise<GroupAnnouncement> {
  const newAnc: GroupAnnouncement = {
    id: `anc-${Date.now()}`,
    groupId,
    authorId: payload.author.id,
    authorName: payload.author.name,
    authorUsername: payload.author.username,
    authorRole: payload.author.role,
    authorTitle:
      payload.author.customTitle ||
      (payload.author.role === "host" || payload.author.role === "president" ? "President" : "Executive"),
    badge: payload.badge,
    title: payload.title,
    content: payload.content,
    pinned: Boolean(payload.pinned),
    createdAt: new Date().toISOString(),
    likesCount: 0,
    isLiked: false,
    commentsCount: 0,
    comments: [],
  };

  try {
    await api.post(`/groups/${groupId}/announcements`, newAnc);
  } catch {
    // offline
  }

  const map = getStoredAnnouncements();
  const list = map[groupId] || [];
  map[groupId] = [newAnc, ...list];
  saveStoredAnnouncements(map);

  // Update count in group
  const groups = getStoredGroups();
  const grp = groups.find((g) => g.id === groupId || g.slug === groupId);
  if (grp) {
    grp.announcementCount = (grp.announcementCount || 0) + 1;
    saveStoredGroups(groups);
  }

  return newAnc;
}

/**
 * Fetch all showcased projects for a group (embedded and software).
 */
export async function fetchGroupProjects(
  groupId: string,
  kindFilter?: ProjectKind | "all"
): Promise<GroupProjectShowcase[]> {
  try {
    const res = await api.get<GroupProjectShowcase[]>(`/groups/${groupId}/projects`, {
      params: { kind: kindFilter && kindFilter !== "all" ? kindFilter : undefined },
    });
    if (Array.isArray(res.data)) return res.data;
  } catch {
    // offline
  }

  const map = getStoredProjects();
  let list = map[groupId] || map["grp-robotics"] || [];
  if (kindFilter && kindFilter !== "all") {
    list = list.filter((p) => p.kind === kindFilter);
  }
  return list;
}

/**
 * Showcase a project in the group (either newly entered or reusing an existing project).
 */
export async function showcaseProjectInGroup(
  groupId: string,
  projectData: Omit<GroupProjectShowcase, "id" | "groupId" | "createdAt" | "likesCount" | "commentsCount">
): Promise<GroupProjectShowcase> {
  const newShowcase: GroupProjectShowcase = {
    ...projectData,
    id: `shw-${Date.now()}`,
    groupId,
    likesCount: 0,
    isLiked: false,
    commentsCount: 0,
    comments: [],
    createdAt: new Date().toISOString(),
  };

  try {
    await api.post(`/groups/${groupId}/projects`, newShowcase);
  } catch {
    // offline
  }

  const map = getStoredProjects();
  const list = map[groupId] || [];
  map[groupId] = [newShowcase, ...list];
  saveStoredProjects(map);

  // Update count in group
  const groups = getStoredGroups();
  const grp = groups.find((g) => g.id === groupId || g.slug === groupId);
  if (grp) {
    grp.projectCount = (grp.projectCount || 0) + 1;
    saveStoredGroups(groups);
  }

  return newShowcase;
}

/**
 * Like / unlike a showcased project.
 */
export async function toggleLikeGroupProject(
  groupId: string,
  projectId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  const map = getStoredProjects();
  const list = map[groupId] || [];
  const p = list.find((item) => item.id === projectId);
  if (!p) return { isLiked: false, likesCount: 0 };

  p.isLiked = !p.isLiked;
  p.likesCount = p.isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1);
  saveStoredProjects(map);
  return { isLiked: p.isLiked, likesCount: p.likesCount };
}

/**
 * Add comment to a showcased project.
 */
export async function addGroupProjectComment(
  groupId: string,
  projectId: string,
  comment: { authorId: string; authorName: string; authorUsername: string; text: string }
): Promise<GroupProjectShowcase> {
  const map = getStoredProjects();
  const list = map[groupId] || [];
  const p = list.find((item) => item.id === projectId);
  if (!p) throw new Error("Project not found");

  if (!p.comments) p.comments = [];
  p.comments.push({
    id: `c-${Date.now()}`,
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorUsername: comment.authorUsername,
    text: comment.text,
    createdAt: new Date().toISOString(),
  });
  p.commentsCount = p.comments.length;
  saveStoredProjects(map);
  return p;
}

/**
 * Like / unlike an announcement.
 */
export async function toggleLikeAnnouncement(
  groupId: string,
  announcementId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  const map = getStoredAnnouncements();
  const list = map[groupId] || [];
  const a = list.find((item) => item.id === announcementId);
  if (!a) return { isLiked: false, likesCount: 0 };

  a.isLiked = !a.isLiked;
  a.likesCount = a.isLiked ? a.likesCount + 1 : Math.max(0, a.likesCount - 1);
  saveStoredAnnouncements(map);
  return { isLiked: a.isLiked, likesCount: a.likesCount };
}

/**
 * Add comment to an announcement.
 */
export async function addAnnouncementComment(
  groupId: string,
  announcementId: string,
  comment: { authorId: string; authorName: string; authorUsername: string; text: string }
): Promise<GroupAnnouncement> {
  const map = getStoredAnnouncements();
  const list = map[groupId] || [];
  const a = list.find((item) => item.id === announcementId);
  if (!a) throw new Error("Announcement not found");

  if (!a.comments) a.comments = [];
  a.comments.push({
    id: `ac-${Date.now()}`,
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorUsername: comment.authorUsername,
    text: comment.text,
    createdAt: new Date().toISOString(),
  });
  a.commentsCount = a.comments.length;
  saveStoredAnnouncements(map);
  return a;
}

/**
 * Create a new group (current user becomes president).
 */
export async function createNetworkGroup(data: {
  name: string;
  tagline: string;
  about: string;
  category: GroupCategory;
  tags: string[];
  policies?: string;
  bannerUrl?: string;
  avatarUrl?: string;
  host: { id: string; name: string; username: string; headline?: string };
  hostTitle?: string;
}): Promise<NetworkGroup> {
  try {
    const res = await api.post<NetworkGroup>("/groups", {
      name: data.name,
      tagline: data.tagline,
      about: data.about,
      category: data.category,
      tags: data.tags,
      policies: data.policies || "",
    });
    if (res.data?.id) return res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err) || "Failed to create club");
  }

  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const newGroup: NetworkGroup = {
    id: `grp-${Date.now()}`,
    slug: slug || `group-${Date.now()}`,
    name: data.name,
    tagline: data.tagline,
    about: data.about,
    category: data.category,
    tags: data.tags,
    policies: data.policies || "",
    bannerUrl: data.bannerUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    avatarUrl: data.avatarUrl || null,
    hostId: data.host.id,
    hostName: data.host.name,
    hostUsername: data.host.username,
    hostTitle: data.hostTitle || "President",
    memberCount: 1,
    projectCount: 0,
    announcementCount: 0,
    isMember: true,
    userRole: "host",
    userCustomTitle: data.hostTitle || "President",
    createdAt: new Date().toISOString(),
    members: [
      {
        userId: data.host.id,
        name: data.host.name,
        username: data.host.username,
        headline: data.host.headline,
        role: "host",
        customTitle: data.hostTitle || "President",
        joinedAt: new Date().toISOString(),
      },
    ],
  };

  const list = getStoredGroups();
  list.unshift(newGroup);
  saveStoredGroups(list);
  return newGroup;
}
