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
  ["developers", "Devs"],
  ["recruiters", "Recruiters"],
  ["suspended", "Suspended"],
  ["paused", "Paused"],
  ["projects", "Projects"],
  ["open_proposals", "Waiting"],
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
      if (result.status === "pending") setMessage(`Queued (${result.approvals ?? 1}/${result.required_approvals}).`);
      else setMessage(result.summary || "Premium granted.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (catalog.isLoading) return <Loading />;
  if (!catalog.data) return <p className={ui.error}>Overview unavailable.</p>;
  const { headline, groups } = catalog.data;

  return (
    <div className="space-y-5">
      {message && <Banner tone="ok">{message}</Banner>}
      {error && <Banner tone="bad">{error}</Banner>}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {STATS.map(([key, label]) => (
          <div key={key} className={`${panel} !p-3`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
            <p className="mt-1 font-serif text-2xl font-bold text-[#2D120D]">{headline[key]}</p>
          </div>
        ))}
      </section>

      <section className={`${panel} !p-4`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={ui.heading}>Premium blast</h2>
            <p className="mt-0.5 text-xs text-stone-500">Resume Studio + PI for every developer</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <input
              type="number"
              min={1}
              max={3650}
              placeholder="Days"
              className={`${ui.input} w-24`}
              value={premiumDays}
              onChange={(e) => setPremiumDays(e.target.value)}
              aria-label="Premium days for all developers"
            />
            <button type="button" disabled={busy} onClick={() => void grantAllPremium()} className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`}>
              {busy ? "…" : "Grant all"}
            </button>
            <Link to="/admin/people" className={`${ui.btn} ${ui.neutral} px-3 py-2 text-sm`}>
              Per person
            </Link>
          </div>
        </div>
        {(headline.open_proposals ?? 0) > 0 && (
          <Link to="/admin/approvals" className={`${ui.btn} ${ui.danger} mt-3 px-3 py-1.5`}>
            {headline.open_proposals} waiting
          </Link>
        )}
      </section>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const total = group.tables.reduce((sum, table) => sum + table.count, 0);
          return (
            <Link
              key={group.id}
              to={`/admin/browse/${group.id}/${group.tables[0]?.name ?? ""}`}
              className={`${panel} !p-4 block hover:border-[#6B0B0C] transition`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-serif text-base font-bold text-[#2D120D]">{group.label}</h2>
                <span className="rounded-full bg-[#6B0B0C]/10 px-2 py-0.5 text-[10px] font-bold text-[#6B0B0C]">
                  {total}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">{group.tables.length} tables</p>
            </Link>
          );
        })}
      </section>

      {session.data?.owner_email && (
        <p className="text-[11px] text-stone-400">
          Confirm twice · critical waits for 2 admins · {session.data.owner_email} deletes immediately
        </p>
      )}
    </div>
  );
}
