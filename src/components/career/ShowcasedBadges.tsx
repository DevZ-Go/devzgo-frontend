import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { fetchMyBadges, fetchUserBadges, type Badge } from "../../api/career";
import { ui } from "../../styles/editorial";
import { familyLabel } from "../../utils/badgeTiers";
import { BadgeArtwork } from "./BadgeArtwork";

/**
 * Public showcased badges — sits above profile tabs for everyone.
 * Full badge management stays private on the owner's Badges tab.
 */
export function ShowcasedBadges({
  userId,
  own = false,
}: {
  userId?: string;
  own?: boolean;
}) {
  const badges = useQuery({
    queryKey: ["badges", userId || "me"],
    queryFn: () => (userId ? fetchUserBadges(userId) : fetchMyBadges()),
  });
  const [detail, setDetail] = useState<Badge | null>(null);

  const showcase = useMemo(
    () => (badges.data || []).filter((b) => b.visibility === "public"),
    [badges.data],
  );

  if (badges.isLoading) {
    return (
      <div className="mb-8 flex items-center gap-2 text-sm text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading achievements…
      </div>
    );
  }

  if (showcase.length === 0) {
    if (!own) return null;
    return (
      <section className="mb-8 overflow-hidden rounded-2xl border border-dashed border-stone-300/80 bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-xl text-stone-900">Showcased badges</h2>
            <p className="mt-1 max-w-xl text-sm text-stone-600">
              Turn on “Show on portfolio” for badges you earn — they appear here for everyone.
            </p>
          </div>
          <Link to="?tab=badges" className={`${ui.btn} ${ui.primary} shrink-0 px-4 py-2`}>
            Open badges
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-stone-900 sm:text-3xl">Showcased badges</h2>
            <p className="mt-1 max-w-2xl text-sm text-stone-600">
              Recognitions this developer chose to share publicly.
            </p>
          </div>
          {own && (
            <Link
              to="?tab=badges"
              className="rounded-full border border-stone-200 bg-[#FAF7EE] px-3.5 py-1.5 text-xs font-semibold text-maroon-800 hover:bg-stone-50"
            >
              Manage badges
            </Link>
          )}
        </div>

        <ul className="mt-5 flex flex-wrap gap-3 sm:gap-4">
          {showcase.map((badge) => (
            <li key={badge.id}>
              <button
                type="button"
                onClick={() => setDetail(badge)}
                className="group flex w-[7.25rem] flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-[#FAF7EE]/50 px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-maroon-800/25 hover:shadow-sm sm:w-32 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-800"
              >
                <BadgeArtwork badge={badge} size={72} />
                <span className="line-clamp-2 text-[11px] font-semibold leading-snug text-stone-900 sm:text-xs">
                  {badge.name}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                  {familyLabel(badge.family)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {detail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <BadgeArtwork badge={detail} size={80} />
                <div>
                  <h3 className="font-serif text-2xl text-stone-900">{detail.name}</h3>
                  <p className="text-xs text-stone-500">
                    {familyLabel(detail.family)}
                    {detail.awarded_at
                      ? ` · ${new Date(detail.awarded_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`
                      : ""}
                  </p>
                </div>
              </div>
              <button type="button" aria-label="Close" onClick={() => setDetail(null)} className="rounded-full p-1.5 hover:bg-stone-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-stone-700">{detail.description}</p>
            <p className="mt-2 text-xs text-stone-500"><span className="font-semibold">Requirements:</span> {detail.criteria}</p>
            {detail.limitations && (
              <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">{detail.limitations}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
