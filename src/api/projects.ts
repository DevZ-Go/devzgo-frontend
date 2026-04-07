import { api } from "./client";
import type { ApiProject } from "../types/project";

export interface TechStackItem {
  id: number | string;
  name: string;
}

export type ProjectVisibility = "Public" | "Private";

export interface CreateProjectPayload {
  title: string;
  short_description: string;
  full_description: string;
  category: string;
  /** Sent when category is `Other` — short custom label (optional) */
  category_other?: string | null;
  visibility: ProjectVisibility;
  /** Backend `ProjectCreate.tech_stack_ids` — numeric IDs from GET /projects/techstacks */
  tech_stack_ids: number[];
}

/** Response from POST /projects — enough to chain uploads by id */
export interface CreateProjectResponse {
  id: string;
}

function normalizeTechStackResponse(data: unknown): TechStackItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((item, i) => {
    if (typeof item === "string") {
      return { id: item, name: item };
    }
    if (item && typeof item === "object" && "name" in item) {
      const o = item as { id?: number | string; name: string };
      return { id: o.id ?? o.name ?? i, name: String(o.name) };
    }
    return { id: i, name: String(item) };
  });
}

export async function fetchProjects(
  params?: Record<string, string | number | boolean | undefined>
): Promise<ApiProject[]> {
  const { data } = await api.get<ApiProject[] | { projects?: ApiProject[] }>(
    "/projects",
    params && Object.keys(params).length ? { params } : undefined
  );
  return Array.isArray(data) ? data : data.projects ?? [];
}

export async function fetchMyProjects(
  params?: Record<string, string | number | boolean | undefined>
): Promise<ApiProject[]> {
  const { data } = await api.get<ApiProject[] | { projects?: ApiProject[] }>(
    "/projects/me",
    params && Object.keys(params).length ? { params } : undefined
  );
  return Array.isArray(data) ? data : data.projects ?? [];
}

export async function fetchTechStacks(): Promise<TechStackItem[]> {
  const { data } = await api.get<
    | string[]
    | TechStackItem[]
    | { techstacks?: unknown; items?: unknown; tech_stacks?: unknown }
  >("/projects/techstacks");

  if (Array.isArray(data)) {
    return normalizeTechStackResponse(data);
  }
  if (data && typeof data === "object") {
    if ("tech_stacks" in data && Array.isArray(data.tech_stacks)) {
      return normalizeTechStackResponse(data.tech_stacks);
    }
    if ("techstacks" in data && Array.isArray(data.techstacks)) {
      return normalizeTechStackResponse(data.techstacks);
    }
    if ("items" in data && Array.isArray(data.items)) {
      return normalizeTechStackResponse(data.items);
    }
  }
  return [];
}

/**
 * Upload cover image and/or demo video for an existing project.
 * Backend: POST /projects/{project_id}/media — multipart fields `cover_image`, `demo_video`.
 */
export async function uploadProjectMedia(
  projectId: string,
  files: { cover_image?: File | null; demo_video?: File | null }
): Promise<void> {
  const formData = new FormData();
  if (files.cover_image) formData.append("cover_image", files.cover_image);
  if (files.demo_video) formData.append("demo_video", files.demo_video);
  if (!formData.has("cover_image") && !formData.has("demo_video")) return;
  await api.post(`/projects/${projectId}/media`, formData);
}

/** Response from POST /projects/{id}/workspace/upload */
export interface WorkspaceUploadResponse {
  message: string;
  total_files: number;
  detected_tech_stacks?: string[];
}

/** One row from GET /projects/{id}/files */
export interface ProjectFileEntry {
  id: string;
  file_name: string;
  file_path: string;
  is_directory: boolean;
  parent_path: string | null;
}

/**
 * Upload a project workspace as a single .zip (extracted under storage/project_<id>/ on the server).
 * Backend: POST /projects/{project_id}/workspace/upload — multipart field name `file`.
 */
export async function uploadProjectWorkspace(
  projectId: string,
  zipFile: File
): Promise<WorkspaceUploadResponse> {
  const formData = new FormData();
  formData.append("file", zipFile);
  const { data } = await api.post<WorkspaceUploadResponse>(
    `/projects/${projectId}/workspace/upload`,
    formData
  );
  return data;
}

export async function fetchProjectFiles(
  projectId: string
): Promise<ProjectFileEntry[]> {
  const { data } = await api.get<ProjectFileEntry[]>(
    `/projects/${projectId}/files`
  );
  return Array.isArray(data) ? data : [];
}

export interface ProjectFileContentResponse {
  content: string;
}

export async function fetchProjectFileContent(
  projectId: string,
  path: string
): Promise<ProjectFileContentResponse> {
  const { data } = await api.get<ProjectFileContentResponse>(
    `/projects/${projectId}/file`,
    { params: { path } }
  );
  return data;
}

export async function fetchProject(projectId: string): Promise<ApiProject> {
  const { data } = await api.get<ApiProject>(`/projects/${projectId}`);
  return data;
}

export async function createProject(
  payload: CreateProjectPayload
): Promise<CreateProjectResponse> {
  const body = {
    title: payload.title,
    short_description: payload.short_description || null,
    full_description: payload.full_description || null,
    category: payload.category,
    category_other:
      payload.category === "Other" ? payload.category_other?.trim() || null : null,
    visibility: payload.visibility,
    tech_stack_ids: payload.tech_stack_ids,
  };
  const { data } = await api.post<CreateProjectResponse>("/projects", body);
  return data;
}

export interface UpdateProjectPayload extends CreateProjectPayload {
  cover_image_url?: string | null;
  demo_video_url?: string | null;
}

export async function updateProject(
  projectId: string,
  payload: UpdateProjectPayload
): Promise<ApiProject> {
  const body = {
    title: payload.title,
    short_description: payload.short_description || null,
    full_description: payload.full_description || null,
    category: payload.category,
    category_other:
      payload.category === "Other" ? payload.category_other?.trim() || null : null,
    visibility: payload.visibility,
    tech_stack_ids: payload.tech_stack_ids,
    cover_image_url: payload.cover_image_url ?? null,
    demo_video_url: payload.demo_video_url ?? null,
  };
  const { data } = await api.put<ApiProject>(`/projects/${projectId}`, body);
  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${encodeURIComponent(projectId)}`, {
    validateStatus: (s) => s === 204 || (s >= 200 && s < 300),
  });
}
