import type { AuthUser } from "../types/auth";
import type { ApiProject } from "../types/project";

function normId(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v).trim().toLowerCase();
}

/**
 * True if the signed-in user owns this project.
 * Uses owner_id ↔ user.id first, then owner_username ↔ user.username (fallback).
 */
export function isProjectOwner(
  project: ApiProject | null | undefined,
  user: AuthUser | null | undefined
): boolean {
  if (!project || !user) return false;

  const uid = normId(user.id);
  const oid = normId(project.owner_id);
  if (uid.length > 0 && oid.length > 0 && uid === oid) return true;

  const myName = (user.username ?? "").trim().toLowerCase();
  const ownerName = (project.owner_username ?? "").trim().toLowerCase();
  if (myName.length > 0 && ownerName.length > 0 && myName === ownerName) {
    return true;
  }

  const nested = project.owner?.username?.trim().toLowerCase();
  if (myName.length > 0 && nested && myName === nested) return true;

  return false;
}
