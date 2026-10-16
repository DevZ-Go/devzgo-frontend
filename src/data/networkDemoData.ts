import type {
  DeveloperProfile,
  FeedActivity,
  Connection,
  Message,
  ProjectCollaborator,
  NotificationItem,
} from "../types/network";

export const INITIAL_DEMO_USERS: DeveloperProfile[] = [
  {
    id: "usr-janasi",
    userId: "usr-janasi",
    username: "janasi",
    email: "janasi@devzgo.com",
    fullName: "Janasi Rajput",
    headline: "Backend & Network Lead | Distributed Systems",
    bio: "Building real-time developer networking, peer messaging, and collaboration infrastructure for DevZ-Go. Passionate about distributed systems, resilient APIs, and developer productivity tooling.",
    skills: "Python, FastAPI, PostgreSQL, Redis, WebSockets, Docker, Microservices, TypeScript",
    githubUrl: "https://github.com/janasirajput",
    linkedinUrl: "https://linkedin.com/in/janasirajput",
    websiteUrl: "https://janasi.dev",
    location: "New York, USA",
    projectsCount: 3,
    connectionsCount: 28,
    collaborationsCount: 4,
    connectionStatus: "none",
  },
  {
    id: "usr-chan",
    userId: "usr-chan",
    username: "chan",
    email: "chan@devzgo.com",
    fullName: "Chan S.",
    headline: "Authentication & Project Architect",
    bio: "Leading authentication security, secure token vaults, and static code intelligence detection algorithms. Architecting multi-tenant workspace isolation.",
    skills: "React, FastAPI, Docker, OAuth2, AST Analysis, TypeScript, TailwindCSS",
    githubUrl: "https://github.com/chan-dev",
    linkedinUrl: "https://linkedin.com/in/chan-dev",
    location: "San Francisco, USA",
    projectsCount: 4,
    connectionsCount: 35,
    collaborationsCount: 5,
    connectionStatus: "connected",
  },
  {
    id: "usr-khushbu",
    userId: "usr-khushbu",
    username: "khushbu",
    email: "khushbu@devzgo.com",
    fullName: "Khushbu Patel",
    headline: "Recruiter & Talent Discovery Specialist",
    bio: "Connecting world-class engineering talent with modern tech teams through open proof of work. Designing talent evaluation heuristics.",
    skills: "React, TypeScript, Talent Tech, GraphQL, UI/UX Design, Algolia, TailwindCSS",
    githubUrl: "https://github.com/khushbu-dev",
    linkedinUrl: "https://linkedin.com/in/khushbu-patel",
    location: "Toronto, Canada",
    projectsCount: 2,
    connectionsCount: 42,
    collaborationsCount: 3,
    connectionStatus: "connected",
  },
  {
    id: "usr-manasi",
    userId: "usr-manasi",
    username: "manasi",
    email: "manasi@devzgo.com",
    fullName: "Manasi Sharma",
    headline: "Analytics & Dashboard Engineer",
    bio: "Crafting developer metrics, monthly wrap-ups, and productivity insights from raw git signals and peer collaboration flows.",
    skills: "Python, Data Visualization, Next.js, Pandas, Chart.js, TailwindCSS, SQL",
    githubUrl: "https://github.com/manasi-eng",
    linkedinUrl: "https://linkedin.com/in/manasi-sharma",
    location: "London, UK",
    projectsCount: 3,
    connectionsCount: 31,
    collaborationsCount: 4,
    connectionStatus: "pending_received",
  },
];

