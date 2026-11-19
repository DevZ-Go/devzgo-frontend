import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAudit } from "../../api/admin";
import { ui } from "../../styles/editorial";
import { Loading, panel, when } from "./bits";

const TONE: Record<string, string> = {
  critical: "bg-[#FEE2E2] text-[#991B1B]",
  important: "bg-[#FEF3C7] text-[#92400E]",
  info: "bg-[#DCFCE7] text-[#14532D]",
};

export function AuditPage() {
  const [offset, setOffset] = useState(0);
  const audit = useQuery({ queryKey: ["admin", "audit", offset], queryFn: () => fetchAudit(offset) });
  if (audit.isLoading) return <Loading />;
  if (!audit.data) return <p className={ui.error}>The audit log could not be loaded.</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">Changes made from this admin area. Looking at records is not listed.</p>
      {audit.data.events.map((event) => (
        <article key={event.id} className={panel}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${TONE[event.severity] ?? TONE.info}`}>{event.severity}</span>
            <span className="text-xs text-stone-500">{when(event.created_at)}</span>
          </div>
          <p className="mt-2 font-medium text-[#2D120D]">{event.summary}</p>
          <p className="mt-1 text-xs text-stone-500">{event.actor_email || "Unknown admin"} · {event.action}</p>
        </article>
      ))}
      {audit.data.events.length === 0 && <p className={ui.empty}>No admin changes yet.</p>}
      <div className="flex justify-between gap-2">
        <button type="button" className={`${ui.btn} ${ui.neutral} px-3 py-2`} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 40))}>Previous</button>
        <button type="button" className={`${ui.btn} ${ui.neutral} px-3 py-2`} disabled={offset + 40 >= audit.data.total} onClick={() => setOffset(offset + 40)}>Next</button>
      </div>
    </div>
  );
}
