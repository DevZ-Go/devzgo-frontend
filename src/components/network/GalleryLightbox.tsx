import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { assetUrlOrNull } from "../../api/config";

export type GalleryItem = {
  id: string;
  url: string;
  mediaType?: string;
};

export function GalleryLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const touchX = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);
  const item = items[index];
  const src = item ? assetUrlOrNull(item.url) || item.url : "";
  const isVideo = item?.mediaType === "video";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + items.length) % items.length);
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndexChange]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#2D120D]/92 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-2 sm:left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index - 1 + items.length) % items.length);
            }}
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            className="absolute right-2 sm:right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index + 1) % items.length);
            }}
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div
        className="relative max-h-[90vh] max-w-[95vw] select-none"
        style={{ transform: `translateX(${drag}px)` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
          setDrag(0);
        }}
        onTouchMove={(e) => {
          if (touchX.current == null) return;
          setDrag((e.touches[0]?.clientX ?? 0) - touchX.current);
        }}
        onTouchEnd={() => {
          if (Math.abs(drag) > 60 && items.length > 1) {
            onIndexChange(
              drag > 0
                ? (index - 1 + items.length) % items.length
                : (index + 1) % items.length
            );
          }
          touchX.current = null;
          setDrag(0);
        }}
      >
        {isVideo ? (
          <video src={src} controls autoPlay className="max-h-[90vh] max-w-[95vw] rounded-lg" />
        ) : (
          <img src={src} alt="" className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain" />
        )}
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-white/80 font-mono bg-black/40 px-2 py-1 rounded">
          {index + 1} / {items.length}
        </p>
      </div>
    </div>
  );
}
