import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { MemberAvatar } from "./MemberAvatar";

export type ProjectTeamPerson = {
  user_id?: string | null;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  is_owner?: boolean;
};

type Props = {
  people: ProjectTeamPerson[];
  /** Faces shown in the compact stack before expand (multi only). */
  maxVisible?: number;
  size?: "sm" | "md";
  className?: string;
  /** Light chips on dark card overlays. */
  onDark?: boolean;
};

function profileHref(person: ProjectTeamPerson) {
  return person.user_id ? `/profile/${person.user_id}` : `/profile/${person.username}`;
}

function label(person: ProjectTeamPerson) {
  return (person.full_name || person.username || "Developer").trim();
}

export function ProjectTeamAvatars({
  people,
  maxVisible = 4,
  size = "sm",
  className = "",
  onDark = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const list = people.filter((p) => p?.username);

  if (list.length === 0) return null;

  const chip = size === "md" ? "!h-8 !w-8" : "!h-7 !w-7";
  const ring = onDark ? "ring-2 ring-white/80" : "ring-2 ring-white";
  const solo = list.length === 1;

  // Solo owner/collaborator: go straight to their profile.
  if (solo) {
    const person = list[0];
    return (
      <Link
        to={profileHref(person)}
        title={`@${person.username}`}
        aria-label={`Open @${person.username}'s profile`}
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/40 ${className}`}
      >
        <span className={`rounded-full ${ring}`}>
          <MemberAvatar name={label(person)} src={person.avatar_url} size="sm" className={chip} />
        </span>
      </Link>
    );
  }

  const stack = list.slice(0, maxVisible);
  const overflow = Math.max(0, list.length - stack.length);

  return (
    <div className={`relative inline-flex flex-col items-start ${className}`}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={expanded ? "Hide team list" : `Show all ${list.length} teammates`}
        title={expanded ? "Hide team" : "Show everyone on this project"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="inline-flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/40"
      >
        <span className="flex items-center">
          {stack.map((person, idx) => (
            <span
              key={`${person.user_id || person.username}-${idx}`}
              className={`relative rounded-full ${ring} ${idx > 0 ? "-ml-2" : ""}`}
              style={{ zIndex: stack.length - idx }}
            >
              <MemberAvatar name={label(person)} src={person.avatar_url} size="sm" className={chip} />
            </span>
          ))}
          {overflow > 0 && !expanded && (
            <span
              className={`relative -ml-2 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${ring} ${
                onDark ? "bg-stone-900/90 text-white" : "bg-stone-800 text-white"
              }`}
              style={{ zIndex: 0 }}
            >
              +{overflow}
            </span>
          )}
        </span>
      </button>

      {expanded && (
        <div
          id={panelId}
          role="region"
          aria-label="Everyone on this project"
          className={`mt-2 w-64 overflow-hidden rounded-2xl border shadow-lg ${
            onDark ? "border-white/20 bg-white" : "border-stone-200 bg-white"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Team · {list.length}
            </p>
            <button
              type="button"
              className="text-[11px] font-semibold text-stone-500 hover:text-stone-800"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded(false);
              }}
            >
              Close
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {list.map((person) => (
              <li key={person.user_id || person.username}>
                <Link
                  to={profileHref(person)}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-stone-50"
                >
                  <MemberAvatar
                    name={label(person)}
                    src={person.avatar_url}
                    size="sm"
                    className="!h-8 !w-8 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-stone-900">{label(person)}</span>
                    <span className="block truncate text-xs text-stone-500">
                      @{person.username}
                      {person.is_owner ? " · Owner" : person.role ? ` · ${person.role}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Build team list from a project list/detail payload (owner + collaborators). */
export function teamFromProject(project: {
  owner_id?: string | null;
  owner_username?: string | null;
  owner_avatar_url?: string | null;
  owner?: { username?: string; name?: string; avatar?: string } | null;
  team?: ProjectTeamPerson[] | null;
}): ProjectTeamPerson[] {
  if (Array.isArray(project.team) && project.team.length > 0) {
    return project.team.map((m) => ({
      user_id: m.user_id ? String(m.user_id) : null,
      username: m.username,
      full_name: m.full_name ?? null,
      avatar_url: m.avatar_url ?? null,
      role: m.role ?? (m.is_owner ? "Owner" : "Collaborator"),
      is_owner: Boolean(m.is_owner),
    }));
  }
  const username = project.owner_username || project.owner?.username;
  if (!username) return [];
  return [{
    user_id: project.owner_id ? String(project.owner_id) : null,
    username,
    full_name: project.owner?.name || username,
    avatar_url: project.owner_avatar_url || project.owner?.avatar || null,
    role: "Owner",
    is_owner: true,
  }];
}
