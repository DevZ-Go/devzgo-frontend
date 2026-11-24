import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LandingPage } from "../pages/LandingPage";

/** Guests see Overview at `/`; signed-in users go to their app home. */
export function RootLanding() {
  const { isAuthenticated, isReady, user } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF8CA]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#780D18] border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    const to = user?.account_type === "recruiter" ? "/recruit" : "/network";
    return <Navigate to={to} replace />;
  }

  return <LandingPage />;
}
