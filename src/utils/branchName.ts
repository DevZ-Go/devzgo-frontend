const BAD = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(31)}\u007f ~^:?*\\[\\\\]`);

/** The same branch-name limits the server enforces, so the form can warn first. */
export function branchProblem(name: string): string | null {
  if (!name || name.length > 100) return "Enter a branch name of at most 100 characters.";
  if (name.startsWith("-") || name.startsWith("/") || name.startsWith(".") || name.endsWith("/") || name.endsWith(".") || name.endsWith(".lock") || name.includes("@{") || name.includes("..") || name.includes("//")) {
    return "That branch name isn't allowed.";
  }
  if (BAD.test(name) || name.split("/").some((part) => !part || part.startsWith(".") || part.endsWith(".lock"))) {
    return "That branch name isn't allowed.";
  }
  return null;
}
