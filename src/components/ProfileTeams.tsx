import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, Crown, Heart, Loader2, MessageCircle, Users } from "lucide-react";
import { ACCESS_LEVELS, accessLabel, fetchUserCollaborations, type JoinedProject, type TeamMember } from "../api/collaborations";
import { assetUrlOrNull } from "../api/config";
import { fetchProfileGroups, type CollabGroup } from "../api/profiles";
import { MemberAvatar } from "./MemberAvatar";

const LANGUAGE_SHADES = ["bg-maroon-800", "bg-[#d4a017]", "bg-forest-600", "bg-stone-500", "bg-rose-400", "bg-stone-300"];

const joinedOn = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(iso)) : null;

/** Projects this person joined, and teams they lead, limited by the server to what the viewer may see. */
export function ProfileTeams({ userId, own }: { userId: string; own: boolean }) {
  const groups = useQuery({ queryKey: ["profile-groups", userId], queryFn: () => fetchProfileGroups(userId) });
  const joined = useQuery({ queryKey: ["profile-joined", userId], queryFn: () => fetchUserCollaborations(userId) });

  if (groups.isLoading || joined.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-maroon-700" />
      </div>
    );
  }

  const projects = joined.data ?? [];
  const leading = (groups.data ?? []).filter((team) => team.role === "Owner");

  if (leading.length === 0 && projects.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-200 bg-white px-8 py-16 text-center text-sm text-stone-600">
        {own
          ? "You are not on a team yet. Invite someone to a project, or ask to join one, and it will show up here."
          : "No teams or joined projects are visible to you. Private work stays hidden unless you are on that project, and a connections-only profile hides its public work too."}
      </div>
    );
  }

  const teammates = new Set(
    [...projects.flatMap((p) => p.team), ...leading.flatMap((t) => t.members)].map((m) => m.username),
  ).size - 1;

  return (
    <div className="space-y-10">
      <dl className="grid grid-cols-3 gap-3">
        <Stat label="Projects joined" value={projects.length} />
        <Stat label="Teams led" value={leading.length} />
        <Stat label="Teammates" value={Math.max(teammates, 0)} />
      </dl>

      {projects.length > 0 && <AccessMix projects={projects} />}

      <section>
        <h2 className="font-serif text-2xl text-stone-900">Projects joined</h2>
        {projects.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">None visible.</p>
        ) : (
          <ul className="mt-4 grid gap-5 md:grid-cols-2">
            {projects.map((project) => <JoinedCard key={project.id} project={project} />)}
          </ul>
        )}
      </section>

      {leading.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl text-stone-900">Teams they lead</h2>
          <ul className="mt-4 grid gap-5 md:grid-cols-2">
            {leading.map((team) => <TeamCard key={team.project_id} team={team} />)}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center shadow-sm">
      <dd className="font-serif text-3xl tabular-nums text-stone-900">{value}</dd>
      <dt className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</dt>
    </div>
  );
}

