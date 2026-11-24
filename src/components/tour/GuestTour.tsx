import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { GUEST_TOUR_EVENT } from "./events";
import { GuidedTour, type TourStep } from "./GuidedTour";

const STORAGE_KEY = "devzgo:guest-tour-done";

const STEPS: TourStep[] = [
  {
    path: "/",
    target: "home-cta",
    title: "Welcome to DevZ-Go",
    body: "Start here on Overview. Sign in when you are ready — or keep going for a quick tour of Reels, TV World, Network, and more.",
  },
  {
    path: "/",
    target: "guest-featured",
    title: "Featured projects",
    body: "Open any card to read a real project. Looking around is free; likes, comments, and connects unlock after sign-in.",
  },
  {
    path: "/explore",
    target: "explore-reels",
    title: "Explore · Reels",
    body: "Reels is the default Explore view — snap-scroll full-bleed project covers. Hearts and shares wait until you have an account.",
  },
  {
    path: "/explore",
    target: "explore-modes",
    title: "Switch views",
    body: "Toggle Reels, Directory, or TV World here. Directory is a filterable grid; TV World unlocks fully after sign-in.",
  },
  {
    path: "/explore?view=directory",
    target: "explore-studio",
    title: "Explore · Directory",
    body: "Calm grid catalog of the same public projects. Filter by stack, then open any build to read more.",
  },
  {
    path: "/preview/tv",
    target: "guest-tv",
    title: "TV World",
    body: "A cozy room with projects on the CRT. Members flip channels here; this stop shows the vibe without live controls.",
  },
  {
    path: "/preview/network",
    target: "guest-network",
    title: "Network · your home",
    body: "After sign-in, Network is home — places on the left, feed in the middle, people and clubs on the right.",
  },
  {
    path: "/preview/network",
    target: "guest-network-feed",
    title: "Network · Feed",
    body: "Posts from classmates, clubs, and project updates. React and comment once you join — this board is a demo layout.",
  },
  {
    path: "/preview/network",
    target: "guest-network-connections",
    title: "Network · Connections",
    body: "Suggested people to connect with. Profiles and Connect stay locked for guests.",
  },
  {
    path: "/preview/network",
    target: "guest-network-clubs",
    title: "Network · Clubs",
    body: "Communities and campus clubs live here. Join and post announcements after you create an account.",
  },
  {
    path: "/preview/create",
    target: "guest-create",
    title: "Share your work",
    body: "Upload a ZIP, cover, and story. Public projects show up in Explore for peers and recruiters.",
  },
  {
    path: "/preview/messages",
    target: "guest-messages",
    title: "Messages",
    body: "Chat with connections and groups. Safety tools (mute, restrict, block) live in Settings.",
  },
  {
    path: "/preview/profile",
    target: "guest-profile",
    title: "Your profile",
    body: "Skills, photo, and projects in one place. Finish the tour to create a free account and use the full app.",
  },
];

/** Guided walkthrough for signed-out visitors. Does not call member-only APIs. */
export function GuestTour() {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const autoStarted = useRef(false);
  const guest = isReady && !isAuthenticated;

  useEffect(() => {
    if (!guest || autoStarted.current) return;
    if (location.pathname !== "/" && location.pathname !== "/home") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    autoStarted.current = true;
    const t = window.setTimeout(() => {
      setStep(0);
      setOpen(true);
    }, 700);
    return () => window.clearTimeout(t);
  }, [guest, location.pathname]);

  useEffect(() => {
    const start = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(GUEST_TOUR_EVENT, start);
    return () => window.removeEventListener(GUEST_TOUR_EVENT, start);
  }, []);

  const finish = useCallback(
    (state: "completed" | "skipped") => {
      setOpen(false);
      localStorage.setItem(STORAGE_KEY, "1");
      navigate(state === "completed" ? "/register" : "/");
    },
    [navigate],
  );

  if (!guest) return null;

  return (
    <GuidedTour
      open={open}
      step={step}
      steps={STEPS}
      label="Guest tour"
      onStep={setStep}
      onFinish={finish}
    />
  );
}
