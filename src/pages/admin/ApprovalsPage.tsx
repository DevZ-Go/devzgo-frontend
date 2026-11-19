import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelProposal, fetchAdminSession, fetchProposals, voteProposal, type ActionPreview, type Proposal } from "../../api/admin";
import { getApiErrorMessage } from "../../utils/apiError";
import { ui } from "../../styles/editorial";
import { Banner, Loading, panel, when } from "./bits";
import { useGuard } from "./guard";

export function ApprovalsPage() {
  const [status, setStatus] = useState("pending");
  const proposals = useQuery({ queryKey: ["admin", "proposals", status], queryFn: () => fetchProposals(status) });
  const session = useQuery({ queryKey: ["admin", "session"], queryFn: fetchAdminSession });
  const { ask } = useGuard();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
  }

  async function vote(proposal: Proposal, decision: "approve" | "reject") {
    setMessage(null);
    setError(null);
    const word = decision === "approve" ? "APPROVE" : "REJECT";
    const confirmed = await ask({
      load: async (): Promise<ActionPreview> => ({
        action: `proposal.${decision}`,
        label: decision === "approve" ? "Approve this change" : "Stop this change",
        severity: "critical",
        warning: proposal.warning,
        typed_label: `Type ${word} to confirm`,
        typed_value: word,
        casefold: false,
        summary: proposal.summary,
        required_approvals: proposal.required_approvals,
        eligible_admins: null,
        blocked: proposal.my_vote ? "You already responded to this request." : null,
      }),
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      const result = await voteProposal(proposal.id, decision, confirmed.typed, confirmed.reason);
      setMessage(result.status === "executed" ? (result.result || "The change has been made.") : result.status === "rejected" ? "The change was stopped." : `Approval recorded. ${result.approvals ?? ""} of ${result.required_approvals ?? proposal.required_approvals} so far.`);
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancel(proposal: Proposal) {
    const confirmed = await ask({
      requireReason: false,
      load: async (): Promise<ActionPreview> => ({
        action: "proposal.cancel",
        label: "Cancel this request",
        severity: "important",
        warning: "The change will not happen. Another admin can submit it again later.",
        typed_label: "Type CANCEL to confirm",
        typed_value: "CANCEL",
        casefold: false,
        summary: proposal.summary,
        required_approvals: null,
        eligible_admins: null,
        blocked: null,
      }),
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await cancelProposal(proposal.id);
      setMessage("The request was cancelled before it ran.");
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["pending", "executed", "rejected", "cancelled", "all"].map((item) => (
          <button key={item} type="button" className={`${ui.btn} px-3 py-2 text-sm ${status === item ? ui.primary : ui.neutral}`} onClick={() => setStatus(item)}>
            {item}
          </button>
        ))}
      </div>
      {message && <Banner tone="ok">{message}</Banner>}
      {error && <Banner tone="bad">{error}</Banner>}
      {proposals.isLoading && <Loading />}
      <div className="grid gap-3">
        {proposals.data?.map((proposal) => (
          <article key={proposal.id} className={panel}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-xl font-bold">{proposal.summary}</h2>
              <span className="rounded-full bg-[#6B0B0C] px-2 py-0.5 text-xs font-semibold uppercase text-[#FFF8CA]">{proposal.status}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#7F1D1D]">{proposal.warning}</p>
            <p className="mt-2 text-sm text-stone-700">Reason from {proposal.proposer_email}: {proposal.reason}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
              {proposal.approvals} of {proposal.required_approvals} approvals · {when(proposal.created_at)}
              {proposal.approvers.length > 0 ? ` · ${proposal.approvers.join(", ")}` : ""}
            </p>
            {proposal.result && <p className="mt-2 text-sm font-medium text-[#14532D]">{proposal.result}</p>}
            {proposal.status === "pending" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {!proposal.my_vote && (
                  <>
                    <button type="button" disabled={busy} className={`${ui.btn} ${ui.primary} px-3 py-2 text-sm`} onClick={() => void vote(proposal, "approve")}>Approve</button>
                    <button type="button" disabled={busy} className={`${ui.btn} ${ui.danger} px-3 py-2 text-sm`} onClick={() => void vote(proposal, "reject")}>Stop it</button>
                  </>
                )}
                {proposal.my_vote === "approve" && proposal.proposer_email === session.data?.email && (
                  <button type="button" disabled={busy} className={`${ui.btn} ${ui.neutral} px-3 py-2 text-sm`} onClick={() => void cancel(proposal)}>Cancel my request</button>
                )}
              </div>
            )}
          </article>
        ))}
        {proposals.data && proposals.data.length === 0 && <p className={ui.empty}>Nothing in this list.</p>}
      </div>
    </div>
  );
}
