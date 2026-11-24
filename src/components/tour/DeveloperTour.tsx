import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchMyProfile, saveTourState } from "../../api/profiles";
import { useAccount } from "../../auth/account";
import { DEVELOPER_TOUR_EVENT } from "./events";
import { GuidedTour, type TourStep } from "./GuidedTour";

/**
 * Separate from the recruiter tour version so finishing one never hides the other.
 * Raise this when the developer steps change.
 */
export const DEV_TOUR_VERSION = 13;

const STEPS: TourStep[] = [
  {
    path: "/network",
    target: "network-places",
    title: "Network is home",
    body: "After sign-in you land here. Left: your space. Center: feed. Right: people and clubs. Restart anytime from More → Take Developer Tour or Settings → Help.",
  },
  {
    path: "/network",
    target: "network-composer",
    title: "Share an update",
    body: "Post text to the community feed. Attach a project later from a project page with Share → Post to network.",
  },
  {
    path: "/network",
    target: "network-feed",
    title: "Your feed",
    body: "Posts from people you connect with, clubs, and project updates. Use the filter (For you / Following / Latest / Projects) on the right.",
  },
  {
    path: "/network",
    target: "network-connections",
    title: "Suggested connections",
    body: "Connect with classmates and collaborators. Accepted connections unlock Messages. See All opens the full connections inbox.",
  },
  {
    path: "/network",
    target: "network-clubs",
    title: "Communities & clubs",
    body: "Join campus clubs for announcements and group chat. See All opens the clubs directory.",
  },
  {
    path: "/explore",
    target: "explore-reels",
    title: "Explore · Reels",
    body: "Reels is the default Explore view — snap-scroll full-bleed project covers. Open any build to read the full page, like, or comment.",
  },
  {
    path: "/explore",
    target: "explore-modes",
    title: "Reels · Directory · TV",
    body: "Switch modes here. Directory is a filterable grid. TV World is a pixel room where every public project is a CRT.",
  },
  {
    path: "/explore?view=directory",
    target: "explore-studio",
    title: "Explore · Directory",
    body: "Grid catalog with filters by stack and category. Same projects as Reels — calmer browsing when you know what you want.",
  },
  {
    path: "/explore/tv",
    target: "explore-tv",
    title: "TV World",
    body: "Drag or use WASD to move. Click a TV to focus it, then open the project. Esc returns to the room.",
  },
  {
    path: "/add-project",
    target: "add-project-form",
    title: "Share a project",
    body: "Upload a ZIP, add a cover and story, then publish. Public projects appear in Explore for peers and recruiters.",
  },
  {
    path: "/messages",
    target: "messages-list",
    title: "Messages",
    body: "Chat one-on-one after a connection, or in club groups. Mute, restrict, or block from a conversation — manage that in Settings.",
  },
  {
    path: "/assessments",
    target: "assessments-intro",
    title: "Assessments",
    body: "Technical challenges from recruiters land here (also under More). Choose whether you receive them; share results only if you want to.",
  },
  {
    path: "/profile",
    target: "profile-actions",
    title: "Your profile",
    body: "Skills, photo, projects, Monthly Wrap, and connection controls. Keep this current — recruiters and classmates see what you share.",
  },
  {
    path: "/settings?section=help",
    target: "settings-tour",
    title: "Settings & safety",
    body: "Blocked & muted, account pause/delete, and restart this tour. Open Settings anytime from More.",
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
