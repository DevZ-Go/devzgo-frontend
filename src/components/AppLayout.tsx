import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";

/**
 * Wraps all routes so the footer appears site-wide without duplicating it per page.
 */
export function AppLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/home" || location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      {!isHome && <Footer />}
    </div>
  );
}
