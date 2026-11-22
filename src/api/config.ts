/** Base URL for the FastAPI backend (no trailing slash). Set VITE_API_BASE_URL at build time for production. */
function apiBaseFromEnv(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:8000";
}

export const API_BASE_URL = apiBaseFromEnv();

if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  console.error(
    "VITE_API_BASE_URL is missing from the production build; API calls will target localhost.",
  );
}

/** Demo mode: local mock data only when VITE_MOCK_API=true. Must stay false in production builds. */
export const USE_MOCK = import.meta.env.VITE_MOCK_API === "true";

if (import.meta.env.PROD && USE_MOCK) {
  console.error("VITE_MOCK_API=true in a production build — disable mock mode.");
}

/** Turn a relative API path (e.g. `/storage/covers/x.png`) into a full URL for `<img src>`. */
export function resolveApiAssetUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "";
  // Absolute / in-browser object URLs must stay untouched (blob: was being prefixed and broke
  // club logo/banner/poster previews with net::ERR_FAILED).
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("blob:") ||
    pathOrUrl.startsWith("data:")
  ) {
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
