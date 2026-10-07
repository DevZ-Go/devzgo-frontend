import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-cream-300/60 bg-cream-50">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row sm:px-10">
        <p className="text-center text-sm text-gray-400 sm:text-left flex items-center gap-1.5">
          © {year} DevZ-Go · Made with{" "}
          <Heart className="w-3.5 h-3.5 text-coral-400 fill-coral-400 inline" />{" "}
          by developers, for developers.
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-gray-400"
          aria-label="Footer"
        >
          <Link to="/home" className="transition-colors hover:text-lavender-500">
            Home
          </Link>
          <Link to="/explore" className="transition-colors hover:text-lavender-500">
            Explore
          </Link>
          <Link to="/add-project" className="transition-colors hover:text-lavender-500">
            Add project
          </Link>
          <Link to="/profile" className="transition-colors hover:text-lavender-500">
            Profile
          </Link>
        </nav>
      </div>
    </footer>
  );
}
