import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAccount } from "../../auth/account";

const PLACES = [
  { id: "feed", label: "Community Feed", to: "/network" },
  { id: "people", label: "People", to: "/network/connections" },
] as const;

export type NetworkPlace = "feed" | "connections" | "requests" | "people";

/** Simple, unified top navigation for the Network section. */
export function NetworkPlaces({ current }: { current: NetworkPlace }) {
  const { recruiter } = useAccount();
  const activeTab = current === "feed" ? "feed" : "people";
  return (
    <nav aria-label="Network" className="mb-6 flex flex-wrap items-center gap-2.5">
      {PLACES.map((place) => {
        const active = place.id === activeTab;
        return (
          <Link
            key={place.id}
            to={place.to}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold tracking-wide transition-all ${
              active
                ? "bg-[#721C2A] text-[#FDFBF7] shadow-xs"
                : "border border-[#D8CFE8] bg-white/90 text-[#4A3E70] hover:bg-[#F0ECFA] hover:border-[#B9A9DC]"
            }`}
          >
            {place.label}
          </Link>
        );
      })}
      <Link
        to={recruiter ? "/recruit/talent" : "/explore/developers"}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#E5DFFA] border border-[#C9BEF0] px-5 py-2 text-xs sm:text-sm font-semibold text-[#42356B] hover:bg-[#D9D0F7] transition-all shadow-2xs"
      >
        <Search className="h-3.5 w-3.5" aria-hidden /> Find developers
      </Link>
    </nav>
  );
}
