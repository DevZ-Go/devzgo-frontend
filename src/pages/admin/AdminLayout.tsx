import { Suspense, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { fetchAdminSession, fetchCatalog } from "../../api/admin";
import { useAuth } from "../../auth/AuthContext";
import { Navbar } from "../../components/Navbar";
import { getApiErrorMessage } from "../../utils/apiError";
import { ui } from "../../styles/editorial";
import { Loading } from "./bits";
import { GuardProvider } from "./guard";

const FIXED = [
  ["/admin", "Overview"],
  ["/admin/insights", "Insights"],
  ["/admin/people", "People"],
  ["/admin/access", "Admin access"],
  ["/admin/approvals", "Approvals"],
  ["/admin/audit", "Audit log"],
] as const;

function linkIsCurrent(to: string, path: string) {
  if (to === "/admin") return path === "/admin";
  if (to.startsWith("/admin/browse/")) {
    const group = to.split("/")[3];
    return path.startsWith(`/admin/browse/${group}/`);
  }
  return path === to || path.startsWith(`${to}/`);
}

function navClass(active: boolean) {
  return `flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap ${
    active ? "bg-[#6B0B0C] text-[#FFF8CA]" : "text-[#2D120D] hover:bg-white"
  }`;
}

export function AdminLayout() {
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const session = useQuery({ queryKey: ["admin", "session"], queryFn: fetchAdminSession, retry: false });
  const catalog = useQuery({
    queryKey: ["admin", "catalog"],
    queryFn: fetchCatalog,
    enabled: Boolean(session.data),
    retry: false,
  });

  useEffect(() => {
    if (session.data && !user?.is_platform_admin) void refreshUser().catch(() => undefined);
  }, [session.data, user?.is_platform_admin, refreshUser]);

  const links = [
    ...FIXED.map(([to, label]) => ({ to, label, badge: to === "/admin/approvals" ? session.data?.open_proposals ?? 0 : 0 })),
    ...(catalog.data?.groups ?? []).map((group) => ({
      to: `/admin/browse/${group.id}/${group.tables[0]?.name ?? ""}`,
      label: group.label,
      badge: 0,
    })),
  ];

  return (
    <div className={ui.page}>
      <Navbar />
      <div className={`${ui.main} max-w-[1400px]`}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B0B0C]">
              <Shield className="h-4 w-4" aria-hidden /> DevZ-Go admin
            </p>
            <h1 className={ui.title}>Control room</h1>
          </div>
          {session.data && (
            <p className="text-sm text-stone-600">
              Signed in as <span className="font-semibold text-[#2D120D]">{session.data.email}</span>
              <span className="ml-2 rounded-full bg-[#6B0B0C] px-2 py-0.5 text-xs font-semibold uppercase text-[#FFF8CA]">{session.data.role}</span>
            </p>
          )}
        </div>

        {session.isLoading && <Loading label="Opening the admin area" />}
        {session.isError && (
          <div className={`${ui.card} p-6`}>
            <h2 className={ui.heading}>The admin area is closed</h2>
            <p className="mt-2 text-sm text-stone-600">{getApiErrorMessage(session.error)}</p>
            <Link to="/home" className={`${ui.btn} ${ui.primary} mt-4 px-4 py-2 text-sm`}>Back home</Link>
          </div>
        )}

        {session.data && (
          <GuardProvider>
            <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
              <nav aria-label="Admin" className="mb-4 lg:mb-0">
                <div className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
                  {links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === "/admin"}
                      className={() => navClass(linkIsCurrent(link.to, location.pathname))}
                    >
                      <span>{link.label}</span>
                      {link.badge > 0 && (
                        <span className={`rounded-full px-1.5 text-xs ${linkIsCurrent(link.to, location.pathname) ? "bg-[#FFF8CA] text-[#6B0B0C]" : "bg-[#6B0B0C] text-[#FFF8CA]"}`}>
                          {link.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </nav>
              <Suspense fallback={<Loading />}>
                <Outlet />
              </Suspense>
            </div>
          </GuardProvider>
        )}
      </div>
    </div>
  );
}
