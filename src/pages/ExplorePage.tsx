import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProjects } from "../api";
import { getApiErrorMessage } from "../utils/apiError";
import type { ApiProject } from "../types/project";
import { CameraController } from "../components/tvworld/CameraController";
import type { Cam, ViewRect } from "../components/tvworld/CameraController";
import { PixelTV } from "../components/tvworld/PixelTV";
import { layoutProjects, toTvProject } from "../components/tvworld/worldLayout";
import type { PlacedTv } from "../components/tvworld/types";
import "../components/tvworld/tvworld.css";

const CAM_KEY = "devzgo:tvworld:cam";
/** How far outside the viewport (world px) a TV is still kept mounted. */
const CULL_MARGIN = 560;
const PANEL_W = 420;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Camera pose that shows the first few TVs of a list. */
function overviewPose(list: PlacedTv[], viewportW: number): Cam {
  const head = list.slice(0, 4);
  if (head.length === 0) return { x: 0, y: 0, zoom: 0.7 };
  const x = head.reduce((s, t) => s + t.x, 0) / head.length;
  const y = head.reduce((s, t) => s + t.y, 0) / head.length;
  return { x, y, zoom: clamp(viewportW / 2100, 0.45, 0.85) };
}

/** One-shot: only present when the user left to a project page and is coming back. */
function readSavedCam(): Cam | null {
  try {
    const raw = sessionStorage.getItem(CAM_KEY);
    sessionStorage.removeItem(CAM_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<Cam>;
    if (
      typeof c.x === "number" &&
      typeof c.y === "number" &&
      typeof c.zoom === "number" &&
      Number.isFinite(c.x + c.y + c.zoom)
    ) {
      return { x: c.x, y: c.y, zoom: c.zoom };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA");
}

/**
 * "Explore Projects": a dark pixel-art room where every public project is a CRT TV.
 * Projects come from the same GET /projects call the old grid used; positions are a
 * deterministic function of the project (see worldLayout.ts), so uploads appear
 * automatically and nothing moves between page loads.
 */
export function ExplorePage() {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<CameraController | null>(null);
  const savedCamRef = useRef<Cam | null>(null);
  const introDoneRef = useRef(false);
  const openingRef = useRef(false);

  const [apiProjects, setApiProjects] = useState<ApiProject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<ViewRect | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [diving, setDiving] = useState(false);

  /* ───────────── data (same source as the old grid) ───────────── */

  const load = useCallback(async () => {
    try {
      const list = await fetchProjects();
      setApiProjects(list);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setApiProjects([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchProjects()
      .then((list) => {
        if (cancelled) return;
        setApiProjects(list);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err));
        setApiProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const layout = useMemo(
    () => layoutProjects((apiProjects ?? []).map((p, i) => toTvProject(p, i))),
    [apiProjects]
  );

  const techOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of layout.placed) t.project.techStack.forEach((n) => set.add(n));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [layout.placed]);

  // Filtering hides TVs but never re-positions the rest.
  const shown = useMemo(() => {
    if (filter === "all") return layout.placed;
    const f = filter.toLowerCase();
    return layout.placed.filter((t) => t.project.techStack.some((n) => n.toLowerCase() === f));
  }, [layout.placed, filter]);

  const visible = useMemo(() => {
    if (!view) return shown.slice(0, 12);
    return shown.filter((t) => {
      if (t.project.id === focusedId) return true;
      const hw = (t.w * t.scale) / 2;
      const hh = (t.h * t.scale) / 2;
      return (
        t.x + hw > view.left - CULL_MARGIN &&
        t.x - hw < view.right + CULL_MARGIN &&
        t.y + hh > view.top - CULL_MARGIN &&
        t.y - hh < view.bottom + CULL_MARGIN
      );
    });
  }, [shown, view, focusedId]);

  const focused = useMemo(
    () => (focusedId ? (layout.placed.find((t) => t.project.id === focusedId) ?? null) : null),
    [layout.placed, focusedId]
  );

  /* ───────────── camera lifecycle ───────────── */

  useEffect(() => {
    const viewport = viewportRef.current;
    const world = worldRef.current;
    if (!viewport || !world) return;
    const ctrl = new CameraController(
      { viewport, world, backdrop: backdropRef.current, onView: setView },
      { x: 0, y: 0, zoom: 0.6 }
    );
    ctrl.attach();
    ctrlRef.current = ctrl;

    // Free the page scrollbar while inside the world.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      ctrl.destroy();
      ctrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    ctrlRef.current?.setBounds(layout.bounds);
  }, [layout.bounds]);

  // Opening shot: start zoomed out near the first TVs and push in (or resume a saved pose).
  useEffect(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl || apiProjects === null || introDoneRef.current) return;
    introDoneRef.current = true;
    const saved = readSavedCam();
    if (saved) {
      ctrl.set(saved);
      return;
    }
    const pose = overviewPose(layout.placed, ctrl.size().w);
    ctrl.set({ ...pose, zoom: pose.zoom * 0.55 });
    ctrl.flyTo(pose, { rate: 2.4, settleMs: 2000 });
  }, [apiProjects, layout.placed]);

  useEffect(() => {
    const t = window.setTimeout(() => setBooting(false), 1500);
    return () => window.clearTimeout(t);
  }, []);

  /* ───────────── focus / unfocus ───────────── */

  const focusTv = useCallback(
    (id: string) => {
      const ctrl = ctrlRef.current;
      const tv = layout.placed.find((t) => t.project.id === id);
      if (!ctrl || !tv) return;
      // Remember the exploration pose only once, so cycling between TVs still returns to it.
      if (!savedCamRef.current) savedCamRef.current = ctrl.snapshot();
      const { w: vw, h: vh } = ctrl.size();
      const bw = tv.w * tv.scale;
      const bh = tv.h * tv.scale + 50;
      let zoom: number;
      let x = tv.x;
      let y = tv.y;
      if (vw >= 900) {
        // Info panel on the right: park the TV in the left part of the screen.
        zoom = Math.min(((vw - PANEL_W) * 0.78) / bw, (vh * 0.72) / bh, 2.2);
        x = tv.x + PANEL_W / 2 / zoom;
        y = tv.y + 14 / zoom;
      } else {
        // Info sheet at the bottom: TV in the upper part.
        zoom = Math.min((vw * 0.86) / bw, (vh * 0.4) / bh, 2.2);
        y = tv.y + (vh / 2 - vh * 0.27) / zoom;
      }
      ctrl.locked = true;
      setFocusedId(id);
      ctrl.flyTo({ x, y, zoom }, { rate: 6, settleMs: 1300 });
    },
    [layout.placed]
  );

  const unfocus = useCallback(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    ctrl.locked = false;
    const saved = savedCamRef.current;
    savedCamRef.current = null;
    setFocusedId(null);
    if (saved) ctrl.flyTo(saved, { rate: 6, settleMs: 1300 });
  }, []);

  const cycle = useCallback(
    (dir: 1 | -1) => {
      if (!focusedId || shown.length < 2) return;
      const i = shown.findIndex((t) => t.project.id === focusedId);
      const next = shown[(i + dir + shown.length) % shown.length];
      focusTv(next.project.id);
    },
    [focusedId, shown, focusTv]
  );

  const recenter = useCallback(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl || ctrl.locked) return;
    ctrl.flyTo(overviewPose(shown, ctrl.size().w), { rate: 4, settleMs: 1600 });
  }, [shown]);

  const openProject = useCallback(
    (id: string) => {
      const ctrl = ctrlRef.current;
      const tv = layout.placed.find((t) => t.project.id === id);
      if (!ctrl || !tv || openingRef.current) return;
      openingRef.current = true;
      try {
        sessionStorage.setItem(CAM_KEY, JSON.stringify(savedCamRef.current ?? ctrl.snapshot()));
      } catch {
        /* ignore */
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        navigate(`/project/${id}`);
        return;
      }
      // Dive into the screen, fade to black, then hand over to the detail page.
      setDiving(true);
      ctrl.flyTo({ x: tv.x, y: tv.y, zoom: ctrl.cam.zoom * 1.8 }, { rate: 5, settleMs: 800 });
      window.setTimeout(() => navigate(`/project/${id}`), 480);
    },
    [layout.placed, navigate]
  );

  // Changing the filter flies the camera to the surviving TVs.
  const lastFilterRef = useRef(filter);
  useEffect(() => {
    if (lastFilterRef.current === filter) return;
    lastFilterRef.current = filter;
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    if (savedCamRef.current) {
      ctrl.locked = false;
      savedCamRef.current = null;
    }
    ctrl.flyTo(overviewPose(shown, ctrl.size().w), { rate: 3.5, settleMs: 1800 });
  }, [filter, shown]);

  /* ───────────── keyboard (focus mode + extras) ───────────── */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape" && focusedId) {
        e.preventDefault();
        unfocus();
      } else if (focusedId && e.key === "ArrowRight") {
        e.preventDefault();
        cycle(1);
      } else if (focusedId && e.key === "ArrowLeft") {
        e.preventDefault();
        cycle(-1);
      } else if (!focusedId && (e.key === "Home" || e.key.toLowerCase() === "r")) {
        recenter();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedId, unfocus, cycle, recenter]);

  // A tap on empty space (not a drag) leaves focus mode.
  function onRootClick(e: MouseEvent<HTMLDivElement>) {
    if (!focusedId) return;
    const el = e.target as Element;
    if (el.closest(".tv-body") || el.closest("[data-ui]")) return;
    unfocus();
  }

  function onSelect(id: string) {
    if (id === focusedId) return;
    focusTv(id);
  }

  /* ───────────── render ───────────── */

  const loading = apiProjects === null;
  const empty = !loading && !error && layout.placed.length === 0;
  const total = layout.placed.length;
  const idx = focused ? shown.findIndex((t) => t.project.id === focused.project.id) + 1 : 0;

  return (
    <div
      ref={viewportRef}
      className={`tvw-root${focusedId ? " has-focus" : ""}`}
      onClick={onRootClick}
    >
      <div ref={backdropRef} className="tvw-backdrop" />

      <div ref={worldRef} className="tvw-world">
        {visible.map((tv) => (
          <PixelTV
            key={tv.project.id}
            tv={tv}
            focused={tv.project.id === focusedId}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="tvw-vignette" />

      {/* ── HUD: tiny, in the corners, never over the screens ── */}
      <div className="tvw-hud tvw-hud--tl">
        <b>PROJECT ARCHIVE</b>
        {loading
          ? "TUNING..."
          : filter === "all"
            ? `${total} PROJECT${total === 1 ? "" : "S"}`
            : `${shown.length} / ${total} PROJECTS`}
      </div>

      <div className="tvw-hud tvw-hud--bl">
        {focused ? (
          <>ESC &middot; BACK TO EXPLORE &nbsp; &larr; &rarr; SWITCH TV</>
        ) : (
          <>
            DRAG TO EXPLORE
            <br />
            <span className="tvw-hint-keys">&uarr; &darr; &larr; &rarr; / WASD &middot; SCROLL &middot; PINCH TO ZOOM</span>
            <span className="tvw-hint-touch">TAP A TV TO OPEN IT</span>
          </>
        )}
      </div>

      <div className="tvw-hud tvw-hud--tr" data-ui>
        {techOptions.length > 0 && (
          <select
            className="tvw-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter by tech stack"
          >
            <option value="all">ALL TECH</option>
            {techOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
        <Link to="/home" className="tvw-btn">
          &larr; EXIT
        </Link>
      </div>

      <div className="tvw-hud tvw-hud--br" data-ui>
        <button type="button" className="tvw-btn tvw-btn--sq" aria-label="Zoom out" onClick={() => ctrlRef.current?.zoomBy(1 / 1.25)}>
          -
        </button>
        <button type="button" className="tvw-btn tvw-btn--sq" aria-label="Zoom in" onClick={() => ctrlRef.current?.zoomBy(1.25)}>
          +
        </button>
        <button type="button" className="tvw-btn" onClick={recenter}>
          CENTER
        </button>
      </div>

      {/* ── states ── */}
      {loading && (
        <div className="tvw-center">
          <span className="tvw-blink">TUNING...</span>
        </div>
      )}
      {error && (
        <div className="tvw-center" data-ui>
          <span>SIGNAL LOST</span>
          <span style={{ color: "#4b4f57", letterSpacing: "0.12em" }}>{error}</span>
          <button type="button" className="tvw-btn" onClick={() => void load()}>
            RETRY
          </button>
        </div>
      )}
      {empty && (
        <div className="tvw-center" data-ui>
          <span>NO SIGNAL</span>
          <span style={{ color: "#4b4f57" }}>NO PUBLIC PROJECTS YET</span>
          <Link to="/add-project" className="tvw-btn tvw-btn--primary">
            UPLOAD THE FIRST ONE
          </Link>
        </div>
      )}
      {!loading && !error && !empty && shown.length === 0 && (
        <div className="tvw-center" data-ui>
          <span>NOTHING TUNED IN FOR THIS TECH</span>
          <button type="button" className="tvw-btn" onClick={() => setFilter("all")}>
            SHOW ALL
          </button>
        </div>
      )}

      {/* ── focused project info ── */}
      {focused && (
        <aside className="tvw-panel" data-ui key={focused.project.id} aria-label="Project details">
          <div className="tvw-panel-kicker">
            TV {String(focused.number).padStart(2, "0")} &middot; {idx} / {shown.length}
          </div>
          <h2>{focused.project.title}</h2>
          {focused.project.shortDescription && <p>{focused.project.shortDescription}</p>}
          {focused.project.fullDescription && (
            <p className="tvw-panel-long">{focused.project.fullDescription}</p>
          )}
          {focused.project.techStack.length > 0 && (
            <div className="tvw-chips">
              {focused.project.techStack.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
          <div className="tvw-meta">
            <div>
              BY<b>@{focused.project.author}</b>
            </div>
            {focused.project.category && (
              <div>
                CATEGORY<b>{focused.project.category}</b>
              </div>
            )}
            {focused.project.videoUrl && (
              <div>
                DEMO<b>PLAYING ON SCREEN</b>
              </div>
            )}
          </div>
          <div className="tvw-sep" />
          <div className="tvw-actions">
            <button
              type="button"
              className="tvw-btn tvw-btn--primary"
              onClick={() => openProject(focused.project.id)}
            >
              OPEN PROJECT &rarr;
            </button>
            {focused.project.isOwner && (
              <Link to={`/project/${focused.project.id}/edit`} className="tvw-btn">
                EDIT
              </Link>
            )}
          </div>
          <div className="tvw-actions">
            <button type="button" className="tvw-btn" onClick={unfocus}>
              &larr; BACK TO EXPLORE
            </button>
            {shown.length > 1 && (
              <>
                <button type="button" className="tvw-btn tvw-btn--sq" aria-label="Previous TV" onClick={() => cycle(-1)}>
                  &lt;
                </button>
                <button type="button" className="tvw-btn tvw-btn--sq" aria-label="Next TV" onClick={() => cycle(1)}>
                  &gt;
                </button>
              </>
            )}
          </div>
        </aside>
      )}

      {booting && (
        <div className="tvw-boot" aria-hidden="true">
          <i />
        </div>
      )}
      {diving && <div className="tvw-dive" aria-hidden="true" />}
    </div>
  );
}
