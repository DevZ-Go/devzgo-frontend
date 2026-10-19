import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  FolderPlus,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Search,
  MessageSquare,
  Users,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { fetchUnreadMessagesCount } from "../api/messages";

interface NavbarProps {
  variant?: "default" | "editorial";
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 768px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const [unreadMessages, setUnreadMessages] = useState(0);

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

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const isActive = (path: string) => {
    if (path === "/home" && (location.pathname === "/home" || location.pathname === "/")) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (variant !== "editorial") return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [variant]);

  // Editorial Navbar matching the reference design layout
  if (variant === "editorial") {
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-black/70 backdrop-blur-md border-b border-white/10 shadow-xl py-0"
            : "bg-transparent py-1"
        }`}
      >
        {/* Subtle top announcement bar */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isScrolled ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
          } bg-black/25 backdrop-blur-xs text-[11px] text-white/80 text-center py-1 tracking-wider uppercase font-medium`}
        >
          DevZ-Go — Community Showcase
        </div>

        <nav className="max-w-[1400px] mx-auto px-6 md:px-12 py-3.5 flex items-center justify-between relative">
          {/* Top Left: Links (Explore & About Us / Submit) */}
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link
              to="/explore"
              className="text-white/90 hover:text-white drop-shadow-sm tracking-wide transition-colors font-sans hover:underline underline-offset-4 text-xs sm:text-sm"
            >
              Explore
            </Link>
            <Link
              to="/add-project"
              className="text-white/90 hover:text-white drop-shadow-sm tracking-wide transition-colors font-sans hover:underline underline-offset-4 text-xs sm:text-sm"
            >
              About Us
            </Link>
          </div>

          {/* Top Center: Brand Title (Centered Serif like reference) */}
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
            <Link
              to="/home"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="font-serif text-2xl md:text-3xl text-white tracking-tight drop-shadow-md hover:opacity-90 transition-opacity"
            >
              DevZ-Go
            </Link>
          </div>

          {/* Top Right: Action Icons */}
          <div className="flex items-center gap-3 sm:gap-4 text-white/90">
            {/* Theme Toggle Button */}
            <ThemeToggle variant="editorial" />

            <Link
              to="/wrap"
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide transition-all"
              title="2026 Monthly Wrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>'26 Wrap</span>
            </Link>

            <NotificationsDropdown />

            <Link
              to="/explore"
              className="p-1.5 hover:text-white hover:bg-white/15 rounded-full transition-all"
              title="Explore Projects"
            >
              <Search className="w-5 h-5 drop-shadow-sm" />
            </Link>

            <Link
              to="/profile"
              className="p-1.5 hover:text-white hover:bg-white/15 rounded-full transition-all"
              title="My Account"
            >
              <User className="w-5 h-5 drop-shadow-sm" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 hover:text-red-300 hover:bg-white/15 rounded-full transition-all"
              title="Log Out"
            >
              <LogOut className="w-5 h-5 drop-shadow-sm" />
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-1.5 hover:text-white hover:bg-white/15 rounded-full transition-all"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-stone-950/95 backdrop-blur-xl border-b border-white/15 text-white px-6 py-5 space-y-3"
            >
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-xs uppercase tracking-wider text-stone-400 font-bold">Theme</span>
                <ThemeToggle variant="pill" />
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  to="/network"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1 text-white hover:text-[#fced96]"
                >
                  Network
                </Link>
                <Link
                  to="/messages"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1 text-white hover:text-[#fced96]"
                >
                  Messages {unreadMessages > 0 && `(${unreadMessages})`}
                </Link>
                <Link
                  to="/explore"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1 text-white hover:text-[#fced96]"
                >
                  Explore Projects
                </Link>
                <Link
                  to="/add-project"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1 text-white hover:text-[#fced96]"
                >
                  About Us / Submit Work
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1 text-white hover:text-[#fced96]"
                >
                  Profile
                </Link>
                <Link
                  to="/wrap"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1 text-amber-300 hover:text-amber-200 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Monthly Wrap
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="block text-sm text-red-300 py-1"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    );
  }

  const linkClass = (path: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-maroon-100 dark:bg-maroon-950/60 text-maroon-800 dark:text-maroon-200 font-semibold"
        : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f8f6f0]/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-amber-200/40 dark:border-stone-800 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/home"
          className="flex items-center gap-2.5 group"
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-maroon-800 via-maroon-700 to-autumn-rust text-amber-200 shadow-sm shadow-maroon-900/30"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
          </motion.div>
          <span className="font-serif text-xl font-normal text-stone-900 dark:text-stone-100 tracking-tight group-hover:text-maroon-700 dark:group-hover:text-maroon-300 transition-colors">
            DevZ-Go
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1.5">
          {(user?.email ?? user?.username) && (
            <span className="text-xs text-stone-400 dark:text-stone-400 mr-2 max-w-[160px] truncate">
              {String(user?.email ?? user?.username)}
            </span>
          )}
          <Link to="/network" className={linkClass("/network")}>
            <Users className="w-4 h-4" />
            Network
          </Link>
          <Link to="/explore" className={linkClass("/explore")}>
            <Compass className="w-4 h-4" />
            Explore
          </Link>
          <Link to="/messages" className={linkClass("/messages")}>
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
            {unreadMessages > 0 && (
              <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-maroon-700 text-[10px] font-bold text-white">
                {unreadMessages}
              </span>
            )}
          </Link>
          <Link to="/profile" className={linkClass("/profile")}>
            <User className="w-4 h-4" />
            Profile
          </Link>

          {isDesktop && <NotificationsDropdown />}

          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/add-project"
              className="flex items-center gap-2 ml-2 px-4 py-2.5 bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust hover:from-maroon-900 hover:to-autumn-amber text-white rounded-2xl text-sm font-semibold shadow-md shadow-maroon-800/20 hover:shadow-lg hover:shadow-maroon-800/30 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              Add Project
            </Link>
          </motion.div>

          {/* Theme toggle button */}
          <div className="ml-1">
            <ThemeToggle variant="ghost" />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleLogout}
            className="ml-1 p-2.5 text-gray-400 dark:text-stone-400 hover:text-coral-500 hover:bg-coral-50 dark:hover:bg-stone-800 rounded-xl transition-all"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2">
          {!isDesktop && <NotificationsDropdown />}
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 text-gray-600 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-800 rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden border-t border-amber-100/60 dark:border-stone-800 bg-cream-50/95 dark:bg-stone-900/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-6 py-4 space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-amber-100/60 dark:border-stone-800">
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-stone-400 font-bold">Theme</span>
                <ThemeToggle variant="pill" />
              </div>

              {(user?.email ?? user?.username) && (
                <p className="text-xs text-gray-400 dark:text-stone-400 pb-2 truncate">
                  {String(user?.email ?? user?.username)}
                </p>
              )}
              <Link
                to="/network"
                onClick={() => setMobileOpen(false)}
                className={linkClass("/network") + " w-full"}
              >
                <Users className="w-4 h-4" /> Network
              </Link>
              <Link
                to="/explore"
                onClick={() => setMobileOpen(false)}
                className={linkClass("/explore") + " w-full"}
              >
                <Compass className="w-4 h-4" /> Explore
              </Link>
              <Link
                to="/messages"
                onClick={() => setMobileOpen(false)}
                className={linkClass("/messages") + " w-full"}
              >
                <MessageSquare className="w-4 h-4" /> Messages
                {unreadMessages > 0 && (
                  <span className="ml-auto flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={linkClass("/profile") + " w-full"}
              >
                <User className="w-4 h-4" /> Profile
              </Link>
              <Link
                to="/add-project"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust text-white rounded-2xl text-sm font-semibold shadow-sm"
              >
                <FolderPlus className="w-4 h-4" /> Add Project
              </Link>
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-950/30 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
