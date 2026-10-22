import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyProfile, markRecruitingGuide } from "../api/profiles";
import { useAuth } from "../auth/AuthContext";
import { ui } from "../styles/editorial";

const STEPS = [
  {
    title: "You are here as a recruiter",
    body: "Your profile says Recruiter and names your company or agency. Messaging, connections, and projects work the same way they do for everyone else.",
  },
  {
    title: "Search by the stack you need",
    body: "Open Find Developers and pick technologies. Someone appears only when their visible projects or skills include every technology you picked.",
  },
  {
    title: "Rank the list",
    body: "Sort by most projects, most commits, most pushes, most connections, or most active. Commits and pushes come from GitHub repositories imported here. Hidden connections and activity stay hidden, so they are not used to rank anyone.",
  },
  {
    title: "Open the graphic portfolio",
    body: "Graphic view turns a profile into bars: projects, commits, pushes, connections, activity, languages, and tech. It only counts work that person has allowed you to see.",
  },
  {
    title: "Privacy still applies",
    body: "A private project, a connections-only profile, or a hidden activity setting stays hidden. Connect when you need a closer look, and message from the same card.",
  },
];

/** A short walkthrough for recruiter accounts. It opens once, and can be opened again from Find Developers. */
export function RecruiterGuide() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMyProfile()
      .then((profile) => {
        if (cancelled || profile.role !== "Recruiter") return;
        setCompany(profile.company || null);
        if (!profile.guideSeen) setOpen(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const openGuide = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("devzgo:recruiting-guide", openGuide);
    return () => window.removeEventListener("devzgo:recruiting-guide", openGuide);
  }, []);

  async function close() {
    setOpen(false);
    await markRecruitingGuide().catch(() => undefined);
  }

  if (!open) return null;
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-stone-950/40 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="recruiting-guide-title"
        className="w-full max-w-lg rounded-3xl border border-stone-200 bg-[#FAF7EE] p-6 shadow-2xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon-800">
          Recruiting guide · {step + 1} of {STEPS.length}
        </p>
        <h2 id="recruiting-guide-title" className="mt-2 font-serif text-3xl text-stone-900">{current.title}</h2>
        {step === 0 && company && <p className="mt-2 text-sm font-semibold text-stone-700">{company}</p>}
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{current.body}</p>
        {step === 1 && (
          <Link to="/explore/developers" onClick={() => void close()} className={`${ui.link} mt-3 inline-block`}>
            Go to Find Developers
          </Link>
        )}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={() => void close()} className={`${ui.btn} ${ui.neutral}`}>Skip</button>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep((n) => n - 1)} className={`${ui.btn} ${ui.neutral}`}>Back</button>
            )}
            {last ? (
              <button type="button" onClick={() => void close()} className={`${ui.btn} ${ui.primary}`}>Done</button>
            ) : (
              <button type="button" onClick={() => setStep((n) => n + 1)} className={`${ui.btn} ${ui.primary}`}>Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
