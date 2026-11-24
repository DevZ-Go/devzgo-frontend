import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    const notice = location.pathname.startsWith("/project")
      ? "Please log in to view project details."
      : location.pathname.startsWith("/explore")
        ? "Please log in to view more projects and explore."
        : location.pathname.startsWith("/network")
          ? "Please log in to view the community network."
          : location.pathname.startsWith("/messages")
            ? "Please log in to access messages."
            : location.pathname.startsWith("/add-project")
              ? "Please log in to add a project."
              : "Please log in to continue.";
    return <Navigate to="/login" state={{ from: location, notice }} replace />;
  }

  return <>{children}</>;
}
