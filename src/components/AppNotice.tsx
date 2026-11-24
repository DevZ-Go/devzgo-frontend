import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

type NoticeTone = "info" | "ok" | "bad";

type Notice = {
  id: number;
  message: string;
  tone: NoticeTone;
};

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  resolve: (ok: boolean) => void;
};

type NoticeApi = {
  notify: (message: string, tone?: NoticeTone) => void;
  confirm: (opts: {
    title?: string;
    message: string;
    confirmLabel?: string;
  }) => Promise<boolean>;
};

const NoticeContext = createContext<NoticeApi | null>(null);

export function useNotice(): NoticeApi {
  const ctx = useContext(NoticeContext);
  if (!ctx) {
    // Safe fallback when provider is missing (tests / isolated stories).
    return {
      notify: (message) => console.info(message),
      confirm: async ({ message }) => window.confirm(message),
    };
  }
  return ctx;
}

export function AppNoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const idRef = useRef(1);

  const notify = useCallback((message: string, tone: NoticeTone = "info") => {
    const id = idRef.current++;
    setNotices((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setNotices((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  const confirm = useCallback(
    (opts: { title?: string; message: string; confirmLabel?: string }) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({
          title: opts.title || "Please confirm",
          message: opts.message,
          confirmLabel: opts.confirmLabel || "Confirm",
          resolve,
        });
      }),
    []
  );

  const api = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  const closeConfirm = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  return (
    <NoticeContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4">
        {notices.map((n) => (
          <div
            key={n.id}
            role="status"
            className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
              n.tone === "bad"
                ? "border-red-200 bg-red-50 text-red-900"
                : n.tone === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border-stone-200 bg-white text-stone-900"
            }`}
          >
            <p className="flex-1 leading-snug">{n.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              className="rounded-md p-1 opacity-70 hover:opacity-100"
              onClick={() => setNotices((prev) => prev.filter((x) => x.id !== n.id))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {confirmState && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-[#1c1917]/55 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-confirm-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-[#f8f6f0] p-5 shadow-2xl">
            <h2 id="app-confirm-title" className="font-serif text-xl text-stone-900">
              {confirmState.title}
            </h2>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">{confirmState.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100"
                onClick={() => closeConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-maroon-800 px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-900"
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </NoticeContext.Provider>
  );
}
