import type { AuthUser } from "../types/auth";
import { fetchMyProfile } from "../api/profiles";

const LAST = "devzgo:last-path";

function homeFor(user: AuthUser | null): string {
  return user?.account_type === "recruiter" ? "/recruit" : "/home";
}

/** Pages worth returning to. Auth screens are never a landing place. */
export function rememberablePath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  return !["/login", "/register", "/forgot-password", "/reset-password", "/auth"].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`),
  );
}

export function rememberPath(userId: string, path: string) {
  if (!userId || !rememberablePath(path)) return;
  localStorage.setItem(`${LAST}:${userId}`, path);
}

function savedPath(userId: string): string | null {
  const path = localStorage.getItem(`${LAST}:${userId}`);
  return path && rememberablePath(path) ? path : null;
}

/** Home by default. Resume only when this account chose it, and only their own last page. */
export async function destinationAfterLogin(user: AuthUser | null): Promise<string> {
  const home = homeFor(user);
  const id = user?.id ? String(user.id) : "";
  if (!id) return home;
  try {
    const profile = await fetchMyProfile();
    if (profile.startPage === "resume") return savedPath(id) ?? home;
  } catch {
    return home;
  }
  return home;
}
