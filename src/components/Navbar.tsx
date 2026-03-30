import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Navbar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-[1440px] mx-auto px-8 py-4 flex items-center justify-between">
        <Link
          to="/home"
          className="text-xl font-bold text-gray-900 hover:text-gray-700"
        >
          DevZ-Go
        </Link>
        <div className="flex items-center gap-6">
          <Link
            to="/explore"
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Explore
          </Link>
          <Link
            to="/add-project"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            Add Project
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
