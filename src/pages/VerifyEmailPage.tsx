import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ClipboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { resendVerification, verifyEmailCode } from "../api/auth";
import { getApiErrorMessage } from "../utils/apiError";

type LocationState = {
  pendingId?: string;
  emailMasked?: string;
  resendAfter?: string;
  email?: string;
};

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const pendingId = state.pendingId || "";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [resendAt, setResendAt] = useState(() => (state.resendAfter ? Date.parse(state.resendAfter) : Date.now()));
  const [now, setNow] = useState(Date.now());
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const code = useMemo(() => digits.join(""), [digits]);

  if (!pendingId) {
    return (
      <AuthLayout title="Verify your email" subtitle="Start from the sign-up page to get a code.">
        <Link to="/register" className="text-sm font-semibold text-maroon-800 underline">
          Back to register
        </Link>
      </AuthLayout>
    );
  }

  async function submitCode(value: string) {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await verifyEmailCode(pendingId, value);
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  }

  function onChange(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 5) inputs.current[index + 1]?.focus();
    if (next.every(Boolean)) void submitCode(next.join(""));
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    if (pasted.length === 6) void submitCode(pasted);
    else inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function onResend() {
    if (secondsLeft > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await resendVerification(pendingId);
      setResendAt(Date.parse(result.resend_after));
      setInfo(`A new code was sent to ${result.email_masked}. Use the latest code only.`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Email verified" subtitle="Your account is ready. Sign in with your email or username.">
        <div className="w-full max-w-[420px] rounded-3xl border border-stone-200 bg-white p-8 shadow-xl">
          <p className="text-sm text-stone-600">Verification worked. Continue to sign in — you are not signed in yet.</p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true, state: { email: state.email } })}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust text-sm font-semibold text-white"
          >
            Go to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Check your email" subtitle={`Enter the 6-digit code sent to ${state.emailMasked || "your inbox"}.`}>
      <form
        className="w-full max-w-[420px] rounded-3xl border border-stone-200 bg-white p-8 shadow-xl"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void submitCode(code);
        }}
      >
        <div className="flex justify-between gap-2" onPaste={onPaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${index + 1}`}
              maxLength={1}
              value={digit}
              onChange={(e) => onChange(index, e.target.value)}
              onKeyDown={(e) => onKeyDown(index, e)}
              className="h-12 w-10 rounded-xl border border-stone-200 bg-[#f8f6f0] text-center font-serif text-xl text-stone-900 focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/20"
            />
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
        {info && <p className="mt-4 text-sm text-stone-600">{info}</p>}
        <p className="mt-4 text-xs text-stone-500">
          Delivery can take a minute. If nothing arrives, check spam, then resend. Only the newest code works.
        </p>
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Checking…" : "Verify email"}
        </button>
        <button
          type="button"
          disabled={busy || secondsLeft > 0}
          onClick={() => void onResend()}
          className="mt-3 w-full text-sm font-semibold text-maroon-800 disabled:text-stone-400"
        >
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend code"}
        </button>
      </form>
    </AuthLayout>
  );
}
