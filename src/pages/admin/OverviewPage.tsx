import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCatalog } from "../../api/admin";
import { ui } from "../../styles/editorial";
import { Loading, panel } from "./bits";

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
  if (catalog.isLoading) return <Loading />;
  if (!catalog.data) return <p className={ui.error}>The overview could not be loaded.</p>;
  const { headline, groups } = catalog.data;

  return (
    <div className="space-y-6">
      <section className={panel}>
        <h2 className={ui.heading}>How dangerous changes work</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          Everyday fixes ask you to confirm twice and write a reason. Changes that can do serious damage — deleting an account or a project,
          removing an admin, disconnecting GitHub, deleting a wrap — do not run until other admins approve them. Three approvals are required
          when three or more admins can vote. With two admins, both must approve. You count as the first approval. Any other admin can stop a request.
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
