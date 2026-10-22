import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { RecruiterGuide } from "./RecruiterGuide";

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
        <Outlet />
        <RecruiterGuide />
      </div>
      {!fullScreen && <Footer />}
    </div>
  );
}
