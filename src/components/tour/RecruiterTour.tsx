import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchMyProfile, saveTourState } from "../../api/profiles";
import { useAccount } from "../../auth/account";
import { RECRUITER_TOUR_EVENT } from "./events";
import { GuidedTour, type TourStep } from "./GuidedTour";

/** Raise this when the steps change, so recruiters who finished an older tour see the new one once. */
export const TOUR_VERSION = 2;

const STEPS: TourStep[] = [
  {
    path: "/recruit",
    target: "dash-summary",
    title: "Recruiting dashboard",
    body: "Counts for shortlists, pipeline status, and contact requests. Candidates never see this page. Restart anytime from Help, Settings → Help, or the dashboard.",
  },
  {
    path: "/recruit/talent",
    target: "talent-search",
    title: "Search talent",
    body: "Search by name or skill, then add the technologies a role needs. Someone appears only when they match every stack you picked.",
  },
  {
    path: "/recruit/talent",
    target: "talent-filters",
    title: "Evidence filters",
    body: "Require tech in a public project, source to review, GitHub history, a minimum project count, or Open to work. Missing GitHub is never treated as inactivity.",
  },
  {
    path: "/recruit/talent",
    target: "talent-sort",
    title: "Transparent ranking",
    body: "Each sort uses one visible measure; each card explains the match. No overall score. Private projects, hidden connections, and hidden activity never count.",
  },
  {
    path: "/recruit/shortlists",
    target: "shortlist-create",
    title: "Private shortlists",
    body: "Create a list per role, move people through statuses, and keep notes. Only you can see your lists and notes.",
  },
  {
    path: "/recruit/inbox",
    target: "inbox-requests",
    title: "Contact requests",
    body: "From a candidate’s page, send a short note about a role. They accept or decline; accepting opens Messages so you can continue the conversation.",
  },
];

/** Guided tour for recruiter accounts. Opens once per tour version; Skip and Escape always close it. */
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
