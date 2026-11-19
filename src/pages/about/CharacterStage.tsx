import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  FIGURE_FRAMES,
  TWIN_PROMINENCE,
  focusChips,
  identityOf,
  type FigureFrame,
  type PortraitSlot,
  type TeamDeveloper,
} from "./team";
import { ProfilePanel } from "./DeveloperDrawer";

const LIFT =
  "motion-safe:transition-[transform,opacity] motion-safe:duration-300 motion-safe:ease-out";

/** One backdrop for every portrait, matching the stage. */
const SHARED_PAPER = [247, 224, 197] as const;
const paperCache = new Map<string, string>();

function hexChannels(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

/**
 * Shifts paper-colored pixels that touch the edge of the file toward one
 * shared beige. The drawing stays: hair, clothes, and outlines are not
 * within the paper threshold, so they are left untouched.
 */
function paintSharedPaper(img: HTMLImageElement, paper: string): Promise<string | null> {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const [bgR, bgG, bgB] = hexChannels(paper);
  const [toR, toG, toB] = SHARED_PAPER;
  const limit = 32;
  const width = canvas.width;
  const height = canvas.height;
  const seen = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  let top = 0;

  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixel = y * width + x;
    if (seen[pixel]) return;
    const index = pixel * 4;
    const distance = Math.abs(data[index] - bgR) + Math.abs(data[index + 1] - bgG) + Math.abs(data[index + 2] - bgB);
    if (distance >= limit) return;
    seen[pixel] = 1;
    stack[top++] = pixel;
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (top > 0) {
    const pixel = stack[--top];
    const index = pixel * 4;
    const distance = Math.abs(data[index] - bgR) + Math.abs(data[index + 1] - bgG) + Math.abs(data[index + 2] - bgB);
    const amount = 1 - distance / limit;
    data[index] = Math.round(data[index] + (toR - data[index]) * amount);
    data[index + 1] = Math.round(data[index + 1] + (toG - data[index + 1]) * amount);
    data[index + 2] = Math.round(data[index + 2] + (toB - data[index + 2]) * amount);
    const x = pixel % width;
    const y = (pixel / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  ctx.putImageData(image, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null), "image/jpeg", 0.92);
  });
}

function useSharedPaper(src: string, paper: string) {
  const [generated, setGenerated] = useState<string | null>(null);
  useEffect(() => {
    if (paperCache.get(src)) return;
    let cancel = false;
    const img = new Image();
    img.onload = () => {
      void paintSharedPaper(img, paper).then((next) => {
        if (cancel || !next) return;
        paperCache.set(src, next);
        setGenerated(next);
      });
    };
    img.src = src;
    return () => {
      cancel = true;
    };
  }, [src, paper]);
  return paperCache.get(src) ?? generated ?? src;
}

