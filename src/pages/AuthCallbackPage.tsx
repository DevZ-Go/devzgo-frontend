import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { destinationAfterLogin } from "../auth/session";

/** Landing page after GitHub login: the backend puts the JWT after "#", which never reaches any server. */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { login, refreshUser, logout } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", window.location.pathname); // drop the token from the address bar
    if (!token) {
      navigate("/login?error=github", { replace: true });
      return;
    }
    login(token);
    refreshUser()
      .then((me) => destinationAfterLogin(me))
      .then((path) => navigate(path, { replace: true }))
      .catch(() => {
        logout();
        navigate("/login?error=github", { replace: true });
      });
  }, [login, refreshUser, logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center gap-2 text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" /> Signing you in…
    </div>
  );
}
