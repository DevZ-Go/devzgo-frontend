/** Current user from GET /auth/me */
export interface AuthUser {
  id?: number | string;
  email?: string;
  username?: string;
  created_at?: string;
  has_password?: boolean;
  username_needs_choice?: boolean;
  /** Fixed at sign-up. Recruiter accounts review work and cannot build projects. */
  account_type?: "developer" | "recruiter";
  /** Set while the account is paused or pending deletion. */
  deactivated_at?: string | null;
  /** When set, permanent deletion is scheduled; signing in before this time cancels it. */
  delete_after?: string | null;
  /** Set while an admin has locked the account. Signing in does not clear it. */
  suspended_at?: string | null;
  /** True when this account can open the admin area. */
  is_platform_admin?: boolean;
  admin_role?: "owner" | "admin" | null;
  /** Uploaded profile photo, when /auth/me includes it. */
  avatar_url?: string | null;
  [key: string]: unknown;
}
