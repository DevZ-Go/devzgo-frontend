import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchMyProfile, saveTourState } from "../../api/profiles";
import { useAccount } from "../../auth/account";
import { RECRUITER_TOUR_EVENT } from "./events";
import { GuidedTour, type TourStep } from "./GuidedTour";

/** Raise this when the steps change, so recruiters who finished an older tour see the new one once. */
export const TOUR_VERSION = 1;

const STEPS: TourStep[] = [
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
    body: "From a candidate's evaluation page, send a short note about a role. They accept or decline, and accepting opens Messages. You can reopen this tour any time from Help in the top bar, Settings → Help, or from your dashboard.",
  },
];

/** A guided tour for recruiter accounts. Opens once per tour version; Skip and Escape always close it. */
export function RecruiterTour() {
  const { ready, recruiter } = useAccount();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const checked = useRef(false);
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
    window.addEventListener(RECRUITER_TOUR_EVENT, start);
    return () => window.removeEventListener(RECRUITER_TOUR_EVENT, start);
  }, []);

  const finish = useCallback((state: "completed" | "skipped") => {
    setOpen(false);
    void saveTourState(TOUR_VERSION, state).catch(() => undefined);
  }, []);

  if (!recruiter) return null;

  return (
    <GuidedTour
      open={open}
      step={step}
      steps={STEPS}
      label="Recruiter tour"
      onStep={setStep}
      onFinish={finish}
    />
  );
}
