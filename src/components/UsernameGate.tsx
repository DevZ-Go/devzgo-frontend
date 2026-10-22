import { useCallback, useState, type FormEvent } from "react";
import { changeUsername } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { UsernameField } from "./UsernameField";
import { getApiErrorMessage } from "../utils/apiError";
import { ui } from "../styles/editorial";

/** Blocks the app until an account that still has an email as its handle picks a username. */
export function UsernameGate() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onAvailable = useCallback((ok: boolean) => setAvailable(ok), []);

  if (!user?.username_needs_choice) return null;

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await changeUsername(username);
      await refreshUser();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1c1917]/70 px-4"
      role="dialog" aria-modal="true" aria-labelledby="username-gate-title">
      <form onSubmit={save} className="w-full max-w-md rounded-3xl border border-stone-200 bg-[#f8f6f0] p-6 shadow-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-maroon-800">Your handle</p>
        <h2 id="username-gate-title" className="mt-1 font-serif text-3xl text-stone-900">Choose a username</h2>
        <p className="mt-2 text-sm text-stone-600">
          This account is still using an email as its name. Pick a handle people can mention and find.
        </p>
        <div className="mt-5">
          <UsernameField value={username} onChange={setUsername} onAvailable={onAvailable} className={`${ui.input} py-3`} />
        </div>
        {error && <p className="mt-3 text-sm text-crimson-700">{error}</p>}
        <button type="submit" disabled={busy || !available} className={`${ui.btn} ${ui.primary} mt-5 rounded-xl px-5 py-2.5 text-sm`}>
          {busy ? "Saving…" : "Save username"}
        </button>
      </form>
    </div>
  );
}
