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
  visibility: ProjectVisibility;
  /** Backend expects stack names, e.g. ["React", "JavaScript"] */
  tech_stacks: string[];
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

export async function createProject(
  payload: CreateProjectPayload
): Promise<unknown> {
  const { data } = await api.post("/projects", payload);
  return data;
}
