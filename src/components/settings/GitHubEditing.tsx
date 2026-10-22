import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { disconnectGitHubEditing, fetchConnection, startGitHubEditing } from "../../api/workspace";
import { useAccount } from "../../auth/account";
import { ui } from "../../styles/editorial";
import { getApiErrorMessage } from "../../utils/apiError";

export function GitHubEditing() {
  const { recruiter } = useAccount();
  const [params] = useSearchParams();
  const connection = useQuery({ queryKey: ["github-connection"], queryFn: fetchConnection, enabled: !recruiter });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const justConnected = params.get("connected") === "1";
  const denied = params.get("error");

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      window.location.assign(await startGitHubEditing());
    } catch (err) {
      setError(getApiErrorMessage(err));
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      await disconnectGitHubEditing();
      await connection.refetch();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (recruiter) {
    return (
      <div>
        <h2 className="font-serif text-2xl text-stone-900">GitHub for editing</h2>
        <p className="mt-2 text-sm text-stone-500">Developer accounts connect GitHub when they want to commit. Recruiter accounts stay read-only.</p>
      </div>
    );
  }

  const row = connection.data;
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl text-stone-900">GitHub for editing</h2>
      <p className="text-sm text-stone-500">
        This connection is only for commits and pull requests you make. It is separate from sign-in and from importing a repository, and DevZ-Go never commits with someone else’s token.
      </p>
      {justConnected && <p className="text-sm font-medium text-forest-800">GitHub is connected for editing.</p>}
      {denied && <p className={ui.error}>{denied === "denied" ? "GitHub authorization was cancelled." : "GitHub couldn’t be connected. Try again."}</p>}
      {row?.connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-[#f8f6f0] px-4 py-3">
          <p className="text-sm text-stone-700">Connected as <span className="font-semibold">{row.login}</span></p>
          <button type="button" className={`${ui.btn} ${ui.neutral}`} disabled={busy} onClick={() => void disconnect()}>Disconnect</button>
        </div>
      ) : (
        <button type="button" className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`} disabled={busy || connection.isLoading} onClick={() => void connect()}>
          {busy ? "Opening GitHub…" : "Connect GitHub"}
        </button>
      )}
      {row && !row.configured && !row.connected && <p className="text-sm text-stone-500">Editing isn’t configured on this server yet.</p>}
      {error && <p className={ui.error}>{error}</p>}
    </div>
  );
}
