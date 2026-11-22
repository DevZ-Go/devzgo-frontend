import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Minus, Plus, RotateCw, X } from "lucide-react";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image could not be opened"));
    img.src = src;
  });
}

/** Draws the chosen crop of the photo, turned by `rotation`, into a JPEG of the given size. */
async function cropToFile(
  src: string,
  area: Area,
  rotation: number,
  name: string,
  outputWidth: number,
  outputHeight: number,
): Promise<File> {
  const img = await loadImage(src);
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const turnedWidth = img.width * cos + img.height * sin;
  const turnedHeight = img.width * sin + img.height * cos;

  const turned = document.createElement("canvas");
  turned.width = turnedWidth;
  turned.height = turnedHeight;
  const tctx = turned.getContext("2d")!;
  tctx.translate(turnedWidth / 2, turnedHeight / 2);
  tctx.rotate(radians);
  tctx.drawImage(img, -img.width / 2, -img.height / 2);

  const out = document.createElement("canvas");
  out.width = outputWidth;
  out.height = outputHeight;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  ctx.drawImage(turned, area.x, area.y, area.width, area.height, 0, 0, outputWidth, outputHeight);

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Could not save the cropped photo");
  return new File([blob], `${name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, { type: "image/jpeg" });
}

function formatMb(bytes: number) {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

/** Drag, zoom and rotate a photo into the allowed ratio, then hand back the cropped file. */
export function PhotoCropper({
  file,
  title = "Crop your photo",
  aspect = 1,
  cropShape = "round",
  outputWidth = 512,
  outputHeight = 512,
  maxBytes = 5 * 1024 * 1024,
  hint,
  confirmLabel = "Save photo",
  onCancel,
  onDone,
}: {
  file: File;
  title?: string;
  /** Width / height. Omit for free-form (custom) crop. Square for avatars; 16/9 for covers. */
  aspect?: number;
  cropShape?: "round" | "rect";
  outputWidth?: number;
  outputHeight?: number;
  /** Reject uploads larger than this before cropping. */
  maxBytes?: number;
  hint?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onDone: (cropped: File) => void | Promise<void>;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file.size > maxBytes) {
      setSrc(null);
      setError(`Keep the image under ${formatMb(maxBytes)} (this file is ${formatMb(file.size)}).`);
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setSrc(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setError("That image could not be opened");
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file, maxBytes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  async function save() {
    if (!src || !area) return;
    setBusy(true);
    setError(null);
    try {
      let outW = outputWidth;
      let outH = outputHeight;
      // Free-form crop: keep the selected area's aspect instead of a fixed paper size.
      if (aspect == null && area.width > 0 && area.height > 0) {
        const maxEdge = Math.max(outputWidth, outputHeight, 1600);
        const scale = maxEdge / Math.max(area.width, area.height);
        outW = Math.max(1, Math.round(area.width * scale));
        outH = Math.max(1, Math.round(area.height * scale));
      }
      const cropped = await cropToFile(src, area, rotation, file.name, outW, outH);
      if (cropped.size > maxBytes) {
        throw new Error(`Cropped image is still over ${formatMb(maxBytes)}. Zoom in on a smaller area or use a lighter photo.`);
      }
      await onDone(cropped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the photo");
      setBusy(false);
    }
  }

  const ratioLabel =
    aspect == null
      ? "any size"
      : aspect === 1
        ? "1:1 square"
        : aspect === 16 / 9
          ? "16:9 landscape"
          : `${aspect.toFixed(2)}:1`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="cropper-title">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 id="cropper-title" className="font-serif text-xl text-stone-900">{title}</h2>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Cancel" className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`relative bg-stone-900 ${(aspect ?? 1) >= 1.4 ? "h-56 sm:h-72" : "h-72 sm:h-80"}`}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={cropShape === "rect"}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          )}
        </div>

        <div className="space-y-4 px-5 py-4">
          {src && (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.2))} aria-label="Zoom out" className="rounded-full p-1.5 text-stone-600 hover:bg-stone-100">
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="range" min={1} max={3} step={0.01} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom" className="h-1.5 flex-1 cursor-pointer accent-maroon-800"
              />
              <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.2))} aria-label="Zoom in" className="rounded-full p-1.5 text-stone-600 hover:bg-stone-100">
                <Plus className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setRotation((r) => (r + 90) % 360)} aria-label="Rotate" className="rounded-full p-1.5 text-stone-600 hover:bg-stone-100">
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="text-xs text-stone-500">
            {hint || `Crop to ${ratioLabel}. Keep the file under ${formatMb(maxBytes)}. Drag to frame, then zoom.`}
          </p>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100">
              Cancel
            </button>
            <button type="button" onClick={() => void save()} disabled={busy || !area || !src} className="rounded-xl bg-maroon-800 px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-900 disabled:opacity-60">
              {busy ? "Saving…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
