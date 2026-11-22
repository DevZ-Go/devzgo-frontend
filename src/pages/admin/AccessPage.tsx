import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAccess } from "../../api/admin";
import { getApiErrorMessage } from "../../utils/apiError";
import { ui } from "../../styles/editorial";
import { Banner, Loading, panel, when } from "./bits";
import { useAdminAction } from "./guard";

export function AccessPage() {
  const access = useQuery({ queryKey: ["admin", "access"], queryFn: fetchAccess });
  const perform = useAdminAction();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function grant(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const result = await perform({ action: "admin.grant", payload: { email: email.trim() } });
      if (result?.summary) {
        setMessage(result.summary);
        setEmail("");
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(action: string, payload: Record<string, string>, target?: string) {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const result = await perform({ action, target_id: target, payload });
      if (result?.status === "pending") setMessage(`Queued (${result.required_approvals} approvals).`);
      else if (result?.summary) setMessage(result.summary);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (access.isLoading) return <Loading />;
  if (!access.data) return <p className={ui.error}>Access unavailable.</p>;
  const data = access.data;

  return (
    <div className="space-y-4">
      {message && <Banner tone="ok">{message}</Banner>}
      {error && <Banner tone="bad">{error}</Banner>}

      <form onSubmit={grant} className={`${panel} !p-4 flex flex-col gap-2 sm:flex-row sm:items-end`}>
        <label className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          Grant access
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            className={`${ui.input} mt-1 font-normal normal-case tracking-normal`}
            placeholder="name@example.com"
          />
        </label>
        <button type="submit" disabled={busy} className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`}>
          Grant
        </button>
      </form>

      <p className="text-[11px] text-stone-400">Owner {data.owner_email} cannot be removed</p>

      <section className="grid gap-2">
        {data.admins.map((admin) => (
          <article key={admin.user_id} className={`${panel} !p-3`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#2D120D]">{admin.email}</p>
                <p className="text-xs text-stone-500">
                  @{admin.username} · {admin.role} · {when(admin.created_at)}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Link to={`/admin/people/${admin.user_id}`} className={`${ui.btn} ${ui.neutral} px-3 py-1.5`}>
                  Open
                </Link>
                {admin.role !== "owner" && admin.email !== data.you && (
                  <button
                    type="button"
                    disabled={busy}
                    className={`${ui.btn} ${ui.danger} px-3 py-1.5`}
                    onClick={() => void remove("admin.revoke", {}, admin.user_id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {data.invites.length > 0 && (
        <section className={`${panel} !p-3 space-y-2`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Pending invites</p>
          {data.invites.map((invite) => (
            <div key={invite.email} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">{invite.email}</span>
              {invite.role !== "owner" && (
                <button
                  type="button"
                  disabled={busy}
                  className={`${ui.btn} ${ui.neutral} px-3 py-1.5`}
                  onClick={() => void remove("admin.revoke_invite", { email: invite.email })}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
