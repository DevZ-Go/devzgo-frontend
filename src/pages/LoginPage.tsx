import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock } from "lucide-react";
import { loginWithPassword } from "../api";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { getApiErrorMessage } from "../utils/apiError";
import { GitHubButton, githubErrorMessage } from "../components/GitHubButton";
import { PasswordInput } from "../components/PasswordInput";

const bouncy = { type: "spring" as const, stiffness: 300, damping: 22 };

export function LoginPage() {
  const navigate = useNavigate();
  const locationState = useLocation().state as { from?: { pathname?: string; search?: string }; notice?: string } | null;
  const from = locationState?.from;
  const { login: setAuthToken, refreshUser, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(githubErrorMessage(useSearchParams()[0].get("error")));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { access_token } = await loginWithPassword(email, password);
      setAuthToken(access_token);
      try {
        await refreshUser();
      } catch {
        logout();
        setError("Signed in but could not verify your session. Try again.");
        return;
      }
      navigate(from?.pathname ? from.pathname + (from.search ?? "") : "/home", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to DevZ-Go"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...bouncy, delay: 0.15 }}
        className="w-full max-w-[420px]"
      >
        <div className="rounded-3xl border-2 border-cream-200/80 bg-white shadow-soft-lg overflow-hidden">
          <div className="px-8 pt-8 pb-2">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-lavender-50 rounded-full border border-lavender-200/50 mb-6 cursor-default"
            >
              <Lock className="w-4 h-4 text-lavender-500" />
              <span className="text-sm font-medium text-lavender-600">
                Sign in to your account
              </span>
            </motion.div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-500"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border-2 border-cream-200 bg-cream-50/50 pl-10 pr-4 py-3 text-gray-800 placeholder:text-gray-300 transition-all focus:border-lavender-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-200/40 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-500"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute z-10 left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50/50 pl-10 pr-4 py-3 text-stone-800 placeholder:text-stone-300 transition-all focus:border-maroon-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-200/40 text-sm"
                />
              </div>
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-xs font-semibold text-maroon-700 hover:text-maroon-900">
                  Forgot password?
                </Link>
              </div>
            </div>

            {locationState?.notice && !error && (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{locationState.notice}</p>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust py-3.5 text-sm font-bold text-white shadow-md shadow-maroon-800/20 transition-all hover:shadow-lg hover:shadow-maroon-800/30 hover:from-maroon-900 hover:to-autumn-amber disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "Signing in…" : "Sign in"}
            </motion.button>
          </form>
          <div className="px-8 pb-8 -mt-3">
            <div className="mb-4 flex items-center gap-3 text-xs text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />or<span className="h-px flex-1 bg-stone-200" />
            </div>
            <GitHubButton />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-maroon-700 hover:text-maroon-900 transition-colors"
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
