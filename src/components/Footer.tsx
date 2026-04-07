import { Link } from "react-router-dom";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row sm:px-10">
        <p className="text-center text-sm text-gray-600 sm:text-left">
          © {year} DevZ-Go. Built by developers, for developers.
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-medium text-gray-600"
          aria-label="Footer"
        >
          <Link to="/home" className="transition-colors hover:text-gray-900">
            Home
          </Link>
          <Link to="/explore" className="transition-colors hover:text-gray-900">
            Explore
          </Link>
          <Link to="/add-project" className="transition-colors hover:text-gray-900">
            Add project
          </Link>
          <Link to="/profile" className="transition-colors hover:text-gray-900">
            Profile
          </Link>
        </nav>
      </div>
    </footer>
  );
}
