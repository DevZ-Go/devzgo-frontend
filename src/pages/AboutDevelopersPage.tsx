import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Check, Plus, Trash2, UserPlus } from "lucide-react";
import { Navbar } from "../components/Navbar";

export interface TeamDeveloper {
  id: string;
  name: string;
  role: string;
  tagline: string;
  profileId: string; // DevZ-Go profile username or user ID (e.g. "janasi", "usr-janasi")
  githubUrl?: string;
}

/**
 * Default team list — connect over DevZ-Go platform
 * Admins / developer profile IDs can be customized in code or via "Customize Team Profiles"
 */
const DEFAULT_DEVELOPERS: TeamDeveloper[] = [
  {
    id: "dev-1",
    name: "Janasi Rajput",
    role: "Full-Stack & UI Architecture",
    tagline: "Crafting warm editorial interfaces, interactive experiences, and community flows.",
    profileId: "usr-janasi",
  },
  {
    id: "dev-2",
    name: "Chan S.",
    role: "Backend & Cloud Infrastructure",
    tagline: "Building FastAPI services, database migrations, and real-time systems.",
    profileId: "usr-chan",
  },
  {
    id: "dev-3",
    name: "Khushbu Patel",
    role: "Full-Stack Developer",
    tagline: "Designing workspace tools, project analysis, and developer portfolios.",
    profileId: "usr-khushbu",
  },
  {
    id: "dev-4",
    name: "Manasi Sharma",
    role: "Full-Stack Developer",
    tagline: "Connecting talent intelligence, assessments, and collaborative features.",
    profileId: "usr-manasi",
  },
];

const STORAGE_KEY = "devzgo_team_profiles_v2";

function loadDevelopers(): TeamDeveloper[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DEVELOPERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((d: Record<string, unknown>, idx: number) => ({
        id: (d.id as string) || `dev-${idx + 1}`,
        name: (d.name as string) || `Developer 0${idx + 1}`,
        role: (d.role as string) || "Full-Stack Developer",
        tagline: (d.tagline as string) || "Building on DevZ-Go.",
        profileId: (d.profileId as string) || (d.username as string) || DEFAULT_DEVELOPERS[idx]?.profileId || "usr-janasi",
        githubUrl: (d.githubUrl as string) || undefined,
      }));
    }
    return DEFAULT_DEVELOPERS;
  } catch {
    return DEFAULT_DEVELOPERS;
  }
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
        profileId: `usr-dev-${developers.length + 1}`,
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
                  Customize Team Profiles
                </>
              )}
            </button>
          </div>

          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#CBE4EE] border border-[#284E45]/30 text-[#284E45] font-mono text-[10px] font-bold uppercase tracking-[0.22em] mb-3">
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
              DevZ-Go platform directly on DevZ-Go.
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
                {/* Top Number & DevZ-Go Badge */}
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
                    <span className="p-1.5 rounded-full bg-[#CDE3E8] text-[#2D120D] shadow-xs" title="DevZ-Go Profile">
                      <img src="/brand/logo.png" alt="" className="w-4 h-4 rounded-full object-cover" />
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
                        DevZ-Go Profile ID or Username
                      </label>
                      <input
                        type="text"
                        value={dev.profileId}
                        onChange={(e) => updateField(dev.id, "profileId", e.target.value)}
                        placeholder="e.g. janasi, usr-janasi, or user ID"
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

              {/* DevZ-Go Connect CTA Button */}
              <div className="mt-6 pt-4 border-t border-[#2D120D]/10">
                <Link
                  to={dev.profileId ? `/profile/${dev.profileId}` : "/explore/developers"}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#2D120D] hover:bg-[#6B0B0C] text-[#FFF8CA] font-sans text-xs font-semibold tracking-wide transition-colors shadow-xs"
                >
                  <UserPlus className="w-4 h-4 text-[#CDE3E8]" />
                  <span>Connect on DevZ-Go</span>
                </Link>
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
