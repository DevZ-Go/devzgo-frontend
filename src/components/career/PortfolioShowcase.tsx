import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, Briefcase, GraduationCap } from "lucide-react";
import { CATEGORY_LABELS, fetchMyCareer, fetchUserCareer, type ExperienceCategory } from "../../api/career";

/** Public career rows for the portfolio overview (badges live above the tabs). */
export function PortfolioShowcase({
  userId,
  own,
  onOpenSection,
}: {
  userId?: string;
  own: boolean;
  onOpenSection?: (section: "experience" | "education" | "certifications") => void;
}) {
  const career = useQuery({
    queryKey: ["career", userId || "me"],
    queryFn: () => (userId ? fetchUserCareer(userId) : fetchMyCareer()),
  });

  const experiences = (career.data?.experiences || []).filter((e) => e.visibility === "public");
  const education = (career.data?.education || []).filter((e) => e.visibility === "public");
  const certifications = (career.data?.certifications || []).filter((c) => c.visibility === "public");
  const empty = !experiences.length && !education.length && !certifications.length;

  if (career.isLoading) return null;

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-maroon-800">Selected for portfolio</p>
          <h3 className="font-serif text-2xl text-stone-900">Highlights</h3>
          <p className="mt-1 text-sm text-stone-600">
            Only items marked “Show on portfolio” appear here. Public badges show above the tabs.
          </p>
        </div>
        {own && (
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <button type="button" className="rounded-full border border-stone-200 px-3 py-1.5 text-maroon-800 hover:bg-stone-50" onClick={() => onOpenSection?.("experience")}>Manage career</button>
            <Link to="?tab=badges" className="rounded-full border border-stone-200 px-3 py-1.5 text-maroon-800 hover:bg-stone-50">Manage badges</Link>
            <Link to="/career/import" className="rounded-full border border-stone-200 px-3 py-1.5 text-stone-700 hover:bg-stone-50">Import resume</Link>
          </div>
        )}
      </div>

      {empty ? (
        <p className="mt-4 text-sm text-stone-500">
          {own
            ? "Confirm resume imports, then mark experience to show on this portfolio overview."
            : "No public career highlights yet."}
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {experiences.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500"><Briefcase className="h-3.5 w-3.5" /> Experience</p>
              <ul className="space-y-2">
                {experiences.slice(0, 4).map((exp) => (
                  <li key={exp.id} className="rounded-2xl border border-stone-100 bg-[#FAF7EE] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-maroon-800">{CATEGORY_LABELS[exp.category as ExperienceCategory] || exp.category}</p>
                    <p className="font-semibold text-stone-900">{exp.title}</p>
                    <p className="text-sm text-stone-600">{exp.organization}{exp.duration ? ` · ${exp.duration.label}` : ""}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {education.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500"><GraduationCap className="h-3.5 w-3.5" /> Education</p>
              <ul className="flex flex-wrap gap-2">
                {education.map((edu) => (
                  <li key={edu.id} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800">
                    {edu.institution}{edu.degree ? ` · ${edu.degree}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {certifications.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500"><Award className="h-3.5 w-3.5" /> Certifications</p>
              <ul className="flex flex-wrap gap-2">
                {certifications.map((cert) => (
                  <li key={cert.id} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800">
                    {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
