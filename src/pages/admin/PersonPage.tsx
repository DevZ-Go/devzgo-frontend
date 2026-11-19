import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPerson } from "../../api/admin";
import { getApiErrorMessage } from "../../utils/apiError";
import { ui } from "../../styles/editorial";
import { Banner, Loading, display, panel, statusClass, titleCase, when } from "./bits";
import { useAdminAction } from "./guard";

const LINKS: [string, string, string][] = [
  ["projects", "Projects they own", "/admin/browse/projects/projects"],
  ["posts", "Network posts", "/admin/browse/network/network_activities"],
  ["messages_sent", "Messages sent", "/admin/browse/messages/messages"],
  ["messages_received", "Messages received", "/admin/browse/messages/messages"],
  ["wraps", "Wraps", "/admin/browse/wraps/monthly_wraps"],
];

const FILTER: Record<string, string> = {
  projects: "owner_id",
  posts: "user_id",
  messages_sent: "sender_id",
  messages_received: "receiver_id",
  wraps: "user_id",
};

export function PersonPage() {
  const { userId = "" } = useParams();
  const person = useQuery({ queryKey: ["admin", "person", userId], queryFn: () => fetchPerson(userId), enabled: Boolean(userId) });
  const perform = useAdminAction();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: string, payload: Record<string, unknown> = {}) {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const result = await perform({ action, target_id: userId, payload });
      if (!result) return;
      if (result.status === "pending") setMessage(`Submitted for approval (${result.approvals ?? 1} of ${result.required_approvals}). Nothing has changed yet.`);
      else setMessage(result.summary || "Saved.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (person.isLoading) return <Loading />;
  if (!person.data) return <p className={ui.error}>That account could not be loaded.</p>;
  const row = person.data.person;
  const counts = person.data.counts;

  return (
    <div className="space-y-4">
      <Link to="/admin/people" className={ui.link}>All people</Link>
      {message && <Banner tone="ok">{message}</Banner>}
      {error && <Banner tone="bad">{error}</Banner>}

      <section className={panel}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-2xl font-bold">@{row.username}</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(row.status)}`}>{row.status}</span>
          {row.admin_role && <span className="rounded-full bg-[#6B0B0C] px-2 py-0.5 text-xs font-semibold uppercase text-[#FFF8CA]">{row.admin_role}</span>}
        </div>
        <p className="mt-1 text-sm text-stone-600">{row.full_name || "No name"} · {row.email}</p>
        <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
          {row.account_type} · {row.has_password ? "password" : "no password"} · {row.github_linked ? "GitHub linked" : "no GitHub"} · joined {when(row.created_at)}
        </p>
        {row.suspended_reason && <p className="mt-2 text-sm text-[#991B1B]">Suspension note: {row.suspended_reason}</p>}
        {row.delete_after && <p className="mt-2 text-sm text-[#991B1B]">Permanent deletion after {when(row.delete_after)}.</p>}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {LINKS.map(([key, label, href]) => (
          <Link key={key} to={`${href}?eq=${FILTER[key]}:${row.id}`} className={`${panel} hover:border-[#6B0B0C]`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
            <p className="font-serif text-2xl font-bold">{counts[key] ?? 0}</p>
          </Link>
        ))}
        <div className={panel}>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Connections</p>
          <p className="font-serif text-2xl font-bold">{counts.connections ?? 0}</p>
        </div>
      </section>

      <section className={`${panel} space-y-3`}>
        <h3 className={ui.heading}>Sign-in and visibility</h3>
        <p className="text-sm text-stone-600">These ask you to confirm twice. A pause ends when they sign in. A suspension does not.</p>
        <div className="flex flex-wrap gap-2">
          <Action disabled={busy} onClick={() => void run("user.pause")}>Pause</Action>
          <Action disabled={busy} onClick={() => void run("user.unpause")}>Clear pause</Action>
          <Action disabled={busy} onClick={() => void run("user.suspend")}>Suspend</Action>
          <Action disabled={busy} onClick={() => void run("user.unsuspend")}>Restore sign-in</Action>
          <Action disabled={busy} onClick={() => void run("user.sign_out")}>Sign out everywhere</Action>
          <Action disabled={busy} onClick={() => void run("user.cancel_delete")}>Cancel deletion</Action>
        </div>
      </section>

      <section className={`${panel} space-y-3`}>
        <h3 className={ui.heading}>Account type</h3>
        <p className="text-sm text-stone-600">
          Set this person to developer or recruiter whenever you need to. Confirming twice applies it immediately and signs them out, so they come back as the new type.
        </p>
        <div className="flex flex-wrap gap-2">
          <Action disabled={busy || row.account_type === "developer"} onClick={() => void run("user.change_type", { account_type: "developer" })}>
            Make developer
          </Action>
          <Action disabled={busy || row.account_type === "recruiter"} onClick={() => void run("user.change_type", { account_type: "recruiter" })}>
            Make recruiter
          </Action>
        </div>
      </section>

      <section className={`${panel} grid gap-4 md:grid-cols-2`}>
        <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void run("user.update_username", { username }); }}>
          <h3 className={ui.heading}>Username</h3>
          <input value={username} onChange={(event) => setUsername(event.target.value)} className={ui.input} placeholder="new handle" aria-label="New username" />
          <Action disabled={busy}>Change username</Action>
        </form>
        <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void run("user.update_email", { email }); }}>
          <h3 className={ui.heading}>Email</h3>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className={ui.input} placeholder="new@email.com" aria-label="New email" />
          <Action disabled={busy}>Change email</Action>
        </form>
      </section>

      <section className="rounded-2xl border-2 border-[#DC2626] bg-[#FEE2E2] p-4 sm:p-5">
        <h3 className="font-serif text-lg font-bold text-[#991B1B]">Major changes</h3>
        <p className="mt-1 text-sm text-[#7F1D1D]">
          These can remove someone’s work. They wait for 2 admin approvals, unless you are signed in as the owner — then a deletion runs as soon as you confirm.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Action disabled={busy} onClick={() => void run("user.schedule_delete")}>Schedule deletion</Action>
          <Action disabled={busy} onClick={() => void run("user.purge")}>Delete account now</Action>
          {row.admin_role === "admin" && <Action disabled={busy} onClick={() => void run("admin.revoke")}>Remove admin access</Action>}
        </div>
      </section>

      <Record title="Profile" row={person.data.profile} />
      <Record title="Account record" row={person.data.account} />
    </div>
  );
}

function Action({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <button type={onClick ? "button" : "submit"} disabled={disabled} onClick={onClick} className={`${ui.btn} ${ui.neutral} px-3 py-2 text-sm`}>
      {children}
    </button>
  );
}

function Record({ title, row }: { title: string; row: Record<string, unknown> | null }) {
  if (!row) return null;
  const entries = Object.entries(row).filter(([key]) => key !== "_pk");
  return (
    <details className={panel}>
      <summary className="cursor-pointer font-serif text-lg font-bold">{title}</summary>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-xl bg-[#FAF7EE] px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">{titleCase(key)}</dt>
            <dd className="mt-1 break-words whitespace-pre-wrap text-sm text-[#2D120D]">{display(value, true)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
