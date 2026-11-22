import { BadgeCheck } from "lucide-react";

export function VerifiedClubBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[#780D18] ${className}`}
      title="Verified club"
      aria-label="Verified club"
    >
      <BadgeCheck className="w-4 h-4" />
    </span>
  );
}
