/** Current user from GET /auth/me */
export interface AuthUser {
  id?: number | string;
  email?: string;
  username?: string;
  created_at?: string;
  [key: string]: unknown;
}
