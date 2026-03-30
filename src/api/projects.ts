import { api } from "./axios";
import type { ApiProject } from "../types/project";

export async function fetchProjects(): Promise<ApiProject[]> {
  const { data } = await api.get<ApiProject[] | { projects?: ApiProject[] }>(
    "/projects"
  );
  return Array.isArray(data) ? data : data.projects ?? [];
}
