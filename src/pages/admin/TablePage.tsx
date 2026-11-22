import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  adminRegenerateProjectSummary,
  fetchCatalog,
  fetchRow,
  fetchTable,
  type TableColumn,
} from "../../api/admin";
import { getApiErrorMessage } from "../../utils/apiError";
import { ui } from "../../styles/editorial";
import { Banner, Loading, display, panel, titleCase } from "./bits";
import { Pager } from "./PeoplePage";
import { useAdminAction } from "./guard";

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
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className={ui.heading}>{rows.data?.label ?? section.label}</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {rows.data?.total ?? 0} rows
            {rows.data?.removable ? " · deletable" : ""}
            {(rows.data?.editable?.length ?? 0) > 0 ? " · editable" : ""}
          </p>
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {section.tables.map((item) => (
          <Link
            key={item.name}
            to={`/admin/browse/${group}/${item.name}`}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
              item.name === table ? "bg-[#6B0B0C] text-[#FFF8CA]" : "bg-white text-[#2D120D] border border-stone-200"
            }`}
          >
            {item.label}
            <span className="ml-1 opacity-70">{item.count}</span>
          </Link>
        ))}
      </div>
      {eq.length > 0 && (
        <p className="text-xs text-stone-500">
          Filter {eq.join(", ")}.{" "}
          <Link to={`/admin/browse/${group}/${table}`} className={ui.link}>
            Clear
          </Link>
        </p>
      )}
      <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="record-search">
          Search records
        </label>
        <input
          id="record-search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className={ui.input}
          placeholder="Search"
        />
        <button type="submit" className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`}>
          Search
        </button>
      </form>
      {rows.isError && <Banner tone="bad">{getApiErrorMessage(rows.error)}</Banner>}
      <div className="grid gap-2 md:hidden">
        {rows.data?.rows.map((row, index) => (
          <button key={index} type="button" className={`${panel} !p-3 text-left`} onClick={() => setOpen(row)}>
            {columns.map((column) => (
              <p key={column.name} className="truncate text-sm">
                <span className="text-stone-500">{titleCase(column.name)}: </span>
                {display(row[column.name])}
              </p>
            ))}
          </button>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block rounded-xl border border-stone-200 bg-white">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.name} className="border-b border-stone-200 px-3 py-2 text-[10px] uppercase tracking-wider text-stone-500">
                  {titleCase(column.name)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.data?.rows.map((row, index) => (
              <tr key={index} className="cursor-pointer hover:bg-[#FAF7EE]" onClick={() => setOpen(row)}>
                {columns.map((column) => (
                  <td key={column.name} className="max-w-[220px] truncate border-b border-stone-100 px-3 py-2">
                    {display(row[column.name])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.data && rows.data.rows.length === 0 && <p className={ui.empty}>Empty.</p>}
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
      {open && (
        <RowDrawer
          table={table}
          row={open}
          columns={rows.data?.columns ?? []}
          editable={rows.data?.editable ?? []}
          removable={Boolean(rows.data?.removable)}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function RowDrawer({
  table,
  row,
  columns,
  editable,
  removable,
  onClose,
}: {
  table: string;
  row: Record<string, unknown>;
  columns: TableColumn[];
  editable: string[];
  removable: boolean;
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
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    const next = detail.data?.row;
    if (!next) return;
    if (typeof next.title === "string") setTitle(next.title);
    setShort(typeof next.short_description === "string" ? next.short_description : "");
    const nextDrafts: Record<string, string> = {};
    for (const key of detail.data?.editable ?? editable) {
      const value = next[key];
      nextDrafts[key] = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
    }
    setDrafts(nextDrafts);
  }, [detail.data, editable]);
  const [busy, setBusy] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);
  const full = detail.data?.row ?? row;
  const id = typeof full.id === "string" ? full.id : "";
  const editFields = detail.data?.editable ?? editable;
  const canRemove = detail.data?.removable ?? removable;

  async function run(action: string, payload: Record<string, unknown> = {}, target?: string) {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const result = await perform({ action, target_id: target ?? id, payload });
      if (!result) return;
      if (result.status === "pending") {
        setMessage(`Queued (${result.approvals ?? 1}/${result.required_approvals}).`);
      } else {
        setMessage(result.summary || "Saved.");
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function regenerateSummary(detailed = false) {
    if (!id) return;
    setMessage(null);
    setError(null);
    setRegenBusy(true);
    try {
      const result = await adminRegenerateProjectSummary(id, {
        publish: true,
        include_detailed: detailed,
      });
      setMessage(
        `AI summary regenerated${result.published ? " · published" : ""}${
          result.quality_status ? ` · ${result.quality_status}` : ""
        }.`,
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRegenBusy(false);
    }
  }

  function saveEdits() {
    const fields: Record<string, unknown> = {};
    for (const key of editFields) {
      const raw = drafts[key] ?? "";
      if (raw === "") {
        fields[key] = null;
        continue;
      }
      if (raw === "true" || raw === "false") {
        fields[key] = raw === "true";
        continue;
      }
      try {
        if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"))) {
          fields[key] = JSON.parse(raw);
          continue;
        }
      } catch {
        /* keep string */
      }
      fields[key] = raw;
    }
    void run("record.update", { table, pk, fields }, id || undefined);
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-[#2D120D]/40" onMouseDown={onClose}>
      <aside
        className="h-full w-full overflow-y-auto bg-[#FFF8CA] p-4 shadow-2xl sm:max-w-lg sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="Record"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className={ui.heading}>Record</h3>
          <button type="button" className={`${ui.btn} ${ui.neutral} px-3 py-2 text-sm`} onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {message && <Banner tone="ok">{message}</Banner>}
          {error && <Banner tone="bad">{error}</Banner>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {table === "users" && id && (
            <Link to={`/admin/people/${id}`} className={`${ui.btn} ${ui.primary} px-3 py-2 text-sm`}>
              Manage person
            </Link>
          )}
          {table === "network_clubs" && id && (
            <Link to="/admin/clubs" className={`${ui.btn} ${ui.primary} px-3 py-2 text-sm`}>
              Club console
            </Link>
          )}
          {table === "projects" && id && (
            <>
              <Tiny disabled={busy} onClick={() => void run("project.visibility", { visibility: "PUBLIC" })}>
                Public
              </Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.visibility", { visibility: "PRIVATE" })}>
                Private
              </Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.comments", { enabled: true })}>
                Comments on
              </Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.comments", { enabled: false })}>
                Comments off
              </Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.likes_hidden", { hidden: true })}>
                Hide likes
              </Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.likes_hidden", { hidden: false })}>
                Show likes
              </Tiny>
              <Tiny disabled={busy || regenBusy} onClick={() => void regenerateSummary(false)}>
                {regenBusy ? "…" : "Regen AI"}
              </Tiny>
              <Tiny disabled={busy || regenBusy} onClick={() => void regenerateSummary(true)}>
                Regen AI+
              </Tiny>
              <Tiny disabled={busy} onClick={() => void run("project.delete")}>
                Delete project
              </Tiny>
            </>
          )}
          {table === "technical_challenges" && id && (
            <>
              <Tiny disabled={busy} onClick={() => void run("challenge.status", { status: "draft" })}>
                Draft
              </Tiny>
              <Tiny disabled={busy} onClick={() => void run("challenge.status", { status: "open" })}>
                Open
              </Tiny>
              <Tiny disabled={busy} onClick={() => void run("challenge.status", { status: "closed" })}>
                Close
              </Tiny>
              <Tiny disabled={busy} onClick={() => void run("challenge.delete")}>
                Delete
              </Tiny>
            </>
          )}
          {table === "github_connections" && id && (
            <Tiny disabled={busy} onClick={() => void run("github.disconnect")}>
              Disconnect GitHub
            </Tiny>
          )}
          {canRemove && (
            <Tiny disabled={busy} onClick={() => void run("record.delete", { table, pk }, id || undefined)}>
              Delete row
            </Tiny>
          )}
        </div>
        {table === "projects" && (
          <form
            className="mt-4 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              void run("project.edit", { title, short_description: short });
            }}
          >
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={ui.input} aria-label="Project title" />
            <textarea
              value={short}
              onChange={(event) => setShort(event.target.value)}
              className={ui.input}
              rows={3}
              aria-label="Short description"
            />
            <Tiny disabled={busy}>Save text</Tiny>
          </form>
        )}
        {editFields.length > 0 && table !== "projects" && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Edit fields</p>
            {editFields.slice(0, 12).map((key) => (
              <label key={key} className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                {titleCase(key)}
                <input
                  value={drafts[key] ?? ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                  className={`${ui.input} mt-1`}
                />
              </label>
            ))}
            <Tiny disabled={busy} onClick={saveEdits}>
              Save edits
            </Tiny>
          </div>
        )}
        <dl className="mt-4 space-y-2">
          {columns.map((column) => (
            <div key={column.name}>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{titleCase(column.name)}</dt>
              <dd className="max-h-64 overflow-auto break-words whitespace-pre-wrap text-sm text-[#2D120D]">
                {column.secret ? "Hidden" : display(full[column.name], true)}
              </dd>
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
