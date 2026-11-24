import { Link } from "react-router-dom";
import { Eye } from "lucide-react";

/** Strip for signed-out visitors browsing public/demo surfaces (place under the fixed Navbar). */
export function GuestPreviewBanner({ message }: { message?: string }) {
  return (
    <div
      className="z-40 shrink-0 border-b border-[#DECDBA] bg-[#2D120D] px-4 py-2.5 text-[#FFF8CA]"
      role="status"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs sm:text-sm">
          <Eye className="h-4 w-4 shrink-0 text-[#fced96]" aria-hidden />
          <span>
            {message ??
              "Preview mode — look around freely. Sign in to like, comment, connect, or publish."}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-full border border-[#FFF8CA]/35 px-3 py-1 text-xs font-semibold hover:bg-white/10"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-[#fced96] px-3 py-1 text-xs font-bold text-stone-900 hover:bg-[#fae77c]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
