import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import {
  NO_PERMISSIONS,
  acceptCollaborationRequest,
  answerInvitation,
  declineCollaborationRequest,
  fetchMyCollabStatus,
  fetchProjectCollaborationRequests,
  fetchProjectCollaborators,
  fetchProjectInvitations,
  inviteCollaborator,
  leaveProject,
  removeMember,
  revokeInvitation,
  searchInvitees,
  updateMemberPermissions,
  withdrawCollabRequest,
} from "../api/collaborations";
import { queryKeys } from "../api/queryKeys";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../utils/apiError";
import type { CollabPermissions } from "../types/network";
import { CollaborationModal } from "./CollaborationModal";
import { ui } from "../styles/editorial";

const LABELS: [keyof CollabPermissions, string][] = [
  ["can_edit_details", "Edit details"],
  ["can_manage_files", "Manage files"],
  ["can_view_secrets", "View secret files"],
];
const btn = ui.btn;
const quiet = `${btn} ${ui.neutral}`;
const primary = `${btn} ${ui.primary}`;

function PermissionToggles({ value, onChange, disabled }: {
  value: CollabPermissions;
  onChange: (next: CollabPermissions) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {LABELS.map(([key, label]) => (
        <label key={key} className="flex items-center gap-1.5 font-sans text-xs text-stone-600">
          <input type="checkbox" className="accent-forest-700" checked={value[key]} disabled={disabled}
            onChange={(e) => onChange({ ...value, [key]: e.target.checked })} />
          {label}
        </label>
      ))}
    </div>
  );
}

