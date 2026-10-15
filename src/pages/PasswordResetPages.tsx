import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { requestPasswordReset, resetPassword } from "../api/auth";
import { getApiErrorMessage } from "../utils/apiError";

const inputClass =
  "w-full rounded-2xl border-2 border-cream-200 bg-cream-50/50 pl-10 pr-4 py-3 text-gray-800 placeholder:text-gray-300 transition-all focus:border-lavender-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-200/40 text-sm";

function Card({ onSubmit, children, busy, label, notice, error }: {
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  busy: boolean;
  label: string;
  notice?: string | null;
  error?: string | null;
}) {
  return (
    <div className="w-full max-w-[420px]">
      <form onSubmit={onSubmit} className="rounded-3xl border-2 border-cream-200/80 bg-white shadow-soft-lg p-8 space-y-5">
        {children}
        {notice && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
        {error && <p role="alert" className="rounded-2xl bg-coral-50 px-4 py-3 text-sm text-coral-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-gradient-to-r from-lavender-500 to-coral-400 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-60"
        >
          {busy ? "Please wait…" : label}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        <Link to="/login" className="font-semibold text-lavender-500 hover:text-lavender-600">Back to sign in</Link>
      </p>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setNotice(await requestPasswordReset(email));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Forgot password" subtitle="We'll email you a link to choose a new one">
      <Card onSubmit={submit} busy={busy} label="Send reset link" notice={notice} error={error}>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" placeholder="you@example.com" className={inputClass} />
        </div>
      </Card>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const token = useSearchParams()[0].get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "This reset link is missing its token.");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      navigate("/login", { replace: true, state: { notice: "Password updated. Sign in with your new password." } });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="At least 8 characters">
      <Card onSubmit={submit} busy={busy || !token} label="Update password" error={error}>
        {[{ v: password, set: setPassword, ph: "New password" }, { v: confirm, set: setConfirm, ph: "Repeat new password" }].map((f) => (
          <div key={f.ph} className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input type="password" required minLength={8} value={f.v} onChange={(e) => f.set(e.target.value)}
              autoComplete="new-password" placeholder={f.ph} className={inputClass} />
          </div>
        ))}
      </Card>
    </AuthLayout>
  );
}
