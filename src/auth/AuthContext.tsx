import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { fetchCurrentUser } from "../api";
import { queryClient } from "../api/queryKeys";
import type { AuthUser } from "../types/auth";
import { getToken, removeToken, setToken } from "./token";
import { stableContext } from "../utils/stableContext";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (token: string) => void;
  logout: () => void;
  /** Load /auth/me using the current token. Call after login or on app load. */
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = stableContext<AuthContextValue | null>("AuthContext", null);

function loadStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return getToken();
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setTokenState] = useState<string | null>(loadStoredToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState<boolean>(() => !loadStoredToken());

  const login = useCallback((newToken: string) => {
    queryClient.clear();
    setUser(null);
    setToken(newToken);
    setTokenState(newToken);
    setIsReady(false);
  }, []);

  const logout = useCallback(() => {
    queryClient.clear();
    removeToken();
    setTokenState(null);
    setUser(null);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsReady(true);
      return;
    }
    // Safety fallback: if backend is unreachable, settle isReady so app is never stuck indefinitely
    const timer = window.setTimeout(() => setIsReady(true), 3000);
    return () => window.clearTimeout(timer);
  }, [token]);

  useEffect(() => {
    const onExpired = () => {
      logout();
    };
    const onShow = (event: PageTransitionEvent) => {
      // Back/forward can restore the previous account's page from memory. Reload uses the token that is stored now.
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("devzgo:session-expired", onExpired);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("devzgo:session-expired", onExpired);
      window.removeEventListener("pageshow", onShow);
    };
  }, [logout]);

  const refreshUser = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setIsReady(true);
      return null;
    }
    try {
      const me = await fetchCurrentUser();
      setUser(me);
      return me;
    } catch (err) {
      // 401 = dead session. Other failures (offline, 500) keep the token so a retry can succeed.
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
      }
      throw err;
    } finally {
      setIsReady(true);
    }
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isReady,
      login,
      logout,
      refreshUser,
    }),
    [token, user, isReady, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