/** How much say this person has across their teams. */
function AccessMix({ projects }: { projects: JoinedProject[] }) {
  const counts = ACCESS_LEVELS.map((level) => ({ ...level, count: projects.filter((p) => p.access === level.value).length }));
  const shades = ["bg-stone-300", "bg-[#d4a017]", "bg-forest-600", "bg-maroon-800"];
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Access across teams</h3>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-stone-100">
        {counts.map((level, i) => level.count > 0 && (
          <span key={level.value} className={shades[i]} style={{ width: `${(level.count / projects.length) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-600">
        {counts.map((level, i) => (
          <li key={level.value} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${shades[i]}`} />
            {level.label} <span className="tabular-nums text-stone-400">{level.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Four steps from Viewer to Manager, filled up to this member's level. */
function AccessMeter({ access }: { access: string }) {
  const level = ACCESS_LEVELS.findIndex((l) => l.value === access) + 1;
  return (
    <div className="flex items-center gap-2" title={ACCESS_LEVELS[level - 1]?.detail}>
      <div className="flex gap-0.5" aria-hidden>
        {ACCESS_LEVELS.map((l, i) => (
          <span key={l.value} className={`h-1.5 w-5 rounded-full ${i < level ? "bg-maroon-800" : "bg-stone-200"}`} />
        ))}
      </div>
      <span className="text-xs font-semibold text-maroon-800">{accessLabel(access)}</span>
    </div>
  );
}

function TeamStack({ team }: { team: TeamMember[] }) {
  const shown = team.slice(0, 5);
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <span key={m.username} title={`@${m.username} · ${m.role}`}>
            <MemberAvatar name={m.username} src={m.avatar_url} size="xs" className="ring-2 ring-white" />
          </span>
        ))}
      </div>
      <span className="text-xs text-stone-500">
        {team.length > shown.length ? `+${team.length - shown.length} · ` : ""}{team.length} {team.length === 1 ? "person" : "people"}
      </span>
    </div>
  );
}

function JoinedCard({ project }: { project: JoinedProject }) {
  const cover = assetUrlOrNull(project.cover_image_url);
  const since = joinedOn(project.joined_at);
  return (
    <li className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:border-maroon-800 hover:shadow-md">
      <Link to={`/project/${project.id}`} className="relative block h-32 bg-gradient-to-br from-maroon-900 via-maroon-800 to-stone-900">
        {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <span className="absolute right-3 top-3 rounded-full bg-[#fced96] px-2.5 py-0.5 text-[11px] font-semibold text-stone-900">
          {project.contribution_info || "Collaborator"}
        </span>
        <span className="absolute inset-x-4 bottom-3 block">
          <span className="block truncate font-serif text-xl text-white">{project.title}</span>
          {project.owner_username && (
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-white/80">
              <Crown className="h-3 w-3" aria-hidden /> led by @{project.owner_username}
            </span>
          )}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <AccessMeter access={project.access} />
        {project.focus && (
          <p className="rounded-xl bg-[#f7f5ed] px-3 py-2 text-xs text-stone-700">
            <span className="font-semibold text-stone-900">Working on:</span> {project.focus}
          </p>
        )}
        {project.languages.length > 0 && (
          <div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-stone-100">
              {project.languages.map((l, i) => (
                <span key={l.name} className={LANGUAGE_SHADES[i % LANGUAGE_SHADES.length]} style={{ width: `${l.percentage}%` }} />
              ))}
            </div>
            <p className="mt-1.5 truncate text-[11px] text-stone-500">
              {project.languages.slice(0, 3).map((l) => `${l.name} ${Math.round(l.percentage)}%`).join(" · ")}
            </p>
          </div>
        )}
        {project.tech_stacks.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {project.tech_stacks.slice(0, 4).map((t) => (
              <li key={t} className="rounded-full border border-stone-200 px-2 py-0.5 text-[11px] text-stone-600">{t}</li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
          <TeamStack team={project.team} />
          <span className="flex items-center gap-3 text-xs text-stone-500">
            {since && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden /> {since}</span>}
            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" aria-hidden /> {project.likes_count}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" aria-hidden /> {project.comments_count}</span>
          </span>
        </div>
      </div>
    </li>
  );
}

function TeamCard({ team }: { team: CollabGroup }) {
  return (
    <li className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Users className="h-4 w-4 text-maroon-800" aria-hidden />
        <Link to={`/project/${team.project_id}`} className="font-serif text-lg text-stone-900 hover:text-maroon-800">{team.title}</Link>
        <span className="rounded-full bg-[#fced96] px-2 py-0.5 text-[11px] font-semibold text-stone-800">{team.visibility}</span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {team.members.map((m) => (
          <li key={m.username} className="flex items-center gap-3">
            <MemberAvatar name={m.username} src={m.avatar_url} size="sm" />
            <span className="min-w-0 flex-1">
              <Link to={m.user_id ? `/profile/${m.user_id}` : "#"} className="block truncate text-sm font-semibold text-stone-900 hover:text-maroon-800">
                {m.full_name || `@${m.username}`}
              </Link>
              <span className="block truncate text-xs text-stone-500">{m.focus ? `Working on ${m.focus}` : m.role}</span>
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              m.access === "owner" ? "bg-maroon-800 text-[#fced96]" : "bg-stone-100 text-stone-700"}`}>
              {accessLabel(m.access)}
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}
