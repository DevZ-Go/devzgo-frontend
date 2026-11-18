import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Pencil, Check, Plus, Trash2, Sparkles } from "lucide-react";
import { Navbar } from "../components/Navbar";

export interface TeamDeveloper {
  id: string;
  name: string;
  role: string;
  tagline: string;
  linkedinUrl: string;
  githubUrl?: string;
}

/**
 * Default team list — you can edit LinkedIn URLs directly here in code
 * OR click "Customize LinkedIn Links" right on the page!
 */
const DEFAULT_DEVELOPERS: TeamDeveloper[] = [
  {
    id: "dev-1",
    name: "Developer 01",
    role: "Full-Stack & UI Architecture",
    tagline: "Crafting warm editorial interfaces, interactive experiences, and community flows.",
    linkedinUrl: "https://www.linkedin.com/",
  },
  {
    id: "dev-2",
    name: "Developer 02",
    role: "Backend & Cloud Infrastructure",
    tagline: "Building FastAPI services, database migrations, and real-time systems.",
    linkedinUrl: "https://www.linkedin.com/",
  },
  {
    id: "dev-3",
    name: "Developer 03",
    role: "Full-Stack Developer",
    tagline: "Designing workspace tools, project analysis, and developer portfolios.",
    linkedinUrl: "https://www.linkedin.com/",
  },
  {
    id: "dev-4",
    name: "Developer 04",
    role: "Full-Stack Developer",
    tagline: "Connecting talent intelligence, assessments, and collaborative features.",
    linkedinUrl: "https://www.linkedin.com/",
  },
];

const STORAGE_KEY = "devzgo_team_linkedin_v1";

