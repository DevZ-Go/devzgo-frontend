/**
 * Mock API module — used when VITE_MOCK_API=true.
 * Provides fake implementations for auth and project endpoints
 * so the frontend can run without the FastAPI backend.
 */

import type { AuthUser } from "../types/auth";
import type { ApiProject } from "../types/project";
import type { LoginTokenResponse, RegisterPayload } from "./auth";
import type {
  TechStackItem,
  CreateProjectPayload,
  CreateProjectResponse,
  ProjectFileEntry,
  ProjectFileContentResponse,
  UpdateProjectPayload,
  WorkspaceUploadResponse,
} from "./projects";

/* ── helpers ── */

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let nextId = 100;

/* ── fake user ── */

const MOCK_USER: AuthUser = {
  id: 1,
  email: "demo@devzgo.dev",
  username: "DevZGoDemoUser",
  created_at: "2025-06-15T10:30:00Z",
};

/* ── fake tech stacks ── */

const MOCK_TECH_STACKS: TechStackItem[] = [
  { id: 1, name: "React" },
  { id: 2, name: "Python" },
  { id: 3, name: "TypeScript" },
  { id: 4, name: "FastAPI" },
  { id: 5, name: "Node.js" },
  { id: 6, name: "TailwindCSS" },
  { id: 7, name: "PostgreSQL" },
  { id: 8, name: "Docker" },
  { id: 9, name: "Go" },
  { id: 10, name: "Rust" },
  { id: 11, name: "Next.js" },
  { id: 12, name: "MongoDB" },
];

/* ── fake projects ── */

const MOCK_PROJECTS: ApiProject[] = [
  {
    id: "1",
    owner_id: "1",
    is_owner: true,
    title: "DevZ-Go Platform",
    short_description:
      "A vibrant showcase platform for student developers to share their projects with the world.",
    full_description:
      "DevZ-Go is a community-driven project showcase platform built with React and FastAPI.",
    category: "Web App",
    visibility: "Public",
    tech_stack_ids: [1, 3, 4, 6],
    tech_stacks: ["React", "TypeScript", "FastAPI", "TailwindCSS"],
    cover_image_url: "https://picsum.photos/seed/devzgo/800/600",
    likes: 142,
    views: 2300,
    comments: 28,
    owner: {
      username: "DevZGoDemoUser",
      name: "Demo User",
      avatar: "",
    },
    owner_username: "DevZGoDemoUser",
  },
  {
    id: "2",
    owner_id: "2",
    is_owner: false,
    title: "CloudNotes",
    short_description:
      "Real-time collaborative note-taking app with Markdown support and synced across devices.",
    full_description:
      "CloudNotes allows teams to collaboratively edit Markdown notes in real-time.",
    category: "Productivity",
    visibility: "Public",
    tech_stack_ids: [11, 3, 7],
    tech_stacks: ["Next.js", "TypeScript", "PostgreSQL"],
    cover_image_url: "https://picsum.photos/seed/cloudnotes/800/600",
    likes: 89,
    views: 1450,
    comments: 12,
    owner: {
      username: "coder_jane",
      name: "Jane Smith",
      avatar: "",
    },
    owner_username: "coder_jane",
  },
  {
    id: "3",
    owner_id: "3",
    is_owner: false,
    title: "PixelForge",
    short_description:
      "Lightweight browser-based pixel art editor with layers, animation, and export to GIF/PNG.",
    full_description:
      "PixelForge is a creative tool for pixel artists, built entirely in the browser.",
    category: "Creative Tool",
    visibility: "Public",
    tech_stack_ids: [1, 3],
    tech_stacks: ["React", "TypeScript"],
    cover_image_url: "https://picsum.photos/seed/pixelforge/800/600",
    likes: 210,
    views: 3800,
    comments: 45,
    owner: {
      username: "art_dev",
      name: "Alex Rivera",
      avatar: "",
    },
    owner_username: "art_dev",
  },
  {
    id: "4",
    owner_id: "4",
    is_owner: false,
    title: "RustCLI Toolkit",
    short_description:
      "A blazing-fast collection of CLI utilities written in Rust for everyday developer tasks.",
    full_description:
      "RustCLI Toolkit provides essential command-line tools optimized for speed.",
    category: "Developer Tool",
    visibility: "Public",
    tech_stack_ids: [10],
    tech_stacks: ["Rust"],
    cover_image_url: "https://picsum.photos/seed/rustcli/800/600",
    likes: 176,
    views: 2100,
    comments: 19,
    owner: {
      username: "rustacean42",
      name: "Sam Lee",
      avatar: "",
    },
    owner_username: "rustacean42",
  },
  {
    id: "5",
    owner_id: "5",
    is_owner: false,
    title: "MicroServe",
    short_description:
      "Container orchestration dashboard for managing microservices with a beautiful UI.",
    full_description:
      "MicroServe provides a visual dashboard for Docker and Kubernetes deployments.",
    category: "DevOps",
    visibility: "Public",
    tech_stack_ids: [9, 8, 1],
    tech_stacks: ["Go", "Docker", "React"],
    cover_image_url: "https://picsum.photos/seed/microserve/800/600",
    likes: 98,
    views: 1670,
    comments: 8,
    owner: {
      username: "infra_max",
      name: "Max Chen",
      avatar: "",
    },
    owner_username: "infra_max",
  },
  {
    id: "6",
    owner_id: "6",
    is_owner: false,
    title: "DataViz Studio",
    short_description:
      "Interactive data visualization builder with drag-and-drop chart components.",
    full_description:
      "DataViz Studio lets anyone create beautiful data visualizations without writing code.",
    category: "Data Science",
    visibility: "Public",
    tech_stack_ids: [2, 1, 12],
    tech_stacks: ["Python", "React", "MongoDB"],
    cover_image_url: "https://picsum.photos/seed/dataviz/800/600",
    likes: 134,
    views: 1920,
    comments: 22,
    owner: {
      username: "data_queen",
      name: "Priya Patel",
      avatar: "",
    },
    owner_username: "data_queen",
  },
];

