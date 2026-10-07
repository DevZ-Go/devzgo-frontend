import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Compass, FolderPlus, User, LogOut, Menu, X, Sparkles, Search } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

interface NavbarProps {
  variant?: "default" | "editorial";
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const isActive = (path: string) => location.pathname === path;

  // Editorial Navbar matching the reference design layout
  if (variant === "editorial") {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        {/* Subtle top announcement bar */}
        <div className="bg-black/20 backdrop-blur-sm text-[11px] text-white/80 text-center py-1 tracking-wider uppercase font-medium">
          DevZ-Go — Community Showcase
        </div>

        <nav className="max-w-[1400px] mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          {/* Top Left: Profile & Submit Your Work */}
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link
              to="/profile"
              className="text-white/90 hover:text-white drop-shadow-sm tracking-wide transition-colors font-sans hover:underline underline-offset-4"
            >
              Profile
            </Link>
            <Link
              to="/add-project"
              className="text-white/90 hover:text-white drop-shadow-sm tracking-wide transition-colors font-sans hover:underline underline-offset-4"
            >
              Submit Your Work
            </Link>
          </div>

          {/* Top Center: Brand Title */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link
              to="/home"
              className="font-serif text-2xl md:text-3xl text-white tracking-tight drop-shadow-md hover:opacity-90 transition-opacity"
            >
              DevZ-Go
            </Link>
          </div>

          {/* Top Right: Icons */}
          <div className="flex items-center gap-4 text-white/90">
            <Link
              to="/explore"
              className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="Explore Projects"
            >
              <Search className="w-5 h-5 drop-shadow-sm" />
            </Link>
            <Link
              to="/profile"
              className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="My Account"
            >
              <User className="w-5 h-5 drop-shadow-sm" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 hover:text-red-300 hover:bg-white/10 rounded-full transition-all"
              title="Log Out"
            >
              <LogOut className="w-5 h-5 drop-shadow-sm" />
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-all"
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
              className="md:hidden bg-black/85 backdrop-blur-xl border-b border-white/10 text-white px-6 py-4 space-y-3"
            >
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium py-1"
              >
                Profile
              </Link>
              <Link
                to="/add-project"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium py-1"
              >
                Submit Your Work
              </Link>
              <Link
                to="/explore"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium py-1"
              >
                Explore Projects
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
          <Link to="/profile" className={linkClass("/profile")}>
            <User className="w-4 h-4" />
            Profile
          </Link>
          <Link to="/explore" className={linkClass("/explore")}>
            <Compass className="w-4 h-4" />
            Explore
          </Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/add-project"
              className="flex items-center gap-2 ml-2 px-4 py-2.5 bg-gradient-to-r from-lavender-500 to-coral-400 text-white rounded-2xl text-sm font-semibold shadow-md shadow-lavender-500/20 hover:shadow-lg hover:shadow-lavender-500/30 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              Add Project
            </Link>
          </motion.div>
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
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 text-gray-600 hover:bg-cream-200 rounded-xl transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </motion.button>
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
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={linkClass("/profile") + " w-full"}
              >
                <User className="w-4 h-4" /> Profile
              </Link>
              <Link
                to="/explore"
                onClick={() => setMobileOpen(false)}
                className={linkClass("/explore") + " w-full"}
              >
                <Compass className="w-4 h-4" /> Explore
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
                onClick={() => { handleLogout(); setMobileOpen(false); }}
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
