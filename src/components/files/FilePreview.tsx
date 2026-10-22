import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { fetchArchiveListing, fetchFileMeta, fetchStreamBlob, mediaSrc, type ArchiveListing, type FileMeta } from "../../api/files";
import { fetchProjectFileContent } from "../../api/projects";
import { getApiErrorMessage } from "../../utils/apiError";
import { viewerFor } from "../../utils/filePreview";

function useBlobUrl(blob: Blob | null, type?: string) {
  const url = useMemo(() => {
    if (!blob) return null;
    return URL.createObjectURL(type ? new Blob([blob], { type }) : blob);
  }, [blob, type]);
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

export function FilePreview({ projectId, path }: { projectId: string; path: string | null }) {
  const [meta, setMeta] = useState<FileMeta | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [archive, setArchive] = useState<ArchiveListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const kind = meta ? viewerFor(meta.kind) : "binary";
  const imageUrl = useBlobUrl(kind === "image" ? blob : null);
  const svgUrl = useBlobUrl(kind === "svg" ? blob : null, "image/svg+xml");
  const pdfUrl = useBlobUrl(kind === "pdf" ? blob : null, "application/pdf");
  const download = meta ? mediaSrc(projectId, meta.download_url) : null;

  useEffect(() => {
    if (!path) {
      setMeta(null);
      setText(null);
      setBlob(null);
      setArchive(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setText(null);
    setBlob(null);
    setArchive(null);
    setMeta(null);
    void (async () => {
      try {
        const next = await fetchFileMeta(projectId, path);
        if (cancelled) return;
        setMeta(next);
        const view = viewerFor(next.kind);
        if (next.message && view !== "text" && view !== "archive") return;
        if (view === "text") {
          const preview = await fetchProjectFileContent(projectId, path);
          if (!cancelled) setText(preview.content ?? preview.message ?? "");
        } else if (view === "archive") {
          const listing = await fetchArchiveListing(projectId, path);
          if (!cancelled) setArchive(listing);
        } else if (view === "image" || view === "svg" || view === "pdf" || view === "font") {
          const file = await fetchStreamBlob(projectId, next.stream_url);
          if (!cancelled) setBlob(file);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, path]);

  if (!path) return <p className="text-sm text-stone-500">Choose a file to preview it.</p>;
  if (loading) return <p className="flex items-center gap-2 text-sm text-stone-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading file…</p>;
  if (error) return <p className="text-sm text-crimson-700">{error}</p>;
  if (!meta) return null;

  const header = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="min-w-0 break-all font-mono text-xs text-stone-500">{meta.path}</p>
      {download && (
        <a href={download} className="inline-flex items-center gap-1 text-xs font-semibold text-maroon-800 hover:underline">
          <Download className="h-3.5 w-3.5" /> Download
        </a>
      )}
    </div>
  );

  if (meta.message && kind !== "text" && kind !== "archive") {
    return <div>{header}<p className="text-sm text-stone-600">{meta.message}</p></div>;
  }
  if (kind === "text") {
    return (
      <div>
        {header}
        {meta.preview_limited && <p className="mb-2 text-xs text-amber-800">Showing the first 2 MB.</p>}
        <pre className="max-h-[420px] overflow-auto whitespace-pre rounded-xl bg-stone-50 p-4 font-mono text-xs text-stone-800">{text ?? ""}</pre>
      </div>
    );
  }
  if (kind === "image" && imageUrl) return <div>{header}<img src={imageUrl} alt={meta.name} className="mx-auto max-h-[420px] max-w-full rounded-xl" /></div>;
  if (kind === "svg" && svgUrl) return <div>{header}<img src={svgUrl} alt={meta.name} className="mx-auto max-h-[420px] max-w-full rounded-xl bg-white" /></div>;
  if (kind === "pdf" && pdfUrl) return <div>{header}<iframe title={meta.name} src={pdfUrl} className="h-[480px] w-full rounded-xl border border-stone-200" /></div>;
  if ((kind === "audio" || kind === "video") && mediaSrc(projectId, meta.stream_url)) {
    const src = mediaSrc(projectId, meta.stream_url)!;
    return <div>{header}{kind === "audio" ? <audio src={src} controls className="w-full" /> : <video src={src} controls className="max-h-[420px] w-full rounded-xl bg-black" />}</div>;
  }
  if (kind === "font" && blob) return <div>{header}<FontSample blob={blob} name={meta.name} /></div>;
  if (kind === "archive") {
    return (
      <div>
        {header}
        {archive?.message && <p className="mb-2 text-sm text-stone-600">{archive.message}</p>}
        <ul className="max-h-[420px] space-y-1 overflow-auto font-mono text-xs text-stone-700">
          {(archive?.entries ?? []).map((entry) => (
            <li key={entry.name} className="break-all">{entry.symlink ? `${entry.name} (link)` : entry.name}</li>
          ))}
        </ul>
      </div>
    );
  }
  return <div>{header}<p className="text-sm text-stone-600">This file can’t be previewed. You can download it.</p></div>;
}

function FontSample({ blob, name }: { blob: Blob; name: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void blob.arrayBuffer().then((buffer) => {
      if (cancelled) return;
      const bytes = new Uint8Array(buffer);
      let binary = "";
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      setSrc(`data:font/octet-stream;base64,${btoa(binary)}`);
    });
    return () => { cancelled = true; };
  }, [blob]);
  if (!src) return null;
  const doc = `<!doctype html><style>@font-face{font-family:preview;src:url(${src})}body{margin:0;font-family:preview,serif;font-size:28px}</style><p>The quick brown fox jumps over the lazy dog</p><p style="font-size:14px">${name}</p>`;
  return <iframe title={name} sandbox="" srcDoc={doc} className="h-28 w-full rounded-xl border border-stone-200 bg-white" />;
}
