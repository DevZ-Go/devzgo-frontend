import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAccount } from "../../auth/account";

const PLACES = [
  { id: "feed", label: "Feed", to: "/network" },
  { id: "connections", label: "Connections", to: "/network/connections?tab=connections" },
  { id: "requests", label: "Requests", to: "/network/connections?tab=requests" },
  { id: "people", label: "People", to: "/network/connections?tab=suggestions" },
] as const;

export type NetworkPlace = (typeof PLACES)[number]["id"];

/** The same places from the feed and from the connections page, plus the full developer search. */
export function NetworkPlaces({ current }: { current: NetworkPlace }) {
  const { recruiter } = useAccount();
  return (
    <nav aria-label="Network" className="mb-6 flex gap-2 overflow-x-auto">
      {PLACES.map((place) => {
        const active = place.id === current;
        return (
          <Link
            key={place.id}
            to={place.to}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              active ? "bg-maroon-800 text-amber-50" : "border border-stone-200 bg-white text-stone-700 hover:border-maroon-800"
            }`}
          >
            {place.label}
          </Link>
        );
      })}
      <Link
        to={recruiter ? "/recruit/talent" : "/explore/developers"}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#fced96] px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-200"
      >
        <Search className="h-3.5 w-3.5" aria-hidden /> Find developers
      </Link>
    </nav>
  );
}
