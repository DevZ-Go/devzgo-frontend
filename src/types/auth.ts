/** Current user from GET /auth/me */
export interface AuthUser {
  id?: number | string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}
