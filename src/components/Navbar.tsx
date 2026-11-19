import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  Compass,
  FileSearch,
  FolderPlus,
  Home,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Search,
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
import { BrandMark } from "./BrandMark";
import { fetchUnreadMessagesCount } from "../api/messages";
import { queryKeys } from "../api/queryKeys";
import { useAccount } from "../auth/account";
import { openDeveloperTour, openRecruiterTour } from "./tour/events";

interface NavbarProps {
  variant?: "default" | "editorial";
}

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/network", label: "Network", icon: Users },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/wrap", label: "Wrap", icon: CalendarDays },
  { to: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { to: "/profile", label: "Profile", icon: User },
];

/** Recruiters review work: no project building, imports, or wraps. */
const RECRUITER_NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/recruit", label: "Dashboard", icon: LayoutDashboard },
  { to: "/recruit/talent", label: "Find talent", icon: Search },
  { to: "/recruit/match", label: "Match", icon: FileSearch },
  { to: "/recruit/challenges", label: "Challenges", icon: ClipboardCheck },
  { to: "/explore", label: "Explore projects", icon: Compass },
  { to: "/recruit/shortlists", label: "Shortlists", icon: ListChecks },
  { to: "/recruit/inbox", label: "Inbox", icon: Inbox },
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
  const homePath = recruiter ? "/recruit" : "/home";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const queryClient = useQueryClient();
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: UNREAD_KEY,
    queryFn: fetchUnreadMessagesCount,
    enabled: Boolean(user),
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      setIsDesktop(mq.matches);
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
    `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive(path)
        ? dark
          ? "bg-white/10 text-amber-200 font-semibold"
          : "bg-maroon-100 dark:bg-maroon-950/60 text-maroon-800 dark:text-maroon-200 font-semibold"
        : dark
          ? "text-white/90 hover:bg-white/10"
          : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60"
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
              : "bg-cream-50/95 dark:bg-stone-900/95 border-amber-100/60 dark:border-stone-800"
          }`}
        >
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-4 space-y-1">
            {identity && (
              <p className={`px-3 pb-2 text-xs truncate ${dark ? "text-stone-400" : "text-stone-500 dark:text-stone-400"}`}>
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
              <Link to="/settings" onClick={close} aria-current={isActive("/settings") ? "page" : undefined} className={mobileLinkClass("/settings", dark)}>
                <Settings className="w-4 h-4 shrink-0" /> Settings
              </Link>
            </div>
            {!recruiter && (
              <Link
                to="/add-project"
                onClick={close}
                className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust text-white rounded-2xl text-sm font-semibold shadow-sm"
              >
                <FolderPlus className="w-4 h-4" /> Add project
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
                    : "bg-[#fced96] text-stone-900 hover:bg-amber-200"
              }`}
            >
              <CircleHelp className="w-4 h-4" /> Take the {recruiter ? "recruiter" : "developer"} tour
            </button>
            <div className={`mt-2 flex justify-end gap-3 pt-3 border-t ${dark ? "border-white/10" : "border-amber-100/60 dark:border-stone-800"}`}>
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
    const topLink = (to: string, label: string) => (
      <Link
        to={to}
        aria-current={isActive(to) ? "page" : undefined}
        className={`font-cursive text-xl md:text-[22px] font-semibold tracking-wide transition-all px-3.5 py-1 rounded-full ${
          isActive(to)
            ? "bg-[#6B0B0C] text-[#FFF8CA] shadow-xs"
            : "text-[#FFF8CA] hover:text-[#CDE3E8] hover:bg-white/10 drop-shadow-sm"
        }`}
      >
        {label}
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
          {/* Left: High-Contrast Brand Logo Pill (Always Visible on Any Background) */}
          <div className="flex items-center shrink-0">
            <Link
              to={homePath}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#2D120D]/90 hover:bg-[#6B0B0C] border border-[#CDE3E8]/35 shadow-lg backdrop-blur-md transition-all"
            >
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#FFF8CA] tracking-tight">
                DevZ
              </span>
              <span className="font-cursive italic font-bold text-[#CDE3E8] text-2xl sm:text-3xl -ml-0.5 leading-none">
                Go
              </span>
            </Link>
          </div>

          {/* Center: Network · Explore · Messages in Cursive Pill Bar */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D120D]/90 backdrop-blur-md border border-[#CDE3E8]/30 shadow-lg xl:absolute xl:left-1/2 xl:-translate-x-1/2">
            {recruiter ? (
              <>
                {topLink("/recruit", "Dashboard")}
                {topLink("/recruit/talent", "Find talent")}
                {topLink("/recruit/shortlists", "Shortlists")}
              </>
            ) : (
              <>
                {topLink("/network", "Network")}
                <span className="text-[#CDE3E8]/40 text-xs select-none" aria-hidden="true">·</span>
                {topLink("/explore", "Explore")}
                <span className="text-[#CDE3E8]/40 text-xs select-none" aria-hidden="true">·</span>
                {topLink("/messages", "Messages")}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[#FFF8CA]">
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
            <Link to="/profile" className={`group/nav ${iconLink}`} title="My account" aria-label="My account">
              <User className="nav-icon-profile w-5 h-5 drop-shadow-sm" />
            </Link>
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

  const primaryItems = items.slice(0, 4);
  const overflowItems = items.slice(4);

  const linkClass = (path: string) =>
    `flex items-center gap-2 whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-[#CBE4EE] text-[#284E45] font-semibold border border-[#FAF6EC]/50 shadow-2xs"
        : "text-[#FAF6EC]/85 hover:text-[#FAF6EC] hover:bg-white/10"
    }`;
  const iconButton = "p-2.5 text-[#FAF6EC]/85 hover:text-[#FAF6EC] hover:bg-white/10 rounded-xl transition-all";

  return (
    <nav
      aria-label="Main"
      className="fixed top-0 left-0 right-0 z-50 bg-[#284E45]/95 backdrop-blur-xl border-b border-[#E2F0CB]/25 transition-colors duration-300"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to={homePath} className="flex items-center gap-2 group shrink-0">
          <BrandMark />
          <span className="font-serif text-xl font-bold text-[#FAF6EC] tracking-tight group-hover:text-[#CBE4EE] transition-colors">
            DevZ
          </span>
          <span className="font-cursive italic text-2xl font-bold text-[#E2F0CB] -ml-1">
            Go
          </span>
        </Link>

        {/* Clean Upper Bar: Maximum 4 Primary Links + Vertical More Dropdown */}
        <div className="hidden lg:flex items-center gap-1">
          {primaryItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} data-tour={tourKey(to)} aria-current={isActive(to) ? "page" : undefined} className={linkClass(to)}>
              <Icon className="hidden xl:block w-4 h-4" />
              <span>{label}</span>
              {to === "/messages" && <UnreadBadge count={unreadMessages} />}
            </Link>
          ))}

          {overflowItems.length > 0 && (
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  overflowItems.some((item) => isActive(item.to))
                    ? "bg-[#CBE4EE] text-[#284E45] font-semibold"
                    : "text-[#FAF6EC]/85 hover:text-[#FAF6EC] hover:bg-white/10"
                }`}
              >
                <span>More</span>
                <span className="text-[10px]">▾</span>
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-2xl border-2 border-[#284E45] bg-[#FAF6EC] p-2 shadow-2xl space-y-1">
                  {overflowItems.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMoreOpen(false)}
                      data-tour={tourKey(to)}
                      aria-current={isActive(to) ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        isActive(to)
                          ? "bg-[#6B0B0C] text-[#FFF8CA]"
                          : "text-[#2D120D] hover:bg-[#CBE4EE]/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-1">
          {isDesktop && <NotificationsDropdown className="text-[#FAF6EC]/85 hover:bg-white/10 hover:text-[#FAF6EC]" />}
          {recruiter ? (
            <>
              {messagesButton("text-[#FAF6EC]/85 hover:bg-white/10 hover:text-[#FAF6EC]")}
            </>
          ) : (
            <Link
              to="/add-project"
              className="flex items-center gap-2 mx-1 px-4 py-2 bg-[#E2F0CB] hover:bg-[#CBE4EE] text-[#284E45] border border-[#284E45]/20 rounded-full text-sm font-bold shadow-sm transition-all"
            >
              <FolderPlus className="w-4 h-4 text-[#284E45]" />
              Add project
            </Link>
          )}
          <button
            type="button"
            onClick={startTour}
            data-tour="nav-help"
            className={`group/nav ${iconButton}`}
            aria-label={`Help: ${tourLabel}`}
            title={tourLabel}
          >
            <CircleHelp className="nav-icon-help w-4 h-4" />
          </button>
          <Link
            to="/profile"
            className={`group/nav ${iconButton}`}
            title="My account"
            aria-label="My account"
            aria-current={isActive("/profile") ? "page" : undefined}
          >
            <User className="nav-icon-profile w-4 h-4" />
          </Link>
          <Link to="/settings" aria-label="Settings" title="Settings" aria-current={isActive("/settings") ? "page" : undefined} className={`group/nav ${iconButton}`}>
            <Settings className="nav-icon-gear w-4 h-4" />
          </Link>
          <button type="button" onClick={handleLogout} className={`${iconButton} hover:text-coral-400`} aria-label="Log out" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="lg:hidden flex items-center gap-1">
          {messagesButton("text-[#FAF6EC]/85 hover:bg-white/10 hover:text-[#FAF6EC]")}
          {!isDesktop && <NotificationsDropdown className="text-[#FAF6EC]/85 hover:bg-white/10 hover:text-[#FAF6EC]" />}
          <button
            type="button"
            onClick={startTour}
            className={`group/nav ${iconButton}`}
            aria-label={`Help: ${tourLabel}`}
            title={tourLabel}
          >
            <CircleHelp className="nav-icon-help w-4 h-4" />
          </button>
          {menuButton("text-[#FAF6EC] hover:bg-white/10")}
        </div>
      </div>

      {mobileMenu(true)}
    </nav>
  );
}
