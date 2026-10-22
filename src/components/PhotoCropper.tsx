import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Minus, Plus, RotateCw, X } from "lucide-react";

const OUTPUT_SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image could not be opened"));
    img.src = src;
  });
}

/** Draws the chosen square of the photo, turned by `rotation`, into a 512px JPEG. */
async function cropToFile(src: string, area: Area, rotation: number, name: string): Promise<File> {
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
  out.width = OUTPUT_SIZE;
  out.height = OUTPUT_SIZE;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(turned, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Could not save the cropped photo");
  return new File([blob], `${name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, { type: "image/jpeg" });
}

/** Drag, zoom and rotate a photo into a square, then hand back the cropped file. */
export function PhotoCropper({ file, title = "Crop your photo", onCancel, onDone }: {
  file: File;
  title?: string;
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
    const reader = new FileReader();
    reader.onload = () => setSrc(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setError("That image could not be opened");
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);

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
      await onDone(await cropToFile(src, area, rotation, file.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the photo");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="cropper-title">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 id="cropper-title" className="font-serif text-xl text-stone-900">{title}</h2>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Cancel" className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative h-72 bg-stone-900 sm:h-80">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          )}
        </div>

        <div className="space-y-4 px-5 py-4">
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
          <p className="text-xs text-stone-500">Drag to move the photo. Pinch, scroll or use the slider to zoom.</p>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100">
              Cancel
            </button>
            <button type="button" onClick={() => void save()} disabled={busy || !area} className="rounded-xl bg-maroon-800 px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-900 disabled:opacity-60">
              {busy ? "Saving…" : "Save photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
