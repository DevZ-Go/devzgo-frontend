import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAccount } from "../auth/account";

function Waiting() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <Loader2 className="h-6 w-6 animate-spin text-maroon-700" aria-hidden />
    </div>
  );
}

/** Building, importing and editing projects, and the developer home and wrap. Recruiters go to their dashboard. */
export function DeveloperRoute({ children }: { children: ReactNode }) {
  const { ready, recruiter } = useAccount();
  if (!ready) return <Waiting />;
  if (recruiter) return <Navigate to="/recruit" replace />;
  return <>{children}</>;
}

export function RecruiterRoute({ children }: { children: ReactNode }) {
  const { ready, recruiter } = useAccount();
  if (!ready) return <Waiting />;
  if (!recruiter) return <Navigate to="/home" replace />;
  return <>{children}</>;
}
