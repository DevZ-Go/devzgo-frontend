import { useEffect, useRef } from "react";

type Destroyable = { destroy: () => void };

export function CodeEditor({ path, value, readOnly, onChange }: {
  path: string;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    let view: Destroyable | null = null;
    let cancelled = false;
    void import("./editorSetup").then((mod) => {
      if (cancelled) return;
      view = mod.createEditor(parent, value, path, readOnly, (next) => onChangeRef.current(next));
    });
    return () => {
      cancelled = true;
      view?.destroy();
    };
    // The editor owns the document after it opens. A new file, or a read-only change, builds a new one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, readOnly]);

  return <div ref={host} className="min-h-40 overflow-hidden rounded-xl border border-stone-200" />;
}

export function DiffView({ path, original, value }: { path: string; original: string; value: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    let view: Destroyable | null = null;
    let cancelled = false;
    void import("./editorSetup").then((mod) => {
      if (cancelled) return;
      view = mod.mountMerge(parent, original, value, path);
    });
    return () => {
      cancelled = true;
      view?.destroy();
    };
  }, [path, original, value]);
  return <div ref={host} className="overflow-hidden rounded-xl border border-stone-200" />;
}
