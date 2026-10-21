import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, UserPlus } from "lucide-react";
import {
  acceptConnection,
  declineConnection,
  fetchConnectionStatus,
  removeConnection,
  sendConnectionRequest,
} from "../api/connections";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";

const base = "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition disabled:opacity-60";
const primary = `${base} bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg`;
const quiet = `${base} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`;

/** Every connection action for one person, driven by the server's view of the pair. */
export function ConnectButton({ userId, onChange }: { userId: string; onChange?: () => void }) {
  const client = useQueryClient();
  const { data } = useQuery({
    queryKey: [...queryKeys.connections, "status", userId],
    queryFn: () => fetchConnectionStatus(userId),
  });
  const [error, setError] = useState<string | null>(null);
  const act = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onMutate: () => setError(null),
    onError: (err) => setError(getApiErrorMessage(err)),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: queryKeys.connections });
      onChange?.();
    },
  });
  const id = data?.connectionId ?? "";
  const busy = act.isPending || !data;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {data?.status === "connected" ? (
        <>
          <span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200`}>
            <Check className="w-3.5 h-3.5" /> Connected
          </span>
          <button type="button" className={quiet} disabled={busy}
            onClick={() => window.confirm("Remove this connection?") && act.mutate(() => removeConnection(id))}>
            Remove
          </button>
        </>
      ) : data?.status === "pending_sent" ? (
        <>
          <span className={`${base} bg-gray-100 text-gray-500`}>Request sent</span>
          <button type="button" className={quiet} disabled={busy} onClick={() => act.mutate(() => removeConnection(id))}>
            Withdraw
          </button>
        </>
      ) : data?.status === "pending_received" ? (
        <>
          <button type="button" className={`${base} bg-emerald-600 text-white hover:bg-emerald-700`} disabled={busy}
            onClick={() => act.mutate(() => acceptConnection(id))}>
            Accept request
          </button>
          <button type="button" className={quiet} disabled={busy} onClick={() => act.mutate(() => declineConnection(id))}>
            Decline
          </button>
        </>
      ) : (
        <button type="button" className={primary} disabled={busy} onClick={() => act.mutate(() => sendConnectionRequest(userId))}>
          <UserPlus className="w-3.5 h-3.5" /> Connect
        </button>
      )}
      {error && <p role="alert" className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
