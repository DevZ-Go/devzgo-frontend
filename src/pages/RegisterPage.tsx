import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Zap } from "lucide-react";
import { loginWithPassword, registerUser } from "../api";
import { useAuth } from "../auth/AuthContext";
import { destinationAfterLogin } from "../auth/session";
import { AuthLayout } from "../components/AuthLayout";
import { getApiErrorMessage } from "../utils/apiError";
import { GitHubButton } from "../components/GitHubButton";
import { UsernameField } from "../components/UsernameField";
import { PasswordField } from "../components/PasswordField";
import { SignupRoleFields } from "../components/SignupRoleFields";
import { passwordValid } from "../utils/passwordPolicy";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function RegisterPage() {
  const navigate = useNavigate();
  const { login, refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [usernameOk, setUsernameOk] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function criteriaErrors(): string[] {
    const issues: string[] = [];
    if (!username.trim()) issues.push("Choose a username.");
    else if (!usernameOk) issues.push("Pick an available username that meets the format rules.");
    if (!email.trim()) issues.push("Add your email address.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) issues.push("Enter a valid email address.");
    if (!password) issues.push("Create a password.");
    else if (!passwordValid(password)) {
      issues.push("Password needs 8–128 characters, an uppercase letter, and a special character.");
    }
    if (!role) issues.push("Select your role.");
    if (role === "Recruiter" && company.trim().length < 2) {
      issues.push("Add the company or agency you recruit for.");
    }
    return issues;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const issues = criteriaErrors();
    if (issues.length) {
      setError(issues.join(" "));
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const result = await registerUser({
        username,
        email,
        password,
        role,
        company: role === "Recruiter" ? company.trim() : undefined,
      });
      if ("verification_required" in result && result.verification_required) {
        navigate("/verify-email", {
          replace: true,
          state: {
            pendingId: result.pending_id,
            emailMasked: result.email_masked,
            resendAfter: result.resend_after,
            email,
          },
        });
        return;
      }
      login((await loginWithPassword(email, password)).access_token);
      navigate(await destinationAfterLogin(await refreshUser()), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const blocking = criteriaErrors();

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join DevZ-Go and showcase your projects"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-[420px]"
      >
        <div className="rounded-3xl border border-gray-200/50 bg-white shadow-xl">
          <div className="px-8 pt-8 pb-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full border border-blue-500/20 mb-6">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Get started free
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <UsernameField value={username} onChange={setUsername} onAvailable={setUsernameOk} className={inputClass} />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <PasswordField id="password" value={password} onChange={setPassword} placeholder="••••••••" className={inputClass} />
            </div>

            <SignupRoleFields role={role} company={company} onRole={setRole} onCompany={setCompany} inputClass={inputClass} />

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
            {!error && blocking.length > 0 && (username || email || password || role) && (
              <ul className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1">
                {blocking.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust py-3.5 text-base font-semibold text-white shadow-md shadow-maroon-800/20 transition-all hover:shadow-lg hover:shadow-maroon-800/30 hover:from-maroon-900 hover:to-autumn-amber disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <div className="px-8 pb-8 -mt-3">
            <div className="mb-4 flex items-center gap-3 text-xs text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />or<span className="h-px flex-1 bg-stone-200" />
            </div>
            <GitHubButton />
          </div>
        </div>

        <p className="mt-8 text-center text-stone-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-maroon-700 hover:text-maroon-900"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
