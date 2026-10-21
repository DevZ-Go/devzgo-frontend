import { Code2 } from "lucide-react";

export function BrandMark() {
  return (
    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-maroon-800 via-maroon-700 to-autumn-rust text-amber-100 shadow-sm shadow-maroon-900/30 transition-transform group-hover:scale-105">
      <Code2 className="w-4 h-4" aria-hidden />
    </span>
  );
}