export const INITIAL_DEMO_ACTIVITIES: FeedActivity[] = [
  {
    id: "act-1",
    userId: "usr-janasi",
    authorName: "Janasi Rajput",
    authorUsername: "janasi",
    authorHeadline: "Backend & Network Lead | Distributed Systems",
    authorAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
    activityType: "project_added",
    title: "Realtime WebSocket Hub for Developer Collaboration",
    content:
      "Just deployed our new high-throughput event hub for DevZ-Go! Handles message dispatching, peer presence heartbeats, and room-based collaboration channels with sub-10ms delivery.",
    mediaUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop",
    isDemo: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    project: {
      id: "demo-proj-1",
      title: "Realtime Peer Collaboration Mesh",
      shortDescription:
        "High-performance distributed event broker for developer teams with room isolation and live status broadcasting.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop",
      techStacks: ["Python", "FastAPI", "Redis", "Docker"],
      category: "Backend",
      githubUrl: "https://github.com/DevZ-Go/collab-mesh",
      complexity: "Advanced",
      contributionInfo: "Core distributed broker and state synchronization",
      ownerUsername: "janasi",
    },
    likesCount: 14,
    isLiked: false,
    commentsCount: 2,
    comments: [
      {
        id: "c-1",
        activityId: "act-1",
        authorId: "usr-chan",
        authorName: "Chan S.",
        authorUsername: "chan",
        authorAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
        commentText:
          "Awesome latency benchmarks! Let's integrate this with the JWT handshake in auth.",
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      },
      {
        id: "c-2",
        activityId: "act-1",
        authorId: "usr-manasi",
        authorName: "Manasi Sharma",
        authorUsername: "manasi",
        authorAvatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces",
        commentText:
          "I can tap into these event counts to feed the monthly collaboration wrap-up dashboard!",
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ],
  },
  {
    id: "act-2",
    userId: "usr-chan",
    authorName: "Chan S.",
    authorUsername: "chan",
    authorHeadline: "Authentication & Project Architect",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
    activityType: "project_analyzed",
    title: "Automated Tech Stack Detection v2",
    content:
      "Successfully integrated static AST inspection for project archives. When you upload a workspace ZIP, DevZ-Go now detects exact framework versions and highlights matching developer skills automatically.",
    isDemo: true,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    project: {
      id: "demo-proj-2",
      title: "Static Workspace Tech Inspector",
      shortDescription:
        "Fast inspection engine for codebases that analyzes syntax trees and dependency manifests.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop",
      techStacks: ["Python", "Docker", "TypeScript"],
      category: "Tooling",
      githubUrl: "https://github.com/DevZ-Go/tech-inspector",
      complexity: "Intermediate",
      contributionInfo: "AST parser and framework signature matcher",
      ownerUsername: "chan",
    },
    likesCount: 19,
    isLiked: true,
    commentsCount: 1,
    comments: [
      {
        id: "c-3",
        activityId: "act-2",
        authorId: "usr-khushbu",
        authorName: "Khushbu Patel",
        authorUsername: "khushbu",
        authorAvatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces",
        commentText:
          "This makes recruiter search in Explore 10x more accurate! Incredible work Chan.",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
  },
  {
    id: "act-3",
    userId: "usr-khushbu",
    authorName: "Khushbu Patel",
    authorUsername: "khushbu",
    authorHeadline: "Recruiter & Talent Discovery Specialist",
    authorAvatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces",
    activityType: "profile_updated",
    title: "Updated Developer Discovery Matrix",
    content:
      "Refreshed my developer profile with new criteria for matching open source contributors with early-stage tech startups. Looking forward to reviewing portfolio projects this semester!",
    isDemo: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    likesCount: 11,
    isLiked: false,
    commentsCount: 0,
    comments: [],
  },
  {
    id: "act-4",
    userId: "usr-manasi",
    authorName: "Manasi Sharma",
    authorUsername: "manasi",
    authorHeadline: "Analytics & Dashboard Engineer",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces",
    activityType: "wrap_up_published",
    title: "Developer Community Monthly Wrap-Up — September",
    content:
      "September DevZ-Go insights are live! 12,000+ project commits indexed, 8,500 active developers, and over 450 new cross-functional collaborations formed. Check your personalized metrics on your dashboard!",
    mediaUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop",
    isDemo: true,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    likesCount: 27,
    isLiked: false,
    commentsCount: 1,
    comments: [
      {
        id: "c-4",
        activityId: "act-4",
        authorId: "usr-janasi",
        authorName: "Janasi Rajput",
        authorUsername: "janasi",
        authorAvatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
        commentText:
          "Love these visual breakdowns! The activity curve looks phenomenal.",
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
    ],
  },
];

export const INITIAL_DEMO_CONNECTIONS: Connection[] = [
  {
    id: "conn-1",
    requesterId: "usr-chan",
    receiverId: "usr-janasi",
    status: "accepted",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    partner: {
      id: "usr-chan",
      username: "chan",
      fullName: "Chan S.",
      headline: "Authentication & Project Architect",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
    },
  },
  {
    id: "conn-2",
    requesterId: "usr-khushbu",
    receiverId: "usr-janasi",
    status: "accepted",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    partner: {
      id: "usr-khushbu",
      username: "khushbu",
      fullName: "Khushbu Patel",
      headline: "Recruiter & Talent Discovery Specialist",
      avatarUrl:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces",
    },
  },
  {
    id: "conn-3",
    requesterId: "usr-manasi",
    receiverId: "usr-janasi",
    status: "pending",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    partner: {
      id: "usr-manasi",
      username: "manasi",
      fullName: "Manasi Sharma",
      headline: "Analytics & Dashboard Engineer",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces",
    },
  },
];

export const INITIAL_DEMO_MESSAGES: Record<string, Message[]> = {
  "usr-chan": [
    {
      id: "msg-1",
      senderId: "usr-chan",
      receiverId: "usr-janasi",
      content:
        "Hey Janasi! Have you looked at the project collaborator schema? I want to make sure the project owner can invite developers directly.",
      read: true,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: "msg-2",
      senderId: "usr-janasi",
      receiverId: "usr-chan",
      content:
        "Hey Chan! Yes, it links directly to your Project model by project_id and User by user_id so there's zero data duplication.",
      read: true,
      createdAt: new Date(Date.now() - 3600000 * 7.5).toISOString(),
      isOutgoing: true,
    },
    {
      id: "msg-3",
      senderId: "usr-chan",
      receiverId: "usr-janasi",
      content:
        "That is perfect. I will hook up the project detail card to render the active collaborator badges as well.",
      read: true,
      createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    },
  ],
  "usr-khushbu": [
    {
      id: "msg-4",
      senderId: "usr-khushbu",
      receiverId: "usr-janasi",
      content:
        "Hi Janasi! We just tested opening developer profiles from the Explore recruiter view. Connecting and messaging works seamlessly with the Network module!",
      read: true,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "msg-5",
      senderId: "usr-janasi",
      receiverId: "usr-khushbu",
      content:
        "That's great news Khushbu! The connection requests will now alert the recipient right away via the navbar bell.",
      read: true,
      createdAt: new Date(Date.now() - 3600000 * 3.8).toISOString(),
      isOutgoing: true,
    },
  ],
  "usr-manasi": [
    {
      id: "msg-6",
      senderId: "usr-manasi",
      receiverId: "usr-janasi",
      content:
        "Hey Janasi, I am querying `/analytics/dashboard-summary` for the charts. The metrics for posts, connections, and collaborations are working wonderfully!",
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ],
};

export const INITIAL_DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    recipientId: "usr-janasi",
    actorId: "usr-manasi",
    actorName: "Manasi Sharma",
    actorUsername: "manasi",
    actorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces",
    type: "connection_request",
    relatedId: "usr-manasi",
    message: "Manasi Sharma sent you a connection request",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: "notif-2",
    recipientId: "usr-janasi",
    actorId: "usr-chan",
    actorName: "Chan S.",
    actorUsername: "chan",
    actorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
    type: "like",
    relatedId: "act-1",
    message: "Chan S. liked your project activity: Realtime WebSocket Hub",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "notif-3",
    recipientId: "usr-janasi",
    actorId: "usr-khushbu",
    actorName: "Khushbu Patel",
    actorUsername: "khushbu",
    actorAvatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces",
    type: "connection_accepted",
    relatedId: "usr-khushbu",
    message: "Khushbu Patel accepted your connection request",
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "notif-4",
    recipientId: "usr-janasi",
    actorId: "usr-chan",
    actorName: "Chan S.",
    actorUsername: "chan",
    actorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
    type: "collaboration_accepted",
    relatedId: "demo-proj-2",
    message: "Chan S. accepted your collaboration request on Tech Inspector",
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export const INITIAL_PROJECT_COLLABORATORS: Record<string, ProjectCollaborator[]> = {
  "demo-proj-1": [
    {
      id: "collab-1",
      projectId: "demo-proj-1",
      userId: "usr-janasi",
      username: "janasi",
      fullName: "Janasi Rajput",
      headline: "Backend & Network Lead",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
      role: "Backend Architect",
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: "collab-2",
      projectId: "demo-proj-1",
      userId: "usr-chan",
      username: "chan",
      fullName: "Chan S.",
      headline: "Authentication & Project Architect",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
      role: "Security & Auth Lead",
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
  ],
  "demo-proj-2": [
    {
      id: "collab-3",
      projectId: "demo-proj-2",
      userId: "usr-chan",
      username: "chan",
      fullName: "Chan S.",
      headline: "Authentication Architect",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
      role: "Project Owner",
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
    {
      id: "collab-4",
      projectId: "demo-proj-2",
      userId: "usr-khushbu",
      username: "khushbu",
      fullName: "Khushbu Patel",
      headline: "Recruiter Specialist",
      avatarUrl:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces",
      role: "Explore & Talent Integration",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: "collab-5",
      projectId: "demo-proj-2",
      userId: "usr-manasi",
      username: "manasi",
      fullName: "Manasi Sharma",
      headline: "Analytics Engineer",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces",
      role: "Telemetry & Performance",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ],
};
