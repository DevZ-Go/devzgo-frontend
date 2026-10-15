import { Github } from "lucide-react";
import { API_BASE_URL } from "../api/config";

export function GitHubButton() {
  return (
    <a
      href={`${API_BASE_URL.replace(/\/$/, "")}/auth/github/login`}
      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
    >
      <Github className="w-4 h-4" /> Continue with GitHub
    </a>
  );
}

const GITHUB_ERRORS: Record<string, string> = {
  github: "GitHub sign-in failed. Please try again.",
  github_state: "GitHub sign-in expired or was started in another browser. Please try again.",
  github_email: "Your GitHub account needs a verified primary email to sign in.",
  github_linked: "That email already belongs to an account linked to a different GitHub user.",
};

export function githubErrorMessage(code: string | null): string | null {
  return code ? GITHUB_ERRORS[code] ?? null : null;
}
