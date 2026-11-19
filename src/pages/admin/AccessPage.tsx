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
      if (result?.status === "pending") setMessage(`Waiting for ${result.required_approvals} approvals. Nothing has changed yet.`);
      else if (result?.summary) setMessage(result.summary);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (access.isLoading) return <Loading />;
  if (!access.data) return <p className={ui.error}>Admin access could not be loaded.</p>;
  const data = access.data;

  return (
    <div className="space-y-4">
      {message && <Banner tone="ok">{message}</Banner>}
      {error && <Banner tone="bad">{error}</Banner>}
      <section className={panel}>
        <h2 className={ui.heading}>Who can open this area</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          {data.owner_email} is the owner and cannot be removed. The project teammates were invited once:
          {" "}{data.team_emails.join(", ")}. After that, only an admin can give or take away access. Giving access is confirmed twice.
          Taking it away waits for other admins, because that person could no longer stop a dangerous change.
        </p>
      </section>

      <form onSubmit={grant} className={`${panel} space-y-3`}>
        <h2 className={ui.heading}>Give someone access</h2>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className={`${ui.input} mt-1 font-normal normal-case tracking-normal`} placeholder="name@example.com" />
        </label>
        <button type="submit" disabled={busy} className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`}>Grant admin access</button>
      </form>

      <section className="grid gap-3">
        {data.admins.map((admin) => (
          <article key={admin.user_id} className={panel}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#2D120D]">{admin.email}</p>
                <p className="text-sm text-stone-600">@{admin.username} · {admin.role} · since {when(admin.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/people/${admin.user_id}`} className={`${ui.btn} ${ui.neutral} px-3 py-2 text-sm`}>Open</Link>
                {admin.role !== "owner" && admin.email !== data.you && (
                  <button type="button" disabled={busy} className={`${ui.btn} ${ui.danger} px-3 py-2 text-sm`} onClick={() => void remove("admin.revoke", {}, admin.user_id)}>
                    Remove access
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className={panel}>
        <h2 className={ui.heading}>Waiting to sign up</h2>
        {data.invites.length === 0 && <p className="mt-2 text-sm text-stone-600">No unused invites.</p>}
        <ul className="mt-3 space-y-2">
          {data.invites.map((invite) => (
            <li key={invite.email} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
              <span className="text-sm font-medium">{invite.email} · {invite.role}</span>
              {invite.role !== "owner" && (
                <button
                  type="button"
                  disabled={busy}
                  className={`${ui.btn} ${ui.neutral} px-3 py-2 text-sm`}
                  onClick={() => void remove("admin.revoke_invite", { email: invite.email })}
                >
                  Remove invite
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
