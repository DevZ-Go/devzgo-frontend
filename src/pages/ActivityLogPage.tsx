import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowUpFromLine, CalendarDays, ExternalLink, Flame, FolderGit2, GitBranch, GitCommitHorizontal, Github, Loader2,
  Lock, Search, Users, X,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { MemberAvatar } from "../components/MemberAvatar";
import { ContributionHeatmap } from "../components/activity/ContributionHeatmap";
import { describeDay, localToday, longDay } from "../components/activity/format";
import {
  fetchActivityLog, PAGE_SIZE, type ActivityFilters, type ActivityItem, type ActivityKind, type ActivityLog, type ActivityScope,
} from "../api/activityLog";
import type { GitHubPerson } from "../api/githubHistory";
import { useAuth } from "../auth/AuthContext";
import { ui } from "../styles/editorial";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LONG_WEEKDAYS = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];

const nameOf = (p: GitHubPerson) => p.full_name || p.username;
const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const dayOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-CA") : "undated");
const shortDate = (day: string | null) =>
  day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">{icon}{label}</p>
      <p className="mt-1 font-serif text-3xl text-stone-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-stone-200 bg-white p-1 shadow-sm">
      {options.map(([id, text]) => (
        <button key={id} type="button" role="radio" aria-checked={value === id} onClick={() => onChange(id)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${value === id ? "bg-maroon-800 text-amber-50" : "text-stone-600 hover:text-stone-900"}`}>
          {text}
        </button>
      ))}
    </div>
  );
}

function Who({ item }: { item: ActivityItem }) {
  if (item.user) {
    return (
      <Link to={`/profile/${item.user.id}`} className="inline-flex items-center gap-1.5 font-semibold text-stone-800 hover:text-maroon-800">
        <MemberAvatar name={nameOf(item.user)} src={item.user.avatar_url} size="xs" className="!h-5 !w-5 !text-[8px]" />
        {nameOf(item.user)}
      </Link>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-stone-600" title="This GitHub account is not linked to a DevZ-Go member">
      <Github className="h-3.5 w-3.5" /> {item.login ? `@${item.login}` : item.name || "Unknown author"}
    </span>
  );
}

function Entry({ item, showProject }: { item: ActivityItem; showProject: boolean }) {
  const commit = item.type === "commit";
  return (
    <li className="relative pl-12">
      <span aria-hidden className={`absolute left-0 top-3 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#FAF7EE] ${
        commit ? "bg-maroon-800 text-amber-50" : "bg-[#fced96] text-stone-900"}`}>
        {commit ? <GitCommitHorizontal className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
      </span>
      <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-maroon-200 hover:shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {commit ? (
            <p className="min-w-0 flex-1 break-words font-medium text-stone-900">{item.message || "(no message)"}</p>
          ) : (
            <p className="min-w-0 flex-1 font-medium text-stone-900">
              Pushed {item.commit_count ? `${item.commit_count} commit${item.commit_count === 1 ? "" : "s"}` : "changes"} to{" "}
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fced96] px-2 py-0.5 font-mono text-xs text-stone-900">
                <GitBranch className="h-3 w-3" /> {item.branch || "a branch"}
              </span>
            </p>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 font-mono text-[11px] text-stone-600 hover:border-maroon-300 hover:text-maroon-800">
              {commit ? item.sha.slice(0, 7) : "branch"} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
          <Who item={item} />
          {showProject && (
            <>
              <span aria-hidden>·</span>
              <Link to={`/project/${item.project.id}`} className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:underline">
                <FolderGit2 className="h-3.5 w-3.5" /> {item.project.title}
              </Link>
            </>
          )}
          {item.at && (
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <span aria-hidden>·</span><time dateTime={item.at}>{time(item.at)}</time>
            </span>
          )}
        </p>
      </article>
    </li>
  );
}

function Timeline({ items, showProject }: { items: ActivityItem[]; showProject: boolean }) {
  const groups = useMemo(() => {
    const out: { day: string; items: ActivityItem[] }[] = [];
    for (const item of items) {
      const day = dayOf(item.at);
      if (out.at(-1)?.day !== day) out.push({ day, items: [] });
      out.at(-1)!.items.push(item);
    }
    return out;
  }, [items]);

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const commits = group.items.filter((i) => i.type === "commit").length;
        return (
          <section key={group.day} aria-label={group.day === "undated" ? "Undated" : longDay(group.day)}>
            <h3 className="sticky top-20 z-10 -mx-1 mb-3 flex items-baseline justify-between gap-2 rounded-xl bg-[#FAF7EE]/95 px-1 py-1 backdrop-blur">
              <span className="font-serif text-lg text-stone-900">{group.day === "undated" ? "Undated" : longDay(group.day)}</span>
              <span className="text-xs text-stone-500">{commits} commit{commits === 1 ? "" : "s"} · {group.items.length - commits} push{group.items.length - commits === 1 ? "" : "es"}</span>
            </h3>
            <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[17px] before:top-2 before:w-px before:bg-stone-200">
              {group.items.map((item) => <Entry key={`${item.type}-${item.id}`} item={item} showProject={showProject} />)}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function Rhythm({ weekdays }: { weekdays: number[] }) {
  const top = Math.max(1, ...weekdays);
  return (
    <div className="flex h-28 items-end gap-2" role="img" aria-label={`Activity by weekday: ${weekdays.map((n, i) => `${WEEKDAYS[i]} ${n}`).join(", ")}`}>
      {weekdays.map((n, i) => (
        <div key={WEEKDAYS[i]} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-stone-500">{n || ""}</span>
          <span className="w-full rounded-t-md bg-gradient-to-t from-maroon-800 to-maroon-500" style={{ height: `${Math.max(4, (n / top) * 72)}px`, opacity: n ? 1 : 0.15 }} />
          <span className="text-[10px] font-semibold text-stone-500">{WEEKDAYS[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function PersonActivityPage() {
  return <ActivityLogPage mode="person" />;
}

export function ProjectActivityPage() {
  return <ActivityLogPage mode="project" />;
}

/** Every commit and push from repositories imported from GitHub, for one person or one project. */
function ActivityLogPage({ mode }: { mode: "person" | "project" }) {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kind, setKind] = useState<ActivityKind>("all");
  const [scope, setScope] = useState<ActivityScope>("mine");
  const [search, setSearch] = useState("");
  const [project, setProject] = useState<string | null>(() => (mode === "person" ? params.get("project") : null));
  const [day, setDay] = useState<string | null>(null);
  const q = useDeferredValue(search);
  const filters: ActivityFilters = { kind, q, project, day, scope };
  const target = mode === "project" ? { projectId: id } : { userId: id };

  const log = useInfiniteQuery({
    queryKey: ["activity-log", mode, id, filters],
    queryFn: ({ pageParam }) => fetchActivityLog(target, filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last: ActivityLog, pages) => {
      const loaded = pages.reduce((n, page) => n + page.items.length, 0);
      return loaded < last.total && last.items.length === PAGE_SIZE ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
    enabled: Boolean(id),
  });

  const first = log.data?.pages[0];
  const items = log.data?.pages.flatMap((p) => p.items) ?? [];
  const own = mode === "person" && user?.id === id;
  const subject = first?.subject;
  const title = subject?.kind === "project" ? subject.project.title : subject ? nameOf(subject.user) : "";
  const s = first?.summary;
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(mode === "project" ? `/project/${id}` : `/profile/${id}`));
  const filtered = kind !== "all" || q.trim() || project || day;

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-6xl`}>
        <button type="button" onClick={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-maroon-800">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {log.isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-maroon-700" /></div>
        ) : log.isError || !first || !s ? (
          <p className={ui.empty}>This activity log could not be loaded. It may be private, or the link is out of date.</p>
        ) : (
          <>
            <header className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#fced96]/50 blur-3xl" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  {subject?.kind === "project" ? (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-maroon-800 text-amber-50"><FolderGit2 className="h-7 w-7" /></span>
                  ) : subject ? (
                    <MemberAvatar name={nameOf(subject.user)} src={subject.user.avatar_url} size="lg" />
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">Activity log</p>
                    <h1 className="mt-1 break-words font-serif text-3xl text-stone-900 sm:text-4xl">{title}</h1>
                    <p className="mt-1 text-sm text-stone-600">
                      {subject?.kind === "project"
                        ? <>Every stored commit and push from this repository{subject.project.synced_at ? `, last read from GitHub ${shortDate(subject.project.synced_at.slice(0, 10))}` : ""}.</>
                        : scope === "team"
                          ? <>Everyone's commits and pushes on projects {own ? "you own or have" : `${nameOf(subject!.user)} owns or has`} joined.</>
                          : <>{own ? "Your" : "Their"} own commits and pushes across every imported project you can open.</>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {subject?.kind === "project" && subject.project.github_url && (
                    <a href={subject.project.github_url} target="_blank" rel="noreferrer" className={`${ui.btn} ${ui.neutral} rounded-full px-4 py-2`}>
                      <Github className="h-4 w-4" /> View on GitHub
                    </a>
                  )}
                  {subject?.kind === "person" && !first.restricted && (
                    <Segmented label="Whose activity" value={scope} onChange={(v) => { setScope(v); setProject(null); }}
                      options={[["mine", own ? "Your work" : "Their work"], ["team", "Whole team"]] as const} />
                  )}
                </div>
              </div>
            </header>

            {first.restricted ? (
              <p className={`${ui.empty} mt-6 flex items-center justify-center gap-2`}><Lock className="h-4 w-4" /> This profile is only open to connections, so its activity stays hidden.</p>
            ) : (
              <>
                <section aria-label="Summary" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <Stat label="Commits" value={s.commits.toLocaleString()} icon={<GitCommitHorizontal className="h-3.5 w-3.5" />} />
                  <Stat label="Pushes" value={s.pushes.toLocaleString()} icon={<ArrowUpFromLine className="h-3.5 w-3.5" />} />
                  {mode === "project"
                    ? <Stat label="Contributors" value={s.contributors} icon={<Users className="h-3.5 w-3.5" />} />
                    : <Stat label="Projects" value={s.projects} icon={<FolderGit2 className="h-3.5 w-3.5" />} />}
                  <Stat label="Active days" value={s.active_days} icon={<CalendarDays className="h-3.5 w-3.5" />} />
                  <Stat label="Longest streak" value={`${s.longest_streak}d`} hint={s.current_streak ? `${s.current_streak} day${s.current_streak === 1 ? "" : "s"} running now` : undefined}
                    icon={<Flame className="h-3.5 w-3.5" />} />
                  <Stat label="Last active" value={<span className="text-xl">{shortDate(s.last_day)}</span>} hint={s.first_day ? `Since ${shortDate(s.first_day)}` : undefined} />
                </section>

                <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="heatmap-title">
                  <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="heatmap-title" className="font-serif text-2xl text-stone-900">The last year</h2>
                    <p className="text-xs text-stone-500">Days in {first.timezone.replace(/_/g, " ")}</p>
                  </div>
                  <ContributionHeatmap rows={first.heatmap} start={first.heatmap_start} today={localToday()} selected={day} onSelect={setDay} />
                </section>

                <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                  <section aria-labelledby="timeline-title">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 id="timeline-title" className="font-serif text-2xl text-stone-900">Timeline</h2>
                      <Segmented label="Show" value={kind} onChange={setKind}
                        options={[["all", "Everything"], ["commits", "Commits"], ["pushes", "Pushes"]] as const} />
                    </div>
                    <label className="relative block">
                      <span className="sr-only">Search commit messages, branches and projects</span>
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages, branches, projects or a commit hash"
                        className={`${ui.input} rounded-full py-2.5 pl-9`} />
                    </label>
                    {(project || day) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {day && (
                          <button type="button" onClick={() => setDay(null)} className="inline-flex items-center gap-1 rounded-full bg-maroon-800 px-3 py-1 text-xs font-semibold text-amber-50">
                            {longDay(day)} <X className="h-3 w-3" />
                          </button>
                        )}
                        {project && (
                          <button type="button" onClick={() => setProject(null)} className="inline-flex items-center gap-1 rounded-full bg-maroon-800 px-3 py-1 text-xs font-semibold text-amber-50">
                            {first.projects.find((p) => p.id === project)?.title ?? "Project"} <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                    <p className="mb-4 mt-3 text-xs text-stone-500" aria-live="polite">
                      {log.isFetching && !log.isFetchingNextPage ? "Updating…" : `${first.total.toLocaleString()} ${filtered ? "matching " : ""}event${first.total === 1 ? "" : "s"}`}
                    </p>
                    {items.length === 0 ? (
                      <p className={ui.empty}>
                        {filtered ? "Nothing matches these filters." : s.legacy_projects
                          ? "These projects were imported before individual commits were kept. The owner can refresh them from GitHub to fill this log."
                          : "No commits or pushes from imported GitHub repositories yet."}
                      </p>
                    ) : (
                      <Timeline items={items} showProject={mode === "person"} />
                    )}
                    {log.hasNextPage && (
                      <div className="mt-6 flex justify-center">
                        <button type="button" onClick={() => void log.fetchNextPage()} disabled={log.isFetchingNextPage} className={`${ui.btn} ${ui.neutral} rounded-full px-5 py-2`}>
                          {log.isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Show older activity
                        </button>
                      </div>
                    )}
                  </section>

                  <aside className="space-y-4 lg:sticky lg:top-24">
                    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="rhythm-title">
                      <h2 id="rhythm-title" className="font-serif text-xl text-stone-900">Weekly rhythm</h2>
                      <p className="mb-3 mt-1 text-xs text-stone-500">
                        {s.busiest_weekday !== null ? `Most active on ${LONG_WEEKDAYS[s.busiest_weekday]}.` : "No dated activity yet."}
                      </p>
                      <Rhythm weekdays={s.weekdays} />
                    </section>
                    {mode === "person" && first.projects.length > 0 && (
                      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="projects-title">
                        <h2 id="projects-title" className="font-serif text-xl text-stone-900">By project</h2>
                        <p className="mb-3 mt-1 text-xs text-stone-500">Pick one to filter the timeline.</p>
                        <ul className="space-y-2">
                          {first.projects.map((p) => {
                            const top = Math.max(1, first.projects[0].commits + first.projects[0].pushes);
                            const on = project === p.id;
                            return (
                              <li key={p.id}>
                                <button type="button" aria-pressed={on} onClick={() => setProject(on ? null : p.id)}
                                  className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${on ? "border-maroon-700 bg-maroon-50" : "border-stone-200 hover:bg-stone-50"}`}>
                                  <span className="flex items-baseline justify-between gap-2">
                                    <span className="truncate text-sm font-semibold text-stone-900">{p.title}</span>
                                    <span className="shrink-0 text-[11px] text-stone-500">{p.commits}c · {p.pushes}p</span>
                                  </span>
                                  <span className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-stone-100">
                                    <span className="bg-maroon-700" style={{ width: `${(p.commits / top) * 100}%` }} />
                                    <span className="bg-[#E0B100]" style={{ width: `${(p.pushes / top) * 100}%` }} />
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    )}
                    <section className="rounded-3xl border border-stone-200 bg-[#f8f6f0] p-5 text-xs leading-relaxed text-stone-600">
                      <p className="font-semibold text-stone-800">How this log is built</p>
                      <p className="mt-1">
                        Commits and pushes come from repositories imported from GitHub. A commit counts for a member when it was made with the GitHub
                        account that imported the project, a GitHub account they linked, or their email. GitHub only shares about 90 days of pushes,
                        so older pushes appear only if the project was refreshed at the time. Private projects you cannot open never appear.
                      </p>
                      {day && <p className="mt-2 font-semibold text-maroon-800">{describeDay(day, first.heatmap.find(([d]) => d === day)?.[1] ?? 0, first.heatmap.find(([d]) => d === day)?.[2] ?? 0)}.</p>}
                    </section>
                  </aside>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
