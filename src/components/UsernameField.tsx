import { useEffect, useState } from "react";
import { checkUsername } from "../api/auth";

const MESSAGES: Record<string, string> = {
  invalid: "3-30 characters: letters, numbers, _ . - (not starting or ending with . or -)",
  reserved: "That name is reserved",
  taken: "That username is taken",
};

/** Username input with a debounced availability check; reports whether the current value is usable. */
export function UsernameField({ value, onChange, onAvailable, className }: {
  value: string;
  onChange: (value: string) => void;
  onAvailable: (available: boolean) => void;
  className?: string;
}) {
  const [result, setResult] = useState<{ value: string; text: string; ok: boolean } | null>(null);
  const status = !value.trim() ? null : result?.value === value ? result : { text: "Checking…", ok: false };

  useEffect(() => {
    onAvailable(false);
    if (!value.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      checkUsername(value, controller.signal)
        .then((r) => {
          setResult({ value, ok: r.available, text: r.available ? `@${r.username} is available` : MESSAGES[r.reason ?? "invalid"] });
          onAvailable(r.available);
        })
        .catch(() => {
          if (!controller.signal.aborted) setResult({ value, text: "Could not check right now", ok: false });
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, onAvailable]);

  return (
    <div>
      <input id="username" aria-label="Username" type="text" required maxLength={30} value={value} onChange={(e) => onChange(e.target.value)}
        autoComplete="username" placeholder="johndoe" className={className} />
      {status && <p className={`mt-1.5 text-xs ${status.ok ? "text-emerald-600" : "text-gray-500"}`}>{status.text}</p>}
    </div>
  );
}
