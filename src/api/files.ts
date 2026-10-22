import { api } from "./client";
import { API_BASE_URL } from "./config";
import { sameOriginStream } from "../utils/filePreview";

export type FileMeta = {
  path: string;
  name: string;
  size: number;
  kind: string;
  mime: string;
  is_secret: boolean;
  width: number | null;
  height: number | null;
  editable: boolean;
  preview_limited: boolean;
  stream_url: string | null;
  download_url: string;
  message: string | null;
};

export type ArchiveListing = {
  entries: { name: string; size: number | null; symlink: boolean }[];
  message: string | null;
  truncated: boolean;
};

export async function fetchFileMeta(projectId: string, path: string): Promise<FileMeta> {
  return (await api.get<FileMeta>(`/projects/${projectId}/files/meta`, { params: { path } })).data;
}

export async function fetchArchiveListing(projectId: string, path: string): Promise<ArchiveListing> {
  return (await api.get<ArchiveListing>(`/projects/${projectId}/files/archive`, { params: { path } })).data;
}

export function streamRequestPath(projectId: string, url: string | null): string | null {
  return url ? sameOriginStream(url, projectId) : null;
}

/** Absolute URL for a media element. Null when the link is not this project's stream. */
export function mediaSrc(projectId: string, url: string | null): string | null {
  const path = streamRequestPath(projectId, url);
  return path ? `${API_BASE_URL.replace(/\/$/, "")}${path}` : null;
}

export async function fetchStreamBlob(projectId: string, url: string | null): Promise<Blob> {
  const path = streamRequestPath(projectId, url);
  if (!path) throw new Error("This preview link isn't valid.");
  return (await api.get<Blob>(path, { responseType: "blob" })).data;
}
