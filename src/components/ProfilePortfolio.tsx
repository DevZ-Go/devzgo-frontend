import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FileText, Github, Globe, Heart, Linkedin, MapPin } from "lucide-react";
import { uploadResume } from "../api/profiles";
import { fetchUserCollaborations } from "../api/collaborations";
import { queryKeys } from "../api/queryKeys";
import { SharedAssessments } from "./evidence/SharedAssessments";
import { SkillMatrix } from "./evidence/SkillMatrix";
import type { DeveloperProfile } from "../types/network";
import type { ApiProject, Project } from "../types/project";
import { getApiErrorMessage } from "../utils/apiError";

const LANGUAGE_COLORS = ["#7a1f2b", "#c2410c", "#3f6212", "#1e40af", "#a16207", "#6b21a8"];
const OTHER_COLOR = "#a8a29e";

type Count = { name: string; count: number };

function countBy(values: string[]): Count[] {
  const counts = new Map<string, Count>();
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key) continue;
    const row = counts.get(key) ?? { name: value.trim(), count: 0 };
    row.count += 1;
    counts.set(key, row);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Average share of each language across the projects that were analysed. */
function languageMix(raw: ApiProject[]) {
  const analysed = raw.filter((p) => p.languages?.length);
  if (!analysed.length) return [];
  const totals = new Map<string, number>();
  for (const project of analysed) {
    for (const { name, percentage } of project.languages ?? []) totals.set(name, (totals.get(name) ?? 0) + percentage);
  }
  const rows = [...totals].map(([name, sum]) => ({ name, share: sum / analysed.length })).sort((a, b) => b.share - a.share);
  const top = rows.slice(0, LANGUAGE_COLORS.length).map((row, i) => ({ ...row, color: LANGUAGE_COLORS[i]! }));
  const rest = rows.slice(LANGUAGE_COLORS.length).reduce((sum, row) => sum + row.share, 0);
  const all = rest > 0.5 ? [...top, { name: "Other", share: rest, color: OTHER_COLOR }] : top;
  const total = all.reduce((sum, row) => sum + row.share, 0) || 1;
  return all.map((row) => ({ ...row, share: (row.share / total) * 100 }));
}

function categoryOf(p: ApiProject) {
  return p.category === "Other" && p.category_other ? p.category_other : p.category ?? "";
}

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <h3 className="mb-4 font-serif text-xl text-stone-900">{title}</h3>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-2xl tabular-nums text-stone-900">{value}</p>
    </div>
  );
}

