import { useCallback, useEffect, useState, type FormEvent } from "react";
import { changeUsername } from "../api/auth";
import { updateMyProfile } from "../api/profiles";
import { useAuth } from "../auth/AuthContext";
import { UsernameField } from "./UsernameField";
import { getApiErrorMessage } from "../utils/apiError";
import { ui } from "../styles/editorial";

/**
 * Alerts existing accounts that are missing a username (still using an email)
 * or missing their First & Last Name so every profile shows First Last with @username underneath.
 */
export function UsernameGate() {
  const { user, refreshUser } = useAuth();
  const needsUsername = Boolean(user?.username_needs_choice);
  const needsName = Boolean(user?.name_needs_choice);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onAvailable = useCallback((ok: boolean) => setAvailable(ok), []);

  useEffect(() => {
    if (!user) return;
    if (!needsUsername && user.username) {
      setUsername(user.username);
      setAvailable(true);
    }
  }, [user, needsUsername]);

  if (!user || (!needsUsername && !needsName)) return null;

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const usernameChanged = username.trim().toLowerCase() !== (user.username || "").trim().toLowerCase();
  const canSubmit =
    !busy &&
    (!needsName || (trimmedFirst.length > 0 && trimmedLast.length > 0)) &&
    (!needsUsername || available) &&
    (!usernameChanged || available);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (needsName && (!trimmedFirst || !trimmedLast)) {
      setError("Please enter both your first name and last name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (needsUsername || (username.trim() && usernameChanged)) {
        await changeUsername(username.trim());
      }
      if (needsName) {
        await updateMyProfile({ fullName: `${trimmedFirst} ${trimmedLast}` });
      }
      await refreshUser();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1c1917]/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="username-gate-title"
    >
      <form
        onSubmit={save}
        className="w-full max-w-md rounded-3xl border border-stone-200 bg-[#f8f6f0] p-6 shadow-2xl space-y-4"
      >
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-maroon-800">
            Profile Update Required
          </p>
          <h2 id="username-gate-title" className="mt-1 font-serif text-3xl text-stone-900">
            {needsUsername && !needsName
              ? "Choose a username"
              : needsName && !needsUsername
              ? "Add your First & Last Name"
              : "Complete your profile"}
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Profiles now display your <strong>First &amp; Last Name</strong> with your{" "}
            <span className="font-mono text-xs">@username</span> underneath. Please fill in your details to continue.
          </p>
        </div>

        {needsName && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="gate-first-name" className="block text-xs font-semibold text-stone-700 mb-1">
                First Name *
              </label>
              <input
                id="gate-first-name"
                type="text"
                required
                maxLength={60}
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className={`${ui.input} py-2.5`}
              />
            </div>
            <div>
              <label htmlFor="gate-last-name" className="block text-xs font-semibold text-stone-700 mb-1">
                Last Name *
              </label>
              <input
                id="gate-last-name"
                type="text"
                required
                maxLength={60}
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={`${ui.input} py-2.5`}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-xs font-semibold text-stone-700 mb-1">
            Username {needsUsername ? "*" : "(your @handle)"}
          </label>
          <UsernameField
            value={username}
            onChange={setUsername}
            onAvailable={onAvailable}
            className={`${ui.input} py-2.5`}
          />
        </div>

        {error && <p className="text-sm text-crimson-700">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`${ui.btn} ${ui.primary} w-full justify-center rounded-xl px-5 py-2.5 text-sm`}
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
