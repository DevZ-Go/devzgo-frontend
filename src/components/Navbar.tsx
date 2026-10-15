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
  Settings,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
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
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (variant !== "editorial") return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      const sectionIds = ["faq", "ecosystem", "showcase", "about", "hero"];
      const scrollPos = window.scrollY + 200;
      let current = "";

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          current = id === "hero" ? "" : id;
          break;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [variant]);

  const scrollToSection = (id: string) => {
    if (location.pathname !== "/home" && location.pathname !== "/") {
      navigate(`/home#${id}`);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  // Editorial Navbar matching Hack the North style continuous page navigation
  if (variant === "editorial") {
    const navSections = [
      { id: "about", label: "About" },
      { id: "showcase", label: "Showcase" },
      { id: "ecosystem", label: "Ecosystem" },
      { id: "faq", label: "FAQ" },
    ];

    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-stone-950/80 backdrop-blur-md border-b border-white/10 shadow-xl py-0"
            : "bg-transparent py-1"
        }`}
      >
        {/* Subtle top announcement bar */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isScrolled ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
          } bg-black/25 backdrop-blur-xs text-[11px] text-white/80 text-center py-1 tracking-wider uppercase font-medium`}
        >
          DevZ-Go — Continuous Student Developer Showcase
        </div>

        <nav className="max-w-[1400px] mx-auto px-6 md:px-10 py-3.5 flex items-center justify-between">
          {/* Brand Logo / Home */}
          <div className="flex items-center gap-4">
            <Link
              to="/home"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="font-serif text-2xl md:text-3xl text-white tracking-tight drop-shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span>DevZ-Go</span>
            </Link>
          </div>

          {/* Center: Floating Section Nav Pills (Hack the North style) */}
          <div className="hidden lg:flex items-center gap-1 bg-stone-900/60 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-inner">
            {navSections.map((sec) => {
              const isCurrent = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isCurrent
                      ? "text-stone-950 shadow-sm"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {isCurrent && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-[#fced96] rounded-full z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Icons & Direct Links */}
          <div className="flex items-center gap-3 md:gap-4 text-white/90">
            <Link
              to="/network"
              className="hidden sm:inline-block text-white/90 hover:text-white drop-shadow-sm tracking-wide transition-colors font-sans hover:underline underline-offset-4"
            >
              Network
            </Link>
            <Link
              to="/messages"
              className="relative hidden sm:flex text-white/90 hover:text-white drop-shadow-sm tracking-wide transition-colors font-sans hover:underline underline-offset-4 items-center gap-1.5"
            >
              Messages
              {unreadMessages > 0 && (
                <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              className="hidden sm:inline-block text-white/85 hover:text-white text-xs font-semibold tracking-wide uppercase transition-colors px-2 py-1 hover:underline underline-offset-4"
            >
              Profile
            </Link>
            <Link
              to="/settings"
              className="hidden sm:inline-block text-white/85 hover:text-white text-xs font-semibold tracking-wide uppercase transition-colors px-2 py-1 hover:underline underline-offset-4"
            >
              Settings
            </Link>

            <Link
              to="/add-project"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold tracking-wide transition-all shadow-xs"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Submit Work</span>
            </Link>

            <Link
              to="/wrap"
              className="hidden xl:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-300/30 text-amber-200 hover:text-white text-xs font-semibold tracking-wide transition-all"
              title="2026 Monthly Wrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>'26 Wrap</span>
            </Link>

            <NotificationsDropdown />
            <Link
              to="/explore"
              className="p-2 hover:text-white hover:bg-white/15 rounded-full transition-all"
              title="Explore Projects"
            >
              <Search className="w-4 h-4 drop-shadow-sm" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 hover:text-red-300 hover:bg-white/15 rounded-full transition-all"
              title="Log Out"
            >
              <LogOut className="w-4 h-4 drop-shadow-sm" />
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 hover:text-white hover:bg-white/15 rounded-full transition-all"
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
              className="lg:hidden bg-stone-950/95 backdrop-blur-xl border-b border-white/15 text-white px-6 py-5 space-y-3"
            >
              <div className="text-xs uppercase tracking-wider text-stone-400 font-bold mb-2">
                Sections
              </div>
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-white/10">
                {navSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className="text-left text-sm font-medium py-1.5 px-2 rounded hover:bg-white/10 text-stone-200 transition-colors"
                  >
                    {sec.label}
                  </button>
                ))}
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
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1 text-white hover:text-[#fced96]"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1 text-white hover:text-[#fced96]"
                >
                  Settings
                </Link>
                <Link
                  to="/add-project"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1 text-white hover:text-[#fced96]"
                >
                  Submit Your Work
                </Link>
                <Link
                  to="/explore"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1 text-white hover:text-[#fced96]"
                >
                  Explore Projects (TV & Cards)
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
        ? "bg-lavender-100 text-lavender-600"
        : "text-gray-500 hover:text-gray-800 hover:bg-cream-200/60"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-50/85 backdrop-blur-xl border-b border-amber-100/60">
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/home"
          className="flex items-center gap-2 group"
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-lavender-400 to-coral-400 text-white"
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
          <span className="text-lg font-bold text-gray-800 tracking-tight group-hover:text-lavender-600 transition-colors">
            DevZ-Go
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {(user?.email ?? user?.username) && (
            <span className="text-xs text-gray-400 mr-2 max-w-[160px] truncate">
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
              <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
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
              className="flex items-center gap-2 ml-2 px-4 py-2.5 bg-gradient-to-r from-lavender-500 to-coral-400 text-white rounded-2xl text-sm font-semibold shadow-md shadow-lavender-500/20 hover:shadow-lg hover:shadow-lavender-500/30 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              Add Project
            </Link>
          </motion.div>
          <Link to="/settings" aria-label="Settings"
            className="ml-1 p-2.5 text-gray-400 hover:text-lavender-500 hover:bg-lavender-50 rounded-xl transition-all">
            <Settings className="w-4 h-4" />
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleLogout}
            className="ml-1 p-2.5 text-gray-400 hover:text-coral-500 hover:bg-coral-50 rounded-xl transition-all"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {!isDesktop && <NotificationsDropdown />}
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 text-gray-600 hover:bg-cream-200 rounded-xl transition-colors"
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
            className="md:hidden border-t border-amber-100/60 bg-cream-50/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-6 py-4 space-y-2">
              {(user?.email ?? user?.username) && (
                <p className="text-xs text-gray-400 pb-2 truncate">
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
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className={linkClass("/settings") + " w-full"}
              >
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <Link
                to="/add-project"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-lavender-500 to-coral-400 text-white rounded-2xl text-sm font-semibold"
              >
                <FolderPlus className="w-4 h-4" /> Add Project
              </Link>
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-coral-500 hover:bg-coral-50 rounded-xl transition-colors"
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
