import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCatalog, fetchRow, fetchTable, type TableColumn } from "../../api/admin";
import { getApiErrorMessage } from "../../utils/apiError";
import { ui } from "../../styles/editorial";
import { Banner, Loading, display, panel, titleCase } from "./bits";
import { Pager } from "./PeoplePage";
import { useAdminAction } from "./guard";

const REMOVABLE = new Set([
  "network_activities", "activity_comments", "activity_likes", "project_comments", "project_likes",
  "messages", "room_messages", "notifications", "connections", "collaboration_requests",
  "project_invitations", "challenge_invitations", "chat_mutes", "user_blocks", "shortlist_entries",
  "recruitment_requests", "workspace_drafts", "files", "password_reset_tokens", "project_tech",
  "chat_rooms", "shortlists", "monthly_wraps",
]);

export function TablePage() {
  const { group = "", table = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const offset = Number(params.get("offset") ?? "0") || 0;
  const eq = params.getAll("eq");
  const [draft, setDraft] = useState(q);
  const [open, setOpen] = useState<Record<string, unknown> | null>(null);
  const catalog = useQuery({ queryKey: ["admin", "catalog"], queryFn: fetchCatalog });
  const rows = useQuery({
    queryKey: ["admin", "table", table, q, offset, eq.join("|")],
    queryFn: () => fetchTable(table, q, offset, eq),
    enabled: Boolean(table),
  });
  const section = catalog.data?.groups.find((item) => item.id === group);

  function search(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    next.set("q", draft.trim());
    next.set("offset", "0");
    setParams(next);
  }

  if (catalog.isLoading || rows.isLoading) return <Loading />;
  if (!section || !section.tables.some((item) => item.name === table)) {
    return <p className={ui.error}>That list is not part of the admin area.</p>;
  }

  const columns = (rows.data?.columns ?? []).filter((column) => !column.secret).slice(0, 5);

  return (
    <div className="space-y-4">
      <div>
        <h2 className={ui.heading}>{rows.data?.label ?? section.label}</h2>
        <p className="mt-1 text-sm text-stone-600">{rows.data?.blurb}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {section.tables.map((item) => (
          <Link
            key={item.name}
            to={`/admin/browse/${group}/${item.name}`}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${item.name === table ? "bg-[#6B0B0C] text-[#FFF8CA]" : "bg-white text-[#2D120D] border border-stone-200"}`}
          >
            {item.label} · {item.count}
          </Link>
        ))}
      </div>
      {eq.length > 0 && (
        <p className="text-sm text-stone-600">
          Filtered by {eq.join(", ")}. <Link to={`/admin/browse/${group}/${table}`} className={ui.link}>Clear</Link>
        </p>
      )}
      <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="record-search">Search records</label>
        <input id="record-search" value={draft} onChange={(event) => setDraft(event.target.value)} className={ui.input} placeholder="Search this list" />
        <button type="submit" className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`}>Search</button>
      </form>
      {rows.isError && <Banner tone="bad">{getApiErrorMessage(rows.error)}</Banner>}
      <div className="grid gap-3 md:hidden">
        {rows.data?.rows.map((row, index) => (
          <button key={index} type="button" className={`${panel} text-left`} onClick={() => setOpen(row)}>
            {columns.map((column) => (
              <p key={column.name} className="truncate text-sm"><span className="text-stone-500">{titleCase(column.name)}: </span>{display(row[column.name])}</p>
            ))}
          </button>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => <th key={column.name} className="border-b border-stone-200 px-3 py-2 text-xs uppercase tracking-wider text-stone-500">{titleCase(column.name)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.data?.rows.map((row, index) => (
              <tr key={index} className="cursor-pointer hover:bg-white" onClick={() => setOpen(row)}>
                {columns.map((column) => <td key={column.name} className="max-w-[220px] truncate border-b border-stone-100 px-3 py-2">{display(row[column.name])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.data && rows.data.rows.length === 0 && <p className={ui.empty}>Nothing is stored here yet.</p>}
      {rows.data && (
        <Pager
          offset={rows.data.offset}
          total={rows.data.total}
          onPage={(next) => {
            const paramsNext = new URLSearchParams(params);
            paramsNext.set("offset", String(next));
            setParams(paramsNext);
          }}
        />
      )}
      {open && <RowDrawer table={table} row={open} columns={rows.data?.columns ?? []} onClose={() => setOpen(null)} />}
    </div>
  );
}

function RowDrawer({
  table,
  row,
  columns,
  onClose,
}: {
  table: string;
  row: Record<string, unknown>;
  columns: TableColumn[];
  onClose: () => void;
}) {
  const pk = (row._pk && typeof row._pk === "object" ? row._pk : {}) as Record<string, unknown>;
  const pkItems = Object.entries(pk).map(([key, value]) => `${key}:${String(value)}`);
  const detail = useQuery({ queryKey: ["admin", "row", table, pkItems.join("|")], queryFn: () => fetchRow(table, pkItems) });
  const perform = useAdminAction();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(String(row.title ?? ""));
  const [short, setShort] = useState(String(row.short_description ?? ""));
  useEffect(() => {
    const next = detail.data?.row;
    if (!next) return;
    if (typeof next.title === "string") setTitle(next.title);
    setShort(typeof next.short_description === "string" ? next.short_description : "");
  }, [detail.data]);
  const [busy, setBusy] = useState(false);
  const full = detail.data?.row ?? row;
  const id = typeof full.id === "string" ? full.id : "";

  async function run(action: string, payload: Record<string, unknown> = {}, target?: string) {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const result = await perform({ action, target_id: target ?? id, payload });
      if (!result) return;
      if (result.status === "pending") setMessage(`Submitted for approval (${result.approvals ?? 1} of ${result.required_approvals}). Nothing has changed yet.`);
      else setMessage(result.summary || "Saved.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-[#2D120D]/40" onMouseDown={onClose}>
      <aside className="h-full w-full overflow-y-auto bg-[#FFF8CA] p-4 shadow-2xl sm:max-w-lg sm:p-6" onMouseDown={(event) => event.stopPropagation()} aria-label="Record">
        <div className="flex items-center justify-between gap-3">
          <h3 className={ui.heading}>Record</h3>
          <button type="button" className={`${ui.btn} ${ui.neutral} px-3 py-2 text-sm`} onClick={onClose}>Close</button>
        </div>
        <div className="mt-3 space-y-2">
          {message && <Banner tone="ok">{message}</Banner>}
          {error && <Banner tone="bad">{error}</Banner>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {table === "users" && id && <Link to={`/admin/people/${id}`} className={`${ui.btn} ${ui.primary} px-3 py-2 text-sm`}>Manage person</Link>}
          {table === "projects" && id && (
            <>
              <Tiny disabled={busy} onClick={() => void run("project.visibility", { visibility: "PUBLIC" })}>Make public</Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.visibility", { visibility: "PRIVATE" })}>Make private</Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.comments", { enabled: true })}>Comments on</Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.comments", { enabled: false })}>Comments off</Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.likes_hidden", { hidden: true })}>Hide likes</Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.likes_hidden", { hidden: false })}>Show likes</Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.delete")}>Delete project</Tiny>
            </>
          )}
          {table === "technical_challenges" && id && (
            <>
              <Tiny disabled={busy} onClick={() => void run("challenge.status", { status: "draft" })}>Draft</Tiny>
              <Tiny disabled={busy} onClick={() => void run("challenge.status", { status: "open" })}>Open</Tiny>
              <Tiny disabled={busy} onClick={() => void run("challenge.status", { status: "closed" })}>Close</Tiny>
              <Tiny disabled={busy} onClick={() => void run("challenge.delete")}>Delete challenge</Tiny>
            </>
          )}
          {table === "github_connections" && id && <Tiny disabled={busy} onClick={() => void run("github.disconnect")}>Disconnect GitHub</Tiny>}
          {REMOVABLE.has(table) && (
            <Tiny disabled={busy} onClick={() => void run("record.delete", { table, pk }, id || undefined)}>Remove record</Tiny>
          )}
        </div>
        {table === "projects" && (
          <form className="mt-4 space-y-2" onSubmit={(event) => { event.preventDefault(); void run("project.edit", { title, short_description: short }); }}>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={ui.input} aria-label="Project title" />
            <textarea value={short} onChange={(event) => setShort(event.target.value)} className={ui.input} rows={3} aria-label="Short description" />
            <Tiny disabled={busy}>Save text</Tiny>
          </form>
        )}
        <dl className="mt-4 space-y-2">
          {columns.map((column) => (
            <div key={column.name}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">{titleCase(column.name)}</dt>
              <dd className="max-h-64 overflow-auto break-words whitespace-pre-wrap text-sm text-[#2D120D]">{column.secret ? "Hidden" : display(full[column.name], true)}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}

function Tiny({ children, disabled, onClick }: { children: string; disabled?: boolean; onClick?: () => void }) {
  return (
    <button type={onClick ? "button" : "submit"} disabled={disabled} onClick={onClick} className={`${ui.btn} ${ui.neutral} px-3 py-2 text-sm`}>
      {children}
    </button>
  );
}
