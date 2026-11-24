import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export type TourStep = { path: string; target: string; title: string; body: string };

type Box = { top: number; left: number; width: number; height: number };

function visible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

type Props = {
  open: boolean;
  step: number;
  steps: TourStep[];
  label: string;
  onStep: (n: number) => void;
  onFinish: (state: "completed" | "skipped") => void;
};

function routeKey(path: string): { pathname: string; search: string } {
  const [pathname, query = ""] = path.split("?");
  return { pathname: pathname || "/", search: query ? `?${query}` : "" };
}

function onRoute(location: { pathname: string; search: string }, path: string): boolean {
  const want = routeKey(path);
  return location.pathname === want.pathname && (want.search === "" || location.search === want.search);
}

/** Spotlight card that follows `[data-tour]` targets across pages. Escape, Skip, and arrows always work. */
export function GuidedTour({ open, step, steps, label, onStep, onFinish }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [measured, setMeasured] = useState<{ step: number; box: Box | null }>({ step: -1, box: null });
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const safeStep = steps.length === 0 ? 0 : Math.min(Math.max(0, step), steps.length - 1);
  const current = steps[safeStep];
  const last = safeStep === steps.length - 1;
  const box = measured.step === safeStep ? measured.box : null;
  const settled = measured.step === safeStep;
  const ready = Boolean(current && onRoute(location, current.path));

  // Clear spotlight immediately when the step changes so focus never sticks to a stale rect.
  useLayoutEffect(() => {
    setMeasured({ step: -1, box: null });
  }, [safeStep, open]);

  useEffect(() => {
    if (open && current && !ready) navigate(current.path);
  }, [open, current, ready, navigate]);

  useEffect(() => {
    if (!open || !ready || !current) return;
    let element: Element | null = null;
    let tries = 0;
    let settle: number | undefined;
    let raf = 0;

    const measure = () => {
      if (!element) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!element) return;
        const r = element.getBoundingClientRect();
        setMeasured({
          step: safeStep,
          box: { top: r.top, left: r.left, width: r.width, height: r.height },
        });
      });
    };

    const find = window.setInterval(() => {
      tries += 1;
      const found = document.querySelector(`[data-tour="${current.target}"]`);
      if (found && visible(found)) {
        window.clearInterval(find);
        element = found;
        found.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        // Wait for layout/scroll to settle, then measure twice for smoothness.
        settle = window.setTimeout(() => {
          measure();
          settle = window.setTimeout(measure, 280);
        }, 320);
      } else if (tries > 40) {
        window.clearInterval(find);
        setMeasured({ step: safeStep, box: null });
      }
    }, 70);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearInterval(find);
      if (settle) window.clearTimeout(settle);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, safeStep, current, ready]);

  useEffect(() => {
    if (!open || !settled) return;
    const t = window.setTimeout(() => cardRef.current?.focus({ preventScroll: true }), 40);
    return () => window.clearTimeout(t);
  }, [open, safeStep, settled]);

  const next = useCallback(
    () => (last ? onFinish("completed") : onStep(safeStep + 1)),
    [last, onFinish, onStep, safeStep],
  );
  const back = useCallback(() => onStep(Math.max(0, safeStep - 1)), [onStep, safeStep]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFinish("skipped");
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onFinish, next, back]);

  function trapFocus(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !cardRef.current) return;
    const items = cardRef.current.querySelectorAll<HTMLElement>("button:not([disabled])");
    if (items.length === 0) return;
    const first = items[0]!;
    const final = items[items.length - 1]!;
    if (e.shiftKey && (document.activeElement === first || document.activeElement === cardRef.current)) {
      e.preventDefault();
      final.focus();
    } else if (!e.shiftKey && document.activeElement === final) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!open || !current) return null;

  const pad = 10;
  const gap = 16;
  const cardEstimate = 280;
  const narrow = window.innerWidth < 640;
  const cardWidth = Math.min(400, window.innerWidth - 32);
  let cardStyle: CSSProperties | undefined;
  let cardPlacementClass = "";

  if (box) {
    const highlight = {
      top: box.top - pad,
      left: box.left - pad,
      right: box.left + box.width + pad,
      bottom: box.top + box.height + pad,
      width: box.width + pad * 2,
      height: box.height + pad * 2,
    };
    const roomRight = window.innerWidth - highlight.right - gap;
    const roomLeft = highlight.left - gap;
    const roomBelow = window.innerHeight - highlight.bottom - gap;
    const roomAbove = highlight.top - gap;
    const centerY = Math.min(
      Math.max(16, highlight.top + highlight.height / 2 - cardEstimate / 2),
      window.innerHeight - cardEstimate - 16,
    );

    if (!narrow && roomRight >= cardWidth) {
      cardStyle = { top: centerY, left: highlight.right + gap, width: cardWidth };
    } else if (!narrow && roomLeft >= cardWidth) {
      cardStyle = { top: centerY, left: Math.max(16, highlight.left - gap - cardWidth), width: cardWidth };
    } else if (roomBelow >= cardEstimate) {
      const left = Math.min(Math.max(16, box.left), window.innerWidth - cardWidth - 16);
      cardStyle = { top: highlight.bottom + gap, left, width: cardWidth };
    } else if (roomAbove >= cardEstimate) {
      const left = Math.min(Math.max(16, box.left), window.innerWidth - cardWidth - 16);
      cardStyle = { top: Math.max(16, highlight.top - gap - cardEstimate), left, width: cardWidth };
    } else if (narrow) {
      const highlightMid = box.top + box.height / 2;
      cardPlacementClass = highlightMid > window.innerHeight / 2 ? "inset-x-3 top-3" : "inset-x-3 bottom-3";
    } else {
      const left = Math.min(Math.max(16, box.left), window.innerWidth - cardWidth - 16);
      cardStyle = {
        top: Math.max(16, Math.min(highlight.bottom + gap, window.innerHeight - cardEstimate - 16)),
        left,
        width: cardWidth,
      };
    }
  }

  return (
    <div className="fixed inset-0 z-[70]" aria-live="polite">
      {box ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-2xl ring-4 ring-[#fced96] transition-[top,left,width,height,opacity] duration-500 ease-out"
          style={{
            top: box.top - pad,
            left: box.left - pad,
            width: box.width + pad * 2,
            height: box.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(28, 25, 23, 0.52)",
            opacity: settled ? 1 : 0.45,
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-stone-950/55 transition-opacity duration-300" />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        onKeyDown={trapFocus}
        style={cardStyle}
        className={`fixed rounded-3xl border border-stone-200/80 bg-[#FAF7EE] p-5 shadow-2xl outline-none transition-[top,left,opacity,transform] duration-500 ease-out sm:p-6 ${
          cardStyle
            ? ""
            : cardPlacementClass || (narrow ? "inset-x-3 bottom-3" : "left-1/2 top-1/2 w-[400px] -translate-x-1/2 -translate-y-1/2")
        } ${settled ? "opacity-100 translate-y-0" : "opacity-70"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">
            {label} · {safeStep + 1} of {steps.length}
          </p>
          <button
            type="button"
            onClick={() => onFinish("skipped")}
            aria-label="Close tour"
            className="-mr-1 -mt-1 rounded-lg p-1 text-stone-500 hover:bg-stone-200/70 hover:text-stone-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 id={titleId} className="mt-2 font-serif text-2xl text-stone-900 sm:text-[1.65rem]">
          {current.title}
        </h2>
        <p id={bodyId} className="mt-2 text-sm leading-relaxed text-stone-600">
          {current.body}
        </p>
        <div className="mt-4 flex gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <span
              key={`${s.path}-${s.target}`}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= safeStep ? "bg-maroon-700" : "bg-stone-200"}`}
            />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onFinish("skipped")}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {safeStep > 0 && (
              <button
                type="button"
                onClick={back}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-maroon-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-maroon-900"
            >
              {last ? "Finish" : "Next"}
            </button>
          </div>
        </div>
        <p className="mt-3 hidden text-[11px] text-stone-400 sm:block">Arrow keys move between steps. Esc skips.</p>
      </div>
    </div>
  );
}