/** Everything about the project's team: members, and the actions open to the owner or to the viewer. */
export function TeamPanel({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const { token } = useAuth();
  const client = useQueryClient();
  const key = [...queryKeys.collab, projectId];
  const members = useQuery({ queryKey: [...key, "members"], queryFn: () => fetchProjectCollaborators(projectId) });
  const me = useQuery({ queryKey: [...key, "me"], queryFn: () => fetchMyCollabStatus(projectId), enabled: Boolean(token) });
  const isOwner = me.data?.status === "owner";
  const requests = useQuery({ queryKey: [...key, "requests"], queryFn: () => fetchProjectCollaborationRequests(projectId), enabled: isOwner });
  const invitations = useQuery({ queryKey: [...key, "invitations"], queryFn: () => fetchProjectInvitations(projectId), enabled: isOwner });

  const [error, setError] = useState<string | null>(null);
  const act = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onMutate: () => setError(null),
    onError: (err) => setError(getApiErrorMessage(err)),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: queryKeys.collab });
      void client.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
  const run = (fn: () => Promise<unknown>) => act.mutate(fn);
  const [showRequest, setShowRequest] = useState(false);

  const [username, setUsername] = useState("");
  const [term, setTerm] = useState("");
  const [role, setRole] = useState("Collaborator");
  const [perms, setPerms] = useState<CollabPermissions>(NO_PERMISSIONS);
  useEffect(() => {
    const t = setTimeout(() => setTerm(username.trim()), 300);
    return () => clearTimeout(t);
  }, [username]);
  const matches = useQuery({
    queryKey: [...key, "invitee-search", term],
    queryFn: () => searchInvitees(projectId, term),
    enabled: isOwner && term.length > 0,
  });

  const status = me.data?.status;
  const list = members.data ?? [];

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white shadow-sm p-6 sm:p-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-stone-900">
          <Users className="w-5 h-5 text-forest-700" />
          <h2 className="font-serif text-2xl text-stone-900">Team ({list.length})</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "none" && <button className={primary} onClick={() => setShowRequest(true)}>Request to join</button>}
          {status === "requested" && (
            <>
              <span className={`${btn} bg-stone-100 text-stone-500 border border-stone-200`}>Request sent</span>
              <button className={quiet} disabled={act.isPending} onClick={() => run(() => withdrawCollabRequest(me.data!.request_id!))}>Withdraw</button>
            </>
          )}
          {status === "invited" && (
            <>
              <button className={`${btn} ${ui.positive}`} disabled={act.isPending}
                onClick={() => run(() => answerInvitation(me.data!.invitation_id!, "accept"))}>Accept invitation</button>
              <button className={quiet} disabled={act.isPending}
                onClick={() => run(() => answerInvitation(me.data!.invitation_id!, "decline"))}>Decline</button>
            </>
          )}
          {status === "member" && (
            <button className={quiet} disabled={act.isPending}
              onClick={() => window.confirm("Leave this project?") && run(() => leaveProject(projectId))}>Leave project</button>
          )}
        </div>
      </div>
      {error && <p role="alert" className={ui.error}>{error}</p>}

      <ul className="divide-y divide-stone-100">
        {list.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
            <Link to={`/profile/${m.userId}`} className="min-w-0 flex-1">
              <span className="block truncate font-cursive text-xl font-bold text-[#1C1917]">{m.fullName || m.username}</span>
              <span className="block truncate font-sans text-xs text-stone-500">@{m.username} · {m.role}</span>
            </Link>
            {isOwner && !m.isOwner && (
              <>
                <PermissionToggles value={m.permissions ?? NO_PERMISSIONS} disabled={act.isPending}
                  onChange={(next) => run(() => updateMemberPermissions(projectId, m.userId, next))} />
                <button className={quiet} disabled={act.isPending}
                  onClick={() => window.confirm(`Remove ${m.fullName || m.username} from the team?`) && run(() => removeMember(projectId, m.userId))}>
                  Remove
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {isOwner && (requests.data?.length ?? 0) > 0 && (
        <div>
          <h3 className="mb-2 font-serif text-base text-stone-900">Join requests</h3>
          {requests.data!.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="flex-1 font-sans text-sm text-stone-700">
                <b>{r.requester.fullName || r.requester.username}</b> as {r.role}
                {r.message && <span className="block text-xs text-stone-500">“{r.message}”</span>}
              </span>
              <button className={`${btn} ${ui.positive}`} disabled={act.isPending}
                onClick={() => run(() => acceptCollaborationRequest(r.id, projectId))}>Accept</button>
              <button className={quiet} disabled={act.isPending} onClick={() => run(() => declineCollaborationRequest(r.id))}>Decline</button>
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="space-y-3 rounded-xl border border-forest-600/20 bg-[#FAF7EE] p-4">
          <h3 className="font-serif text-base text-stone-900">Invite by username</h3>
          <div className="flex flex-wrap gap-2">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" aria-label="Invite username"
              className={`min-w-0 flex-1 ${ui.input} py-1.5`} />
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" aria-label="Invite role"
              className={`!w-40 ${ui.input} py-1.5`} />
            <button className={primary} disabled={act.isPending || !username.trim() || !role.trim()}
              onClick={() => run(async () => {
                await inviteCollaborator(projectId, { username: username.trim(), role: role.trim(), permissions: perms });
                setUsername("");
                setPerms(NO_PERMISSIONS);
              })}>
              Invite
            </button>
          </div>
          {(matches.data?.length ?? 0) > 0 && username.trim() && (
            <ul className="flex flex-wrap gap-2">
              {matches.data!.map((u) => (
                <li key={u.id}>
                  <button className={quiet} disabled={u.status !== "none"} onClick={() => setUsername(u.username)}>
                    @{u.username}{u.status !== "none" ? ` (${u.status})` : ""}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <PermissionToggles value={perms} onChange={setPerms} />
          {(invitations.data ?? []).map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-3 font-sans text-sm text-stone-700">
              <span className="flex-1">
                Invited <b>@{i.invitee.username}</b> as {i.role} · expires {new Date(i.expires_at).toLocaleDateString()}
              </span>
              <button className={quiet} disabled={act.isPending} onClick={() => run(() => revokeInvitation(i.id))}>Revoke</button>
            </div>
          ))}
        </div>
      )}

      {showRequest && (
        <CollaborationModal projectId={projectId} projectTitle={projectTitle} isOpen onClose={() => setShowRequest(false)}
          onSuccess={() => void client.invalidateQueries({ queryKey: queryKeys.collab })} />
      )}
    </section>
  );
}
