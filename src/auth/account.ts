import { useAuth } from "./AuthContext";

/** The signed-in account type. `ready` stays false until /auth/me has answered or settled. */
export function useAccount() {
  const { user, token, isReady } = useAuth();
  return {
    ready: isReady ?? (!token || user !== null),
    recruiter: user?.account_type === "recruiter",
  };
}
