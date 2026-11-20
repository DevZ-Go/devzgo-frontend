import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminSession, fetchCatalog } from "../../api/admin";
import { getApiErrorMessage } from "../../utils/apiError";
import { ui } from "../../styles/editorial";
import { Banner, Loading, panel } from "./bits";
import { useAdminAction } from "./guard";

const STATS = [
  ["people", "People"],
  ["developers", "Developers"],
  ["recruiters", "Recruiters"],
  ["suspended", "Suspended"],
  ["paused", "Paused"],
  ["projects", "Projects"],
  ["open_proposals", "Waiting for approval"],
] as const;

export function OverviewPage() {
  const catalog = useQuery({ queryKey: ["admin", "catalog"], queryFn: fetchCatalog });
  const session = useQuery({ queryKey: ["admin", "session"], queryFn: fetchAdminSession });
  const perform = useAdminAction();
  const [premiumDays, setPremiumDays] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function grantAllPremium() {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const payload = premiumDays.trim() ? { days: Number(premiumDays) } : {};
      const result = await perform({ action: "premium.grant_all", payload });
      if (!result) return;
      if (result.status === "pending") setMessage(`Submitted for approval (${result.approvals ?? 1} of ${result.required_approvals}).`);
      else setMessage(result.summary || "Premium granted to all developers.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (catalog.isLoading) return <Loading />;
  if (!catalog.data) return <p className={ui.error}>The overview could not be loaded.</p>;
  const { headline, groups } = catalog.data;
  const ownerEmail = session.data?.owner_email ?? "the owner";

  return (
    <div className="space-y-6">
      {message && <Banner tone="ok">{message}</Banner>}
      {error && <Banner tone="bad">{error}</Banner>}

      <section className={`${panel} space-y-3`}>
        <h2 className={ui.heading}>Premium access</h2>
        <p className="text-sm text-stone-600">
          Grant <strong>Resume Studio</strong> and <strong>Project Intelligence Premium</strong> to every developer, or open a person
          page for one account. Optional days set the same expiry for everyone; each person is emailed when access ends.
          Platform admins already unlock every premium feature automatically.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Days for all
            <input
              type="number"
              min={1}
              max={3650}
              placeholder="forever"
              className={`${ui.input} mt-1 w-28`}
              value={premiumDays}
              onChange={(e) => setPremiumDays(e.target.value)}
              aria-label="Premium days for all developers"
            />
          </label>
          <button type="button" disabled={busy} onClick={() => void grantAllPremium()} className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`}>
            {busy ? "Working…" : "Grant Premium to all developers"}
          </button>
          <Link to="/admin/people" className={`${ui.btn} ${ui.neutral} px-4 py-2 text-sm`}>Grant per person</Link>
        </div>
      </section>

      <section className={panel}>
        <h2 className={ui.heading}>How dangerous changes work</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          Everyday fixes ask you to confirm twice and write a reason. Deleting an account or a project, removing an admin, disconnecting GitHub,
          or deleting a wrap waits for 2 admin approvals, including yours. Any other admin can stop a request.
          When {ownerEmail} confirms a deletion, it runs right away.
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Passwords, reset links, GitHub tokens and unsaved editor text are hidden. Every change is written to the audit log.
        </p>
        {headline.open_proposals > 0 && (
          <Link to="/admin/approvals" className={`${ui.btn} ${ui.danger} mt-4 px-4 py-2 text-sm`}>
            {headline.open_proposals} change{headline.open_proposals === 1 ? "" : "s"} waiting
          </Link>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {STATS.map(([key, label]) => (
          <div key={key} className={panel}>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
            <p className="mt-1 font-serif text-3xl font-bold text-[#2D120D]">{headline[key]}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {groups.map((group) => (
          <Link key={group.id} to={`/admin/browse/${group.id}/${group.tables[0]?.name ?? ""}`} className={`${panel} block hover:border-[#6B0B0C]`}>
            <h2 className={ui.heading}>{group.label}</h2>
            <p className="mt-1 text-sm text-stone-600">{group.blurb}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#6B0B0C]">
              {group.tables.reduce((sum, table) => sum + table.count, 0)} records · {group.tables.length} lists
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
