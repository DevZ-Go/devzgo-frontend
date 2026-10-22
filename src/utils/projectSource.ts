import type { ProjectSource } from "../types/project";

export interface SourceDescription {
  /** e.g. "From GitHub · octo/shop · main at 1a2b3c4" */
  label: string;
  /** The exact commit (or repository) on GitHub, when known */
  href: string | null;
  /** When the stored copy was last replaced */
  syncedAt: string | null;
  /** "pending" while a replacement runs, "failed" when the last one did not finish */
  state: "pending" | "failed" | null;
  /** Why it failed; only sent to the owner and team members */
  error: string | null;
}

const SHA = /^[0-9a-f]{40}$/;

export function describeSource(source: ProjectSource | null | undefined): SourceDescription | null {
  if (!source) return null;
  const snapshot = source.snapshot ?? null;
  const state = source.sync_state === "pending" || source.sync_state === "failed" ? source.sync_state : null;
  const base = { syncedAt: snapshot?.synced_at ?? null, state, error: source.sync_error ?? null };

  if (source.kind === "github" && source.repository) {
    const repo = source.repository;
    const ref = snapshot?.origin === "github" ? snapshot.ref || source.default_branch : null;
    const sha = snapshot?.origin === "github" && snapshot.commit_sha && SHA.test(snapshot.commit_sha) ? snapshot.commit_sha : null;
    const at = [ref, sha && `at ${sha.slice(0, 7)}`].filter(Boolean).join(" ");
    return {
      ...base,
      label: ["From GitHub", repo, at].filter(Boolean).join(" · "),
      href: `https://github.com/${repo}${sha ? `/tree/${sha}` : ""}`,
    };
  }
  if (!snapshot) return state ? { ...base, label: "No files yet", href: null } : null;
  return { ...base, label: "From a ZIP upload", href: null };
}
