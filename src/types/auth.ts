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
  [key: string]: unknown;
}
