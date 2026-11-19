import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { UsernameField } from "../components/UsernameField";
import { completeGitHubSignup } from "../api/auth";
import { SignupRoleFields } from "../components/SignupRoleFields";
import { useAuth } from "../auth/AuthContext";
import { destinationAfterLogin } from "../auth/session";
import { getApiErrorMessage } from "../utils/apiError";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20";

function readFragment() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return {
    token: params.get("token") ?? "",
    suggested: params.get("suggested") ?? "",
    needsEmail: params.get("needs_email") === "1",
  };
}

/** First GitHub sign-in: the account is created only after the person picks a username. */
export function GitHubOnboardingPage() {
  const navigate = useNavigate();
  const { login, refreshUser } = useAuth();
  const [{ token, suggested, needsEmail }] = useState(readFragment);
  const [username, setUsername] = useState(suggested);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "This sign-up link is incomplete. Sign in with GitHub again.");
  useEffect(() => window.history.replaceState(null, "", window.location.pathname), []); // keep the token out of the address bar

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await completeGitHubSignup(
        token,
        username,
        role,
        role === "Recruiter" ? company.trim() : undefined,
        needsEmail ? email.trim() : undefined,
      );
      if ("verification_required" in result && result.verification_required) {
        navigate("/verify-email", {
          replace: true,
          state: {
            pendingId: result.pending_id,
            emailMasked: result.email_masked,
            resendAfter: result.resend_after,
            email: email.trim(),
          },
        });
        return;
      }
      login(result.access_token);
      navigate(await destinationAfterLogin(await refreshUser()), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const emailOk = !needsEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <AuthLayout title="Choose your username" subtitle="This is how other developers find you. It can't be changed later.">
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-3xl border border-gray-200/50 bg-white shadow-xl p-8 space-y-5">
        <UsernameField value={username} onChange={setUsername} onAvailable={setAvailable} className={inputClass} />
        {needsEmail && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`${inputClass} mt-1 font-normal normal-case tracking-normal`}
            />
            <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-stone-500">
              GitHub did not share a verified email. We will send a 6-digit code to confirm this address.
            </span>
          </label>
        )}
        <SignupRoleFields role={role} company={company} onRole={setRole} onCompany={setCompany} inputClass={inputClass} />
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy || !token || !available || !role || !emailOk || (role === "Recruiter" && company.trim().length < 2)}
          className="w-full rounded-2xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust py-3.5 font-semibold text-white shadow-md shadow-maroon-800/20 hover:from-maroon-900 hover:to-autumn-amber disabled:opacity-60">
          {busy ? "Creating account…" : needsEmail ? "Send verification code" : "Create account"}
        </button>
        <p className="text-center text-sm text-gray-500"><Link to="/login" className="font-semibold text-forest-700">Back to sign in</Link></p>
      </form>
    </AuthLayout>
  );
}
