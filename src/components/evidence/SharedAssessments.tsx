import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { fetchSharedAssessments, type Rating } from "../../api/challenges";
import { queryKeys } from "../../api/queryKeys";
import { difficultyLabel, ratingLabel, typeLabel } from "../../utils/challenges";
import { shortDate } from "../../utils/evidence";

const RATING_TONE: Record<Rating, string> = {
  strong: "bg-maroon-800 text-amber-50 border-maroon-800",
  meets_expectations: "bg-[#DCFCE7] text-[#14532D] border-[#15803D]/40",
  needs_improvement: "bg-stone-100 text-stone-700 border-stone-200",
};

/** Reviewed technical challenges the developer chose to share. Renders nothing when there are none. */
export function SharedAssessments({ userId, own = false }: { userId: string; own?: boolean }) {
  const query = useQuery({ queryKey: queryKeys.sharedAssessments(userId), queryFn: () => fetchSharedAssessments(userId), enabled: Boolean(userId) });
  const items = query.data ?? [];
  if (!items.length && !own) return null;

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl text-stone-900">Technical assessments</h3>
        {own && <Link to="/assessments" className="text-xs font-semibold text-maroon-800 hover:underline">Manage sharing</Link>}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500">Reviewed challenges you choose to share appear here. Nothing is shared until you turn it on.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((a) => (
            <li key={a.submission_id} className="rounded-2xl bg-[#f7f5ed] p-4">
              <div className="flex flex-wrap items-start gap-3">
                <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-maroon-800" />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg text-stone-900">{a.title}</p>
                  <p className="text-xs text-stone-500">
                    {[typeLabel(a.challenge_type), difficultyLabel(a.difficulty), a.company ? `Reviewed by ${a.company}` : null, shortDate(a.reviewed_at)]
                      .filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              {a.technologies.length > 0 && (
                <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-stone-500">{a.technologies.join(" · ")}</p>
              )}
              <dl className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {a.ratings.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-2 text-sm">
                    <dt className="text-stone-700">{r.label}</dt>
                    <dd className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${RATING_TONE[r.rating]}`}>{ratingLabel(r.rating)}</dd>
                  </div>
                ))}
              </dl>
              {a.feedback && <p className="mt-3 whitespace-pre-line border-l-2 border-maroon-800/30 pl-3 text-sm text-stone-700">{a.feedback}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
