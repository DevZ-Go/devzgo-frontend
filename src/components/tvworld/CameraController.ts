import type { WorldBounds } from "./types";

export interface Cam {
  /** World point at the centre of the viewport. */
  x: number;
  y: number;
  zoom: number;
}

export interface ViewRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  zoom: number;
}

interface Options {
  viewport: HTMLElement;
  world: HTMLElement;
  /** Optional layer whose background parallaxes with the camera. */
  backdrop: HTMLElement | null;
  /** Called (throttled) whenever the visible world rectangle changed meaningfully. */
  onView: (rect: ViewRect) => void;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.6;
const DRAG_THRESHOLD = 6;
const BACKDROP_TILE = 200;

const KEY_DIRS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  a: [-1, 0],
  d: [1, 0],
  w: [0, -1],
  s: [0, 1],
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Plain-TypeScript 2D camera. The viewport is the camera, children of `world`
 * live at world coordinates, and every frame writes a single GPU transform:
 *
 *   world.style.transform = translate3d(...) scale(zoom)
 *
 * Input only moves `target`; `cam` chases it each frame with exponential easing,
 * which is what gives the movement its smooth, physical feel. Drag release
 * leaves velocity behind (inertia). The loop sleeps when nothing is moving.
 */
export class CameraController {
  cam: Cam;
  target: Cam;
  /** While locked (a TV is focused) the user cannot pan or zoom. */
  locked = false;
  /** Follow speed. Higher = snappier. */
  rate = 9;

  private o: Options;
  private bounds: WorldBounds | null = null;
  private vw = 1;
  private vh = 1;
  private vel = { x: 0, y: 0 };
  private keyVel = { x: 0, y: 0 };
  private keys = new Set<string>();
  private raf = 0;
  private running = false;
  private last = 0;
  private pointers = new Map<number, { x: number; y: number }>();
  private down = { x: 0, y: 0 };
  private dragging = false;
  private suppressClick = false;
  private lastMove = { t: 0 };
  private pinchDist = 0;
  private rateTimer = 0;
  private lastReport: ViewRect | null = null;
  private ro: ResizeObserver | null = null;

  constructor(options: Options, initial: Cam) {
    this.o = options;
    this.cam = { ...initial };
    this.target = { ...initial };
  }

  /* ───────────── lifecycle ───────────── */

  attach(): void {
    const v = this.o.viewport;
    v.addEventListener("pointerdown", this.onDown);
    v.addEventListener("pointermove", this.onMove);
    v.addEventListener("pointerup", this.onUp);
    v.addEventListener("pointercancel", this.onUp);
    v.addEventListener("wheel", this.onWheel, { passive: false });
    v.addEventListener("click", this.onClickCapture, true);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(v);
    this.resize();
    this.wake();
  }

  destroy(): void {
    const v = this.o.viewport;
    v.removeEventListener("pointerdown", this.onDown);
    v.removeEventListener("pointermove", this.onMove);
    v.removeEventListener("pointerup", this.onUp);
    v.removeEventListener("pointercancel", this.onUp);
    v.removeEventListener("wheel", this.onWheel);
    v.removeEventListener("click", this.onClickCapture, true);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.ro?.disconnect();
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.rateTimer);
    this.running = false;
  }

  /* ───────────── public API ───────────── */

  size(): { w: number; h: number } {
    return { w: this.vw, h: this.vh };
  }

  setBounds(bounds: WorldBounds | null): void {
    this.bounds = bounds;
    this.wake();
  }

  /** Jump instantly (no easing). */
  set(cam: Cam): void {
    this.cam = { ...cam };
    this.target = { ...cam };
    this.vel = { x: 0, y: 0 };
    this.apply();
    this.report(true);
    this.wake();
  }

  /** Ease towards a camera pose. `rate` temporarily overrides the follow speed. */
  flyTo(cam: Cam, opts?: { rate?: number; settleMs?: number }): void {
    this.target = { x: cam.x, y: cam.y, zoom: clamp(cam.zoom, MIN_ZOOM, MAX_ZOOM) };
    this.vel = { x: 0, y: 0 };
    this.keyVel = { x: 0, y: 0 };
    if (opts?.rate) {
      this.rate = opts.rate;
      window.clearTimeout(this.rateTimer);
      this.rateTimer = window.setTimeout(() => {
        this.rate = 9;
      }, opts.settleMs ?? 1800);
    }
    this.wake();
  }

