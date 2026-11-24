import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { loginWithPassword, registerUser } from "../api";
import { useAuth } from "../auth/AuthContext";
import { destinationAfterLogin, markNewAccountWelcome } from "../auth/session";
import { AuthLayout } from "../components/AuthLayout";
import { getApiErrorMessage } from "../utils/apiError";
import { GitHubButton } from "../components/GitHubButton";
import { UsernameField } from "../components/UsernameField";
import { PasswordField } from "../components/PasswordField";
import { SignupRoleFields } from "../components/SignupRoleFields";
import { passwordValid } from "../utils/passwordPolicy";

const inputClass =
  "w-full rounded-xl border border-[#DECDBA] bg-white px-4 py-3 text-[#2D120D] placeholder:text-[#6E5952]/65 transition focus:border-[#780D18] focus:outline-none focus:ring-2 focus:ring-[#780D18]/20";

export function RegisterPage() {
  const navigate = useNavigate();
  const { login, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
    if (!firstName.trim()) issues.push("Enter your first name.");
    if (!lastName.trim()) issues.push("Enter your last name.");
    if (!username.trim()) issues.push("Choose a username.");
    else if (!usernameOk) issues.push("Pick an available username that meets the format rules.");
    if (!email.trim()) issues.push("Add your email address.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) issues.push("Enter a valid email address.");
    if (!password) issues.push("Create a password.");
    else if (!passwordValid(password)) {
      issues.push("Password needs 8–128 characters, one uppercase letter, and one special character.");
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
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email,
        password,
        role,
        company: role === "Recruiter" ? company.trim() : undefined,
      });
      if ("verification_required" in result && result.verification_required) {
        markNewAccountWelcome(email.trim());
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
      markNewAccountWelcome(email.trim(), result.id);
      login((await loginWithPassword(email, password)).access_token);
      navigate(await destinationAfterLogin(await refreshUser(), { isNewAccount: true }), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const blocking = criteriaErrors();
  const started = Boolean(firstName || lastName || username || email || password || role);

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join DevZ-Go with your real name and a unique handle"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="w-full max-w-[440px]"
      >
        <div className="rounded-3xl border border-[#DECDBA] bg-[#F7F1E8] shadow-[0_18px_40px_rgba(45,18,13,0.08)] overflow-hidden">
          <div className="px-7 sm:px-8 pt-7 pb-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#780D18]">
              Developer signup
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[#2D120D]">Welcome to DevZ-Go</h2>
            <p className="mt-1.5 text-sm text-[#6E5952] leading-relaxed">
              Profiles show your first and last name with @username underneath.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-7 sm:px-8 pb-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="first-name" className="mb-1.5 block text-sm font-medium text-[#2D120D]">
                  First name
                </label>
                <input
                  id="first-name"
                  type="text"
                  required
                  maxLength={60}
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="last-name" className="mb-1.5 block text-sm font-medium text-[#2D120D]">
                  Last name
                </label>
                <input
                  id="last-name"
                  type="text"
                  required
                  maxLength={60}
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-[#2D120D]">
                Username
              </label>
              <UsernameField
                value={username}
                onChange={setUsername}
                onAvailable={setUsernameOk}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#2D120D]">
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
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#2D120D]">
                Password
              </label>
              <PasswordField
                id="password"
                value={password}
                onChange={setPassword}
                placeholder="Create a password"
                className={inputClass}
              />
            </div>

            <SignupRoleFields
              role={role}
              company={company}
              onRole={setRole}
              onCompany={setCompany}
              inputClass={inputClass}
            />

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[#780D18]/25 bg-[#780D18]/8 px-4 py-3 text-sm text-[#780D18]"
              >
                {error}
              </div>
            )}
            {!error && blocking.length > 0 && started && (
              <ul className="rounded-xl border border-[#DECDBA] bg-white px-4 py-3 text-sm text-[#2D120D]/85 space-y-1">
                {blocking.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[#780D18]">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#780D18] py-3.5 text-base font-semibold text-[#F7F1E8] shadow-md transition hover:bg-[#5C0A12] disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="px-7 sm:px-8 pb-8 -mt-2">
            <div className="mb-4 flex items-center gap-3 text-xs text-[#6E5952]">
              <span className="h-px flex-1 bg-[#DECDBA]" />
              or
              <span className="h-px flex-1 bg-[#DECDBA]" />
            </div>
            <GitHubButton />
          </div>
        </div>

        <p className="mt-7 text-center text-[#6E5952]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#780D18] hover:text-[#5C0A12]">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
