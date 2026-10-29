import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Link2, Linkedin, Loader2, X } from "lucide-react";
import { fetchConnections } from "../api/connections";
import { createPost } from "../api/network";
import { sendMessage } from "../api/messages";
import { queryKeys } from "../api/queryKeys";
import { ui } from "../styles/editorial";
import { getApiErrorMessage } from "../utils/apiError";

export function ShareProjectDialog({ projectId, title, open, onClose }: {
  projectId: string;
  title: string;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connections = useQuery({
    queryKey: [...queryKeys.connections, "summary"],
    queryFn: fetchConnections,
    enabled: open,
  });
  if (!open) return null;

  const url = `${window.location.origin}/project/${projectId}`;
  const needle = query.trim().toLowerCase();
  const people = (connections.data?.accepted ?? []).filter((row) => {
    const name = `${row.partner.fullName ?? ""} ${row.partner.username}`.toLowerCase();
    return !needle || name.includes(needle);
  });

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  function shareExternally(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="share-title" className="font-serif text-2xl text-stone-900">Share {title}</h2>
            <p className="mt-1 text-sm text-stone-500">Send it to someone, post it, or share the link.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-stone-500 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={`${ui.btn} ${ui.neutral}`} disabled={busy !== null} onClick={() => void run("feed", async () => {
            await createPost({ activity_type: "project_share", title, content: title, project_id: projectId });
            setNotice("Posted to the network.");
          })}>
            {busy === "feed" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Post to network
          </button>
          <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={() => void navigator.clipboard.writeText(url).then(() => setNotice("Link copied."))}>
            <Link2 className="h-3.5 w-3.5" /> Copy link
          </button>
          <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={() => shareExternally(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`)}>
            Post on X
          </button>
          <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={() => shareExternally(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)}>
            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
          </button>
        </div>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Send in a chat
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your connections" className={`${ui.input} mt-1 normal-case tracking-normal`} />
        </label>
        <ul className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-stone-200">
          {connections.isLoading ? (
            <li className="px-3 py-4 text-sm text-stone-500">Loading connections…</li>
          ) : people.length === 0 ? (
            <li className="px-3 py-4 text-sm text-stone-500">No connections match. You can still post the project or copy the link.</li>
          ) : people.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 border-b border-stone-100 px-3 py-2 last:border-0">
              <span className="min-w-0 truncate text-sm text-stone-800">{row.partner.fullName || row.partner.username}</span>
              <button type="button" className={`${ui.btn} ${ui.primary} px-3 py-1 text-xs`} disabled={busy !== null}
                onClick={() => void run(row.partner.id, async () => {
                  await sendMessage(row.partner.id, `Shared a project: ${title}\n${url}`);
                  onClose();
                  navigate(`/messages?user=${row.partner.id}`);
                })}>
                {busy === row.partner.id ? "Sending…" : "Send"}
              </button>
            </li>
          ))}
        </ul>
        {notice && <p className="mt-3 flex items-center gap-1 text-sm text-forest-800"><Check className="h-4 w-4" /> {notice}</p>}
        {error && <p className={`mt-3 ${ui.error}`}>{error}</p>}
      </div>
    </div>
  );
}
