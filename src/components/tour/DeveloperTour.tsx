import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchMyProfile, saveTourState } from "../../api/profiles";
import { useAccount } from "../../auth/account";
import { DEVELOPER_TOUR_EVENT } from "./events";
import { GuidedTour, type TourStep } from "./GuidedTour";

/**
 * Separate from the recruiter tour version (1) so finishing one never hides the other.
 * Raise this when the developer steps change.
 */
export const DEV_TOUR_VERSION = 11;

const STEPS: TourStep[] = [
  {
    path: "/home",
    target: "home-cta",
    title: "Welcome to DevZ-Go",
    body: "This is your home. Jump into Explore to browse projects, or start a new one of your own. You can reopen this tour any time from Help in the top bar.",
  },
  {
    path: "/explore",
    target: "explore-rooms",
    title: "Explore in different rooms",
    body: "Pick a room to browse projects, or search for developers. Each room is a different way to look at the same work.",
  },
  {
    path: "/network",
    target: "network-places",
    title: "Your network",
    body: "See the feed, manage connections and requests, and find developers. This is where collaboration starts.",
  },
  {
    path: "/add-project",
    target: "add-project-form",
    title: "Share a project",
    body: "Add a title, stack, and optional media or workspace files. Public projects show up in Explore for everyone.",
  },
  {
    path: "/messages",
    target: "messages-list",
    title: "Messages and groups",
    body: "Chat one-on-one or in groups. You can mute, restrict, or block anyone from a conversation, and manage that in Settings.",
  },
  {
    path: "/assessments",
    target: "assessments-intro",
    title: "Assessments",
    body: "Technical challenges from recruiters land here. Choose whether you receive them, and share results only if you want to.",
  },
  {
    path: "/profile",
    target: "profile-actions",
    title: "Your profile",
    body: "Keep your skills and photo up to date, open your Monthly Wrap, and manage connections. Help in the top bar restarts this tour whenever you need it.",
  },
  {
    path: "/settings?section=help",
    target: "settings-tour",
    title: "Settings and safety",
    body: "Blocked & muted lives here, along with pause or delete your account. You can restart this tour from Help in Settings or from the top bar.",
  },
];

/** Guided tour for developer accounts. Opens once per tour version; Skip and Escape always close it. */
export function DeveloperTour() {
  const { ready, recruiter } = useAccount();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const checked = useRef(false);
  const developer = ready && !recruiter;
  const onDevHome = location.pathname === "/home" || location.pathname === "/";

  useEffect(() => {
    if (!developer || checked.current || !onDevHome) return;
    checked.current = true;
    fetchMyProfile()
      .then((profile) => {
        if ((profile.tourVersion ?? 0) < DEV_TOUR_VERSION) {
          setStep(0);
          setOpen(true);
        }
      })
      .catch(() => undefined);
  }, [developer, onDevHome]);

  useEffect(() => {
    const start = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(DEVELOPER_TOUR_EVENT, start);
    return () => window.removeEventListener(DEVELOPER_TOUR_EVENT, start);
  }, []);

  const finish = useCallback((state: "completed" | "skipped") => {
    setOpen(false);
    void saveTourState(DEV_TOUR_VERSION, state).catch(() => undefined);
  }, []);

  if (!developer) return null;

  return (
    <GuidedTour
      open={open}
      step={step}
      steps={STEPS}
      label="Developer tour"
      onStep={setStep}
      onFinish={finish}
    />
  );
}
