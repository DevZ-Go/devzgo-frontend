import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { answerInvitation, fetchMyInvitations } from "../api/collaborations";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";

const btn = "rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60";

/** Project invitations waiting for me; hidden when there are none. */
export function InvitationsInbox() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: [...queryKeys.collab, "invitations", "mine"], queryFn: fetchMyInvitations });
  const [error, setError] = useState<string | null>(null);
  const answer = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: "accept" | "decline" }) => answerInvitation(id, reply),
    onMutate: () => setError(null),
    onSuccess: (_, { id, reply }) => {
      const invitation = data?.find((i) => i.id === id);
      if (reply === "accept" && invitation) navigate(`/project/${invitation.project_id}`);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.collab }),
  });
  if (!data?.length) return null;

  return (
    <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <h2 className="mb-2 text-sm font-semibold text-amber-900">Project invitations ({data.length})</h2>
      {error && <p role="alert" className="mb-2 text-xs text-red-600">{error}</p>}
      <ul className="space-y-2">
        {data.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <span className="flex-1">
              <b>@{i.inviter.username}</b> invited you to <b>{i.project_title}</b> as {i.role} · expires {new Date(i.expires_at).toLocaleDateString()}
            </span>
            <button className={`${btn} bg-emerald-600 text-white`} disabled={answer.isPending}
              onClick={() => answer.mutate({ id: i.id, reply: "accept" })}>Accept</button>
            <button className={`${btn} border border-slate-200 bg-white text-slate-700`} disabled={answer.isPending}
              onClick={() => answer.mutate({ id: i.id, reply: "decline" })}>Decline</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
