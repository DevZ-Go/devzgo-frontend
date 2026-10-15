/** Same rules as the backend (app/core/policy.py); the server still has the final say. */
export const PASSWORD_RULES: { label: string; ok: (pw: string) => boolean }[] = [
  { label: "8 to 128 characters", ok: (pw) => pw.length >= 8 && pw.length <= 128 },
  { label: "An uppercase letter", ok: (pw) => pw !== pw.toLowerCase() },
  { label: "A special character", ok: (pw) => /[^\p{L}\p{N}]/u.test(pw) },
];

export const passwordValid = (pw: string) => PASSWORD_RULES.every((r) => r.ok(pw));
