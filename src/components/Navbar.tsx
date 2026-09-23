import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { fetchUnreadMessagesCount } from "../api/messages";
import { MessageSquare, Plus } from "lucide-react";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/home"
            className="flex items-center gap-2 text-xl font-black text-gray-900 tracking-tight hover:opacity-90 transition"
          >
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DevZ-Go
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 sm:gap-2">
            <Link
              to="/home"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive("/home")
                  ? "text-blue-600 bg-blue-50/80 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              }`}
            >
              Home
            </Link>
            <Link
              to="/network"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive("/network")
                  ? "text-blue-600 bg-blue-50/80 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              }`}
            >
              Network
            </Link>
            <Link
              to="/explore"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive("/explore")
                  ? "text-blue-600 bg-blue-50/80 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              }`}
            >
              Explore
            </Link>
            <Link
              to="/messages"
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                isActive("/messages")
                  ? "text-blue-600 bg-blue-50/80 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
              {unreadMessages > 0 && (
                <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive("/profile") && !location.pathname.startsWith("/profile/")
                  ? "text-blue-600 bg-blue-50/80 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              }`}
            >
              Profile
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationsDropdown />

          <Link
            to="/add-project"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Project</span>
          </Link>

          {(user?.email ?? user?.username) && (
            <span className="hidden xl:inline text-xs text-gray-500 max-w-[160px] truncate">
              {String(user?.email ?? user?.username)}
            </span>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors px-2 py-1"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
