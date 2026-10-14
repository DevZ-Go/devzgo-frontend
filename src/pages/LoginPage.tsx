import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, Mail, Lock } from "lucide-react";
import { loginWithPassword } from "../api";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { getApiErrorMessage } from "../utils/apiError";

const bouncy = { type: "spring" as const, stiffness: 300, damping: 22 };

export function LoginPage() {
  const navigate = useNavigate();
  const { login: setAuthToken, refreshUser, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      navigate("/home", { replace: true });
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
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-4 h-4 text-lavender-500" />
              </motion.div>
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl border-2 border-cream-200 bg-cream-50/50 pl-10 pr-4 py-3 text-gray-800 placeholder:text-gray-300 transition-all focus:border-lavender-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-200/40 text-sm"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="rounded-2xl border border-coral-200/60 bg-coral-50 px-4 py-3 text-sm text-coral-600"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-lavender-500 to-coral-400 py-3.5 text-sm font-bold text-white shadow-lg shadow-lavender-500/20 transition-all hover:shadow-xl hover:shadow-lavender-500/30 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "Signing in…" : "Sign in ✨"}
            </motion.button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-lavender-500 hover:text-lavender-600 transition-colors"
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
