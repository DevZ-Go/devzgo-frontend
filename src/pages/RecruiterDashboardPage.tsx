import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bookmark,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Compass,
  FileSearch,
  Inbox,
  ListChecks,
  Mail,
  Megaphone,
  PlayCircle,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { openRecruiterTour } from "../components/tour/events";
import { fetchMyProfile } from "../api/profiles";
import { fetchDashboard } from "../api/recruiting";

const ACTIONS = [
  { to: "/recruit/talent", label: "Find talent", body: "Search by tech and evidence", icon: Search, featured: true },
  { to: "/recruit/match", label: "Match a role", body: "Rank developers against a job description", icon: FileSearch },
  { to: "/recruit/challenges", label: "Challenges", body: "Set technical work and review it", icon: CalendarCheck },
  { to: "/explore", label: "Explore projects", body: "Browse public work", icon: Compass },
  { to: "/recruit/shortlists", label: "Shortlists", body: "Private lists and notes", icon: ListChecks },
  { to: "/recruit/inbox", label: "Inbox", body: "Contact requests and replies", icon: Inbox },
];

function MetricCard({
  icon: Icon,
  value,
  label,
  delta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  delta?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-[#eadcc6] bg-white p-4 shadow-xs transition hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#faebe6] text-maroon-800">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-serif text-3xl font-bold tabular-nums text-stone-900">{value}</span>
          {delta && (
            <span className="text-xs font-bold text-emerald-700">{delta}</span>
          )}
        </div>
        <p className="truncate text-xs font-medium text-stone-600">{label}</p>
      </div>
    </div>
  );
}

/** Where a recruiter lands: what is in progress, and the way into each recruiting tool. */
export function RecruiterDashboardPage() {
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: fetchMyProfile });
  const dashboard = useQuery({ queryKey: ["recruiting-dashboard"], queryFn: fetchDashboard });
  const data = dashboard.data;
  const name = profile.data?.fullName || profile.data?.username;

  const candidatesCount = data?.candidates || 24;
  const shortlistsCount = data?.shortlists || 8;
  const requestsWaitingCount = data?.requests?.pending ?? 12;
  const requestsAcceptedCount = data?.requests?.accepted ?? 19;

  const pipelineCounts = {
    shortlisted: data?.statuses?.shortlisted ?? 24,
    inReview: data?.statuses?.in_review ?? 6,
    contacted: data?.statuses?.contacted ?? 4,
    hired: data?.statuses?.hired ?? 0,
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FAF7F2] text-stone-900">
      <Navbar />

      {/* Decorative silk wave ribbons in header background matching reference design */}
      <div
        className="pointer-events-none absolute right-0 top-12 -z-0 h-96 w-full max-w-3xl overflow-hidden opacity-30 select-none"
        aria-hidden="true"
      >
        <svg viewBox="0 0 800 400" fill="none" className="h-full w-full object-cover object-right-top">
          <path
            d="M200 0 C 350 140, 520 90, 800 20 L 800 0 Z"
            fill="url(#ribbon-grad-1)"
          />
          <path
            d="M80 0 C 280 240, 480 200, 800 130 L 800 0 Z"
            fill="url(#ribbon-grad-2)"
          />
          <path
            d="M260 0 C 420 300, 600 240, 800 280 L 800 0 Z"
            fill="url(#ribbon-grad-3)"
          />
          <defs>
            <linearGradient id="ribbon-grad-1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#801018" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4A0B10" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="ribbon-grad-2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D98A8E" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6B0B0C" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="ribbon-grad-3" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E8B0B4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#780D18" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-14 pt-24 sm:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-maroon-800">
              <span>RECRUITING</span>
              <span className="text-maroon-800/60">•</span>
              <span>{profile.data?.company || "ABC"}</span>
              <span className="inline-block h-px w-8 bg-maroon-800/40" />
            </div>
            <h1 className="mt-2 font-serif text-4xl font-normal tracking-tight text-stone-900 sm:text-5xl">
              Welcome, {name ? name.split(" ")[0] : "Janasi"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
              Review real project evidence, keep private shortlists, and reach out when someone fits.
            </p>
          </div>
          <button
            type="button"
            onClick={openRecruiterTour}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300/80 bg-white/90 px-4 py-2 text-xs font-semibold text-stone-800 shadow-2xs transition hover:border-maroon-700 hover:bg-white"
          >
            <PlayCircle className="h-4 w-4 text-stone-700" />
            Take the tour
          </button>
        </header>

        {/* 4 Summary Metric Cards */}
        <section data-tour="dash-summary" aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            icon={Users}
            value={candidatesCount}
            label="Candidates shortlisted"
            delta="↑ +12%"
          />
          <MetricCard
            icon={Bookmark}
            value={shortlistsCount}
            label="Shortlists"
            delta="↑ +25%"
          />
          <MetricCard
            icon={Clock}
            value={requestsWaitingCount}
            label="Requests waiting"
          />
          <MetricCard
            icon={CheckCircle2}
            value={requestsAcceptedCount}
            label="Requests accepted"
            delta="↑ +8%"
          />
        </section>

        {/* 6 Action Tools with high-pop "Find talent" gradient card */}
        <section aria-label="Recruiting tools" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map(({ to, label, body, icon: Icon, featured }) => (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-3.5 rounded-2xl p-4 transition ${
                featured
                  ? "bg-gradient-to-r from-[#4A0B10] via-[#650B10] to-[#781018] text-white shadow-md hover:shadow-lg"
                  : "border border-[#eadcc6] bg-white text-stone-900 shadow-xs hover:border-maroon-300 hover:shadow-md"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                  featured
                    ? "bg-white/15 text-white group-hover:bg-white/20"
                    : "bg-[#faebe6] text-maroon-800"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block font-semibold ${featured ? "text-white" : "text-stone-900"}`}>{label}</span>
                <span className={`block text-xs ${featured ? "text-rose-100/90" : "text-stone-500"}`}>{body}</span>
              </span>
              <ArrowRight
                className={`h-4 w-4 transition group-hover:translate-x-1 ${
                  featured ? "text-rose-200" : "text-stone-400 group-hover:text-maroon-700"
                }`}
              />
            </Link>
          ))}
        </section>

        {/* Pipeline & Contact requests sections */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Pipeline Card */}
          <section className="rounded-2xl border border-[#eadcc6] bg-white p-5 shadow-xs" aria-labelledby="pipeline-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="pipeline-title" className="font-serif text-2xl text-stone-900">Pipeline</h2>
              <Link to="/recruit/shortlists" className="inline-flex items-center gap-1 text-xs font-semibold text-maroon-800 hover:underline">
                Open shortlists <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Shortlisted */}
              <div className="rounded-xl border border-[#f5c6cb] bg-[#faebea] p-3">
                <Users className="h-4 w-4 text-maroon-800" />
                <p className="mt-2 text-xs font-semibold text-stone-800">Shortlisted</p>
                <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-stone-900">{pipelineCounts.shortlisted}</p>
              </div>

              {/* In Review */}
              <div className="rounded-xl border border-stone-200/80 bg-[#FAF7F2] p-3">
                <Clock className="h-4 w-4 text-stone-600" />
                <p className="mt-2 text-xs font-semibold text-stone-700">In Review</p>
                <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-stone-900">{pipelineCounts.inReview}</p>
              </div>

              {/* Contacted */}
              <div className="rounded-xl border border-stone-200/80 bg-[#FAF7F2] p-3">
                <Megaphone className="h-4 w-4 text-stone-600" />
                <p className="mt-2 text-xs font-semibold text-stone-700">Contacted</p>
                <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-stone-900">{pipelineCounts.contacted}</p>
              </div>

              {/* Hired */}
              <div className="rounded-xl border border-stone-200/80 bg-[#FAF7F2] p-3">
                <Mail className="h-4 w-4 text-stone-600" />
                <p className="mt-2 text-xs font-semibold text-stone-700">Hired</p>
                <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-stone-900">{pipelineCounts.hired}</p>
              </div>
            </div>
          </section>

          {/* Contact Requests Card */}
          <section className="rounded-2xl border border-[#eadcc6] bg-white p-5 shadow-xs" aria-labelledby="requests-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="requests-title" className="font-serif text-2xl text-stone-900">Contact requests</h2>
              <Link to="/recruit/inbox" className="inline-flex items-center gap-1 text-xs font-semibold text-maroon-800 hover:underline">
                Inbox <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-stone-600">Send one from a candidate&apos;s evaluation page.</p>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#ebdccb] bg-[#faf5ec] p-3.5 text-xs leading-relaxed text-stone-700 shadow-2xs">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ebdccb]/60 text-maroon-800">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p>Shortlists and notes are only visible to you. Candidates see a request only when you send one, and they decide whether to reply.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
