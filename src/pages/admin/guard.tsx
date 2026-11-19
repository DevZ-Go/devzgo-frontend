import { useContext, useEffect, useId, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Copy, X } from "lucide-react";
import { previewAction, runAction, type ActionInput, type ActionPreview, type ActionResult } from "../../api/admin";
import { getApiErrorMessage } from "../../utils/apiError";
import { stableContext } from "../../utils/stableContext";
import { ui } from "../../styles/editorial";

export interface GuardAnswer {
  reason: string;
  typed: string;
}

interface AskOptions {
  load: () => Promise<ActionPreview>;
  /** Cancel is a lighter second step and does not need a stored reason. */
  requireReason?: boolean;
}

interface GuardApi {
  ask: (options: AskOptions) => Promise<GuardAnswer | null>;
}

const GuardContext = stableContext<GuardApi | null>("AdminGuard", null);

export function useGuard(): GuardApi {
  const value = useContext(GuardContext);
  if (!value) throw new Error("useGuard must be used inside the admin area");
  return value;
}

/** Two-step confirm, then run the change and refresh the admin pages. */
export function useAdminAction() {
  const { ask } = useGuard();
  const queryClient = useQueryClient();
  return async (input: ActionInput): Promise<ActionResult | null> => {
    const confirmed = await ask({ load: () => previewAction(input) });
    if (!confirmed) return null;
    const result = await runAction({ ...input, reason: confirmed.reason, typed: confirmed.typed });
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
    return result;
  };
}

export function GuardProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<(AskOptions & { resolve: (value: GuardAnswer | null) => void }) | null>(null);

  const ask = (options: AskOptions) =>
    new Promise<GuardAnswer | null>((resolve) => {
      setRequest({ ...options, resolve });
    });

  function finish(value: GuardAnswer | null) {
    request?.resolve(value);
    setRequest(null);
  }

  return (
    <GuardContext.Provider value={{ ask }}>
      {children}
      {request && <GuardDialog requireReason={request.requireReason !== false} load={request.load} onClose={finish} />}
    </GuardContext.Provider>
  );
}

function GuardDialog({
  load,
  requireReason,
  onClose,
}: {
  load: () => Promise<ActionPreview>;
  requireReason: boolean;
  onClose: (value: GuardAnswer | null) => void;
}) {
  const titleId = useId();
  const [preview, setPreview] = useState<ActionPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let gone = false;
    load()
      .then((next) => {
        if (!gone) setPreview(next);
      })
      .catch((err: unknown) => {
        if (!gone) setError(getApiErrorMessage(err));
      });
    return () => {
      gone = true;
    };
  }, [load]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const critical = preview?.severity === "critical";
  const reasonOk = !requireReason || reason.trim().length >= 8;
  const typedOk = preview
    ? preview.casefold
      ? typed.trim().toLowerCase() === preview.typed_value.trim().toLowerCase()
      : typed.trim() === preview.typed_value.trim()
    : false;
  const canFinish = Boolean(preview && !preview.blocked && reasonOk && typedOk && (!critical || checked));

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#2D120D]/55 p-0 sm:items-center sm:p-4" onMouseDown={() => onClose(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border-2 border-[#6B0B0C] bg-[#FFF8CA] p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B0B0C]">
              {preview ? `Step ${step} of 2 · ${critical && !preview.action.startsWith("proposal.") ? "Needs other admins" : "Confirm twice"}` : "Checking"}
            </p>
            <h2 id={titleId} className="mt-1 font-serif text-2xl font-bold text-[#2D120D]">
              {preview?.label ?? "Review this change"}
            </h2>
          </div>
          <button type="button" className="rounded-full p-2 text-[#2D120D] hover:bg-white" onClick={() => onClose(null)} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className={`${ui.error} mt-4`}>{error}</p>}
        {!preview && !error && <p className="mt-4 text-sm text-stone-600">Checking what this change would do…</p>}

        {preview?.blocked && (
          <div className="mt-4 rounded-2xl border-2 border-[#B45309] bg-white p-4 text-sm text-[#2D120D]">
            <p className="font-semibold">This cannot be done yet</p>
            <p className="mt-1">{preview.blocked}</p>
          </div>
        )}

        {preview && !preview.blocked && step === 1 && (
          <div className="mt-4 space-y-4">
            <div className={`rounded-2xl border-2 p-4 text-sm ${critical ? "border-[#DC2626] bg-[#FEE2E2]" : "border-[#B45309] bg-white"}`}>
              <p className="flex items-center gap-2 font-semibold text-[#2D120D]">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                {critical ? "This can cause a major problem" : "Read this before continuing"}
              </p>
              <p className="mt-2 leading-relaxed text-[#2D120D]">{preview.warning}</p>
              <p className="mt-3 font-medium">You are about to: {preview.summary}</p>
            </div>
            {requireReason && (
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Reason
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  maxLength={500}
                  className={`${ui.input} mt-1 font-normal normal-case tracking-normal`}
                  placeholder="At least 8 characters. Other admins can read this."
                />
              </label>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={`${ui.btn} ${ui.neutral} px-4 py-2 text-sm`} onClick={() => onClose(null)}>
                Go back
              </button>
              <button
                type="button"
                disabled={!reasonOk}
                className={`${ui.btn} ${ui.primary} px-4 py-2 text-sm`}
                onClick={() => setStep(2)}
              >
                I have read this
              </button>
            </div>
          </div>
        )}

        {preview && !preview.blocked && step === 2 && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[#2D120D]">{preview.typed_label}</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#2D120D]">{preview.typed_value}</code>
              <button
                type="button"
                className={`${ui.btn} ${ui.neutral} px-3 py-2 text-sm`}
                onClick={() => {
                  void navigator.clipboard?.writeText(preview.typed_value).then(() => setCopied(true));
                }}
              >
                <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Confirmation text"
              className={ui.input}
              placeholder="Type it here"
            />
            {critical && (
              <label className="flex items-start gap-2 text-sm font-medium text-[#2D120D]">
                <input type="checkbox" className="mt-1 accent-[#6B0B0C]" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
                I understand this can cause a major problem.
              </label>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={`${ui.btn} ${ui.neutral} px-4 py-2 text-sm`} onClick={() => setStep(1)}>
                Back
              </button>
              <button
                type="button"
                disabled={!canFinish}
                className={`${ui.btn} ${critical ? ui.danger : ui.primary} px-4 py-2 text-sm`}
                onClick={() => onClose({ reason: reason.trim(), typed: typed.trim() })}
              >
                {preview.action.startsWith("proposal.") ? "Submit vote" : critical ? "Submit for approval" : "Confirm change"}
              </button>
            </div>
          </div>
        )}

        {preview?.blocked && (
          <button type="button" className={`${ui.btn} ${ui.neutral} mt-4 px-4 py-2 text-sm`} onClick={() => onClose(null)}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
