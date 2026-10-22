import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { fetchUserCollaborations } from "../api/collaborations";
import { fetchProfileGroups } from "../api/profiles";

/** Teams and joined projects the viewer is allowed to see. */
export function ProfileTeams({ userId, own }: { userId: string; own: boolean }) {
  const groups = useQuery({ queryKey: ["profile-groups", userId], queryFn: () => fetchProfileGroups(userId) });
  const joined = useQuery({ queryKey: ["profile-joined", userId], queryFn: () => fetchUserCollaborations(userId) });
  const loading = groups.isLoading || joined.isLoading;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-maroon-700" />
      </div>
    );
  }

  const teams = groups.data ?? [];
  const projects = joined.data ?? [];
  const leading = teams.filter((team) => team.role === "Owner");
  const memberOf = teams.filter((team) => team.role !== "Owner");

  if (teams.length === 0 && projects.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-200 bg-white px-8 py-16 text-center text-sm text-stone-600">
        {own
          ? "You are not on a team yet. Invite someone to a project and the group will show up here."
          : "No teams or joined projects are visible to you. Private work stays hidden unless you are on that project, and a connections-only profile hides its public work too."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-2xl text-stone-900">Projects they joined</h2>
        <p className="mt-1 text-xs text-stone-500">Only memberships you are allowed to see.</p>
        {projects.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">None visible.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link to={`/project/${project.id}`} className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-sm hover:border-maroon-800">
                  <span className="font-semibold text-stone-900">{project.title}</span>
                  <span className="mt-1 block text-xs text-stone-500">
                    {project.contribution_info || "Collaborator"}
                    {project.owner_username ? ` · with @${project.owner_username}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TeamList title="Teams they lead" teams={leading} empty="No visible teams led by this person." />
      <TeamList title="Teams they belong to" teams={memberOf} empty="No other visible teams." />
    </div>
  );
}

function TeamList({ title, teams, empty }: {
  title: string;
  teams: { project_id: string; title: string; visibility: string; role: string; members: { username: string; role: string }[] }[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-stone-900">{title}</h2>
      {teams.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {teams.map((team) => (
            <li key={team.project_id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/project/${team.project_id}`} className="font-semibold text-stone-900 hover:text-maroon-800">{team.title}</Link>
                <span className="rounded-full bg-[#fced96] px-2 py-0.5 text-[11px] font-semibold text-stone-800">{team.visibility}</span>
                <span className="text-xs text-stone-500">{team.role}</span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {team.members.map((member) => (
                  <li key={`${team.project_id}-${member.username}`} className="rounded-full border border-stone-200 px-2.5 py-1 text-xs text-stone-700">
                    @{member.username} · {member.role}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
