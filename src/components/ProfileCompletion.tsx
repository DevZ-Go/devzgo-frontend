import { Link } from "react-router-dom";
import { BadgeCheck, Briefcase, Camera, Check, Link2, MapPin, Plus, Quote, Type, Wrench, type LucideIcon } from "lucide-react";
import type { DeveloperProfile } from "../types/network";

type Step = {
  key: string;
  title: string;
  hint: string;
  icon: LucideIcon;
  done: (p: DeveloperProfile) => boolean;
  to?: string;
};

const STEPS: Step[] = [
  { key: "photo", title: "Photo", hint: "Help people recognise you", icon: Camera, done: (p) => Boolean(p.avatarUrl), to: "/settings?section=account" },
  { key: "role", title: "Role", hint: "Developer, designer, student…", icon: Briefcase, done: (p) => Boolean(p.role) },
  { key: "headline", title: "Headline", hint: "One line about what you build", icon: Type, done: (p) => Boolean(p.headline) },
  { key: "about", title: "About", hint: "A short story about your work", icon: Quote, done: (p) => Boolean(p.bio) },
  { key: "skills", title: "Skills", hint: "Tools and languages you use", icon: Wrench, done: (p) => Boolean(p.skills) },
  { key: "location", title: "Location", hint: "City or time zone you work from", icon: MapPin, done: (p) => Boolean(p.location) },
  { key: "links", title: "Links", hint: "GitHub, LinkedIn, or a website", icon: Link2, done: (p) => Boolean(p.githubUrl || p.linkedinUrl || p.websiteUrl) },
];

const addClass =
  "inline-flex shrink-0 items-center gap-1 rounded-lg border border-maroon-800/30 bg-white px-2.5 py-1 text-xs font-semibold text-maroon-800 transition hover:border-maroon-800 hover:bg-maroon-800 hover:text-amber-50";

/** Checklist on your own profile; collapses to one line once every step is done. */
export function ProfileCompletion({ profile, onEdit }: { profile: DeveloperProfile; onEdit: () => void }) {
  const done = STEPS.filter((step) => step.done(profile)).length;
  const percent = Math.round((done / STEPS.length) * 100);

  if (done === STEPS.length) {
    return (
      <p className="mb-8 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm text-stone-700 shadow-sm">
        <BadgeCheck className="h-5 w-5 text-maroon-800" />
        <span className="font-semibold text-stone-900">Profile complete</span>
        <span className="text-stone-500">Everything people look for is filled in.</span>
      </p>
    );
  }

  const ordered = [...STEPS].sort((a, b) => Number(a.done(profile)) - Number(b.done(profile)));

  return (
    <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="profile-completion">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="profile-completion" className="font-serif text-2xl text-stone-900">Complete your profile</h2>
          <p className="mt-1 text-sm text-stone-600">A full profile helps people understand your work before they connect or invite you.</p>
        </div>
        <div className="w-full sm:w-56">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-semibold text-stone-700">{done} of {STEPS.length} done</span>
            <span className="font-mono text-stone-500">{percent}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
            <div className="h-full rounded-full bg-maroon-800 transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((step) => {
          const ready = step.done(profile);
          const Icon = step.icon;
          return (
            <li key={step.key}
              className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition ${ready ? "border-stone-100 bg-stone-50/60 opacity-60" : "border-stone-200 bg-[#f7f5ed]"}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ready ? "bg-stone-200 text-stone-500" : "bg-white text-maroon-800 ring-1 ring-stone-200"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-stone-900">{step.title}</span>
                <span className="block truncate text-xs text-stone-500">{step.hint}</span>
              </span>
              {ready ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-amber-50" aria-label="Done">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : step.to ? (
                <Link to={step.to} className={addClass}><Plus className="h-3.5 w-3.5" />Add</Link>
              ) : (
                <button type="button" onClick={onEdit} className={addClass}><Plus className="h-3.5 w-3.5" />Add</button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
