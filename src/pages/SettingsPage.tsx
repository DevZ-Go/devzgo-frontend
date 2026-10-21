import { useState, type FormEvent } from "react";
import { changePassword } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { Navbar } from "../components/Navbar";
import { PasswordField } from "../components/PasswordField";
import { getApiErrorMessage } from "../utils/apiError";
import { passwordValid } from "../utils/passwordPolicy";
import { ui } from "../styles/editorial";

const inputClass = `${ui.input} py-3`;

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
    <div className={ui.page}>
    <Navbar />
    <div className={`${ui.main} max-w-lg`}>
      <h1 className={ui.title}>Account settings</h1>
      {user && <p className="mt-1 font-sans text-sm text-stone-500">@{user.username} · {user.email}</p>}
      <form onSubmit={submit} className={`mt-8 p-6 space-y-4 ${ui.card}`}>
        <h2 className={ui.heading}>{hasPassword ? "Change password" : "Set a password"}</h2>
        {!hasPassword && <p className="font-sans text-sm text-stone-500">You sign in with GitHub. A password lets you sign in with your email too.</p>}
        {hasPassword && (
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password" placeholder="Current password" className={inputClass} />
        )}
        <PasswordField value={next} onChange={setNext} className={inputClass} />
        {message && <p role="status" className={`font-sans text-sm ${message.ok ? "text-forest-700" : "text-crimson-700"}`}>{message.text}</p>}
        <button type="submit" disabled={busy || !passwordValid(next)}
          className={`${ui.btn} ${ui.primary} rounded-xl px-5 py-2.5 text-sm`}>
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </div>
    </div>
  );
}
