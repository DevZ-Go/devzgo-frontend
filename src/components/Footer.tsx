import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAccount } from "../auth/account";

export function Footer() {
  const year = new Date().getFullYear();
  const { ready, recruiter } = useAccount();

  return (
    <footer className="mt-auto shrink-0 border-t border-[#6B0B0C]/40 bg-[#2D120D] text-[#FFF8CA] transition-colors duration-300">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row sm:px-10 lg:py-3.5">
        <p className="text-center text-sm text-[#FFF8CA]/80 sm:text-left flex items-center gap-1.5 font-sans">
          © {year} DevZ-Go · Made with{" "}
          <Heart className="w-3.5 h-3.5 text-[#CDE3E8] fill-[#CDE3E8] inline" />{" "}
          by developers, for developers.
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-[#FFF8CA]/85"
          aria-label="Footer"
        >
          <Link to={recruiter ? "/recruit" : "/home"} className="transition-colors hover:text-[#CDE3E8]">
            Home
          </Link>
          <Link to="/explore" className="transition-colors hover:text-[#CDE3E8]">
            Explore
          </Link>
          {ready && (
            <Link to={recruiter ? "/recruit/talent" : "/add-project"} className="transition-colors hover:text-[#CDE3E8]">
              {recruiter ? "Find talent" : "Add project"}
            </Link>
          )}
          <Link to="/profile" className="transition-colors hover:text-[#CDE3E8]">
            Profile
          </Link>
          <Link to="/about-developers" className="transition-colors text-[#CDE3E8] hover:text-[#FFF8CA] font-semibold">
            About Developers
          </Link>
        </nav>
      </div>
    </footer>
  );
}
