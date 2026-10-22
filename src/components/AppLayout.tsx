import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Footer } from "./Footer";
import { RecruiterGuide } from "./RecruiterGuide";

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading page">
      <Loader2 className="h-6 w-6 animate-spin text-maroon-700" aria-hidden />
    </div>
  );
}

/**
 * Wraps all routes so the footer appears site-wide without duplicating it per page.
 */
export function AppLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/home" || location.pathname === "/";
  const fullScreen =
    isHome ||
    location.pathname.startsWith("/explore") ||
    location.pathname.startsWith("/wrap");
  const deskFit = location.pathname === "/messages";

  return (
    <div className={`flex min-h-screen flex-col bg-[#f8f6f0] dark:bg-[#090d16] text-stone-800 dark:text-stone-100 transition-colors duration-300 ${deskFit ? "lg:h-dvh lg:overflow-hidden" : ""}`}>
      <div className={`flex-1 ${deskFit ? "lg:min-h-0 lg:overflow-hidden" : ""}`}>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
        <RecruiterGuide />
      </div>
      {!fullScreen && <Footer />}
    </div>
  );
}
