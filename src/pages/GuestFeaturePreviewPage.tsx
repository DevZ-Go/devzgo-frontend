import { Link, Navigate, useParams } from "react-router-dom";
import {
  Film,
  FolderPlus,
  Heart,
  MessageSquare,
  Radio,
  Sparkles,
  Tv,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Navbar } from "../components/Navbar";
import { GuestPreviewBanner } from "../components/GuestPreviewBanner";

type FeatureKey = "reels" | "tv" | "network" | "create" | "messages" | "profile";

const KEYS: FeatureKey[] = ["reels", "tv", "network", "create", "messages", "profile"];

function PreviewShell({
  children,
  banner,
}: {
  children: React.ReactNode;
  banner: string;
}) {
  return (
    <div className="min-h-screen bg-[#FFF8CA] text-[#2D120D]">
      <Navbar />
      <div className="pt-14 sm:pt-16">
        <GuestPreviewBanner message={banner} />
      </div>
      {children}
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 px-4 pb-16 pt-8">
        <Link
          to="/register"
          className="inline-flex min-h-11 items-center rounded-full bg-[#6B0B0C] px-6 text-sm font-bold text-[#FFF8CA] hover:bg-[#8B1A1E]"
        >
          Create free account
        </Link>
        <Link
          to="/explore"
          className="inline-flex min-h-11 items-center rounded-full border border-[#DECDBA] bg-white px-6 text-sm font-semibold text-[#2D120D] hover:bg-[#FAF7F2]"
        >
          Keep browsing projects
        </Link>
      </div>
    </div>
  );
}