/** A one-page read on the person: who they are, what they build with, and their best work. */
export function ProfilePortfolio({
  profile,
  projects,
  raw,
  own,
  onUpdated,
}: {
  profile: DeveloperProfile;
  projects: Project[];
  raw: ApiProject[];
  own: boolean;
  onUpdated: (profile: DeveloperProfile) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = profile.userId || profile.id;
  const collaborations = useQuery({
    queryKey: [...queryKeys.collab, "user", userId],
    queryFn: () => fetchUserCollaborations(userId),
  });

  const name = profile.fullName || profile.username;
  const tech = useMemo(() => countBy(raw.flatMap((p) => p.tech_stacks ?? [])), [raw]);
  const languages = useMemo(() => languageMix(raw), [raw]);
  const focus = useMemo(() => countBy(raw.map(categoryOf)), [raw]);
  const likes = raw.reduce((sum, p) => sum + (p.likes_count ?? p.likes ?? 0), 0);
  const skills = useMemo(() => {
    const known = new Set([...tech.map((t) => t.name), ...languages.map((l) => l.name)].map((n) => n.toLowerCase()));
    return (profile.skills || "").split(",").map((s) => s.trim()).filter((s) => s && !known.has(s.toLowerCase()));
  }, [profile.skills, tech, languages]);
  const memberSince = profile.createdAt
    ? new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(profile.createdAt))
    : "—";
  const links = [
    { href: profile.githubUrl, label: "GitHub", icon: Github },
    { href: profile.linkedinUrl, label: "LinkedIn", icon: Linkedin },
    { href: profile.websiteUrl, label: "Website", icon: Globe },
  ].filter((l): l is { href: string; label: string; icon: typeof Github } => Boolean(l.href));
  const joined = collaborations.data ?? [];
  const topTech = tech[0]?.count || 1;

  async function onResume(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onUpdated(await uploadResume(file));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-maroon-800 px-6 py-8 text-amber-50 shadow-sm sm:px-10 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="h-24 w-24 shrink-0 rounded-3xl object-cover ring-4 ring-amber-50/20" />
          ) : (
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-amber-50/10 font-serif text-4xl text-amber-50 ring-4 ring-amber-50/20">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#fced96]">{profile.role || "Portfolio"}</p>
            <h2 className="mt-1 break-words font-serif text-4xl text-amber-50 sm:text-5xl">{name}</h2>
            {profile.headline && <p className="mt-2 max-w-2xl text-base text-amber-100/90">{profile.headline}</p>}
            {profile.location && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-100/70">
                <MapPin className="h-4 w-4" />{profile.location}
              </p>
            )}
          </div>
        </div>
        {(links.length > 0 || profile.resumeUrl) && (
          <div className="mt-6 flex flex-wrap gap-2">
            {links.map(({ href, label, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-50/10 px-4 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-50 hover:text-maroon-800">
                <Icon className="h-4 w-4" />{label}
              </a>
            ))}
            {profile.resumeUrl && (
              <a href={profile.resumeUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#fced96] px-4 py-2 text-xs font-semibold text-stone-900 transition hover:bg-amber-50">
                <FileText className="h-4 w-4" />Open resume
              </a>
            )}
          </div>
        )}
      </section>

      <section aria-label="At a glance" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Projects" value={projects.length} />
        <Stat label="Total likes" value={likes} />
        <Stat label="Connections" value={profile.connectionsVisible === false ? "Hidden" : profile.connectionsCount} />
        <Stat label="Collaborations" value={profile.collaborationsCount} />
        <Stat label="Member since" value={<span className="text-xl">{memberSince}</span>} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          {profile.bio && (
            <Card title="About">
              <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">{profile.bio}</p>
            </Card>
          )}

          {(skills.length > 0 || focus.length > 0) && (
            <Card title="Skills and focus">
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-[#f7f5ed] px-3 py-1 text-xs font-semibold text-stone-700">{skill}</span>
                  ))}
                </div>
              )}
              {focus.length > 0 && (
                <div className={skills.length ? "mt-5" : ""}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Focus areas</p>
                  <div className="flex flex-wrap gap-2">
                    {focus.map((f) => (
                      <span key={f.name} className="inline-flex items-center gap-1.5 rounded-full border border-maroon-800/20 px-3 py-1 text-xs font-semibold text-maroon-800">
                        {f.name}<span className="font-mono text-stone-500">{f.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card title="Selected work">
            {projects.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-500">
                {own ? "Projects you publish show up here." : "No published projects yet."}
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link to={`/project/${project.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 transition hover:border-maroon-800">
                      <img src={project.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
                      <div className="flex flex-1 flex-col p-4">
                        <h4 className="font-serif text-xl text-stone-900 group-hover:text-maroon-800">{project.title}</h4>
                        {project.shortDescription && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{project.shortDescription}</p>}
                        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                          <p className="truncate font-mono text-[11px] uppercase tracking-wider text-stone-400">
                            {project.techStack.slice(0, 3).join(" · ")}
                          </p>
                          <span className="flex shrink-0 items-center gap-1 text-xs text-stone-500">
                            <Heart className="h-3.5 w-3.5" />{project.likes}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <SkillMatrix userId={userId} own={own} />

          {joined.length > 0 && (
            <Card title="Collaborations">
              <ul className="divide-y divide-stone-100">
                {joined.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link to={`/project/${c.id}`} className="block truncate font-serif text-lg text-stone-900 hover:text-maroon-800">{c.title}</Link>
                      <p className="text-xs text-stone-500">
                        {c.contribution_info || "Collaborator"}{c.owner_username ? ` · with @${c.owner_username}` : ""}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-400" />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <SharedAssessments userId={userId} own={own} />
        </div>

        <aside className="min-w-0 space-y-6">
          {tech.length > 0 && (
            <Card title="Tech stack">
              <ul className="space-y-3">
                {tech.slice(0, 12).map((t) => (
                  <li key={t.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold text-stone-800">{t.name}</span>
                      <span className="shrink-0 text-xs text-stone-500">used in {t.count} {t.count === 1 ? "project" : "projects"}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-maroon-800" style={{ width: `${(t.count / topTech) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {languages.length > 0 && (
            <Card title="Languages">
              <div className="flex h-3 overflow-hidden rounded-full" role="img"
                aria-label={languages.map((l) => `${l.name} ${Math.round(l.share)}%`).join(", ")}>
                {languages.map((l) => <span key={l.name} style={{ width: `${l.share}%`, background: l.color }} />)}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {languages.map((l) => (
                  <li key={l.name} className="flex items-center gap-2 text-sm text-stone-700">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: l.color }} />
                    <span className="truncate">{l.name}</span>
                    <span className="ml-auto font-mono text-xs text-stone-500">{Math.round(l.share)}%</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-stone-400">Averaged across analysed project uploads.</p>
            </Card>
          )}

          {(profile.resumeUrl || own) && (
            <Card title="Resume">
              {profile.resumeUrl ? (
                <a href={profile.resumeUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-[#f7f5ed] p-4 transition hover:border-maroon-800">
                  <FileText className="h-6 w-6 text-maroon-800" />
                  <span className="text-sm font-semibold text-stone-900">Open resume (PDF)</span>
                </a>
              ) : (
                <p className="text-sm text-stone-500">Add a PDF and it appears here. Connections can see it unless you change that in Settings.</p>
              )}
              {own && (
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-50">
                  {busy ? "Uploading…" : profile.resumeUrl ? "Replace PDF" : "Add PDF"}
                  <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={busy} onChange={(e) => void onResume(e.target.files?.[0])} />
                </label>
              )}
              {error && <p className="mt-3 text-xs text-crimson-700">{error}</p>}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
