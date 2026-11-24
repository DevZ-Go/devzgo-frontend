import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchMyProfile, saveTourState } from "../../api/profiles";
import { useAccount } from "../../auth/account";
import { DEVELOPER_TOUR_EVENT } from "./events";
import { GuidedTour, type TourStep } from "./GuidedTour";

/**
 * Separate from the recruiter tour version (1) so finishing one never hides the other.
 * Raise this when the developer steps change.
 */
export const DEV_TOUR_VERSION = 12;

const STEPS: TourStep[] = [
  {
    path: "/network",
    target: "network-places",
    title: "Welcome to DevZ-Go",
    body: "Network is your home feed — posts, connections, and clubs. You can restart this tour any time from More → Take Developer Tour, or from Settings → Help.",
  },
  {
    path: "/explore",
    target: "explore-studio",
    title: "Explore projects",
    body: "Browse real projects from the community. Filter by stack, switch gallery modes, and open any project to learn more.",
  },
  {
    path: "/add-project",
    target: "add-project-form",
    title: "Share a project",
    body: "Upload a ZIP, add a cover, and publish. Public projects show up in Explore for everyone.",
  },
  {
    path: "/messages",
    target: "messages-list",
    title: "Messages",
    body: "Chat one-on-one or in groups. Mute, restrict, or block anyone from a conversation — manage that in Settings.",
  },
  {
    path: "/assessments",
    target: "assessments-intro",
    title: "Assessments",
    body: "Technical challenges from recruiters land here (also under More). Choose whether you receive them, and share results only if you want to.",
  },
  {
    path: "/profile",
    target: "profile-actions",
    title: "Your profile",
    body: "Keep skills and photo up to date, open Monthly Wrap, and manage connections.",
  },
  {
    path: "/settings?section=help",
    target: "settings-tour",
    title: "Settings and safety",
    body: "Open Settings from More. Blocked & muted, account pause/delete, and restart this tour all live here.",
  },
];

/** Guided tour for developer accounts. Opens once per tour version; Skip and Escape always close it. */
export function DeveloperTour() {
  const { ready, recruiter } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const checked = useRef(false);
  const developer = ready && !recruiter;
  const onNetworkHome = location.pathname === "/network";

  useEffect(() => {
    if (!developer || checked.current || !onNetworkHome) return;
    checked.current = true;
    fetchMyProfile()
      .then((profile) => {
        if ((profile.tourVersion ?? 0) < DEV_TOUR_VERSION) {
          setStep(0);
          setOpen(true);
        }
      })
      .catch(() => undefined);
  }, [developer, onNetworkHome]);

  useEffect(() => {
    const start = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(DEVELOPER_TOUR_EVENT, start);
    return () => window.removeEventListener(DEVELOPER_TOUR_EVENT, start);
  }, []);

  const finish = useCallback(
    (state: "completed" | "skipped") => {
      setOpen(false);
      void saveTourState(DEV_TOUR_VERSION, state).catch(() => undefined);
      if (location.pathname !== "/network") {
        navigate("/network");
      }
    },
    [location.pathname, navigate],
  );

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
