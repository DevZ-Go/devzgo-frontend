import { Check, X } from "lucide-react";
import { PASSWORD_RULES } from "../utils/passwordPolicy";

export function PasswordField({ id, value, onChange, placeholder = "New password", className }: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div>
      <input id={id} aria-label={id ? undefined : placeholder} type="password" required maxLength={128} value={value} onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password" placeholder={placeholder} className={className} />
      <ul className="mt-2 space-y-0.5 text-xs">
        {PASSWORD_RULES.map((r) => {
          const ok = r.ok(value);
          return (
            <li key={r.label} className={`flex items-center gap-1.5 ${ok ? "text-forest-700" : "text-stone-400"}`}>
              {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
