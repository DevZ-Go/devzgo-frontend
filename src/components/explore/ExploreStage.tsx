import type { ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { GuestPreviewBanner } from "../GuestPreviewBanner";
import { Navbar } from "../Navbar";

/** Full-screen frame shared by the Explore themes so each one fits the laptop without a page scrollbar. */
export function ExploreStage({
  children,
  className = "",
}: {
  title?: string;
  tone?: "paper" | "felt" | "night" | "deck";
  data?: unknown;
  children: ReactNode;
  className?: string;
}) {
  const { isAuthenticated, isReady } = useAuth();
  const guest = isReady && !isAuthenticated;

  return (
    <div className={`flex h-dvh flex-col overflow-hidden bg-[#F7F2E8] dark:bg-[#1A0B0E] text-[#3E2217] dark:text-[#FAF7F2] ${className}`}>
      <Navbar />
      <div className="pt-14 sm:pt-16 flex flex-col flex-1 min-h-0 overflow-hidden">
        {guest && (
          <GuestPreviewBanner message="Browse and open projects freely. Sign in to like, comment, share to Network, or connect with people." />
        )}
        {children}
      </div>
    </div>
  );
}
