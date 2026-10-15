/** Base URL for the FastAPI backend (no trailing slash). */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

/** Demo mode: social modules fall back to local demo data only when this is on. */
export const USE_MOCK = import.meta.env.VITE_MOCK_API === "true";

/** Turn a relative API path (e.g. `/storage/covers/x.png`) into a full URL for `<img src>`. */
export function resolveApiAssetUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const base = API_BASE_URL.replace(/\/$/, "");
  return pathOrUrl.startsWith("/") ? `${base}${pathOrUrl}` : `${base}/${pathOrUrl}`;
}

/** Same as resolveApiAssetUrl but keeps "no image" as null for optional fields. */
export function assetUrlOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? resolveApiAssetUrl(value) : null;
}

/** In real mode rethrow so the UI shows the error; in demo mode let the caller use local data. */
export function demoFallback(err: unknown): void {
  if (!USE_MOCK) throw err;
  console.warn("Demo mode: using local data", err);
}
