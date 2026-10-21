import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { answerInvitation, fetchMyInvitations } from "../api/collaborations";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";
import { ui } from "../styles/editorial";

const btn = ui.btn;

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
    <section className="relative mb-6 rounded-2xl border-2 border-crimson-300 bg-crimson-50/60 p-5 shadow-xs">
      <h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-wider text-crimson-900">Project invitations ({data.length})</h2>
      {error && <p role="alert" className={`mb-2 ${ui.error}`}>{error}</p>}
      <ul className="space-y-2">
        {data.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white border border-crimson-200 p-3 font-sans text-sm text-stone-700">
            <span className="flex-1">
              <b>@{i.inviter.username}</b> invited you to <b>{i.project_title}</b> as {i.role} · expires {new Date(i.expires_at).toLocaleDateString()}
            </span>
            <button className={`${btn} ${ui.positive}`} disabled={answer.isPending}
              onClick={() => answer.mutate({ id: i.id, reply: "accept" })}>Accept</button>
            <button className={`${btn} ${ui.neutral}`} disabled={answer.isPending}
              onClick={() => answer.mutate({ id: i.id, reply: "decline" })}>Decline</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
