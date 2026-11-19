import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Copy, Link2, Linkedin, Loader2, Share2, X } from "lucide-react";
import { fetchConnections } from "../api/connections";
import { createPost } from "../api/network";
import { fetchGroups, sendGroupMessage, sendMessage } from "../api/messages";
import { fetchProject } from "../api";
import { resolveApiAssetUrl } from "../api/config";
import { queryKeys } from "../api/queryKeys";
import { projectBody } from "../lib/chatText";
import { ui } from "../styles/editorial";
import { getApiErrorMessage } from "../utils/apiError";
import { ImageWithFallback } from "./ImageWithFallback";

export function ShareProjectDialog({
  projectId,
  title,
  open,
  onClose,
  coverUrl,
  blurb,
  techStacks,
}: {
  projectId: string;
  title: string;
  open: boolean;
  onClose: () => void;
  coverUrl?: string | null;
  blurb?: string | null;
  techStacks?: string[] | null;
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
  const details = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => fetchProject(projectId),
    enabled: open && /^[0-9a-f-]{36}$/i.test(projectId) && (!coverUrl || !blurb),
    staleTime: 60_000,
  });
  if (!open) return null;

  const safeId = /^[0-9a-f-]{36}$/i.test(projectId) ? projectId : "";
  const url = safeId ? `${window.location.origin}/project/${safeId}` : "";
  const displayTitle = (details.data?.title || title).trim() || "Project";
  const previewCover = resolveApiAssetUrl(
    coverUrl || details.data?.cover_image_url || details.data?.image_url || null,
  );
  const previewBlurb = (blurb || details.data?.short_description || "").trim();
  const previewTech = (techStacks?.length ? techStacks : details.data?.tech_stacks || []).slice(0, 4);
  const needle = query.trim().toLowerCase();
  const people = (connections.data?.accepted ?? []).filter((row) => {
    const name = `${row.partner.fullName ?? ""} ${row.partner.username}`.toLowerCase();
    return !needle || name.includes(needle);
  });
  const rooms = (groups.data ?? []).filter((room) => !needle || room.title.toLowerCase().includes(needle));
  const card = projectBody(projectId, displayTitle, note);

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

  async function shareNative() {
    if (!url || !navigator.share) return;
    await navigator.share({ title: displayTitle, text: previewBlurb || displayTitle, url });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 px-3 py-4 sm:items-center sm:px-4 sm:py-6" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-maroon-800">Share project</p>
            <h2 id="share-title" className="font-serif text-xl text-stone-900 sm:text-2xl">Send it anywhere</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-[#faf7f0]">
            <div className="relative aspect-[16/9] overflow-hidden bg-stone-200">
              {previewCover ? (
                <ImageWithFallback src={previewCover} alt="" className="h-full w-full object-cover object-center" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-stone-500">No cover image</div>
              )}
            </div>
            <div className="space-y-1.5 px-3 py-3">
              <p className="font-serif text-lg leading-snug text-stone-900">{displayTitle}</p>
              {previewBlurb && <p className="text-xs leading-relaxed text-stone-600 line-clamp-2">{previewBlurb}</p>}
              {previewTech.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {previewTech.map((tech) => (
                    <span key={tech} className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-medium text-stone-700">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Quick share</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" className={`${ui.btn} ${ui.neutral} justify-center`} disabled={!url || busy !== null} onClick={() => void run("copy", async () => {
                await navigator.clipboard.writeText(url);
                setNotice("Link copied.");
              })}>
                <Copy className="h-3.5 w-3.5" /> Copy link
              </button>
              {"share" in navigator && (
                <button type="button" className={`${ui.btn} ${ui.neutral} justify-center`} disabled={!url || busy !== null} onClick={() => void run("native", shareNative)}>
                  <Share2 className="h-3.5 w-3.5" /> Device share
                </button>
              )}
              <button type="button" className={`${ui.btn} ${ui.neutral} justify-center`} disabled={busy !== null || !safeId} onClick={() => void run("feed", async () => {
                await createPost({ activity_type: "project_share", title: displayTitle.slice(0, 255), content: displayTitle.slice(0, 255), project_id: safeId });
                setNotice("Posted to the network.");
              })}>
                {busy === "feed" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                Post to network
              </button>
              <button type="button" className={`${ui.btn} ${ui.neutral} justify-center`} disabled={!url} onClick={() => shareExternally(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)}>
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </button>
              <button type="button" className={`${ui.btn} ${ui.neutral} justify-center col-span-2`} disabled={!url} onClick={() => shareExternally(`https://twitter.com/intent/tweet?text=${encodeURIComponent(displayTitle.slice(0, 200))}&url=${encodeURIComponent(url)}`)}>
                Share on X
              </button>
            </div>
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Add a note
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={2}
              placeholder="Optional message for the chat"
              className={`${ui.input} mt-1 normal-case tracking-normal`}
            />
          </label>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Send in messages</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people and groups"
              className={`${ui.input} mt-2 normal-case tracking-normal`}
            />
            <ul className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-stone-200">
              {connections.isLoading || groups.isLoading ? (
                <li className="px-3 py-4 text-sm text-stone-500">Loading chats…</li>
              ) : people.length === 0 && rooms.length === 0 ? (
                <li className="px-3 py-4 text-sm text-stone-500">No chats match. Copy the link or post to the network instead.</li>
              ) : (
                <>
                  {rooms.map((room) => (
                    <li key={room.id} className="flex items-center justify-between gap-3 border-b border-stone-100 px-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-stone-800">{room.title}</span>
                        <span className="block text-[11px] text-stone-500">Group</span>
                      </span>
                      <button
                        type="button"
                        className={`${ui.btn} ${ui.primary} shrink-0 px-3 py-1.5 text-xs`}
                        disabled={busy !== null || !safeId}
                        onClick={() => void run(`room:${room.id}`, async () => {
                          await sendGroupMessage(room.id, card);
                          onClose();
                          navigate(`/messages?room=${room.id}`);
                        })}
                      >
                        {busy === `room:${room.id}` ? "Sending…" : "Send"}
                      </button>
                    </li>
                  ))}
                  {people.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3 border-b border-stone-100 px-3 py-2.5 last:border-0">
                      <span className="min-w-0 truncate text-sm font-medium text-stone-800">{row.partner.fullName || row.partner.username}</span>
                      <button
                        type="button"
                        className={`${ui.btn} ${ui.primary} shrink-0 px-3 py-1.5 text-xs`}
                        disabled={busy !== null || !safeId}
                        onClick={() => void run(row.partner.id, async () => {
                          await sendMessage(row.partner.id, card);
                          onClose();
                          navigate(`/messages?user=${row.partner.id}`);
                        })}
                      >
                        {busy === row.partner.id ? "Sending…" : "Send"}
                      </button>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>

          {notice && <p className="flex items-center gap-1.5 text-sm text-forest-800"><Check className="h-4 w-4" /> {notice}</p>}
          {error && <p className={ui.error}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
