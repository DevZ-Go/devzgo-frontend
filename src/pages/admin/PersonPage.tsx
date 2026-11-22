import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPerson } from "../../api/admin";
import { getApiErrorMessage } from "../../utils/apiError";
import { ui } from "../../styles/editorial";
import { Banner, Loading, display, panel, statusClass, titleCase, when } from "./bits";
import { useAdminAction } from "./guard";

const LINKS: [string, string, string][] = [
  ["projects", "Projects", "/admin/browse/projects/projects"],
  ["posts", "Posts", "/admin/browse/network/network_activities"],
  ["messages_sent", "Sent", "/admin/browse/messages/messages"],
  ["messages_received", "Inbox", "/admin/browse/messages/messages"],
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
  const [premiumDays, setPremiumDays] = useState("");
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
      if (result.status === "pending") setMessage(`Queued (${result.approvals ?? 1}/${result.required_approvals}).`);
      else setMessage(result.summary || "Saved.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (person.isLoading) return <Loading />;
  if (!person.data) return <p className={ui.error}>Account unavailable.</p>;
  const row = person.data.person;
  const counts = person.data.counts;

  return (
    <div className="space-y-4">
      <Link to="/admin/people" className={ui.link}>
        ← People
      </Link>
      {message && <Banner tone="ok">{message}</Banner>}
      {error && <Banner tone="bad">{error}</Banner>}

      <section className={`${panel} !p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-2xl font-bold">@{row.username}</h2>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(row.status)}`}>{row.status}</span>
          {row.admin_role && (
            <span className="rounded-full bg-[#6B0B0C] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#FFF8CA]">
              {row.admin_role}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-stone-600">
          {row.full_name || "—"} · {row.email}
        </p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-stone-400">
          {row.account_type} · {row.has_password ? "pwd" : "no pwd"} · {row.github_linked ? "GitHub" : "no GH"} · {when(row.created_at)}
        </p>
        {row.suspended_reason && <p className="mt-2 text-sm text-[#991B1B]">{row.suspended_reason}</p>}
        {row.delete_after && <p className="mt-2 text-sm text-[#991B1B]">Deletes {when(row.delete_after)}</p>}
      </section>

      <section className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {LINKS.map(([key, label, href]) => (
          <Link key={key} to={`${href}?eq=${FILTER[key]}:${row.id}`} className={`${panel} !p-3 hover:border-[#6B0B0C]`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
            <p className="font-serif text-xl font-bold">{counts[key] ?? 0}</p>
          </Link>
        ))}
        <div className={`${panel} !p-3`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Links</p>
          <p className="font-serif text-xl font-bold">{counts.connections ?? 0}</p>
        </div>
      </section>

      <section className={`${panel} !p-4 space-y-2`}>
        <h3 className={ui.heading}>Session</h3>
        <div className="flex flex-wrap gap-1.5">
          <Action disabled={busy} onClick={() => void run("user.pause")}>Pause</Action>
          <Action disabled={busy} onClick={() => void run("user.unpause")}>Unpause</Action>
          <Action disabled={busy} onClick={() => void run("user.suspend")}>Suspend</Action>
          <Action disabled={busy} onClick={() => void run("user.unsuspend")}>Restore</Action>
          <Action disabled={busy} onClick={() => void run("user.sign_out")}>Sign out</Action>
          <Action disabled={busy} onClick={() => void run("user.cancel_delete")}>Cancel delete</Action>
        </div>
      </section>

      {row.account_type === "developer" && (
        <section className={`${panel} !p-4 space-y-2`}>
          <h3 className={ui.heading}>Premium</h3>
          <div className="flex flex-wrap items-end gap-2">
            <input
              type="number"
              min={1}
              max={3650}
              placeholder="Days"
              className={`${ui.input} w-24`}
              value={premiumDays}
              onChange={(e) => setPremiumDays(e.target.value)}
              aria-label="Premium days"
            />
            <Action disabled={busy} onClick={() => void run("premium.grant", premiumDays.trim() ? { days: Number(premiumDays) } : {})}>
              Grant
            </Action>
            <Action disabled={busy} onClick={() => void run("premium.revoke")}>
              Revoke
            </Action>
          </div>
        </section>
      )}

      <section className={`${panel} !p-4 space-y-2`}>
        <h3 className={ui.heading}>Type</h3>
        <div className="flex flex-wrap gap-1.5">
          <Action disabled={busy || row.account_type === "developer"} onClick={() => void run("user.change_type", { account_type: "developer" })}>
            Developer
          </Action>
          <Action disabled={busy || row.account_type === "recruiter"} onClick={() => void run("user.change_type", { account_type: "recruiter" })}>
            Recruiter
          </Action>
        </div>
      </section>

      <section className={`${panel} !p-4 grid gap-3 md:grid-cols-2`}>
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run("user.update_username", { username });
          }}
        >
          <h3 className={ui.heading}>Username</h3>
          <input value={username} onChange={(event) => setUsername(event.target.value)} className={ui.input} placeholder="new handle" aria-label="New username" />
          <Action disabled={busy}>Save</Action>
        </form>
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run("user.update_email", { email });
          }}
        >
          <h3 className={ui.heading}>Email</h3>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className={ui.input} placeholder="new@email.com" aria-label="New email" />
          <Action disabled={busy}>Save</Action>
        </form>
      </section>

      <section className="rounded-xl border border-[#DC2626] bg-[#FEE2E2] p-4 space-y-2">
        <h3 className="font-serif text-base font-bold text-[#991B1B]">Danger</h3>
        <div className="flex flex-wrap gap-1.5">
          <Action disabled={busy} onClick={() => void run("user.schedule_delete")}>
            Schedule delete
          </Action>
          <Action disabled={busy} onClick={() => void run("user.purge")}>
            Delete now
          </Action>
          {row.admin_role === "admin" && (
            <Action disabled={busy} onClick={() => void run("admin.revoke")}>
              Remove admin
            </Action>
          )}
        </div>
      </section>

      <Record title="Profile" row={person.data.profile} />
      <Record title="Account" row={person.data.account} />
    </div>
  );
}

function Action({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <button type={onClick ? "button" : "submit"} disabled={disabled} onClick={onClick} className={`${ui.btn} ${ui.neutral} px-3 py-1.5`}>
      {children}
    </button>
  );
}

function Record({ title, row }: { title: string; row: Record<string, unknown> | null }) {
  if (!row) return null;
  const entries = Object.entries(row).filter(([key]) => key !== "_pk");
  return (
    <details className={`${panel} !p-3`}>
      <summary className="cursor-pointer font-serif text-base font-bold">{title}</summary>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-lg bg-[#FAF7EE] px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{titleCase(key)}</dt>
            <dd className="mt-1 break-words whitespace-pre-wrap text-sm text-[#2D120D]">{display(value, true)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
