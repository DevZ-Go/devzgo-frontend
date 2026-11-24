import { Check } from "lucide-react";
import { PASSWORD_RULES } from "../utils/passwordPolicy";
import { PasswordInput } from "./PasswordInput";

export function PasswordField({
  id,
  value,
  onChange,
  placeholder = "New password",
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const started = value.length > 0;

  return (
    <div>
      <PasswordInput
        id={id}
        aria-label={id ? undefined : placeholder}
        required
        maxLength={128}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        placeholder={placeholder}
        className={className}
      />
      <div className="mt-2.5 rounded-xl border border-[#DECDBA]/80 bg-white/70 px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6E5952] mb-1.5">
          Password checklist
        </p>
        <ul className="space-y-1 text-xs">
          {PASSWORD_RULES.map((r) => {
            const ok = r.ok(value);
            return (
              <li
                key={r.label}
                className={`flex items-center gap-2 ${
                  ok ? "text-[#284E45]" : started ? "text-[#780D18]/80" : "text-[#6E5952]"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    ok
                      ? "border-[#284E45] bg-[#284E45] text-white"
                      : "border-[#DECDBA] bg-transparent"
                  }`}
                >
                  {ok ? <Check className="h-2.5 w-2.5" /> : null}
                </span>
                {r.label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
