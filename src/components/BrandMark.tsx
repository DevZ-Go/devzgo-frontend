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

/** Home-page wordmark: logo, serif DevZ, cursive Go. No chip behind it. */
export function DevZLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <img
        src="/brand/logo.png"
        alt=""
        className={compact ? "h-6 w-6 rounded-md object-cover" : "h-9 w-9 rounded-lg object-cover"}
      />
      <span className={`font-serif font-bold tracking-tight text-[#FFF8CA] ${compact ? "text-sm" : "text-xl sm:text-2xl"}`}>
        DevZ
      </span>
      <span className={`-ml-1 font-cursive font-bold italic leading-none text-[#CDE3E8] ${compact ? "text-lg" : "text-2xl sm:text-3xl"}`}>
        Go
      </span>
    </span>
  );
}
