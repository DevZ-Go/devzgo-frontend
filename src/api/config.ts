/** Base URL for the FastAPI backend (no trailing slash). */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

/** Turn a relative API path (e.g. `/static/covers/x.png`) into a full URL for `<img src>`. */
export function resolveApiAssetUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const base = API_BASE_URL.replace(/\/$/, "");
  return pathOrUrl.startsWith("/") ? `${base}${pathOrUrl}` : `${base}/${pathOrUrl}`;
}