function loadDevelopers(): TeamDeveloper[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DEVELOPERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DEVELOPERS;
  } catch {
    return DEFAULT_DEVELOPERS;
  }
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export function AboutDevelopersPage() {
  const [developers, setDevelopers] = useState<TeamDeveloper[]>(loadDevelopers);
  const [editing, setEditing] = useState(false);

  function saveList(next: TeamDeveloper[]) {
    setDevelopers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function updateField(id: string, field: keyof TeamDeveloper, value: string) {
    saveList(developers.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function addDeveloper() {
    const nextId = `dev-${Date.now()}`;
    saveList([
      ...developers,
      {
        id: nextId,
        name: `Developer 0${developers.length + 1}`,
        role: "Full-Stack Developer",
        tagline: "Building tools and experiences on DevZ-Go.",
        linkedinUrl: "https://www.linkedin.com/in/",
      },
    ]);
  }

  function removeDeveloper(id: string) {
    if (developers.length <= 1) return;
    saveList(developers.filter((d) => d.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#FFF8CA] text-[#2D120D] font-sans antialiased">
      <Navbar />

      {/* Hero Header in Mint Stripes, Powder Blue & Forest Teal */}
      <section className="relative pt-24 pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden pattern-mint-stripes border-b-2 border-[#284E45]/20">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link
              to="/home"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#284E45] hover:bg-[#3E2217] text-[#FAF6EC] text-xs font-semibold uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>

            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#CBE4EE] hover:bg-[#284E45] text-[#284E45] hover:text-[#FAF6EC] border border-[#284E45]/30 text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              {editing ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Done Editing
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  Customize LinkedIn Links
                </>
              )}
            </button>
          </div>

          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#CBE4EE] border border-[#284E45]/30 text-[#284E45] font-mono text-[10px] font-bold uppercase tracking-[0.22em] mb-3">
              <Sparkles className="w-3 h-3" />
              MEET THE BUILDERS
            </span>
            <h1 className="font-cake text-5xl sm:text-6xl md:text-7xl font-bold uppercase text-[#3E2217] tracking-tight leading-none">
              ABOUT DEVELOPERS
            </h1>
            <p className="font-cursive text-2xl sm:text-3xl text-[#284E45] mt-1">
              The team behind DevZ-Go
            </p>
            <p className="font-sans text-sm sm:text-base text-[#3E2217]/80 mt-3 leading-relaxed">
              Connect with the developers who designed, engineered, and built the
              DevZ-Go platform on LinkedIn.
            </p>
          </div>
        </div>
      </section>

      {/* Checkered Gingham Trim */}
      <div className="w-full overflow-hidden">
        <div
          className="w-full h-4"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #284E45 0px, #284E45 48px, #CBE4EE 48px, #CBE4EE 96px, #FFF8CA 96px, #FFF8CA 144px)",
          }}
        />
      </div>

      {/* Developers Grid */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {developers.map((dev, idx) => (
            <div
              key={dev.id}
              className="group relative flex flex-col justify-between rounded-3xl bg-[#FFFDF0] border-2 border-[#2D120D]/20 hover:border-[#6B0B0C] p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div>
                {/* Top Number & LinkedIn Badge */}
                <div className="flex items-center justify-between gap-2 mb-5">
                  <span className="px-3 py-1 rounded-full bg-[#2D120D] text-[#FFF8CA] font-mono text-[10px] font-bold tracking-widest uppercase">
                    0{idx + 1} · BUILDER
                  </span>
                  {editing && developers.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeDeveloper(dev.id)}
                      className="p-1.5 rounded-full text-[#6B0B0C] hover:bg-[#6B0B0C]/10 transition"
                      title="Remove card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="p-2 rounded-full bg-[#CDE3E8] text-[#2D120D]">
                      <LinkedInIcon className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {/* Avatar Initials Circle */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6B0B0C] to-[#2D120D] text-[#FFF8CA] font-cake text-2xl font-bold flex items-center justify-center mb-4 shadow-sm border border-[#CDE3E8]/40">
                  {dev.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                {editing ? (
                  <div className="space-y-2.5 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B0B0C] mb-0.5">
                        Name
                      </label>
                      <input
                        type="text"
                        value={dev.name}
                        onChange={(e) => updateField(dev.id, "name", e.target.value)}
                        className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-1.5 text-sm font-semibold text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B0B0C] mb-0.5">
                        Role
                      </label>
                      <input
                        type="text"
                        value={dev.role}
                        onChange={(e) => updateField(dev.id, "role", e.target.value)}
                        className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-1.5 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B0B0C] mb-0.5">
                        Bio / Tagline
                      </label>
                      <textarea
                        rows={2}
                        value={dev.tagline}
                        onChange={(e) => updateField(dev.id, "tagline", e.target.value)}
                        className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-1.5 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B0B0C] mb-0.5">
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        value={dev.linkedinUrl}
                        onChange={(e) => updateField(dev.id, "linkedinUrl", e.target.value)}
                        placeholder="https://www.linkedin.com/in/your-profile"
                        className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-1.5 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-gift text-2xl font-bold text-[#2D120D] leading-tight">
                      {dev.name}
                    </h2>
                    <p className="font-sans text-xs font-semibold text-[#6B0B0C] mt-1">
                      {dev.role}
                    </p>
                    <p className="font-sans text-xs text-[#2D120D]/75 mt-2.5 leading-relaxed">
                      {dev.tagline}
                    </p>
                  </>
                )}
              </div>

              {/* LinkedIn CTA Button */}
              <div className="mt-6 pt-4 border-t border-[#2D120D]/10">
                <a
                  href={dev.linkedinUrl || "https://www.linkedin.com/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#2D120D] hover:bg-[#6B0B0C] text-[#FFF8CA] font-sans text-xs font-semibold tracking-wide transition-colors shadow-xs"
                >
                  <LinkedInIcon className="w-4 h-4 text-[#CDE3E8]" />
                  <span>Connect on LinkedIn</span>
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={addDeveloper}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2D120D] hover:bg-[#6B0B0C] text-[#FFF8CA] font-sans text-xs font-semibold uppercase tracking-wider shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#CDE3E8]" />
              Add Another Developer
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
