import { assetUrlOrNull } from "../api/config";

const SIZES = { xs: "h-7 w-7 text-[10px]", sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg" };

/** A person's photo, or their initials on a maroon tile when they have none. */
export function MemberAvatar({ name, src, size = "sm", className = "" }: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const url = assetUrlOrNull(src);
  const base = `${SIZES[size]} shrink-0 rounded-full object-cover ${className}`;
  if (url) return <img src={url} alt="" className={base} />;
  const letters = name.replace(/^@/, "").slice(0, 2).toUpperCase() || "?";
  return (
    <span aria-hidden className={`${base} inline-flex items-center justify-center bg-maroon-800 font-semibold text-[#fced96]`}>
      {letters}
    </span>
  );
}
