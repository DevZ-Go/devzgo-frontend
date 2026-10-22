import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays,
  Compass,
  FolderPlus,
  Home,
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
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { BrandMark } from "./BrandMark";
import { fetchUnreadMessagesCount } from "../api/messages";

interface NavbarProps {
  variant?: "default" | "editorial";
}

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/network", label: "Network", icon: Users },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/wrap", label: "Wrap", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: User },
];

function UnreadBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-maroon-700 text-[10px] font-bold text-white ${className}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const [unreadMessages, setUnreadMessages] = useState(0);
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
    let cancelled = false;
    async function checkMessages() {
      try {
        const count = await fetchUnreadMessagesCount();
        if (!cancelled) setUnreadMessages(count);
      } catch {
        // Ignore
      }
    }
    checkMessages();
    const handleUpdate = () => {
      checkMessages();
    };
    window.addEventListener("devzgo:messages-updated", handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("devzgo:messages-updated", handleUpdate);
    };
  }, []);

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
    navigate("/login", { replace: true });
  }

  const isActive = (path: string) => {
    const here = location.pathname;
    if (path === "/home") return here === "/home" || here === "/";
    if (path === "/profile") return here === "/profile";
    return here === path || here.startsWith(`${path}/`);
  };

  const close = () => setMobileOpen(false);
  const identity = user?.email ?? user?.username;

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
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={close} aria-current={isActive(to) ? "page" : undefined} className={mobileLinkClass(to, dark)}>
                  <Icon className="w-4 h-4 shrink-0" /> {label}
                  {to === "/messages" && <UnreadBadge count={unreadMessages} className="ml-auto" />}
                </Link>
              ))}
              <Link to="/settings" onClick={close} aria-current={isActive("/settings") ? "page" : undefined} className={mobileLinkClass("/settings", dark)}>
                <Settings className="w-4 h-4 shrink-0" /> Settings
              </Link>
            </div>
            <Link
              to="/add-project"
              onClick={close}
              className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust text-white rounded-2xl text-sm font-semibold shadow-sm"
            >
              <FolderPlus className="w-4 h-4" /> Add project
            </Link>
            <div className={`mt-2 flex items-center justify-between gap-3 pt-3 border-t ${dark ? "border-white/10" : "border-amber-100/60 dark:border-stone-800"}`}>
              <ThemeToggle variant="pill" />
              <button
                type="button"
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  dark ? "text-red-300 hover:bg-white/10" : "text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-950/30"
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
        className="text-white/90 hover:text-white drop-shadow-sm tracking-wide transition-colors font-sans hover:underline underline-offset-4 text-sm"
      >
        {label}
      </Link>
    );
    const iconLink = "hidden lg:inline-flex p-1.5 rounded-full bg-stone-950/80 text-white shadow-sm ring-1 ring-white/20 hover:bg-stone-950 transition-all";

    return (
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          solid ? "bg-black/70 backdrop-blur-md border-b border-white/10 shadow-xl py-0" : "bg-transparent py-1"
        }`}
      >
        <div
          className={`transition-all duration-300 overflow-hidden ${
            solid ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
          } bg-black/25 backdrop-blur-xs text-[11px] text-white/80 text-center py-1 tracking-wider uppercase font-medium`}
        >
          DevZ-Go — Community Showcase
        </div>

        <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 py-3.5 flex items-center justify-between relative" aria-label="Main">
          <div className="hidden lg:flex items-center gap-6 font-medium">
            {topLink("/network", "Network")}
            {topLink("/explore", "Explore")}
            {topLink("/messages", unreadMessages > 0 ? `Messages (${unreadMessages})` : "Messages")}
          </div>

          <div className="lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            <Link
              to="/home"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="font-serif text-2xl md:text-3xl text-white tracking-tight drop-shadow-md hover:opacity-90 transition-opacity"
            >
              DevZ-Go
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-white/90">
            <div className="hidden lg:block">
              <ThemeToggle variant="editorial" />
            </div>
            <Link
              to="/wrap"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide transition-all"
              title="Monthly Wrap"
            >
              <CalendarDays className="w-3.5 h-3.5 text-amber-300" />
              <span>Wrap</span>
            </Link>
            <NotificationsDropdown className="bg-stone-950/80 text-white ring-1 ring-white/20 hover:bg-stone-950 hover:text-white" />
            <Link to="/profile" className={iconLink} title="My account" aria-label="My account">
              <User className="w-5 h-5 drop-shadow-sm" />
            </Link>
            <Link to="/settings" className={iconLink} title="Settings" aria-label="Settings">
              <Settings className="w-5 h-5 drop-shadow-sm" />
            </Link>
            <button type="button" onClick={handleLogout} className={`${iconLink} hover:text-red-300`} title="Log out" aria-label="Log out">
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
    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
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
        <Link to="/home" className="flex items-center gap-2.5 group shrink-0">
          <BrandMark />
          <span className="font-serif text-xl font-normal text-stone-900 dark:text-stone-100 tracking-tight group-hover:text-maroon-700 dark:group-hover:text-maroon-300 transition-colors">
            DevZ-Go
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} aria-current={isActive(to) ? "page" : undefined} className={linkClass(to)}>
              <Icon className="hidden xl:block w-4 h-4" />
              <span>{label}</span>
              {to === "/messages" && <UnreadBadge count={unreadMessages} />}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-1">
          {isDesktop && <NotificationsDropdown className="text-stone-800 hover:bg-stone-200/80 hover:text-maroon-800" />}
          <Link
            to="/add-project"
            className="flex items-center gap-2 mx-1 px-4 py-2.5 bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust hover:from-maroon-900 hover:to-autumn-amber text-white rounded-2xl text-sm font-semibold shadow-md shadow-maroon-800/20 hover:shadow-lg hover:shadow-maroon-800/30 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            Add project
          </Link>
          <ThemeToggle variant="ghost" />
          <Link to="/settings" aria-label="Settings" title="Settings" aria-current={isActive("/settings") ? "page" : undefined} className={iconButton}>
            <Settings className="w-4 h-4" />
          </Link>
          <button type="button" onClick={handleLogout} className={`${iconButton} hover:text-coral-500`} aria-label="Log out" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="lg:hidden flex items-center gap-1">
          {!isDesktop && <NotificationsDropdown className="text-stone-800 hover:bg-stone-200/80 hover:text-maroon-800" />}
          {menuButton("text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800")}
        </div>
      </div>

      {mobileMenu(false)}
    </nav>
  );
}
