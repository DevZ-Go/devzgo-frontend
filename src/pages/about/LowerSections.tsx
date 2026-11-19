import { useState } from "react";
import { Link } from "react-router-dom";
import { Code2, LayoutTemplate, MessagesSquare, Server } from "lucide-react";

const DESKS = [
  {
    id: "engineering",
    title: "Engineering",
    icon: Code2,
    body: "A project can be written here or imported from GitHub. Opening it leads to that project's code workspace.",
    links: [
      { to: "/add-project", label: "Add a project" },
      { to: "/import/github", label: "Import from GitHub" },
      { to: "/explore", label: "Browse projects" },
    ],
  },
  {
    id: "interfaces",
    title: "Interfaces",
    icon: LayoutTemplate,
    body: "Profiles hold a developer's own work. Explore and the catalog are where that work is found.",
    links: [
      { to: "/profile", label: "Profiles" },
      { to: "/explore", label: "Explore" },
      { to: "/explore/catalog", label: "Catalog" },
    ],
  },
  {
    id: "community",
    title: "Community",
    icon: MessagesSquare,
    body: "The network is the feed and the connections. Messages are a separate conversation with someone on DevZ-Go.",
    links: [
      { to: "/network", label: "Network" },
      { to: "/messages", label: "Messages" },
      { to: "/network/connections", label: "Connections" },
    ],
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    icon: Server,
    body: "Accounts and projects are stored in the database. Uploaded photos and project files are kept in file storage, and the site is served apart from the API.",
    links: [],
  },
] as const;

export function BuilderDesk() {
  const [open, setOpen] = useState<string>(DESKS[0].id);
  const active = DESKS.find((item) => item.id === open) ?? DESKS[0];

  return (
    <section className="mt-16" aria-labelledby="desk-heading">
      <h2 id="desk-heading" className="font-serif text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">
        What&apos;s on our desks?
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
        Four parts of the platform. None of them belongs to only one person.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DESKS.map((item) => {
          const Icon = item.icon;
          const selected = item.id === active.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`desk-tab-${item.id}`}
              aria-pressed={selected}
              aria-controls="desk-panel"
              onClick={() => setOpen(item.id)}
              className={`flex min-h-11 items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                selected ? "bg-maroon-800 text-amber-50" : "bg-white text-stone-800 ring-1 ring-stone-200 hover:ring-maroon-800"
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-800`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.title}
            </button>
          );
        })}
      </div>
      <div
        id="desk-panel"
        role="region"
        aria-labelledby={`desk-tab-${active.id}`}
        className="mt-3 rounded-2xl bg-white p-5 ring-1 ring-stone-200"
      >
        <h3 className="font-serif text-2xl font-normal text-stone-900">{active.title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-700">{active.body}</p>
        {active.links.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {active.links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="inline-flex min-h-11 items-center rounded-full border border-stone-200 px-3 text-xs font-semibold text-maroon-800 hover:border-maroon-800"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const STORY = [
  {
    title: "A Sheridan College capstone",
    body: "DevZ-Go began as a capstone project: a platform for developers to show real work, collaborate, and connect.",
  },
  {
    title: "Profiles and projects",
    body: "A developer profile and a project page are in the product, along with Explore for finding that work.",
  },
  {
    title: "Working with other people",
    body: "Messages, the network, GitHub import, and a workspace on each project are part of the app.",
  },
];

export function StorySection() {
  return (
    <section className="mt-16" aria-labelledby="story-heading">
      <h2 id="story-heading" className="font-serif text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">
        From capstone to community.
      </h2>
      <ol className="mt-6 space-y-6 border-l border-stone-300 pl-6">
        {STORY.map((step) => (
          <li key={step.title} className="relative">
            <span className="absolute -left-[1.7rem] top-1.5 h-3 w-3 rounded-full bg-[#fced96] ring-4 ring-[#f8f6f0]" aria-hidden />
            <h3 className="font-serif text-xl font-normal text-stone-900">{step.title}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const BUILT = [
  { title: "Profiles and portfolios", body: "A profile collects the work a developer chooses to show.", to: "/profile", label: "Open profiles" },
  { title: "Project showcase", body: "Explore is the gallery of projects on DevZ-Go.", to: "/explore", label: "Explore projects" },
  { title: "GitHub import", body: "A repository can be brought in as a project.", to: "/import/github", label: "Import from GitHub" },
  { title: "Code workspace", body: "The workspace opens from inside a project, not as its own page.", to: "/explore", label: "Browse projects" },
  { title: "Messages", body: "A direct conversation with someone on DevZ-Go.", to: "/messages", label: "Open messages" },
  { title: "Network", body: "The feed, posts, and connections.", to: "/network", label: "Open the network" },
  { title: "Assessments", body: "Challenges a developer can take.", to: "/assessments", label: "View assessments" },
  { title: "Recruiter tools", body: "A separate area for recruiting, shortlists, and matching.", to: "/recruit", label: "Recruiter home" },
];

export function BuiltSection() {
  return (
    <section className="mt-16" aria-labelledby="built-heading">
      <h2 id="built-heading" className="font-serif text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">
        What we built
      </h2>
      <p className="mt-2 max-w-xl text-sm text-stone-600">Each of these is a page in the app today.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {BUILT.map((item) => (
          <li key={item.title}>
            <Link
              to={item.to}
              className="flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-stone-200 motion-safe:transition motion-safe:hover:-translate-y-0.5 hover:ring-maroon-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-800"
            >
              <h3 className="font-serif text-2xl font-normal text-stone-900">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{item.body}</p>
              <span className="mt-4 text-xs font-semibold text-maroon-800">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ClosingSection() {
  return (
    <section className="mt-16 bg-maroon-800 px-5 pb-28 pt-14 text-[#f8f6f0] sm:px-8 lg:pb-14" aria-labelledby="close-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="close-heading" className="font-serif text-3xl font-normal tracking-tight sm:text-5xl">
          Different strengths. One DevZ-Go.
        </h2>
        <p className="mt-3 text-sm text-[#fced96] sm:text-base">Built by developers, for developers.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/explore"
            className="inline-flex min-h-11 items-center rounded-xl bg-[#fced96] px-5 text-sm font-semibold text-stone-900 hover:bg-[#fae77c]"
          >
            Explore Projects
          </Link>
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center rounded-xl border border-[#f8f6f0]/40 px-5 text-sm font-semibold text-[#f8f6f0] hover:bg-white/10"
          >
            Join the Community
          </Link>
        </div>
      </div>
    </section>
  );
}