export function DeveloperFields({
  dev,
  onChange,
}: {
  dev: TeamDeveloper;
  onChange: (field: keyof TeamDeveloper, value: string) => void;
}) {
  const fields = [
    ["name", "Name", dev.name],
    ["role", "Role", dev.role],
    ["craft", "Craft", dev.craft],
    ["profileId", "DevZ-Go profile ID or username", dev.profileId],
  ] as const;

  return (
    <div className="space-y-2">
      {fields.map(([field, label, value]) => (
        <label key={field} className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</span>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(field, event.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-[#f8f6f0] px-3 py-2 text-sm text-stone-900 outline-none focus:border-maroon-700 focus:bg-white"
          />
        </label>
      ))}
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Line</span>
        <textarea
          rows={3}
          value={dev.tagline}
          onChange={(event) => onChange("tagline", event.target.value)}
          className="w-full resize-none rounded-xl border border-stone-200 bg-[#f8f6f0] px-3 py-2 text-sm text-stone-900 outline-none focus:border-maroon-700 focus:bg-white"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">Focus, separated by commas</span>
        <input
          type="text"
          value={dev.focus}
          onChange={(event) => onChange("focus", event.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-[#f8f6f0] px-3 py-2 text-sm text-stone-900 outline-none focus:border-maroon-700 focus:bg-white"
        />
      </label>
    </div>
  );
}

function EditPlate({
  dev,
  canRemove,
  onChange,
  onRemove,
}: {
  dev: TeamDeveloper;
  canRemove: boolean;
  onChange: (field: keyof TeamDeveloper, value: string) => void;
  onRemove: () => void;
}) {
  const identity = identityOf(dev);
  return (
    <div className="rounded-2xl border border-[#eadfce] bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          <Pencil className="h-3 w-3" /> {identity?.label ?? "Editing"}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon-800"
            aria-label={`Remove ${dev.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <DeveloperFields dev={dev} onChange={onChange} />
    </div>
  );
}

/**
 * Shows the measured body box of an illustration.
 * Height follows the figure, not the empty paper around it, and the
 * image keeps its own aspect ratio.
 */
function FigureWindow({
  frame,
  scale,
  alt,
  override,
  fit,
}: {
  frame: FigureFrame;
  scale: number;
  alt: string;
  override?: string | null;
  fit: number;
}) {
  const src = useSharedPaper(frame.src, frame.paper);
  const height = `calc(var(--solo) * ${scale})`;
  if (override) {
    return (
      <div
        className="flex items-end justify-center overflow-hidden"
        style={{ height, width: `calc(var(--solo) * ${scale} * ${fit})`, backgroundColor: "#f7e0c5" }}
      >
        <img src={override} alt={alt} decoding="async" draggable={false} className="max-h-full max-w-full select-none object-contain object-bottom" />
      </div>
    );
  }

  const body = frame.bottom - frame.top;
  const spanX = frame.right - frame.left;
  const aspect = frame.width / frame.height;
  const width = `calc(var(--solo) * ${scale} * ${(aspect / body) * spanX})`;

  return (
    <div className="relative overflow-hidden" style={{ height, width, backgroundColor: "#f7e0c5" }}>
      <img
        src={src}
        alt={alt}
        width={frame.width}
        height={frame.height}
        decoding="async"
        draggable={false}
        className="absolute max-w-none select-none"
        style={{
          height: `${100 / body}%`,
          width: "auto",
          left: `${(-frame.left / spanX) * 100}%`,
          top: `${(-frame.top / body) * 100}%`,
        }}
      />
    </div>
  );
}

function NamePlate({
  dev,
  selected,
  onSelect,
  nameOnly,
}: {
  dev: TeamDeveloper;
  selected: boolean;
  onSelect: (dev: TeamDeveloper) => void;
  nameOnly?: boolean;
}) {
  const identity = identityOf(dev);
  return (
    <button
      id={`builder-${dev.id}`}
      type="button"
      data-builder={dev.id}
      onClick={() => onSelect(dev)}
      aria-pressed={selected}
      aria-controls="builder-profile"
      className={`flex min-w-0 flex-col justify-center rounded-2xl border px-3 motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-800 ${
        nameOnly ? "h-11 w-[8.4rem] items-center text-center" : "h-[3.25rem] w-[10.75rem] text-left"
      } ${
        selected
          ? "border-maroon-800 bg-white shadow-[inset_0_-2px_0_0_#6B0B0C]"
          : "border-[#e4d3c0] bg-white/90 hover:border-maroon-800"
      }`}
    >
      {!nameOnly && (
        <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-maroon-800">
          {identity?.label ?? dev.craft ?? "Builder"}
        </span>
      )}
      <span className="block truncate font-serif text-[15px] leading-tight text-stone-900">{dev.name}</span>
    </button>
  );
}

function PortraitField({
  label,
  hint,
  current,
  onPick,
  onClear,
}: {
  label: string;
  hint?: string;
  current?: string;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#eadfce] bg-white px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</p>
      {hint && <p className="mt-1 text-xs leading-relaxed text-stone-500">{hint}</p>}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onPick(file);
        }}
        className="mt-2 block w-full text-xs text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#f8f6f0] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-maroon-800"
      />
      {current && (
        <button type="button" onClick={onClear} className="mt-2 text-xs font-semibold text-maroon-800 hover:underline">
          Use the original drawing
        </button>
      )}
    </div>
  );
}

function Intro({ text }: { text: string }) {
  return (
    <p className="pointer-events-none absolute bottom-[calc(100%+0.4rem)] left-1/2 z-20 hidden w-max max-w-[15rem] -translate-x-1/2 bg-[#f7e0c5]/95 px-1.5 text-center text-[11px] italic leading-snug text-stone-600 opacity-0 motion-safe:transition-opacity motion-safe:duration-200 [@media(hover:hover)_and_(pointer:fine)]:block [@media(hover:hover)_and_(pointer:fine)]:group-hover/spot:opacity-100">
      {text}
    </p>
  );
}

function StandingFigure({
  lifted,
  dimmed,
  children,
}: {
  lifted: boolean;
  dimmed: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative ${LIFT} ${lifted ? "motion-safe:-translate-y-2" : ""} ${
        dimmed ? "motion-safe:opacity-[0.86]" : ""
      }`}
    >
      {children}
    </div>
  );
}

function Spot({
  active,
  children,
  onEnter,
  onLeave,
}: {
  active: boolean;
  children: ReactNode;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      className={`group/spot flex w-full flex-col items-center md:w-auto ${
        active ? "relative z-10" : ""
      }`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}

function MobileGround() {
  return (
    <svg viewBox="0 0 96 12" className="mt-1 h-3 w-24 md:hidden" aria-hidden>
      <path d="M6 3 C 28 11, 68 11, 90 3" fill="none" stroke="#6B0B0C" strokeOpacity="0.4" strokeWidth="1.1" />
    </svg>
  );
}

export function CharacterStage({
  left,
  centerLeft,
  centerRight,
  right,
  others,
  editing,
  canRemove,
  hoverId,
  selectedId,
  onHover,
  onSelect,
  onClear,
  onChange,
  onRemove,
  portraits,
  onPortrait,
  portraitError,
}: {
  left: TeamDeveloper | null;
  centerLeft: TeamDeveloper | null;
  centerRight: TeamDeveloper | null;
  right: TeamDeveloper | null;
  others: TeamDeveloper[];
  editing: boolean;
  canRemove: boolean;
  hoverId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (dev: TeamDeveloper) => void;
  onClear: () => void;
  onChange: (id: string, field: keyof TeamDeveloper, value: string) => void;
  onRemove: (id: string) => void;
  portraits: Partial<Record<PortraitSlot, string>>;
  onPortrait: (slot: PortraitSlot, file: File | null) => void;
  portraitError?: string | null;
}) {
  const pair = [centerLeft, centerRight].filter((dev): dev is TeamDeveloper => Boolean(dev));
  const cast = [left, centerLeft, centerRight, right, ...others].filter((dev): dev is TeamDeveloper => Boolean(dev));
  const selected = cast.find((dev) => dev.id === selectedId) ?? null;
  const centerActive = pair.some((dev) => dev.id === hoverId);
  const someoneHovered = Boolean(hoverId);

  function moveSelection(event: KeyboardEvent<HTMLElement>) {
    if (editing) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (event.key === "Escape") {
      onClear();
      return;
    }
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    if (!target?.closest("[data-builder]")) return;
    event.preventDefault();
    const index = Math.max(0, cast.findIndex((dev) => dev.id === (selectedId ?? target.closest("[data-builder]")?.getAttribute("data-builder"))));
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = cast[(index + step + cast.length) % cast.length];
    if (!next) return;
    onSelect(next);
    document.getElementById(`builder-${next.id}`)?.focus();
  }

  function plates(dev: TeamDeveloper, nameOnly = false) {
    return <NamePlate dev={dev} selected={selectedId === dev.id} onSelect={onSelect} nameOnly={nameOnly} />;
  }

  function figure(slot: PortraitSlot, scale: number, alt: string, fit: number) {
    return <FigureWindow frame={FIGURE_FRAMES[slot]} scale={scale} alt={alt} override={portraits[slot]} fit={fit} />;
  }

  return (
    <section aria-label="The builders" className="mt-6" onKeyDown={moveSelection}>
      <div className="builder-stage relative overflow-x-clip border border-[#eadcc6] bg-[#f7e0c5] px-1 pb-4 pt-6 max-sm:-mx-5 max-sm:rounded-none max-sm:border-x-0 sm:rounded-[2rem] sm:px-6 sm:pt-8">
        <div
          className="pointer-events-none absolute inset-x-[6%] hidden h-3 rounded-[100%] bg-maroon-950/10 blur-[1px] md:block"
          style={{ bottom: editing ? "0.35rem" : "4.4rem" }}
          aria-hidden
        />
        <svg
          className="pointer-events-none absolute left-6 right-6 hidden h-4 w-[calc(100%-3rem)] md:block"
          style={{ bottom: editing ? "0.15rem" : "4.4rem" }}
          viewBox="0 0 1000 16"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M24 3 C 180 14, 340 2, 500 7 S 820 14, 976 3"
            fill="none"
            stroke="#6B0B0C"
            strokeOpacity="0.45"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-end md:justify-center md:gap-8">
          {left && (
            <Spot
              active={hoverId === left.id}
              onEnter={() => onHover(left.id)}
              onLeave={() => onHover(null)}
            >
              <StandingFigure lifted={hoverId === left.id} dimmed={someoneHovered && hoverId !== left.id}>
                {editing ? (
                  figure("left", 1, `Illustrated portrait of ${left.name}`, 0.42)
                ) : (
                  <button
                    type="button"
                    data-builder={left.id}
                    onClick={() => onSelect(left)}
                    className="block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-maroon-800"
                  >
                    {figure("left", 1, `Illustrated portrait of ${left.name}`, 0.42)}
                  </button>
                )}
              </StandingFigure>
              <MobileGround />
              {!editing && (
                <div className="relative mt-3 flex h-[4.4rem] flex-col justify-end md:mt-4">
                  {identityOf(left) && <Intro text={identityOf(left)!.line} />}
                  {plates(left)}
                </div>
              )}
            </Spot>
          )}

          {pair.length > 0 && (
            <Spot
              active={centerActive}
              onEnter={() => onHover(pair[0]?.id ?? null)}
              onLeave={() => onHover(null)}
            >
              <StandingFigure lifted={centerActive} dimmed={someoneHovered && !centerActive}>
                {figure(
                  "center",
                  TWIN_PROMINENCE,
                  `Illustrated portrait of ${pair.map((dev) => dev.name).join(" and ")}`,
                  0.74,
                )}
              </StandingFigure>
              <MobileGround />
              {!editing && (
                <div className="relative mt-3 flex h-[4.4rem] flex-col items-center justify-end gap-1 md:mt-4">
                  {identityOf(pair[0]) && <Intro text={identityOf(pair[0])!.line} />}
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-maroon-800">
                    {identityOf(pair[0])?.label ?? "The Twins"}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {pair.map((dev) => (
                      <div key={dev.id}>{plates(dev, true)}</div>
                    ))}
                  </div>
                </div>
              )}
            </Spot>
          )}

          {right && (
            <Spot
              active={hoverId === right.id}
              onEnter={() => onHover(right.id)}
              onLeave={() => onHover(null)}
            >
              <StandingFigure lifted={hoverId === right.id} dimmed={someoneHovered && hoverId !== right.id}>
                {editing ? (
                  figure("right", 1, `Illustrated portrait of ${right.name}`, 0.5)
                ) : (
                  <button
                    type="button"
                    data-builder={right.id}
                    onClick={() => onSelect(right)}
                    className="block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-maroon-800"
                  >
                    {figure("right", 1, `Illustrated portrait of ${right.name}`, 0.5)}
                  </button>
                )}
              </StandingFigure>
              <MobileGround />
              {!editing && (
                <div className="relative mt-3 flex h-[4.4rem] flex-col justify-end md:mt-4">
                  {identityOf(right) && <Intro text={identityOf(right)!.line} />}
                  {plates(right)}
                </div>
              )}
            </Spot>
          )}
        </div>
      </div>

      {!editing && <ProfilePanel dev={selected} onClose={onClear} />}

      {editing && (
        <div className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <PortraitField
              label={`${left?.name ?? "Left"} portrait`}
              current={portraits.left}
              onPick={(file) => onPortrait("left", file)}
              onClear={() => onPortrait("left", null)}
            />
            <PortraitField
              label="Shared portrait"
              hint="One picture for both people in the center."
              current={portraits.center}
              onPick={(file) => onPortrait("center", file)}
              onClear={() => onPortrait("center", null)}
            />
            <PortraitField
              label={`${right?.name ?? "Right"} portrait`}
              current={portraits.right}
              onPick={(file) => onPortrait("right", file)}
              onClear={() => onPortrait("right", null)}
            />
          </div>
          {portraitError && <p className="text-center text-xs text-rose-700">{portraitError}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {cast.map((dev) => (
            <EditPlate
              key={dev.id}
              dev={dev}
              canRemove={canRemove}
              onChange={(field, value) => onChange(dev.id, field, value)}
              onRemove={() => onRemove(dev.id)}
            />
          ))}
        </div>
        </div>
      )}

      {!editing && others.length > 0 && (
        <div className="mt-6">
          <h2 className="font-serif text-2xl font-normal text-stone-900">Also on the team</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((dev) => (
              <li key={dev.id}>{plates(dev)}</li>
            ))}
          </ul>
          {others.some((dev) => focusChips(dev.focus).length > 0) && (
            <p className="sr-only">Additional builders can be selected from these nameplates.</p>
          )}
        </div>
      )}
    </section>
  );
}
