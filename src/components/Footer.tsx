import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAccount } from "../auth/account";

export function Footer() {
  const year = new Date().getFullYear();
  const { ready, recruiter } = useAccount();

  return (
    <footer className="mt-auto shrink-0 border-t border-amber-200/40 dark:border-stone-800 bg-[#f8f6f0] dark:bg-stone-950 transition-colors duration-300">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row sm:px-10 lg:py-3">
        <p className="text-center text-sm text-stone-500 dark:text-stone-400 sm:text-left flex items-center gap-1.5 font-sans">
          © {year} DevZ-Go · Made with{" "}
          <Heart className="w-3.5 h-3.5 text-maroon-700 fill-maroon-700/50 inline" />{" "}
          by developers, for developers.
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-stone-500 dark:text-stone-400"
          aria-label="Footer"
        >
          <Link to={recruiter ? "/recruit" : "/home"} className="transition-colors hover:text-maroon-700 dark:hover:text-maroon-300">
            Home
          </Link>
          <Link to="/explore" className="transition-colors hover:text-maroon-700 dark:hover:text-maroon-300">
            Explore
          </Link>
          {ready && (
            <Link to={recruiter ? "/recruit/talent" : "/add-project"} className="transition-colors hover:text-maroon-700 dark:hover:text-maroon-300">
              {recruiter ? "Find talent" : "Add project"}
            </Link>
          )}
          <Link to="/profile" className="transition-colors hover:text-maroon-700 dark:hover:text-maroon-300">
            Profile
          </Link>
        </nav>
      </div>
    </footer>
  );
}
