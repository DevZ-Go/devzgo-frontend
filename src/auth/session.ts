import type { AuthUser } from "../types/auth";
import { fetchMyProfile } from "../api/profiles";

const LAST = "devzgo:last-path";
const FIRST_WELCOME = "devzgo:first-welcome";

function homeFor(user: AuthUser | null): string {
  return user?.account_type === "recruiter" ? "/recruit" : "/network";
}

/** Mark that a newly created account should see the About Us welcome page (/home) on its very first sign-in. */
export function markNewAccountWelcome(email?: string, userId?: string) {
  if (email?.trim()) {
    localStorage.setItem(`${FIRST_WELCOME}:email:${email.trim().toLowerCase()}`, "1");
  }
  if (userId?.trim()) {
    localStorage.setItem(`${FIRST_WELCOME}:id:${userId.trim()}`, "1");
  }
}

function consumeNewAccountWelcome(user: AuthUser | null): boolean {
  if (!user || user.account_type === "recruiter") return false;
  let pending = false;
  const email = user.email?.trim().toLowerCase();
  const id = user.id ? String(user.id) : "";
  if (email && localStorage.getItem(`${FIRST_WELCOME}:email:${email}`) === "1") {
    localStorage.removeItem(`${FIRST_WELCOME}:email:${email}`);
    pending = true;
  }
  if (id && localStorage.getItem(`${FIRST_WELCOME}:id:${id}`) === "1") {
    localStorage.removeItem(`${FIRST_WELCOME}:id:${id}`);
    pending = true;
  }
  return pending;
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

/**
 * Network (/network) is the main page for developers after sign-in.
 * New accounts also land on /network so the developer tour can auto-start there.
 */
export async function destinationAfterLogin(
  user: AuthUser | null,
  options?: { isNewAccount?: boolean },
): Promise<string> {
  // Consume first-welcome flag so it does not linger; tour uses profile.tourVersion instead.
  if (options?.isNewAccount || consumeNewAccountWelcome(user)) {
    /* no-op: destination is always role home */
  }
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
