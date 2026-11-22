import { Suspense, useEffect, useMemo } from "react";
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
  { to: "/admin", label: "Home", section: "ops" },
  { to: "/admin/insights", label: "Insights", section: "ops" },
  { to: "/admin/people", label: "People", section: "ops" },
  { to: "/admin/clubs", label: "Clubs", section: "ops" },
  { to: "/admin/project-intelligence", label: "PI", section: "ops" },
  { to: "/admin/access", label: "Access", section: "ops" },
  { to: "/admin/approvals", label: "Approvals", section: "ops" },
  { to: "/admin/audit", label: "Audit", section: "ops" },
] as const;

const SECTION_LABEL: Record<string, string> = {
  ops: "Control",
  data: "Data",
};

function linkIsCurrent(to: string, path: string) {
  if (to === "/admin") return path === "/admin";
  if (to.startsWith("/admin/browse/")) {
    const group = to.split("/")[3];
    return path.startsWith(`/admin/browse/${group}/`);
  }
  return path === to || path.startsWith(`${to}/`);
}

function navClass(active: boolean) {
  return `flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
    active ? "bg-[#6B0B0C] text-[#FFF8CA]" : "text-[#2D120D]/90 hover:bg-white"
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

  const links = useMemo(() => {
    const ops = FIXED.map((item) => ({
      ...item,
      badge: item.to === "/admin/approvals" ? session.data?.open_proposals ?? 0 : 0,
    }));
    const data = (catalog.data?.groups ?? []).map((group) => ({
      to: `/admin/browse/${group.id}/${group.tables[0]?.name ?? ""}`,
      label: group.label,
      section: "data" as const,
      badge: 0,
    }));
    return [...ops, ...data];
  }, [catalog.data?.groups, session.data?.open_proposals]);

  const sections = ["ops", "data"] as const;

  return (
    <div className={ui.page}>
      <Navbar />
      <div className={`${ui.main} max-w-[1400px]`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6B0B0C] text-[#FFF8CA]">
              <Shield className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B0B0C]">Admin</p>
              <h1 className="font-serif text-2xl font-bold leading-none text-[#2D120D]">Control room</h1>
            </div>
          </div>
          {session.data && (
            <div className="flex items-center gap-2 rounded-full border border-[#DECDBA] bg-white/80 px-3 py-1.5">
              <span className="max-w-[200px] truncate text-xs font-medium text-[#2D120D]">{session.data.email}</span>
              <span className="rounded-full bg-[#6B0B0C] px-2 py-0.5 text-[10px] font-bold uppercase text-[#FFF8CA]">
                {session.data.role}
              </span>
            </div>
          )}
        </div>

        {session.isLoading && <Loading label="Opening the admin area" />}
        {session.isError && (
          <div className={`${ui.card} p-6`}>
            <h2 className={ui.heading}>Closed</h2>
            <p className="mt-2 text-sm text-stone-600">{getApiErrorMessage(session.error)}</p>
            <Link to="/home" className={`${ui.btn} ${ui.primary} mt-4 px-4 py-2 text-sm`}>
              Back home
            </Link>
          </div>
        )}

        {session.data && (
          <GuardProvider>
            <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-5">
              <nav aria-label="Admin" className="mb-4 lg:mb-0">
                <div className="rounded-2xl border border-[#DECDBA]/80 bg-gradient-to-b from-white to-[#FAF7EE] p-2 lg:sticky lg:top-24">
                  {sections.map((section) => {
                    const items = links.filter((link) => link.section === section);
                    if (items.length === 0) return null;
                    return (
                      <div key={section} className="mb-2 last:mb-0">
                        <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                          {SECTION_LABEL[section]}
                        </p>
                        <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                          {items.map((link) => (
                            <NavLink
                              key={link.to}
                              to={link.to}
                              end={link.to === "/admin"}
                              className={() => navClass(linkIsCurrent(link.to, location.pathname))}
                            >
                              <span>{link.label}</span>
                              {link.badge > 0 && (
                                <span
                                  className={`rounded-full px-1.5 text-[10px] ${
                                    linkIsCurrent(link.to, location.pathname)
                                      ? "bg-[#FFF8CA] text-[#6B0B0C]"
                                      : "bg-[#6B0B0C] text-[#FFF8CA]"
                                  }`}
                                >
                                  {link.badge}
                                </span>
                              )}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
