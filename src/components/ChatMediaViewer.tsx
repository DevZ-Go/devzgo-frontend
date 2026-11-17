import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { api } from "../api/client";

export type ChatMediaItem = {
  id: string;
  url: string;
  kind: "image" | "video";
  label: string;
  senderName: string;
  createdAt?: string;
};

type Props = {
  items: ChatMediaItem[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
};

function formatWhen(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Full-screen gallery for chat photos and videos — arrows, swipe, and a clean dark stage. */
export function ChatMediaViewer({ items, index, onIndex, onClose }: Props) {
  const current = items[index];
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const cache = useRef(new Map<string, string>());
  const touch = useRef<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (delta: number) => {
      if (items.length < 2) return;
      onIndex((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stageRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  useEffect(() => {
    if (!current) return;
    let dead = false;
    const cached = cache.current.get(current.url);
    if (cached) {
      setSrc(cached);
      setFailed(false);
      setLoading(false);
      return;
    }
    setSrc(null);
    setFailed(false);
    setLoading(true);
    api
      .get(current.url, { responseType: "blob" })
      .then((res) => {
        const objectUrl = URL.createObjectURL(res.data);
        cache.current.set(current.url, objectUrl);
        if (!dead) {
          setSrc(objectUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!dead) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      dead = true;
    };
  }, [current]);

  useEffect(() => () => {
    for (const url of cache.current.values()) URL.revokeObjectURL(url);
    cache.current.clear();
  }, []);

  if (!current) return null;

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    touch.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: React.PointerEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  }

  const when = formatWhen(current.createdAt);
  const many = items.length > 1;

  return (
    <div
      ref={stageRef}
      role="dialog"
      aria-modal="true"
      aria-label={current.label}
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex flex-col outline-none"
      style={{ background: "radial-gradient(120% 80% at 50% 20%, rgba(41,37,36,0.92), rgba(12,10,9,0.97))" }}
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 backdrop-blur-md" aria-hidden />

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] text-stone-100">
        <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
          <p className="truncate font-serif text-lg tracking-tight">{current.senderName}</p>
          <p className="truncate text-xs text-stone-400">
            {current.kind === "video" ? "Video" : "Photo"}
            {when ? ` · ${when}` : ""}
            {many ? ` · ${index + 1} of ${items.length}` : ""}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="shrink-0 rounded-full border border-white/15 bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div
        className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 sm:px-14"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { touch.current = null; }}
      >
        {many && (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/15 bg-stone-950/50 p-3 text-white backdrop-blur-md transition hover:bg-stone-900/80 sm:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/15 bg-stone-950/50 p-3 text-white backdrop-blur-md transition hover:bg-stone-900/80 sm:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <div className="relative flex max-h-full max-w-[min(96vw,64rem)] items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="h-10 w-10 animate-pulse rounded-full border-2 border-white/20 border-t-amber-200" />
            </div>
          )}
          {failed && <p className="text-sm text-stone-300">Couldn't load this file.</p>}
          {src && current.kind === "video" && (
            <video
              key={current.id}
              src={src}
              controls
              autoPlay
              playsInline
              className="max-h-[min(78vh,900px)] max-w-full rounded-2xl bg-black shadow-[0_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
            />
          )}
          {src && current.kind === "image" && (
            <img
              key={current.id}
              src={src}
              alt={current.label}
              draggable={false}
              className="max-h-[min(78vh,900px)] max-w-full select-none rounded-2xl object-contain shadow-[0_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
            />
          )}
        </div>
      </div>

      <footer className="relative z-10 flex flex-col items-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        {many && (
          <div className="flex max-w-full items-center gap-1.5 overflow-x-auto px-2 py-1" onClick={(e) => e.stopPropagation()}>
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to ${item.kind} ${i + 1}`}
                aria-current={i === index}
                onClick={() => onIndex(i)}
                className={`h-1.5 shrink-0 rounded-full transition-all ${
                  i === index ? "w-6 bg-amber-200" : "w-1.5 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        )}
        <p className="text-[11px] tracking-wide text-stone-500">
          {many ? "Swipe or use arrow keys · Esc to close" : "Esc to close"}
        </p>
      </footer>
    </div>
  );
}

/** Compact thread preview that opens the gallery. */
export function ChatMediaThumb({
  url,
  kind,
  label,
  onOpen,
}: {
  url: string;
  kind: "image" | "video";
  label: string;
  onOpen: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let dead = false;
    let objectUrl = "";
    api
      .get(url, { responseType: "blob" })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        if (dead) URL.revokeObjectURL(objectUrl);
        else setSrc(objectUrl);
      })
      .catch(() => {
        if (!dead) setFailed(true);
      });
    return () => {
      dead = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (failed) return <p className="text-xs opacity-80">Couldn't load this file.</p>;
  if (!src) return <p className="mt-1 text-xs opacity-70">Loading…</p>;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${label}`}
      className="group relative mt-1 block w-full overflow-hidden rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
    >
      {kind === "video" ? (
        <>
          <video src={src} muted playsInline preload="metadata" className="max-h-64 w-full bg-black object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-stone-950/25 transition group-hover:bg-stone-950/35">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-lg backdrop-blur-sm">
              <Play className="h-5 w-5 fill-current" />
            </span>
          </span>
        </>
      ) : (
        <img
          src={src}
          alt={label}
          className="max-h-64 w-full cursor-zoom-in object-contain transition duration-300 group-hover:scale-[1.02]"
        />
      )}
    </button>
  );
}