  /** Zoom around a screen point (used by +/- keys and buttons). */
  zoomBy(factor: number): void {
    if (this.locked) return;
    this.zoomAt(this.vw / 2, this.vh / 2, factor);
    this.wake();
  }

  snapshot(): Cam {
    return { ...this.target };
  }

  resize(): void {
    const r = this.o.viewport.getBoundingClientRect();
    this.vw = Math.max(1, r.width);
    this.vh = Math.max(1, r.height);
    this.apply();
    this.report(true);
    this.wake();
  }

  /* ───────────── pointer input ───────────── */

  private onDown = (e: PointerEvent): void => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as Element).closest("[data-ui]")) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 1) {
      this.down = { x: e.clientX, y: e.clientY };
      this.dragging = false;
      this.vel = { x: 0, y: 0 };
      this.lastMove.t = performance.now();
    } else if (this.pointers.size === 2) {
      this.pinchDist = this.pointerDistance();
    }
  };

  private onMove = (e: PointerEvent): void => {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.locked) return;

    if (this.pointers.size === 2) {
      const d = this.pointerDistance();
      if (this.pinchDist > 0 && d > 0) {
        const pts = [...this.pointers.values()];
        const mx = (pts[0].x + pts[1].x) / 2;
        const my = (pts[0].y + pts[1].y) / 2;
        const rect = this.o.viewport.getBoundingClientRect();
        this.zoomAt(mx - rect.left, my - rect.top, d / this.pinchDist);
        this.pinchDist = d;
        this.dragging = true;
        this.wake();
      }
      return;
    }

    if (!this.dragging) {
      if (Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) < DRAG_THRESHOLD) {
        return;
      }
      this.dragging = true;
      try {
        this.o.viewport.setPointerCapture(e.pointerId);
      } catch {
        /* pointer may already be gone */
      }
      this.o.viewport.classList.add("is-dragging");
    }

    const now = performance.now();
    const dt = Math.max(0.001, (now - this.lastMove.t) / 1000);
    this.lastMove.t = now;
    const z = this.cam.zoom;
    this.target.x -= dx / z;
    this.target.y -= dy / z;
    // Smoothed release velocity, in world px / second.
    this.vel.x = this.vel.x * 0.6 + (-dx / z / dt) * 0.4;
    this.vel.y = this.vel.y * 0.6 + (-dy / z / dt) * 0.4;
    this.wake();
  };

  private onUp = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.delete(e.pointerId);
    if (this.dragging) {
      try {
        this.o.viewport.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      this.suppressClick = true;
      window.setTimeout(() => {
        this.suppressClick = false;
      }, 60);
      // A stale velocity means the pointer paused before release: no fling.
      if (performance.now() - this.lastMove.t > 90) this.vel = { x: 0, y: 0 };
    }
    if (this.pointers.size === 0) {
      this.dragging = false;
      this.o.viewport.classList.remove("is-dragging");
    }
    this.pinchDist = 0;
    this.wake();
  };

  /** After a drag, swallow the click so dragging never opens a TV. */
  private onClickCapture = (e: MouseEvent): void => {
    if (this.suppressClick) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  private onWheel = (e: WheelEvent): void => {
    // Let HUD / info-panel elements scroll normally.
    if ((e.target as Element).closest("[data-ui]")) return;
    e.preventDefault();
    if (this.locked) return;
    const unit = e.deltaMode === 1 ? 32 : 1;
    if (e.ctrlKey) {
      // Trackpad pinch (and ctrl+wheel) zooms around the cursor.
      const rect = this.o.viewport.getBoundingClientRect();
      this.zoomAt(
        e.clientX - rect.left,
        e.clientY - rect.top,
        Math.exp(-e.deltaY * unit * 0.0025)
      );
    } else {
      this.target.x += (e.deltaX * unit) / this.cam.zoom;
      this.target.y += (e.deltaY * unit) / this.cam.zoom;
      this.vel = { x: 0, y: 0 };
    }
    this.wake();
  };

  private pointerDistance(): number {
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  /** Zoom the *target* so the world point under (sx, sy) stays under the cursor. */
  private zoomAt(sx: number, sy: number, factor: number): void {
    const mx = sx - this.vw / 2;
    const my = sy - this.vh / 2;
    const z0 = this.target.zoom;
    const z1 = clamp(z0 * factor, MIN_ZOOM, MAX_ZOOM);
    const wx = this.target.x + mx / z0;
    const wy = this.target.y + my / z0;
    this.target.x = wx - mx / z1;
    this.target.y = wy - my / z1;
    this.target.zoom = z1;
  }

  /* ───────────── keyboard ───────────── */

  private isTyping(e: KeyboardEvent): boolean {
    const t = e.target as HTMLElement | null;
    if (!t) return false;
    return t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT";
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.locked || this.isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key in KEY_DIRS) {
      this.keys.add(key);
      e.preventDefault();
      this.wake();
    } else if (key === "+" || key === "=") {
      this.zoomBy(1.2);
    } else if (key === "-" || key === "_") {
      this.zoomBy(1 / 1.2);
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    this.keys.delete(key);
  };

  private onBlur = (): void => {
    this.keys.clear();
    this.pointers.clear();
    this.dragging = false;
    this.o.viewport.classList.remove("is-dragging");
  };

  /* ───────────── frame loop ───────────── */

  private wake(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    const t = this.target;
    const c = this.cam;

    if (!this.locked) {
      // Held keys → smoothed velocity → target.
      let kx = 0;
      let ky = 0;
      for (const k of this.keys) {
        kx += KEY_DIRS[k][0];
        ky += KEY_DIRS[k][1];
      }
      const speed = 820 / c.zoom;
      const a = 1 - Math.exp(-dt * 7);
      this.keyVel.x += (kx * speed - this.keyVel.x) * a;
      this.keyVel.y += (ky * speed - this.keyVel.y) * a;
      t.x += this.keyVel.x * dt;
      t.y += this.keyVel.y * dt;

      // Inertia after a drag release.
      if (!this.dragging) {
        t.x += this.vel.x * dt;
        t.y += this.vel.y * dt;
        const decay = Math.exp(-dt * 3.4);
        this.vel.x *= decay;
        this.vel.y *= decay;
        if (Math.hypot(this.vel.x, this.vel.y) < 4) this.vel = { x: 0, y: 0 };
      }
    }

    // Only clamp where necessary: a generous margin around the outermost TVs.
    if (this.bounds) {
      const padX = 700 + this.vw / (2 * t.zoom) * 0.5;
      const padY = 600 + this.vh / (2 * t.zoom) * 0.5;
      t.x = clamp(t.x, this.bounds.minX - padX, this.bounds.maxX + padX);
      t.y = clamp(t.y, this.bounds.minY - padY, this.bounds.maxY + padY);
    }

    // Exponential follow: the camera chases the target.
    const k = this.dragging ? 22 : this.rate;
    const f = 1 - Math.exp(-dt * k);
    c.x += (t.x - c.x) * f;
    c.y += (t.y - c.y) * f;
    // Zoom is eased in log space so zooming in and out feels symmetric.
    c.zoom *= Math.pow(t.zoom / c.zoom, 1 - Math.exp(-dt * Math.min(k, 8)));

    this.apply();
    this.report(false);

    const settled =
      Math.abs(t.x - c.x) * c.zoom < 0.08 &&
      Math.abs(t.y - c.y) * c.zoom < 0.08 &&
      Math.abs(t.zoom / c.zoom - 1) < 0.0004 &&
      this.keys.size === 0 &&
      !this.dragging &&
      this.vel.x === 0 &&
      this.vel.y === 0 &&
      Math.hypot(this.keyVel.x, this.keyVel.y) < 1;

    if (settled) {
      c.x = t.x;
      c.y = t.y;
      c.zoom = t.zoom;
      this.keyVel = { x: 0, y: 0 };
      this.apply();
      this.report(true);
      this.running = false;
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  private apply(): void {
    const { x, y, zoom } = this.cam;
    const tx = this.vw / 2 - x * zoom;
    const ty = this.vh / 2 - y * zoom;
    this.o.world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${zoom})`;
    const b = this.o.backdrop;
    if (b) {
      const tile = BACKDROP_TILE * zoom;
      b.style.backgroundSize = `${tile}px ${tile}px`;
      b.style.backgroundPosition = `${tx}px ${ty}px`;
    }
  }

  private report(force: boolean): void {
    const { x, y, zoom } = this.cam;
    const hw = this.vw / (2 * zoom);
    const hh = this.vh / (2 * zoom);
    const rect: ViewRect = {
      left: x - hw,
      top: y - hh,
      right: x + hw,
      bottom: y + hh,
      zoom,
    };
    const last = this.lastReport;
    if (
      !force &&
      last &&
      Math.abs(rect.left - last.left) < 160 &&
      Math.abs(rect.top - last.top) < 160 &&
      Math.abs(rect.zoom / last.zoom - 1) < 0.04
    ) {
      return;
    }
    this.lastReport = rect;
    this.o.onView(rect);
  }
}
