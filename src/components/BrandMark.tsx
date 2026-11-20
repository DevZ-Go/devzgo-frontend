type DevZLockupProps = {
  compact?: boolean;
  /** `dark` = home / editorial (cream on deep maroon). `light` = site chrome on cream. */
  tone?: "dark" | "light";
};

export function BrandMark() {
  return (
    <img
      src="/brand/logo.png"
      alt=""
      width={36}
      height={36}
      className="h-9 w-9 rounded-xl object-cover shadow-sm shadow-maroon-900/20 transition-transform group-hover:scale-105"
    />
  );
}

/** Shared DevZ-Go wordmark: logo mark, serif DevZ, cursive Go. */
export function DevZLockup({ compact = false, tone = "dark" }: DevZLockupProps) {
  const onDark = tone === "dark";
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <img
        src="/brand/logo.png"
        alt=""
        className={compact ? "h-6 w-6 rounded-md object-cover" : "h-9 w-9 rounded-lg object-cover"}
      />
      <span
        className={`font-serif font-bold tracking-tight ${
          compact ? "text-sm" : "text-xl sm:text-2xl"
        } ${onDark ? "text-[#FFF8CA]" : "text-[#780D18] dark:text-[#FFF8CA]"}`}
      >
        DevZ
      </span>
      <span
        className={`-ml-1 font-cursive font-bold italic leading-none ${
          compact ? "text-lg" : "text-2xl sm:text-3xl"
        } ${onDark ? "text-[#B8C86A]" : "text-[#3F4F23] dark:text-[#B8C86A]"}`}
      >
        Go
      </span>
    </span>
  );
}
