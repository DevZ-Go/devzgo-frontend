const VIEWERS = new Set(["text", "image", "svg", "pdf", "audio", "video", "font", "archive"]);

export type ViewerKind = "text" | "image" | "svg" | "pdf" | "audio" | "video" | "font" | "archive" | "binary";

/** Which viewer a server-classified kind uses. Unknown kinds stay download-only. */
export function viewerFor(kind: string): ViewerKind {
  return VIEWERS.has(kind) ? (kind as ViewerKind) : "binary";
}

/**
 * Keep only a stream URL for this project. The path is returned relative to the API
 * so the page never navigates to a host the response invented.
 */
export function sameOriginStream(url: string, projectId: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (parsed.pathname !== `/projects/${projectId}/files/stream`) return null;
  return `${parsed.pathname}${parsed.search}`;
}
