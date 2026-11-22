import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  Compass,
  FileSearch,
  Home,
  Inbox,
  LayoutDashboard,
  ListChecks,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trophy,
  UsersRound,
  User,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { DevZLockup } from "./BrandMark";
import { fetchUnreadMessagesCount } from "../api/messages";
import { fetchMyProfile } from "../api/profiles";
import { resolveApiAssetUrl } from "../api/config";
import { queryKeys } from "../api/queryKeys";
import { useAccount } from "../auth/account";
import { openDeveloperTour, openRecruiterTour } from "./tour/events";

interface NavbarProps {
  variant?: "default" | "editorial";
}

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/network", label: "Network", icon: Users },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/home", label: "About Us", icon: Home },
];

/** Recruiters review work: no project building, imports, or wraps. */
const RECRUITER_NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/recruit", label: "Dashboard", icon: LayoutDashboard },
  { to: "/recruit/talent", label: "Find talent", icon: Search },
  { to: "/recruit/match", label: "Match", icon: FileSearch },
  { to: "/recruit/challenges", label: "Challenges", icon: ClipboardCheck },
  { to: "/explore", label: "Explore projects", icon: Compass },
];

const UNREAD_KEY = [...queryKeys.messages, "unread-count"] as const;

const tourKey = (to: string) => `nav-${to.split("/").filter(Boolean).pop() ?? "home"}`;

function UnreadBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-maroon-700 text-[10px] font-bold text-white ${className}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { recruiter } = useAccount();
  const items = recruiter ? RECRUITER_NAV : NAV_ITEMS;
  const homePath = recruiter ? "/recruit" : "/network";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: UNREAD_KEY,
    queryFn: fetchUnreadMessagesCount,
    enabled: Boolean(user),
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const displayName = String(user?.name || user?.username || user?.email || "User");
  const userInitials = useMemo(() => {
    const raw = String(user?.name || user?.username || user?.email || "User");
    const cleaned = raw.replace(/^@/, "").trim();
    if (!cleaned) return "DV";
    const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleaned.slice(0, 2).toUpperCase();
  }, [user]);

  const mine = useQuery({
    queryKey: ["my-profile-photo", user?.id ?? ""],
    queryFn: fetchMyProfile,
    enabled: Boolean(user),
    staleTime: 30_000,
  });
  const avatarUrl = mine.data?.avatarUrl || resolveApiAssetUrl(String(user?.avatar_url || user?.avatar || ""));

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    const queryKey = UNREAD_KEY;
    const onMessages = () => void queryClient.invalidateQueries({ queryKey }, { cancelRefetch: false });
    const onRead = () => void queryClient.invalidateQueries({ queryKey });
    window.addEventListener("devzgo:messages-updated", onMessages);
    window.addEventListener("devzgo:unread-changed", onRead);
    return () => {
      window.removeEventListener("devzgo:messages-updated", onMessages);
      window.removeEventListener("devzgo:unread-changed", onRead);
    };
  }, [queryClient]);

  useEffect(() => {
    if (variant !== "editorial") return;
    let node = headerRef.current?.parentElement ?? null;
    while (node) {
      const overflow = getComputedStyle(node).overflowY;
      if (overflow === "auto" || overflow === "scroll") break;
      node = node.parentElement;
    }
    const handleScroll = () => {
      const windowTop = window.scrollY || document.documentElement.scrollTop || 0;
      const nodeTop = node ? node.scrollTop : 0;
      setIsScrolled(Math.max(windowTop, nodeTop) > 24);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    node?.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      node?.removeEventListener("scroll", handleScroll);
    };
  }, [variant]);

  useEffect(() => {
    if (!moreOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [moreOpen]);

  function handleLogout() {
    setMobileOpen(false);
    logout();
    window.location.replace("/login");
  }

  const isActive = (path: string) => {
    const here = location.pathname;
    if (path === "/home") return here === "/home" || here === "/";
    if (path === "/recruit") return here === "/recruit";
    if (path === "/profile") return here === "/profile";
    return here === path || here.startsWith(`${path}/`);
  };

  const close = () => setMobileOpen(false);
  const identity = user?.email ?? user?.username;
  const startTour = () => {
    if (recruiter) openRecruiterTour();
    else openDeveloperTour();
  };
  const tourLabel = recruiter ? "Recruiter tour" : "Developer tour";

  const mobileLinkClass = (path: string, dark: boolean) =>
    `flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive(path)
        ? dark
          ? "bg-white/10 text-amber-200 font-semibold"
          : "bg-[#780D18] text-white font-semibold shadow-xs"
        : dark
          ? "text-white/90 hover:bg-white/10"
          : "text-[#3B1812] hover:bg-[#EFE5D8]"
    }`;

  const mobileMenu = (dark: boolean) => (
    <AnimatePresence>
      {mobileOpen && (
        <motion.div
          id="mobile-menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`lg:hidden overflow-y-auto max-h-[calc(100dvh-4rem)] backdrop-blur-xl border-b ${
            dark
              ? "bg-stone-950/95 border-white/15 text-white"
              : "bg-[#F7F2E8]/98 dark:bg-stone-900/98 border-[#DECDBA] dark:border-stone-800 text-[#3B1812]"
          }`}
        >
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-4 space-y-1">
            {identity && (
              <p className={`px-3 pb-2 text-xs truncate ${dark ? "text-stone-400" : "text-[#3B1812]/70 dark:text-stone-400"}`}>
                Signed in as {String(identity)}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {items.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={close} data-tour={`m-${tourKey(to)}`} aria-current={isActive(to) ? "page" : undefined} className={mobileLinkClass(to, dark)}>
                  <Icon className="w-4 h-4 shrink-0" /> {label}
                  {to === "/messages" && <UnreadBadge count={unreadMessages} className="ml-auto" />}
                </Link>
              ))}
              {user?.is_platform_admin && (
                <Link to="/admin" onClick={close} aria-current={isActive("/admin") ? "page" : undefined} className={mobileLinkClass("/admin", dark)}>
                  <Shield className="w-4 h-4 shrink-0" /> Admin
                </Link>
              )}
              {!recruiter && (
                <>
                  <Link to="/assessments" onClick={close} className={mobileLinkClass("/assessments", dark)}>
                    <Trophy className="w-4 h-4 shrink-0" /> Assessments
                  </Link>
                  <Link to="/wrap" onClick={close} className={mobileLinkClass("/wrap", dark)}>
                    <CalendarDays className="w-4 h-4 shrink-0" /> Monthly Wrap
                  </Link>
                  <Link to="/network?tab=collaborations" onClick={close} className={mobileLinkClass("/network?tab=collaborations", dark)}>
                    <Users className="w-4 h-4 shrink-0" /> Collaborations
                  </Link>
                  <Link to="/profile?tab=activity" onClick={close} className={mobileLinkClass("/profile?tab=activity", dark)}>
                    <Activity className="w-4 h-4 shrink-0" /> Activity Log
                  </Link>
                </>
              )}
                  <Link to="/about-developers" onClick={close} aria-current={isActive("/about-developers") ? "page" : undefined} className={mobileLinkClass("/about-developers", dark)}>
                <UsersRound className="w-4 h-4 shrink-0" /> About us
              </Link>
              <Link to="/settings" onClick={close} aria-current={isActive("/settings") ? "page" : undefined} className={mobileLinkClass("/settings", dark)}>
                <Settings className="w-4 h-4 shrink-0" /> Settings
              </Link>
            </div>
            {!recruiter && (
              <Link
                to="/add-project"
                onClick={close}
                className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#780D18] hover:bg-[#5C0A12] text-white rounded-2xl text-sm font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Project
              </Link>
            )}
            <button
              type="button"
              onClick={() => { close(); startTour(); }}
              className={`mt-2 flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl text-sm font-semibold ${
                recruiter
                  ? "bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust text-white shadow-sm"
                  : dark
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "bg-[#EFE5D8] text-[#3B1812] hover:bg-[#E5DACB]"
              }`}
            >
              <CircleHelp className="w-4 h-4" /> Take the {recruiter ? "recruiter" : "developer"} tour
            </button>
            <div className={`mt-2 flex justify-end gap-3 pt-3 border-t ${dark ? "border-white/10" : "border-[#DECDBA] dark:border-stone-800"}`}>
              <button
                type="button"
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  dark ? "text-white/90 hover:bg-white/10 hover:text-red-400" : "text-stone-700 dark:text-stone-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                }`}
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const messagesButton = (className: string) => (
    <Link
      to="/messages"
      aria-label={unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : "Messages"}
      title="Messages"
      aria-current={isActive("/messages") ? "page" : undefined}
      className={`group/nav relative rounded-xl p-2 transition ${className}`}
    >
      <MessageSquare className="nav-icon-messages h-5 w-5 transition-colors group-hover/nav:text-[#f5d76e]" />
      {unreadMessages > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d4a017] px-1 text-[10px] font-bold text-stone-950 ring-2 ring-white dark:ring-stone-900">
          {unreadMessages > 99 ? "99+" : unreadMessages}
        </span>
      )}
    </Link>
  );

  const menuButton = (className: string) => (
    <button
      type="button"
      onClick={() => setMobileOpen((v) => !v)}
      className={`lg:hidden p-2 rounded-xl transition-colors ${className}`}
      aria-label={mobileOpen ? "Close menu" : "Open menu"}
      aria-expanded={mobileOpen}
      aria-controls="mobile-menu"
    >
      {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  );

  if (variant === "editorial") {
    const solid = isScrolled || mobileOpen;
    const topLink = (to: string, label: string, Icon?: LucideIcon) => (
      <Link
        to={to}
        aria-current={isActive(to) ? "page" : undefined}
        className={`inline-flex items-center justify-center gap-2 font-sans text-sm md:text-[15px] font-semibold tracking-normal transition-all px-4 py-1.5 rounded-full min-w-[120px] ${
          isActive(to)
            ? "bg-[#6B0B0C] text-[#FFF8CA] shadow-xs"
            : "text-[#FFF8CA] hover:text-[#CDE3E8] hover:bg-white/10 drop-shadow-sm"
        }`}
      >
        {Icon && <Icon className="w-4 h-4 md:w-[18px] md:h-[18px] shrink-0" />}
        <span className="leading-none">{label}</span>
      </Link>
    );
    const iconLink = "hidden lg:inline-flex p-1.5 rounded-full bg-[#2D120D]/80 text-[#FFF8CA] shadow-sm ring-1 ring-[#FFF8CA]/25 hover:bg-[#6B0B0C] transition-all";

    return (
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          solid ? "bg-[#2D120D]/95 backdrop-blur-md border-b border-[#FFF8CA]/20 shadow-xl py-0" : "bg-transparent py-1"
        }`}
      >
        <div
          className={`transition-all duration-300 overflow-hidden ${
            solid ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
          } bg-[#2D120D]/80 backdrop-blur-xs text-[11px] text-[#FFF8CA]/90 text-center py-1 tracking-[0.2em] uppercase font-medium`}
        >
          DevZ-Go — Community Showcase
        </div>

        <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 py-3 flex items-center justify-between gap-3 relative" aria-label="Main">
          <div className="flex items-center shrink-0">
            <Link
              to={homePath}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group inline-flex items-center drop-shadow-md"
            >
              <DevZLockup />
            </Link>
          </div>

          {/* Center: Network · Explore · Me in Cursive Pill Bar */}
          <div className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-full bg-[#2D120D]/90 backdrop-blur-md border border-[#CDE3E8]/30 shadow-lg xl:absolute xl:left-1/2 xl:-translate-x-1/2">
            {recruiter ? (
              <>
                {topLink("/recruit", "Dashboard", LayoutDashboard)}
                {topLink("/recruit/talent", "Find talent", Search)}
                {topLink("/recruit/shortlists", "Shortlists", ListChecks)}
              </>
            ) : (
              <>
                {topLink("/network", "Network", Users)}
                {topLink("/explore", "Explore", Search)}
                {topLink("/profile", "Me", User)}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[#FFF8CA]">
            {user?.is_platform_admin && (
              <Link
                to="/admin"
                className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF8CA] text-[#6B0B0C] text-xs font-semibold tracking-wide transition-all shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
            {!recruiter && (
              <Link
                to="/wrap"
                className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#6B0B0C] hover:bg-[#2D120D] text-[#FFF8CA] border border-[#FFF8CA]/35 text-xs font-semibold tracking-wide transition-all shadow-xs"
                title="Monthly Wrap"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#CDE3E8]" />
                <span>Wrap</span>
              </Link>
            )}
            {messagesButton("bg-[#2D120D]/80 text-[#FFF8CA] ring-1 ring-[#FFF8CA]/25 hover:bg-[#6B0B0C] hover:text-[#FFF8CA]")}
            <NotificationsDropdown className="bg-[#2D120D]/80 text-[#FFF8CA] ring-1 ring-[#FFF8CA]/25 hover:bg-[#6B0B0C] hover:text-[#FFF8CA]" />
            <button
              type="button"
              onClick={startTour}
              data-tour="nav-help"
              className={`group/nav ${iconLink}`}
              aria-label={`Help: ${tourLabel}`}
              title={tourLabel}
            >
              <CircleHelp className="nav-icon-help w-5 h-5 drop-shadow-sm" />
            </button>
            <Link to="/settings" className={`group/nav ${iconLink}`} title="Settings" aria-label="Settings">
              <Settings className="nav-icon-gear w-5 h-5 drop-shadow-sm" />
            </Link>
            <button type="button" onClick={handleLogout} className={`${iconLink} hover:text-red-400`} title="Log out" aria-label="Log out">
              <LogOut className="w-5 h-5 drop-shadow-sm" />
            </button>
            {menuButton("bg-[#2D120D]/80 text-[#FFF8CA] ring-1 ring-[#FFF8CA]/25 hover:bg-[#6B0B0C]")}
          </div>
        </nav>

        {mobileMenu(true)}
      </header>
    );
  }

  const isMoreActive =
    isActive("/assessments") ||
    isActive("/wrap") ||
    isActive("/about-developers") ||
    location.pathname.startsWith("/network?tab=collaborations") ||
    location.search.includes("tab=collaborations") ||
    (location.pathname === "/profile" && location.search.includes("tab=activity")) ||
    isActive("/activity") ||
    isActive("/settings");

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed top-0 left-0 right-0 z-50 bg-[#2D120D]/95 backdrop-blur-md border-b border-[#FFF8CA]/15 shadow-lg transition-colors duration-300"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-2.5 flex items-center justify-between gap-3">
          {/* Left: DevZ-Go lockup (dark-surface tone) */}
          <Link
            to={homePath}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex items-center shrink-0"
            title="DevZ-Go Home"
            aria-label="DevZ-Go Home"
          >
            <DevZLockup />
          </Link>

          {/* Center: Home · Explore · Network · Messages · More (with Icons & Labels) */}
          <div className="hidden lg:flex items-center gap-1.5">
            {items.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  data-tour={tourKey(to)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-sans text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-[#6B0B0C] text-[#FFF8CA] shadow-xs ring-1 ring-[#FFF8CA]/20"
                      : "text-[#FFF8CA]/85 hover:text-[#FFF8CA] hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                  {to === "/messages" && <UnreadBadge count={unreadMessages} />}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full font-sans text-sm font-semibold transition-all ${
                  isMoreActive
                    ? "bg-[#6B0B0C] text-[#FFF8CA] shadow-xs ring-1 ring-[#FFF8CA]/20"
                    : "text-[#FFF8CA]/85 hover:text-[#FFF8CA] hover:bg-white/10"
                }`}
              >
                <span>More</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-2xl border border-[#DECDBA] bg-[#FAF6EC] dark:bg-[#2D120D] dark:border-[#6B0B0C] p-2 shadow-2xl space-y-1 text-[#3B1812] dark:text-[#FFF8CA]">
                  {user?.is_platform_admin && (
                    <Link
                      to="/admin"
                      onClick={() => setMoreOpen(false)}
                      aria-current={isActive("/admin") ? "page" : undefined}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-[#EFE5D8] dark:hover:bg-[#3D1812] transition-colors"
                    >
                      <Shield className="w-4 h-4 text-[#780D18] dark:text-[#E2A5A8]" />
                      <span>Admin</span>
                    </Link>
                  )}
                  {recruiter ? (
                    <>
                      <Link
                        to="/recruit/shortlists"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-[#EFE5D8] dark:hover:bg-[#3D1812] transition-colors"
                      >
                        <ListChecks className="w-4 h-4 text-[#780D18] dark:text-[#E2A5A8]" />
                        <span>Shortlists</span>
                      </Link>
                      <Link
                        to="/recruit/inbox"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-[#EFE5D8] dark:hover:bg-[#3D1812] transition-colors"
                      >
                        <Inbox className="w-4 h-4 text-[#780D18] dark:text-[#E2A5A8]" />
                        <span>Inbox</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/assessments"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-[#EFE5D8] dark:hover:bg-[#3D1812] transition-colors"
                      >
                        <Trophy className="w-4 h-4 text-[#780D18] dark:text-[#E2A5A8]" />
                        <span>Assessments</span>
                      </Link>
                      <Link
                        to="/wrap"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-[#EFE5D8] dark:hover:bg-[#3D1812] transition-colors"
                      >
                        <CalendarDays className="w-4 h-4 text-[#780D18] dark:text-[#E2A5A8]" />
                        <span>Monthly Wrap</span>
                      </Link>
                      <Link
                        to="/network?tab=collaborations"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-[#EFE5D8] dark:hover:bg-[#3D1812] transition-colors"
                      >
                        <Users className="w-4 h-4 text-[#780D18] dark:text-[#E2A5A8]" />
                        <span>Collaborations</span>
                      </Link>
                      <Link
                        to="/profile?tab=activity"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-[#EFE5D8] dark:hover:bg-[#3D1812] transition-colors"
                      >
                        <Activity className="w-4 h-4 text-[#780D18] dark:text-[#E2A5A8]" />
                        <span>Activity Log</span>
                      </Link>
                    </>
                  )}
                  <div className="my-1 border-t border-[#DECDBA]/60 dark:border-white/10" />
                  <Link
                    to="/about-developers"
                    onClick={() => setMoreOpen(false)}
                    aria-current={isActive("/about-developers") ? "page" : undefined}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-[#EFE5D8] dark:hover:bg-[#3D1812] transition-colors"
                  >
                    <UsersRound className="w-4 h-4 text-[#780D18] dark:text-[#E2A5A8]" />
                    <span>About us</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#EFE5D8] dark:hover:bg-[#3D1812] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setMoreOpen(false); startTour(); }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#EFE5D8] dark:hover:bg-[#3D1812] transition-colors text-left"
                  >
                    <CircleHelp className="w-4 h-4" />
                    <span>Take {recruiter ? "Recruiter" : "Developer"} Tour</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: + Add Project · Search · Notifications · User Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {!recruiter && (
              <Link
                to="/add-project"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-[#6B0B0C] hover:bg-[#8B1A1E] text-[#FFF8CA] ring-1 ring-[#FFF8CA]/25 rounded-full font-sans text-sm font-bold shadow-xs transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Project</span>
              </Link>
            )}

            {/* Circular Search Button */}
            <Link
              to="/explore"
              className="p-2 rounded-full border border-[#FFF8CA]/25 text-[#FFF8CA] hover:bg-[#6B0B0C] hover:border-[#FFF8CA]/40 transition-all flex items-center justify-center h-9 w-9"
              title="Search projects and developers"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </Link>

            {/* Circular Notifications Button */}
            <NotificationsDropdown className="p-2 rounded-full border border-[#FFF8CA]/25 text-[#FFF8CA] hover:bg-[#6B0B0C] hover:border-[#FFF8CA]/40 transition-all flex items-center justify-center h-9 w-9" />

            {/* Circular User Avatar */}
            <Link
              to="/profile"
              className="rounded-full overflow-hidden border border-[#FFF8CA]/35 hover:border-[#FFF8CA] transition-all flex items-center justify-center h-9 w-9 bg-[#6B0B0C] text-[#FFF8CA] text-xs font-serif font-bold shadow-xs hover:scale-105"
              title={displayName}
              aria-label="My Profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{userInitials}</span>
              )}
            </Link>

            {/* Mobile Hamburger toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-full border border-[#FFF8CA]/25 text-[#FFF8CA] hover:bg-[#6B0B0C] transition-colors h-9 w-9 flex items-center justify-center"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileMenu(true)}
      </nav>

      {/* Mobile Bottom Navigation Bar (Social App - Reference Image) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F7F2E8]/95 dark:bg-[#20100C]/95 backdrop-blur-md border-t border-[#DECDBA] dark:border-[#3D1812] px-3 py-1.5 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <Link
          to="/home"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            isActive("/home")
              ? "text-[#780D18] font-bold dark:text-[#FFF8CA]"
              : "text-[#3B1812]/75 hover:text-[#780D18] dark:text-[#FFF8CA]/70"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>
        <Link
          to="/explore"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            isActive("/explore")
              ? "text-[#780D18] font-bold dark:text-[#FFF8CA]"
              : "text-[#3B1812]/75 hover:text-[#780D18] dark:text-[#FFF8CA]/70"
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">Explore</span>
        </Link>
        <Link
          to="/network"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            isActive("/network")
              ? "text-[#780D18] font-bold dark:text-[#FFF8CA]"
              : "text-[#3B1812]/75 hover:text-[#780D18] dark:text-[#FFF8CA]/70"
          }`}
        >
          <div className={`p-1 rounded-full ${isActive("/network") ? "bg-[#780D18] text-white" : ""}`}>
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px]">Network</span>
        </Link>
        <Link
          to="/messages"
          className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            isActive("/messages")
              ? "text-[#780D18] font-bold dark:text-[#FFF8CA]"
              : "text-[#3B1812]/75 hover:text-[#780D18] dark:text-[#FFF8CA]/70"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessages > 0 && <UnreadBadge count={unreadMessages} className="absolute top-0 right-2" />}
          <span className="text-[10px]">Messages</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            mobileOpen
              ? "text-[#780D18] font-bold dark:text-[#FFF8CA]"
              : "text-[#3B1812]/75 hover:text-[#780D18] dark:text-[#FFF8CA]/70"
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>
    </>
  );
}
