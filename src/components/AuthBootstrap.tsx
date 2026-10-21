import { useEffect } from "react";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import { syncTimezone } from "../api/wraps";

/**
 * After refresh, if a token exists, loads GET /auth/me so `user` is populated.
 * Clears session if the token is rejected (401).
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, user, refreshUser, logout } = useAuth();
  const userId = user?.id ? String(user.id) : null;

  useEffect(() => {
    if (!token) return;
    void refreshUser().catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
      }
    });
  }, [token, refreshUser, logout]);

  useEffect(() => {
    if (userId) void syncTimezone(userId).catch(() => undefined);
  }, [userId]);

  return <>{children}</>;
}