function ReelsScene() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-4 pt-8 sm:px-6">
      <div
        data-tour="guest-reels"
        className="relative overflow-hidden rounded-[2rem] border border-[#2D120D]/15 bg-[#120507] shadow-[0_24px_60px_rgba(45,18,13,0.35)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,13,24,0.55),transparent_55%),linear-gradient(160deg,#1a0b0e_0%,#120507_55%,#2d120d_100%)]" />
        <div className="relative grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[420px] sm:min-h-[520px]">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=1600&fit=crop')] bg-cover bg-center opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120507] via-[#120507]/35 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#120507]/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-16 p-6 sm:p-8">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFF3B0]">
                — Student showcase · Reels
              </p>
              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#FAF7F2] sm:text-4xl">
                Scroll projects like stories
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#FAF7F2]/85">
                Full-bleed covers, tech chips, and a quiet action rail — discover builds one snap at a time.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["React", "FastAPI", "PostgreSQL"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-[#FFF3B0] backdrop-blur-md"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="absolute bottom-8 right-5 flex flex-col items-center gap-4 text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 backdrop-blur-md">
                <Heart className="h-5 w-5" />
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 backdrop-blur-md">
                <MessageSquare className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-[#FFF3B0]">1 / 12</span>
            </div>
          </div>
          <div className="relative flex flex-col justify-center gap-5 border-t border-white/10 p-6 text-[#FFF8CA] sm:p-8 lg:border-l lg:border-t-0">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Film className="h-6 w-6 text-[#fced96]" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-bold">Explore · Reels</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#FFF8CA]/8">
                Members switch Directory ↔ Reels in Explore. Guests can open the live Reels gallery next in the tour — likes stay locked until sign-in.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-[#FFF8CA]/9">
              {[
                "Snap-scroll through public project covers",
                "Read title, blurb, and tech at a glance",
                "Open any build to read the full project page",
              ].map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#fced96]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

function TvScene() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-4 pt-8 sm:px-6">
      <div
        data-tour="guest-tv"
        className="relative overflow-hidden rounded-[2rem] border border-[#2D120D]/12 bg-[#1A1410] shadow-[0_24px_60px_rgba(45,18,13,0.28)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(252,237,150,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(107,11,12,0.35),transparent_45%),linear-gradient(145deg,#2a1c16,#120c0a_60%,#1a0b0e)]" />
        <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-[1.75rem] border-[10px] border-[#2a211c] bg-black p-3 shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#0d0a08]">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=800&fit=crop')] bg-cover bg-center opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#fced96] backdrop-blur-md">
                  Channel · Projects
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-serif text-xl font-bold text-white sm:text-2xl">Campus Build Night</p>
                  <p className="mt-1 text-xs text-white/75">Live on the TV World stage after you sign in</p>
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay [background:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.15)_3px)]" />
              </div>
            </div>
            <div className="mx-auto mt-3 h-3 w-24 rounded-full bg-[#3a2c24]" />
            <div className="mx-auto mt-1 h-8 w-40 rounded-b-2xl bg-[#2a211c]" />
          </div>
          <div className="text-[#FFF8CA]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Tv className="h-6 w-6 text-[#fced96]" />
            </span>
            <h1 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">TV World</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#FFF8CA]/82 sm:text-base">
              A playful living-room stage for projects — flip channels, browse builds on the CRT, and wander the room. Pure atmosphere, still read-only until you join.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Retro room with a working project TV",
                "Flip between featured student builds",
                "Same projects as Explore — different vibe",
              ].map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#fced96]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

function NetworkScene() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-4 pt-8 sm:px-6">
      <div className="mb-5 max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B0B0C]">After sign-in · Home</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-[#2D120D] sm:text-4xl">Network</h1>
        <p className="mt-2 text-sm text-[#2D120D]/7">
          Your signed-in home: feed, clubs, and people to connect with — previewed below (demo only).
        </p>
      </div>

      <div
        data-tour="guest-network"
        className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_260px]"
      >
        <aside className="rounded-3xl border border-[#DECDBA] bg-[#FAF6EC] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B0B0C]">Places</p>
          <ul className="mt-3 space-y-1.5 text-sm font-semibold text-[#2D120D]">
            {["Feed", "Clubs", "Connections", "Messages"].map((item, i) => (
              <li
                key={item}
                className={`rounded-2xl px-3 py-2 ${i === 0 ? "bg-[#2D120D] text-[#FFF8CA]" : "hover:bg-white/70"}`}
              >
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <section
          data-tour="guest-network-feed"
          className="space-y-3 rounded-3xl border border-[#DECDBA] bg-[#FAF6EC] p-4 shadow-sm sm:p-5"
        >
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#6B0B0C]" />
            <h2 className="font-serif text-xl font-bold">Community feed</h2>
          </div>
          <div className="rounded-2xl border border-dashed border-[#DECDBA] bg-white/70 px-4 py-3 text-sm text-[#2D120D]/65">
            Share an update, a project win, or a club note…
          </div>
          {[
            { who: "Maya Chen", what: "Shipped a React Native campus map", tag: "Project" },
            { who: "Dev Club", what: "Hack night Friday · bring a laptop", tag: "Club" },
            { who: "Jordan Lee", what: "Looking for a FastAPI teammate", tag: "Ask" },
          ].map((post) => (
            <article key={post.what} className="rounded-2xl border border-[#DECDBA]/80 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#2D120D]">{post.who}</p>
                <span className="rounded-full bg-[#FFF8CA] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6B0B0C]">
                  {post.tag}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#2D120D]/75">{post.what}</p>
              <div className="mt-3 flex gap-3 text-[11px] font-semibold text-[#2D120D]/45">
                <span>Like</span>
                <span>Comment</span>
                <span>Share</span>
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-4">
          <section
            data-tour="guest-network-connections"
            className="rounded-3xl border border-[#DECDBA] bg-[#FAF6EC] p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#6B0B0C]" />
              <h2 className="font-serif text-lg font-bold">Suggested connections</h2>
            </div>
            <ul className="mt-3 space-y-2.5">
              {["Aisha Patel · Full-stack", "Chris Ng · UI/UX", "Sam Ortiz · Data"].map((name) => (
                <li key={name} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2.5 text-xs">
                  <span className="font-semibold text-[#2D120D]">{name}</span>
                  <span className="rounded-full border border-[#2D120D]/15 px-2 py-1 font-bold text-[#6B0B0C]">
                    Connect
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section
            data-tour="guest-network-clubs"
            className="rounded-3xl border border-[#DECDBA] bg-[#FAF6EC] p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#6B0B0C]" />
              <h2 className="font-serif text-lg font-bold">Communities & clubs</h2>
            </div>
            <ul className="mt-3 space-y-2.5">
              {["Sheridan Dev Society", "Women in Tech", "Game Jam Crew"].map((club) => (
                <li key={club} className="rounded-2xl bg-white px-3 py-2.5 text-xs font-semibold text-[#2D120D]">
                  {club}
                  <span className="mt-1 block text-[10px] font-medium text-[#2D120D]/5">Join after sign-in</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}

function SimpleScene({
  tour,
  title,
  body,
  bullets,
  icon: Icon,
  accent,
}: {
  tour: string;
  title: string;
  body: string;
  bullets: string[];
  icon: typeof Users;
  accent: string;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-4 pt-10 sm:px-6">
      <div
        data-tour={tour}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${accent} p-8 text-[#FFF8CA] shadow-xl sm:p-10`}
      >
        <Sparkles className="absolute right-6 top-6 h-8 w-8 text-[#fced96]/70" aria-hidden />
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
          <Icon className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#FFF8CA]/85 sm:text-base">{body}</p>
        <ul className="mt-6 space-y-2 text-sm text-[#FFF8CA]/9">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#fced96]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

/** Visual, non-interactive previews so guests can tour features that require an account. */
export function GuestFeaturePreviewPage() {
  const { isAuthenticated, isReady } = useAuth();
  const { feature = "network" } = useParams<{ feature: string }>();
  const key = (KEYS.includes(feature as FeatureKey) ? feature : "network") as FeatureKey;

  if (isReady && isAuthenticated) {
    const dest =
      key === "create"
        ? "/add-project"
        : key === "messages"
          ? "/messages"
          : key === "profile"
            ? "/profile"
            : key === "reels" || key === "tv"
              ? "/explore"
              : "/network";
    return <Navigate to={dest} replace />;
  }

  if (key === "reels") {
    return (
      <PreviewShell banner="Demo · Reels gallery style. Open live Explore Reels on the next tour stop — likes stay locked.">
        <ReelsScene />
      </PreviewShell>
    );
  }

  if (key === "tv") {
    return (
      <PreviewShell banner="Demo · TV World is a signed-in playground. This stop shows the vibe without live interaction.">
        <TvScene />
      </PreviewShell>
    );
  }

  if (key === "network") {
    return (
      <PreviewShell banner="Demo · Network sections below are illustrative. Sign in for your real feed, clubs, and connections.">
        <NetworkScene />
      </PreviewShell>
    );
  }

  if (key === "create") {
    return (
      <PreviewShell banner="Demo stop — publishing unlocks after you create an account.">
        <SimpleScene
          tour="guest-create"
          title="Share a project"
          body="Upload a ZIP, add a cover image, and publish. Public projects appear in Explore for recruiters and peers."
          bullets={[
            "Detect tech stacks from your codebase",
            "Optional AI help for your project story",
            "Workspace files stay with the project page",
          ]}
          icon={FolderPlus}
          accent="from-[#8B1A1E] to-[#4A121A]"
        />
      </PreviewShell>
    );
  }

  if (key === "messages") {
    return (
      <PreviewShell banner="Demo stop — messaging unlocks after you create an account.">
        <SimpleScene
          tour="guest-messages"
          title="Messages"
          body="Chat one-on-one or in groups once you connect. Mute, restrict, or block anyone from a conversation."
          bullets={[
            "Direct messages after a connection",
            "Group chats for clubs and teams",
            "Safety controls in Settings",
          ]}
          icon={MessageSquare}
          accent="from-[#284E45] to-[#1A2D23]"
        />
      </PreviewShell>
    );
  }

  return (
    <PreviewShell banner="Demo stop — profiles unlock after you create an account.">
      <SimpleScene
        tour="guest-profile"
        title="Your profile"
        body="Show skills, photo, projects, and career highlights. Recruiters and classmates see what you choose to share."
        bullets={[
          "Portfolio of your public projects",
          "Skills and headline that match your work",
          "Monthly Wrap for your build story",
        ]}
        icon={UserRound}
        accent="from-[#6B0B0C] to-[#3D1812]"
      />
    </PreviewShell>
  );
}