/* ── Auth mocks ── */

export async function loginWithPassword(
  _email: string,
  _password: string
): Promise<LoginTokenResponse> {
  await delay(600);
  return { access_token: "mock-jwt-token-devzgo-demo-2025", token_type: "bearer" };
}

export async function registerUser(_payload: RegisterPayload): Promise<unknown> {
  await delay(600);
  return { message: "User registered successfully" };
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  await delay(300);
  return { ...MOCK_USER };
}

/* ── Project mocks ── */

export async function fetchProjects(
  _params?: Record<string, string | number | boolean | undefined>
): Promise<ApiProject[]> {
  await delay(500);
  return [...MOCK_PROJECTS];
}

export async function fetchMyProjects(
  _params?: Record<string, string | number | boolean | undefined>
): Promise<ApiProject[]> {
  await delay(400);
  return MOCK_PROJECTS.filter((p) => p.is_owner);
}

export async function fetchTechStacks(): Promise<TechStackItem[]> {
  await delay(200);
  return [...MOCK_TECH_STACKS];
}

export async function fetchProject(projectId: string): Promise<ApiProject> {
  await delay(300);
  const p = MOCK_PROJECTS.find((proj) => String(proj.id) === projectId);
  if (!p) throw new Error("Project not found");
  return { ...p };
}

export async function createProject(
  payload: CreateProjectPayload
): Promise<CreateProjectResponse> {
  await delay(500);
  const id = String(nextId++);
  MOCK_PROJECTS.push({
    id,
    owner_id: "1",
    is_owner: true,
    title: payload.title,
    short_description: payload.short_description,
    full_description: payload.full_description,
    category: payload.category,
    visibility: payload.visibility,
    tech_stack_ids: payload.tech_stack_ids,
    tech_stacks: payload.tech_stack_ids.map(
      (tid) => MOCK_TECH_STACKS.find((t) => t.id === tid)?.name ?? "Unknown"
    ),
    cover_image_url: `https://picsum.photos/seed/proj${id}/800/600`,
    likes: 0,
    views: 0,
    comments: 0,
    owner: { username: "DevZGoDemoUser", name: "Demo User", avatar: "" },
    owner_username: "DevZGoDemoUser",
  });
  return { id };
}

export async function updateProject(
  projectId: string,
  payload: UpdateProjectPayload
): Promise<ApiProject> {
  await delay(400);
  const idx = MOCK_PROJECTS.findIndex((p) => String(p.id) === projectId);
  if (idx === -1) throw new Error("Project not found");
  MOCK_PROJECTS[idx] = {
    ...MOCK_PROJECTS[idx],
    title: payload.title,
    short_description: payload.short_description,
    full_description: payload.full_description,
    category: payload.category,
    visibility: payload.visibility,
    tech_stack_ids: payload.tech_stack_ids,
    tech_stacks: payload.tech_stack_ids.map(
      (tid) => MOCK_TECH_STACKS.find((t) => t.id === tid)?.name ?? "Unknown"
    ),
  };
  return { ...MOCK_PROJECTS[idx] };
}

export async function deleteProject(projectId: string): Promise<void> {
  await delay(300);
  const idx = MOCK_PROJECTS.findIndex((p) => String(p.id) === projectId);
  if (idx !== -1) MOCK_PROJECTS.splice(idx, 1);
}

export async function uploadProjectMedia(
  _projectId: string,
  _files: { cover_image?: File | null; demo_video?: File | null }
): Promise<void> {
  await delay(300);
}

export async function uploadProjectWorkspace(
  _projectId: string,
  _zipFile: File
): Promise<WorkspaceUploadResponse> {
  await delay(500);
  return { message: "Workspace uploaded successfully", total_files: 12 };
}

export async function fetchProjectFiles(
  _projectId: string
): Promise<ProjectFileEntry[]> {
  await delay(300);
  return [
    { id: "f1", file_name: "main.py", file_path: "main.py", is_directory: false, parent_path: null },
    { id: "f2", file_name: "README.md", file_path: "README.md", is_directory: false, parent_path: null },
    { id: "f3", file_name: "src", file_path: "src", is_directory: true, parent_path: null },
    { id: "f4", file_name: "app.py", file_path: "src/app.py", is_directory: false, parent_path: "src" },
  ];
}

export async function fetchProjectFileContent(
  _projectId: string,
  path: string
): Promise<ProjectFileContentResponse> {
  await delay(200);
  return {
    content: `# Mock file content for: ${path}\n\nprint("Hello from DevZ-Go mock!")\n`,
  };
}
