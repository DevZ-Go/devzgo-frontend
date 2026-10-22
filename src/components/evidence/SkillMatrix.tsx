import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, FileCode2, GitCommitHorizontal, Info, Loader2, Lock } from "lucide-react";
import { fetchSkillMatrix, type EvidenceClass, type Skill } from "../../api/evidence";
import { queryKeys } from "../../api/queryKeys";
import { EVIDENCE_CLASSES, classLabel, fileLink, filterMatrix, shortDate, sourceLabel } from "../../utils/evidence";

const CLASS_TONE: Record<EvidenceClass, string> = {
  contribution_linked: "bg-maroon-800 text-amber-50 border-maroon-800",
  detected: "bg-[#DCFCE7] text-[#14532D] border-[#15803D]/40",
  declared: "bg-white text-stone-600 border-dashed border-stone-300",
};

function ClassBadge({ id }: { id: EvidenceClass }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CLASS_TONE[id]}`}>
      {classLabel(id)}
    </span>
  );
}

function SkillRow({ skill, own }: { skill: Skill; own: boolean }) {
  const [open, setOpen] = useState(false);
  const counts = [
    skill.owned_projects ? `${skill.owned_projects} owned project${skill.owned_projects === 1 ? "" : "s"}` : null,
    skill.team_projects ? `${skill.team_projects} team project${skill.team_projects === 1 ? "" : "s"}` : null,
    skill.commits ? `${skill.commits} credited commit${skill.commits === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return (
    <li className="rounded-2xl border border-stone-200 bg-white">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left">
        <span className="font-semibold text-stone-900">{skill.name}</span>
        <span className="flex flex-wrap gap-1">{skill.classes.map((c) => <ClassBadge key={c} id={c} />)}</span>
        <span className="ml-auto flex items-center gap-2 text-xs text-stone-500">
          <span className="hidden sm:inline">{counts.join(" · ") || "Profile only"}</span>
          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </span>
        <span className="w-full text-xs text-stone-500 sm:hidden">{counts.join(" · ") || "Profile only"}</span>
      </button>
      {open && (
        <div className="border-t border-stone-100 px-4 pb-4 pt-3">
          <p className="text-xs text-stone-500">
            How it is known: {skill.sources.map(sourceLabel).join(", ")}
            {skill.last_activity ? ` · latest supporting project activity ${shortDate(skill.last_activity)}` : ""}
          </p>
          {skill.projects.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">Listed on the profile. No project {own ? "you have shared" : "you can see"} shows it yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {skill.projects.map((p) => (
                <li key={p.project_id} className="rounded-xl bg-[#f7f5ed] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/project/${p.project_id}`} className="font-serif text-base text-stone-900 hover:text-maroon-800">{p.title}</Link>
                    <span className="rounded-full border border-stone-300 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                      {p.relation === "owner" ? "Owner" : `Team member · ${p.role}`}
                    </span>
                    {p.visibility === "private" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500"><Lock className="h-3 w-3" /> Private</span>
                    )}
                    {p.commits > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-maroon-800">
                        <GitCommitHorizontal className="h-3.5 w-3.5" /> {p.commits} commit{p.commits === 1 ? "" : "s"} credited
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {p.detected
                      ? [
                          p.kinds.map(sourceLabel).join(", "),
                          p.language_share != null ? `${p.language_share}% of the code` : null,
                          p.unrecorded ? "detected at upload; re-analyse to record the files" : null,
                        ].filter(Boolean).join(" · ")
                      : "Added to the project by its team; not detected in the source"}
                  </p>
                  {p.files.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {p.files.map((f) => (
                        <li key={`${f.kind}-${f.file}`}>
                          <Link to={fileLink(p.project_id, f.file)}
                            className="inline-flex max-w-full items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 font-mono text-[11px] text-stone-700 hover:border-maroon-700 hover:text-maroon-800">
                            <FileCode2 className="h-3 w-3 shrink-0" /><span className="truncate">{f.file}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

/** Technologies grouped by category, each with how it is known and the projects behind it. No levels or scores. */
export function SkillMatrix({ userId, own = false, className = "" }: { userId: string; own?: boolean; className?: string }) {
  const [only, setOnly] = useState<EvidenceClass | "all">("all");
  const query = useQuery({ queryKey: queryKeys.skillMatrix(userId), queryFn: () => fetchSkillMatrix(userId), enabled: Boolean(userId) });
  const matrix = query.data;

  return (
    <section className={`rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 ${className}`} aria-labelledby="skill-matrix-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="skill-matrix-title" className="font-serif text-xl text-stone-900">Skill evidence</h3>
          <p className="mt-1 max-w-xl text-xs text-stone-500">
            What {own ? "your" : "their"} projects show, grouped by category. There are no ratings: each skill says how it is known and where.
          </p>
        </div>
        {matrix && matrix.totals.skills > 0 && (
          <div role="group" aria-label="Filter by evidence" className="flex flex-wrap gap-1.5">
            {(["all", ...EVIDENCE_CLASSES.map((c) => c.id)] as const).map((id) => {
              const count = id === "all" ? matrix.totals.skills : matrix.totals[id];
              return (
                <button key={id} type="button" onClick={() => setOnly(id)} aria-pressed={only === id} disabled={id !== "all" && !count}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                    only === id ? "border-maroon-800 bg-maroon-800 text-amber-50" : "border-stone-200 bg-white text-stone-600 hover:border-maroon-700"}`}>
                  {id === "all" ? "All" : classLabel(id)} <span className="font-mono opacity-80">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {query.isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-maroon-700" /></div>}
      {query.isError && <p className="mt-4 text-sm text-crimson-700">The skill evidence could not be loaded.</p>}
      {matrix && matrix.restricted && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-stone-100 p-3 text-xs text-stone-600">
          <Lock className="h-4 w-4" /> This profile is shared with connections only, so its skill evidence is hidden.
        </p>
      )}
      {matrix && !matrix.restricted && matrix.totals.skills === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
          {own ? "Upload a project or import one from GitHub and the technologies it uses appear here." : "No skill evidence is visible yet."}
        </p>
      )}

      {matrix && matrix.totals.skills > 0 && (
        <>
          <div className="mt-5 space-y-5">
            {filterMatrix(matrix, only).map((category) => (
              <div key={category.key}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  {category.label} <span className="font-mono text-stone-400">{category.skills.length}</span>
                </p>
                <ul className="space-y-2">{category.skills.map((s) => <SkillRow key={s.name} skill={s} own={own} />)}</ul>
              </div>
            ))}
          </div>
          <details className="mt-5 text-xs text-stone-500">
            <summary className="flex cursor-pointer items-center gap-1.5 font-semibold text-stone-600"><Info className="h-3.5 w-3.5" /> How skills are classified</summary>
            <ul className="mt-2 space-y-1">
              {EVIDENCE_CLASSES.map((c) => <li key={c.id}><span className="font-semibold text-stone-700">{c.label}:</span> {c.body}</li>)}
              <li>
                {matrix.projects_with_file_evidence} of {matrix.projects_considered} project{matrix.projects_considered === 1 ? "" : "s"} have file-level evidence recorded.
                Projects analysed earlier show what was detected without the files behind it.
              </li>
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
