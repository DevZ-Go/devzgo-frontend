import { useAuth } from "./AuthContext";

/** The signed-in account type. `ready` stays false until /auth/me has answered. */
export function useAccount() {
  const { user, token } = useAuth();
  return {
    ready: !token || user !== null,
    recruiter: user?.account_type === "recruiter",
  };
}
