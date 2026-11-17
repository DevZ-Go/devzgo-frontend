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
    const scroller: HTMLElement | Window = node ?? window;
    const handleScroll = () => {
      const top = scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop;
      setIsScrolled(top > 40);
    };
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [variant]);

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
            ? "bg-[#fced96] text-stone-900 shadow-xs"
            : "text-[#f8f6f0] hover:text-[#fced96] hover:bg-white/10 drop-shadow-sm"
        }`}
      >
        {label}
      </Link>
    );
    const iconLink = "hidden lg:inline-flex p-1.5 rounded-full bg-stone-950/80 text-white shadow-sm ring-1 ring-white/20 hover:bg-stone-950 transition-all";

    return (
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          solid ? "bg-maroon-950/80 backdrop-blur-md border-b border-white/10 shadow-xl py-0" : "bg-transparent py-1"
        }`}
      >
        <div
          className={`transition-all duration-300 overflow-hidden ${
            solid ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
          } bg-black/25 backdrop-blur-xs text-[11px] text-white/85 text-center py-1 tracking-[0.2em] uppercase font-medium`}
        >
          DevZ-Go — Community Showcase
        </div>

        <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 py-3 flex items-center justify-between relative" aria-label="Main">
          {/* Left: Brand Logo */}
          <div className="flex items-center">
            <Link
              to={homePath}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 font-serif text-2xl md:text-3xl font-semibold text-[#f8f6f0] tracking-tight drop-shadow-md hover:opacity-90 transition-opacity"
            >
              <span>DevZ</span>
              <span className="font-cursive italic font-bold text-[#fced96] text-3xl md:text-[34px] -ml-1">
                Go
              </span>
            </Link>
          </div>

          {/* Center: Network · Explore · Messages in Cursive Pill Bar */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/15 shadow-lg lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            {recruiter ? (
              <>
                {topLink("/recruit", "Dashboard")}
                {topLink("/recruit/talent", "Find talent")}
                {topLink("/recruit/shortlists", "Shortlists")}
              </>
            ) : (
              <>
                {topLink("/network", "Network")}
                <span className="text-[#fced96]/50 text-xs select-none">✦</span>
                {topLink("/explore", "Explore")}
                <span className="text-[#fced96]/50 text-xs select-none">✦</span>
                {topLink("/messages", "Messages")}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-white/90">
            {!recruiter && (
              <Link
                to="/wrap"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide transition-all"
                title="Monthly Wrap"
              >
                <CalendarDays className="w-3.5 h-3.5 text-amber-300" />
                <span>Wrap</span>
              </Link>
            )}
            {messagesButton("bg-stone-950/80 text-white ring-1 ring-white/20 hover:bg-stone-950 hover:text-white")}
            <NotificationsDropdown className="bg-stone-950/80 text-white ring-1 ring-white/20 hover:bg-stone-950 hover:text-white" />
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
            {menuButton("bg-stone-950/80 text-white ring-1 ring-white/20 hover:bg-stone-950")}
          </div>
        </nav>

        {mobileMenu(true)}
      </header>
    );
  }

  const linkClass = (path: string) =>
    `flex items-center gap-2 whitespace-nowrap px-2 xl:px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-maroon-100 dark:bg-maroon-950/60 text-maroon-800 dark:text-maroon-200 font-semibold"
        : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60"
    }`;
  const iconButton = "p-2.5 text-stone-800 dark:text-stone-100 hover:text-maroon-800 hover:bg-stone-200/80 dark:hover:bg-stone-800 rounded-xl transition-all";

  return (
    <nav
      aria-label="Main"
      className="fixed top-0 left-0 right-0 z-50 bg-[#f8f6f0]/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-amber-200/40 dark:border-stone-800 transition-colors duration-300"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to={homePath} className="flex items-center gap-2.5 group shrink-0">
          <BrandMark />
          <span className="font-serif text-xl font-normal text-stone-900 dark:text-stone-100 tracking-tight group-hover:text-maroon-700 dark:group-hover:text-maroon-300 transition-colors">
            DevZ-Go
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} data-tour={tourKey(to)} aria-current={isActive(to) ? "page" : undefined} className={linkClass(to)}>
              <Icon className="hidden xl:block w-4 h-4" />
              <span>{label}</span>
              {to === "/messages" && <UnreadBadge count={unreadMessages} />}
            </Link>
          ))}
        </div>

          <div className="hidden lg:flex items-center gap-1">
          {isDesktop && <NotificationsDropdown className="text-stone-800 hover:bg-stone-200/80 hover:text-maroon-800 dark:text-stone-100 dark:hover:bg-stone-800 dark:hover:text-white" />}
          {recruiter && messagesButton("text-stone-800 hover:bg-stone-200/80 hover:text-maroon-800 dark:text-stone-100 dark:hover:bg-stone-800 dark:hover:text-white")}
          {!recruiter && (
            <Link
              to="/add-project"
              className="flex items-center gap-2 mx-1 px-4 py-2.5 bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust hover:from-maroon-900 hover:to-autumn-amber text-white rounded-2xl text-sm font-semibold shadow-md shadow-maroon-800/20 hover:shadow-lg hover:shadow-maroon-800/30 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
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
          <button
            type="button"
            onClick={handleLogout}
            className="p-2.5 text-stone-800 dark:text-stone-100 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-xl transition-all"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="lg:hidden flex items-center gap-1">
          {messagesButton("text-stone-800 hover:bg-stone-200/80 dark:text-stone-100 dark:hover:bg-stone-800")}
          {!isDesktop && <NotificationsDropdown className="text-stone-800 hover:bg-stone-200/80 hover:text-maroon-800 dark:text-stone-100 dark:hover:bg-stone-800 dark:hover:text-white" />}
          <button
            type="button"
            onClick={startTour}
            className={`group/nav ${iconButton}`}
            aria-label={`Help: ${tourLabel}`}
            title={tourLabel}
          >
            <CircleHelp className="nav-icon-help w-4 h-4" />
          </button>
          {menuButton("text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800")}
        </div>
      </div>

      {mobileMenu(false)}
    </nav>
  );
}
