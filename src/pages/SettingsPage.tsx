import { useState, type FormEvent } from "react";
import { changePassword } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { Navbar } from "../components/Navbar";
import { PasswordField } from "../components/PasswordField";
import { getApiErrorMessage } from "../utils/apiError";
import { passwordValid } from "../utils/passwordPolicy";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function SettingsPage() {
  const { user, login, refreshUser } = useAuth();
  const hasPassword = user?.has_password !== false;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      login(await changePassword(next, hasPassword ? current : undefined));
      await refreshUser();
      setCurrent("");
      setNext("");
      setMessage({ text: "Password saved. Other devices have been signed out.", ok: true });
    } catch (err) {
      setMessage({ text: getApiErrorMessage(err), ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <Navbar />
    <div className="mx-auto max-w-lg px-4 pt-28 pb-16">
      <h1 className="text-2xl font-bold text-gray-900">Account settings</h1>
      {user && <p className="mt-1 text-sm text-gray-500">@{user.username} · {user.email}</p>}
      <form onSubmit={submit} className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">{hasPassword ? "Change password" : "Set a password"}</h2>
        {!hasPassword && <p className="text-sm text-gray-500">You sign in with GitHub. A password lets you sign in with your email too.</p>}
        {hasPassword && (
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password" placeholder="Current password" className={inputClass} />
        )}
        <PasswordField value={next} onChange={setNext} className={inputClass} />
        {message && <p role="status" className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>}
        <button type="submit" disabled={busy || !passwordValid(next)}
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </div>
    </>
  );
}
