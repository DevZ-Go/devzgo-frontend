import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { fetchMyChallenges, inviteDevelopers } from "../../api/challenges";
import { queryKeys } from "../../api/queryKeys";
import { ui } from "../../styles/editorial";
import { getApiErrorMessage } from "../../utils/apiError";
import { deadlineText } from "../../utils/challenges";

/** Invite one developer to one of the recruiter's open challenges. */
export function InviteToChallenge({ developerId }: { developerId: string }) {
  const client = useQueryClient();
  const challenges = useQuery({ queryKey: [...queryKeys.challenges, "mine"], queryFn: fetchMyChallenges });
  const open = (challenges.data ?? []).filter((c) => c.accepting);
  const [picked, setPicked] = useState("");
  const [message, setMessage] = useState("");
  const challengeId = picked || open[0]?.id || "";
  const invite = useMutation({
    mutationFn: () => inviteDevelopers(challengeId, [developerId], message.trim()),
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.challenges }),
  });
  const skipped = invite.data?.skipped[developerId];

  if (challenges.isLoading) return <Loader2 className="h-4 w-4 animate-spin text-maroon-700" />;
  if (!open.length) {
    return (
      <p className="text-sm text-stone-600">
        You have no open challenges. <Link to="/recruit/challenges/new" className={ui.link}>Create one</Link> and publish it to invite people.
      </p>
    );
  }
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); invite.mutate(); }}>
      <label className="block text-xs font-semibold text-stone-600">
        Challenge
        <select value={challengeId} onChange={(e) => { setPicked(e.target.value); invite.reset(); }} className={`${ui.input} mt-1`}>
          {open.map((c) => <option key={c.id} value={c.id}>{c.title} · {deadlineText(c.deadline_at)}</option>)}
        </select>
      </label>
      <label className="block text-xs font-semibold text-stone-600">
        Note <span className="font-normal text-stone-400">(optional)</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={1000} className={`${ui.input} mt-1`}
          placeholder="Why you think this challenge suits them" />
      </label>
      {invite.isError && <p className={ui.error}>{getApiErrorMessage(invite.error)}</p>}
      {invite.isSuccess && (skipped
        ? <p className="text-xs text-amber-900">Not invited: {skipped}.</p>
        : <p className="text-xs text-forest-700">Invitation sent. They will see it under Assessments.</p>)}
      <button type="submit" disabled={invite.isPending || !challengeId} className={`${ui.btn} ${ui.neutral} w-full py-2`}>
        {invite.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send invitation
      </button>
    </form>
  );
}
