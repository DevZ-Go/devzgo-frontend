import { useEffect } from "react";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";

/**
 * After refresh, if a token exists, loads GET /auth/me so `user` is populated.
 * Clears session if the token is rejected (401).
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, refreshUser, logout } = useAuth();

  useEffect(() => {
    if (!token) return;
    void refreshUser().catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
      }
    });
  }, [token, refreshUser, logout]);

  return <>{children}</>;
}
