import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { fetchMyProfile, saveTourState } from "../../api/profiles";
import { useAccount } from "../../auth/account";
import { TOUR_EVENT } from "./events";

/** Raise this when the steps change, so recruiters who finished an older tour see the new one once. */
export const TOUR_VERSION = 1;

type Step = { path: string; target: string; title: string; body: string };

const STEPS: Step[] = [
  {
    path: "/recruit",
    target: "dash-summary",
    title: "Your recruiting dashboard",
    body: "Shortlisted candidates, where each one stands, and the contact requests you have sent all collect here. Candidates never see this page.",
  },
  {
    path: "/recruit/talent",
    target: "talent-search",
    title: "Search by the stack you need",
    body: "Search by name or skill and add the technologies a role needs. A person appears only when they match every one you picked.",
  },
  {
    path: "/recruit/talent",
    target: "talent-filters",
    title: "Filter on evidence",
    body: "Require the tech in a public project, source code to review, imported GitHub history, a minimum number of relevant projects, or people who said they are open to work. Missing GitHub history is never treated as inactivity.",
  },
  {
    path: "/recruit/talent",
    target: "talent-sort",
    title: "Every ranking says what it measures",
    body: "Each sort uses one visible measure and each card lists why that person matched. There is no overall score, and private projects, hidden connections and hidden activity never count.",
  },
  {
    path: "/recruit/shortlists",
    target: "shortlist-create",
    title: "Keep private shortlists",
    body: "Make a list per role, move candidates through statuses, and keep notes. Only you can see your lists and notes.",
  },
  {
    path: "/recruit/inbox",
    target: "inbox-requests",
    title: "Reach out with a contact request",
    body: "From a candidate's evaluation page, send a short note about a role. They accept or decline, and accepting opens Messages. You can reopen this tour any time from Help in the top bar or from your dashboard.",
  },
];

type Box = { top: number; left: number; width: number; height: number };

function visible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/** A guided tour for recruiter accounts. Opens once per tour version; Skip and Escape always close it. */
export function RecruiterTour() {
  const { ready, recruiter } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [measured, setMeasured] = useState<{ step: number; box: Box | null }>({ step: -1, box: null });
  const checked = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const current = STEPS[step]!;
  const last = step === STEPS.length - 1;
  const box = measured.step === step ? measured.box : null;
  const onRecruitPage = location.pathname.startsWith("/recruit");

  useEffect(() => {
    if (!ready || !recruiter || checked.current || !onRecruitPage) return;
    checked.current = true;
    fetchMyProfile()
      .then((profile) => {
        if ((profile.tourVersion ?? 0) < TOUR_VERSION) {
          setStep(0);
          setOpen(true);
        }
      })
      .catch(() => undefined);
  }, [ready, recruiter, onRecruitPage]);

  useEffect(() => {
    const start = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_EVENT, start);
    return () => window.removeEventListener(TOUR_EVENT, start);
  }, []);

  useEffect(() => {
    if (open && location.pathname !== current.path) navigate(current.path);
  }, [open, current.path, location.pathname, navigate]);

  useEffect(() => {
    if (!open || location.pathname !== current.path) return;
    let element: Element | null = null;
    let tries = 0;
    const measure = () => {
      if (!element) return;
      const r = element.getBoundingClientRect();
      setMeasured({ step, box: { top: r.top, left: r.left, width: r.width, height: r.height } });
    };
    const find = window.setInterval(() => {
      tries += 1;
      const found = document.querySelector(`[data-tour="${current.target}"]`);
      if (found && visible(found)) {
        window.clearInterval(find);
        element = found;
        found.scrollIntoView({ block: "center", behavior: "smooth" });
        window.setTimeout(measure, 350);
      } else if (tries > 25) {
        window.clearInterval(find);
        setMeasured({ step, box: null });
      }
    }, 100);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearInterval(find);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, current.target, current.path, location.pathname]);

  useEffect(() => {
    if (open) cardRef.current?.focus();
  }, [open, step]);

  const finish = useCallback((state: "completed" | "skipped") => {
    setOpen(false);
    void saveTourState(TOUR_VERSION, state).catch(() => undefined);
  }, []);

  const next = useCallback(() => (last ? finish("completed") : setStep((n) => n + 1)), [last, finish]);
  const back = useCallback(() => setStep((n) => Math.max(0, n - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish("skipped");
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish, next, back]);

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

  if (!open || !recruiter) return null;

  const pad = 8;
  const narrow = window.innerWidth < 640;
  const cardWidth = Math.min(380, window.innerWidth - 32);
  let cardStyle: CSSProperties | undefined;
  if (box && !narrow) {
    const below = box.top + box.height + pad + 12;
    const roomBelow = window.innerHeight - below > 240;
    const left = Math.min(Math.max(16, box.left), window.innerWidth - cardWidth - 16);
    cardStyle = roomBelow
      ? { top: below, left, width: cardWidth }
      : { top: Math.max(16, box.top - pad - 12 - 260), left, width: cardWidth };
  }

  return (
    <div className="fixed inset-0 z-[70]" aria-live="polite">
      {box ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-2xl ring-4 ring-[#fced96] transition-all duration-300"
          style={{
            top: box.top - pad,
            left: box.left - pad,
            width: box.width + pad * 2,
            height: box.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(28, 25, 23, 0.55)",
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-stone-950/55" />
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
        className={`fixed rounded-3xl border border-stone-200 bg-[#FAF7EE] p-5 shadow-2xl outline-none sm:p-6 ${
          cardStyle ? "" : narrow ? "inset-x-3 bottom-3" : "left-1/2 top-1/2 w-[380px] -translate-x-1/2 -translate-y-1/2"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">
            Recruiter tour · {step + 1} of {STEPS.length}
          </p>
          <button type="button" onClick={() => finish("skipped")} aria-label="Close tour"
            className="-mr-1 -mt-1 rounded-lg p-1 text-stone-500 hover:bg-stone-200/70 hover:text-stone-900">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 id={titleId} className="mt-2 font-serif text-2xl text-stone-900">{current.title}</h2>
        <p id={bodyId} className="mt-2 text-sm leading-relaxed text-stone-600">{current.body}</p>
        <div className="mt-4 flex gap-1" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s.target} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-maroon-700" : "bg-stone-200"}`} />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={() => finish("skipped")}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200/70 hover:text-stone-900">
            Skip tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={back}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50">
                Back
              </button>
            )}
            <button type="button" onClick={next}
              className="rounded-lg bg-maroon-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-maroon-900">
              {last ? "Finish" : "Next"}
            </button>
          </div>
        </div>
        <p className="mt-3 hidden text-[11px] text-stone-400 sm:block">Arrow keys move between steps. Esc skips.</p>
      </div>
    </div>
  );
}
