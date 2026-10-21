/** Current user from GET /auth/me */
export interface AuthUser {
  id?: number | string;
  email?: string;
  username?: string;
  created_at?: string;
  has_password?: boolean;
  [key: string]: unknown;
}
