import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Link2, Linkedin, Loader2, X } from "lucide-react";
import { fetchConnections } from "../api/connections";
import { createPost } from "../api/network";
import { fetchGroups, sendGroupMessage, sendMessage } from "../api/messages";
import { queryKeys } from "../api/queryKeys";
import { projectBody } from "../lib/chatText";
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
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connections = useQuery({
    queryKey: [...queryKeys.connections, "summary"],
    queryFn: fetchConnections,
    enabled: open,
  });
  const groups = useQuery({
    queryKey: ["chat-groups", "share"],
    queryFn: fetchGroups,
    enabled: open,
  });
  if (!open) return null;

  const safeId = /^[0-9a-f-]{36}$/i.test(projectId) ? projectId : "";
  const url = safeId ? `${window.location.origin}/project/${safeId}` : "";
  const needle = query.trim().toLowerCase();
  const people = (connections.data?.accepted ?? []).filter((row) => {
    const name = `${row.partner.fullName ?? ""} ${row.partner.username}`.toLowerCase();
    return !needle || name.includes(needle);
  });
  const rooms = (groups.data ?? []).filter((room) => !needle || room.title.toLowerCase().includes(needle));
  const card = projectBody(projectId, title, note);

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
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-3 py-4 sm:items-center sm:px-4 sm:py-6" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-200 bg-white p-4 shadow-2xl sm:p-5">
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
          <button type="button" className={`${ui.btn} ${ui.neutral}`} disabled={busy !== null || !safeId} onClick={() => void run("feed", async () => {
            const label = title.trim().slice(0, 255) || "Project";
            await createPost({ activity_type: "project_share", title: label, content: label, project_id: safeId });
            setNotice("Posted to the network.");
          })}>
            {busy === "feed" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Post to network
          </button>
          <button type="button" className={`${ui.btn} ${ui.neutral}`} disabled={!url || busy !== null} onClick={() => void run("copy", async () => {
            await navigator.clipboard.writeText(url);
            setNotice("Link copied.");
          })}>
            <Link2 className="h-3.5 w-3.5" /> Copy link
          </button>
          <button type="button" className={`${ui.btn} ${ui.neutral}`} disabled={!url} onClick={() => shareExternally(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title.slice(0, 200))}&url=${encodeURIComponent(url)}`)}>
            Post on X
          </button>
          <button type="button" className={`${ui.btn} ${ui.neutral}`} disabled={!url} onClick={() => shareExternally(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)}>
            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
          </button>
        </div>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Add a thought
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} rows={2} placeholder="Say something about this project" className={`${ui.input} mt-1 normal-case tracking-normal`} />
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Send in a chat
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people and groups" className={`${ui.input} mt-1 normal-case tracking-normal`} />
        </label>
        <ul className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-stone-200">
          {connections.isLoading || groups.isLoading ? (
            <li className="px-3 py-4 text-sm text-stone-500">Loading chats…</li>
          ) : people.length === 0 && rooms.length === 0 ? (
            <li className="px-3 py-4 text-sm text-stone-500">No chats match. You can still post the project or copy the link.</li>
          ) : (
            <>
              {rooms.map((room) => (
                <li key={room.id} className="flex items-center justify-between gap-3 border-b border-stone-100 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-stone-800">{room.title}</span>
                    <span className="block text-[11px] text-stone-500">Group</span>
                  </span>
                  <button type="button" className={`${ui.btn} ${ui.primary} shrink-0 px-3 py-1 text-xs`} disabled={busy !== null || !safeId}
                    onClick={() => void run(`room:${room.id}`, async () => {
                      await sendGroupMessage(room.id, card);
                      onClose();
                      navigate(`/messages?room=${room.id}`);
                    })}>
                    {busy === `room:${room.id}` ? "Sending…" : "Send"}
                  </button>
                </li>
              ))}
              {people.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 border-b border-stone-100 px-3 py-2 last:border-0">
                  <span className="min-w-0 truncate text-sm text-stone-800">{row.partner.fullName || row.partner.username}</span>
                  <button type="button" className={`${ui.btn} ${ui.primary} shrink-0 px-3 py-1 text-xs`} disabled={busy !== null || !safeId}
                    onClick={() => void run(row.partner.id, async () => {
                      await sendMessage(row.partner.id, card);
                      onClose();
                      navigate(`/messages?user=${row.partner.id}`);
                    })}>
                    {busy === row.partner.id ? "Sending…" : "Send"}
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>
        {notice && <p className="mt-3 flex items-center gap-1 text-sm text-forest-800"><Check className="h-4 w-4" /> {notice}</p>}
        {error && <p className={`mt-3 ${ui.error}`}>{error}</p>}
      </div>
    </div>
  );
}
