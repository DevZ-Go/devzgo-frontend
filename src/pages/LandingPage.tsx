import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  Tv,
  Layers,
  ChevronDown,
  ExternalLink,
  Star,
  Users,
  Code2,
  Compass,
  FolderPlus,
  Flame,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import pixelCatBackground from "../assets/pixelcat-ezgif.com-gif-to-mp4-converter.mp4";
import { fetchProjects } from "../api";
import type { ApiProject } from "../types/project";
import { toTvProject } from "../components/tvworld/worldLayout";

/* ─────────────────────────────────────────────────────────────
   DECORATIVE ASSETS & ACCENTS
───────────────────────────────────────────────────────────── */

// Floating vintage / editorial stamp badges
function EditorialStamps() {
  return (
    <div className="hidden lg:flex flex-col gap-4 absolute right-8 top-28 z-20 pointer-events-none select-none">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.9, x: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        className="w-16 h-16 rounded-full border-2 border-stone-400/60 flex flex-col items-center justify-center text-center p-1 bg-white/20 backdrop-blur-xs text-stone-200 shadow-sm"
      >
        <span className="text-[7px] font-bold tracking-widest uppercase">THE DEVZ</span>
        <span className="font-serif font-bold text-sm leading-none my-0.5 text-amber-200">D</span>
        <span className="text-[6px] tracking-wider uppercase">STANDARD</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.9, x: 0 }}
        transition={{ delay: 0.4 }}
        className="w-16 h-16 rounded-lg border border-stone-400/60 flex flex-col items-center justify-center text-center p-1.5 bg-white/20 backdrop-blur-xs text-stone-200 shadow-sm"
      >
        <span className="text-[9px] font-bold tracking-tight text-emerald-300">100%</span>
        <span className="text-[7px] font-semibold tracking-wider uppercase leading-tight">
          STUDENT
          <br />
          CRAFTED
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.9, x: 0 }}
        transition={{ delay: 0.5 }}
        className="w-16 h-16 rounded-full border border-amber-500/50 flex flex-col items-center justify-center text-center p-1 bg-amber-500/10 backdrop-blur-xs text-amber-200 shadow-sm"
      >
        <span className="text-[6px] font-bold tracking-widest uppercase">VERIFIED</span>
        <span className="font-serif text-[10px] font-bold leading-tight my-0.5">SOURCE</span>
        <span className="text-[6px] tracking-wider uppercase">COMMUNITY</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.9, x: 0 }}
        transition={{ delay: 0.6 }}
        className="w-16 h-12 rounded border border-emerald-500/40 flex flex-col items-center justify-center text-center p-1 bg-emerald-950/40 backdrop-blur-xs text-emerald-300 shadow-sm"
      >
        <span className="font-serif text-[8px] italic leading-tight">open source</span>
        <span className="text-[6px] tracking-widest uppercase text-emerald-200">IN THE WILD</span>
      </motion.div>
    </div>
  );
}

// Decorative washi tape for cards
function WashiTape({ color = "#889b8d" }: { color?: string }) {
  return (
    <div
      className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 z-20 shadow-xs rotate-[-3deg] pointer-events-none opacity-85"
      style={{
        backgroundColor: color,
        backgroundImage: `
          repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.25) 0, rgba(255, 255, 255, 0.25) 4px, transparent 0, transparent 8px),
          repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.12) 0, rgba(0, 0, 0, 0.12) 4px, transparent 0, transparent 8px)
        `,
      }}
    />
  );
}

// Fallback curated student projects
const CURATED_PROJECTS = [
  {
    id: "curated-1",
    title: "NeuroPulse AI",
    description: "Brainwave visualizer & focus telemetry for student developers.",
    techStack: ["React", "TypeScript", "WebAudio", "PyTorch"],
    author: { username: "sarah_k", avatar: "👩‍💻" },
    likesCount: 342,
    category: "AI & ML",
  },
  {
    id: "curated-2",
    title: "VoxelForge Engine",
    description: "Real-time web voxel game engine running in WebGL with zero dependencies.",
    techStack: ["TypeScript", "WebGL", "Rust", "WASM"],
    author: { username: "dev_alex", avatar: "🎮" },
    likesCount: 512,
    category: "Games & Graphics",
  },
  {
    id: "curated-3",
    title: "HyperSync DB",
    description: "Local-first distributed state synchronization for collaborative apps.",
    techStack: ["Go", "CRDT", "WebSockets", "React"],
    author: { username: "marcus_t", avatar: "⚡" },
    likesCount: 289,
    category: "Systems & Tools",
  },
  {
    id: "curated-4",
    title: "RetroSound DAW",
    description: "8-bit chiptune synthesizer and tracker built in the browser.",
    techStack: ["Vue", "WebAudio", "TailwindCSS"],
    author: { username: "chloe_pixel", avatar: "🎵" },
    likesCount: 421,
    category: "Creative",
  },
  {
    id: "curated-5",
    title: "OrbitLang Compiler",
    description: "Toy programming language compiling down to readable JavaScript AST.",
    techStack: ["Rust", "LLVM", "Parser"],
    author: { username: "yuki_san", avatar: "🦀" },
    likesCount: 680,
    category: "Systems & Tools",
  },
  {
    id: "curated-6",
    title: "CampusFlow App",
    description: "Peer-to-peer textbook and project hardware marketplace for university students.",
    techStack: ["Next.js", "PostgreSQL", "Prisma"],
    author: { username: "jordan_w", avatar: "📚" },
    likesCount: 195,
    category: "Web Apps",
  },
];

/* ─────────────────────────────────────────────────────────────
   LANDING PAGE COMPONENT (INFINITE CONTINUOUS REALM)
───────────────────────────────────────────────────────────── */

export function LandingPage() {
  const [projects, setProjects] = useState<any[]>(CURATED_PROJECTS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Load real projects if available
  useEffect(() => {
    fetchProjects()
      .then((apiList) => {
        if (apiList && apiList.length > 0) {
          const mapped = apiList.map((p: ApiProject, idx: number) => {
            const tv = toTvProject(p, idx);
            return {
              id: tv.id,
              title: tv.title,
              description: tv.shortDescription || "Student crafted software build.",
              techStack: tv.techStack.length > 0 ? tv.techStack : ["React", "TypeScript"],
              author: {
                username: tv.author || `builder_${idx + 1}`,
                avatar: ["🚀", "⚡", "👾", "🦊", "🎨", "💻"][idx % 6],
              },
              likesCount: tv.likes ?? (120 + idx * 47),
              category: tv.category || (idx % 2 === 0 ? "AI & ML" : "Web Apps"),
            };
          });
          setProjects(mapped);
        }
      })
      .catch(() => {
        // Keep curated fallback
      });
  }, []);

  const categories = ["All", "AI & ML", "Web Apps", "Systems & Tools", "Games & Graphics"];

  const filteredProjects =
    selectedCategory === "All"
      ? projects
      : projects.filter((p) => p.category === selectedCategory || p.techStack.includes(selectedCategory));

  const faqs = [
    {
      q: "Who can showcase projects on DevZ-Go?",
      a: "Any student builder, self-taught coder, or open-source enthusiast! Whether you're building your first full-stack hackathon prototype, a systems-level Rust compiler, or an indie game, DevZ-Go is your stage.",
    },
    {
      q: "What makes DevZ-Go different from GitHub or LinkedIn?",
      a: "GitHub is a code repository and LinkedIn is a resume board. DevZ-Go is a living arcade. We turn your builds into tactile interactive showcases with live video demos, retro TV exploration worlds, 3D card decks, and direct peer feedback.",
    },
    {
      q: "How do the Retro TV World and House of Cards explore modes work?",
      a: "We believe browsing projects should feel like an adventure! In the TV World (/explore/tv), projects are mounted onto retro CRT monitors in a 2D canvas room you can pan and zoom through. In House of Cards (/explore/cards), you can swipe and flip through collectible project cards with keyboard navigation.",
    },
    {
      q: "Is DevZ-Go completely free for students?",
      a: "Yes, 100% free and open-source forever. No paywalls, no promoted ad spots. Every project stands on the merit of its craftsmanship and community spark.",
    },
    {
      q: "How can I connect with project authors or invite teammates?",
      a: "Each project page includes direct collaboration links, GitHub source repositories, and author profiles. You can leave feedback, spark kudos, or reach out to team up for your next hackathon.",
    },
    {
      q: "What is the Monthly Wrap retrospective?",
      a: "Just like Spotify Wrapped, DevZ-Go's Monthly Wrap (/wrap) analyzes your coding milestones, commit momentum, top tech stacks, and community highlights in an interactive pixel-art story chapter experience.",
    },
  ];

  return (
    <div className="min-h-screen text-stone-100 selection:bg-amber-300 selection:text-stone-900 overflow-x-hidden">
      {/* ── Top Floating Editorial Navigation ── */}
      <Navbar variant="editorial" />

      {/* ─────────────────────────────────────────────────────────────
          BIOME 0: THE TWILIGHT CANVASES / SKY HERO (#hero)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative w-full min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#0c0f17]"
      >
        {/* Pixelcat Video Background Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            src={pixelCatBackground}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center opacity-80"
          />
          {/* Subtle atmospheric vignette and color tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/30 to-[#0e2117]/80" />
        </div>

        {/* Ambient floating stars / spark particles */}
        <div className="absolute inset-0 z-1 pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-75" />
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-cyan-200 rounded-full animate-pulse opacity-60" />
          <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-pink-200 rounded-full animate-pulse opacity-80" />
          <div className="absolute top-1/2 right-1/8 w-2 h-2 bg-amber-100 rounded-full animate-ping opacity-40" />
        </div>

        {/* Floating Editorial Stamps Column on the Right */}
        <EditorialStamps />

        {/* Center Content: Headline & Action Buttons */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-200 text-xs font-semibold uppercase tracking-widest mb-6 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>The Infinite Student Stage</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal text-white tracking-tight leading-[1.08] drop-shadow-lg"
          >
            Where Code Comes Alive. <br />
            <span className="italic text-[#fced96]">Like, Really.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="mt-6 text-stone-200 text-base sm:text-lg md:text-xl font-sans max-w-2xl leading-relaxed text-balance drop-shadow-sm font-light"
          >
            An infinite continuous world where student builders launch ideas into the wild.
            Discover standout projects, find your crew, and explore interactive realms.
          </motion.p>

          {/* Action Pills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/explore"
              className="px-8 py-3 rounded-full bg-[#fced96] hover:bg-[#fae77c] text-stone-900 font-sans text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-stone-900" />
              <span>Explore Projects</span>
            </Link>

            <Link
              to="/wrap"
              className="px-7 py-3 rounded-full bg-stone-900/80 hover:bg-stone-900 border border-amber-300/40 text-amber-200 hover:text-white font-sans text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-md hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2 backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>'26 Monthly Wrap</span>
            </Link>

            <Link
              to="/add-project"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-sans text-xs font-bold uppercase tracking-widest transition-all duration-200 backdrop-blur-md flex items-center gap-2"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Submit Work</span>
            </Link>
          </motion.div>

          {/* Ambient Scroll Down Indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mt-14 flex flex-col items-center gap-1.5 text-stone-300/80 hover:text-amber-200 transition-colors cursor-pointer"
            onClick={() => {
              document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="text-[10px] font-semibold tracking-widest uppercase">
              Scroll To Journey Through The Biomes
            </span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>

        {/* ── SEAMLESS BIOME TRANSITION 1: Sky into Pine Forest Ridge ── */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-16 sm:h-24 md:h-32 text-[#0e2417]"
            viewBox="0 0 1440 120"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Background rolling hills */}
            <path
              d="M0,45 C280,95 480,10 720,60 C960,110 1200,30 1440,75 L1440,120 L0,120 Z"
              fill="rgba(10, 26, 17, 0.65)"
            />
            {/* Foreground jagged tree silhouettes & wavy crest */}
            <path
              d="M0,70 Q120,40 240,75 T480,65 T720,85 T960,55 T1200,80 T1440,60 L1440,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BIOME 1: THE MAKER PINES & CAMPSITE WORKSHOP (#about)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="about"
        className="relative z-10 bg-[#0e2417] text-stone-100 px-6 md:px-14 pt-16 pb-28 border-t border-[#183d28]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 25%, rgba(46, 125, 78, 0.15) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(251, 191, 36, 0.08) 0%, transparent 40%)
          `,
        }}
      >
        <div className="max-w-[1300px] mx-auto">
          {/* Section Kicker & Title */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase px-3 py-1 rounded-full bg-[#1e4830] text-emerald-300 border border-emerald-500/30">
              BIOME 01 // THE CAMPSITE WORKSHOP
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-white font-normal tracking-tight mt-4">
              Built by Students, for the Wild.
            </h2>
            <p className="text-stone-300 font-sans text-sm sm:text-base mt-3 leading-relaxed">
              No stiff corporate resumes or dead GitHub repos. DevZ-Go gives student projects a living
              campground — where unfinished prototypes, side hustles, and late-night hacks shine with genuine personality.
            </p>
          </div>

          {/* Interactive Polaroid / Bulletin Story Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
            {/* Polaroid Card 1 */}
            <motion.div
              whileHover={{ y: -6, rotate: -1 }}
              transition={{ duration: 0.2 }}
              className="relative rounded-2xl bg-[#fdfbf7] text-stone-900 p-6 pt-10 shadow-xl border border-stone-200 flex flex-col justify-between"
            >
              <WashiTape color="#768a7c" />
              <div>
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 border border-stone-200/80 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-800 flex items-center justify-center text-2xl mb-2">
                    📺
                  </div>
                  <span className="font-serif text-stone-800 font-bold text-sm">
                    Interactive Demos
                  </span>
                  <p className="text-[11px] text-stone-600 mt-1 max-w-[200px]">
                    Video walk-throughs, architecture maps, and playable prototypes.
                  </p>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                  Showcase Without Limits
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  Upload custom walk-through videos, embed live hosted links, and highlight the exact tech stack you used to build it.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
                <span>01 // SHOWCASE</span>
                <span className="font-mono">#SHOW_YOUR_WORK</span>
              </div>
            </motion.div>

            {/* Polaroid Card 2 */}
            <motion.div
              whileHover={{ y: -6, rotate: 1 }}
              transition={{ duration: 0.2 }}
              className="relative rounded-2xl bg-[#fdfbf7] text-stone-900 p-6 pt-10 shadow-xl border border-stone-200 flex flex-col justify-between"
            >
              <WashiTape color="#b59a68" />
              <div>
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 border border-stone-200/80 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-600/10 text-amber-800 flex items-center justify-center text-2xl mb-2">
                    ⚡
                  </div>
                  <span className="font-serif text-stone-800 font-bold text-sm">
                    Authentic Peer Sparks
                  </span>
                  <p className="text-[11px] text-stone-600 mt-1 max-w-[200px]">
                    Real student praise, constructive code critiques, and verified stars.
                  </p>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                  Constructive Community
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  Get eyes on your code from fellow hackers. Receive constructive architectural reviews, bug spotting, and honest appreciation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-[11px] font-semibold text-amber-800">
                <span>02 // COMMUNITY</span>
                <span className="font-mono">#PEER_REVIEW</span>
              </div>
            </motion.div>

            {/* Polaroid Card 3 */}
            <motion.div
              whileHover={{ y: -6, rotate: -0.5 }}
              transition={{ duration: 0.2 }}
              className="relative rounded-2xl bg-[#fdfbf7] text-stone-900 p-6 pt-10 shadow-xl border border-stone-200 flex flex-col justify-between"
            >
              <WashiTape color="#6e7f8e" />
              <div>
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-cyan-100 to-sky-50 border border-stone-200/80 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-600/10 text-cyan-800 flex items-center justify-center text-2xl mb-2">
                    🤝
                  </div>
                  <span className="font-serif text-stone-800 font-bold text-sm">
                    Co-Founder Radar
                  </span>
                  <p className="text-[11px] text-stone-600 mt-1 max-w-[200px]">
                    Find frontend wizards, systems engineers, and AI hackers.
                  </p>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                  Team Up & Collaborate
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  Looking for a teammate for your next hackathon or open-source repo? Connect with builders who share your technical taste.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-[11px] font-semibold text-sky-800">
                <span>03 // RADAR</span>
                <span className="font-mono">#HACK_TOGETHER</span>
              </div>
            </motion.div>
          </div>

          {/* Wooden / Campfire Stats Ribbon */}
          <div className="rounded-2xl bg-[#143321]/90 border border-[#235839] p-6 sm:p-8 backdrop-blur-md shadow-2xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#fced96]">500+</div>
              <p className="text-xs uppercase tracking-wider text-stone-300 font-semibold mt-1">
                Student Projects
              </p>
            </div>
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-emerald-300">40+</div>
              <p className="text-xs uppercase tracking-wider text-stone-300 font-semibold mt-1">
                University Hubs
              </p>
            </div>
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-cyan-300">100%</div>
              <p className="text-xs uppercase tracking-wider text-stone-300 font-semibold mt-1">
                Free & Open Source
              </p>
            </div>
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-pink-300">14K+</div>
              <p className="text-xs uppercase tracking-wider text-stone-300 font-semibold mt-1">
                Community Sparks
              </p>
            </div>
          </div>
        </div>

        {/* ── SEAMLESS BIOME TRANSITION 2: Pine Forest into Lakeside Shore ── */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-16 sm:h-24 md:h-32 text-[#0d323b]"
            viewBox="0 0 1440 120"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,35 C320,105 560,15 880,75 C1120,115 1300,45 1440,70 L1440,120 L0,120 Z"
              fill="rgba(13, 40, 48, 0.7)"
            />
            <path
              d="M0,65 Q240,15 480,70 T960,45 T1440,75 L1440,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BIOME 2: THE BOARDWALK ARCADE / PROJECT SHOWCASE (#showcase)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="showcase"
        className="relative z-10 bg-[#0d323b] text-stone-100 px-6 md:px-14 pt-16 pb-32 border-t border-[#164855]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(20, 184, 166, 0.1) 0%, transparent 45%)
          `,
        }}
      >
        <div className="max-w-[1300px] mx-auto">
          {/* Section Kicker & Title */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase px-3 py-1 rounded-full bg-[#154652] text-cyan-300 border border-cyan-500/30">
                BIOME 02 // THE BOARDWALK ARCADE
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl text-white font-normal tracking-tight mt-4">
                The Project Showcase.
              </h2>
              <p className="text-cyan-100/80 font-sans text-sm sm:text-base mt-2 max-w-xl">
                Real code shipped by students. Filter by stack, inspect repositories, or jump into our
                dedicated 3D immersion rooms.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    selectedCategory === cat
                      ? "bg-[#fced96] text-stone-950 shadow-md scale-105"
                      : "bg-white/10 text-cyan-100 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Exploration Modes Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
            {/* Mode 1: TV World */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#122833] to-[#0c1c24] border border-cyan-500/30 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xl group hover:border-cyan-400/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  EXPLORE MODE 01
                </span>
                <Tv className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="font-serif text-2xl text-white font-bold mb-2">
                  Pixel CRT TV World
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed font-sans mb-6">
                  Wander through an infinite retro room where every public project is displayed on an
                  authentic glowing CRT TV. Pan, zoom, and tune into channels.
                </p>
              </div>
              <Link
                to="/explore/tv"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-stone-950 font-sans text-xs font-bold uppercase tracking-wider transition-all self-start shadow-md group-hover:scale-[1.03]"
              >
                <span>Enter TV World</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mode 2: House of Cards */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#192b33] to-[#0f1d24] border border-amber-500/30 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xl group hover:border-amber-400/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  EXPLORE MODE 02
                </span>
                <Layers className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-serif text-2xl text-white font-bold mb-2">
                  House of Cards Deck
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed font-sans mb-6">
                  Experience projects as tangible, tactile collector cards. Flip through decks with
                  arrow keys, inspect developer badges, and share builds.
                </p>
              </div>
              <Link
                to="/explore/cards"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-300 hover:bg-amber-200 text-stone-950 font-sans text-xs font-bold uppercase tracking-wider transition-all self-start shadow-md group-hover:scale-[1.03]"
              >
                <span>Enter Card Deck</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredProjects.slice(0, 6).map((proj) => (
              <motion.div
                key={proj.id}
                whileHover={{ y: -5 }}
                className="group rounded-2xl bg-stone-900/60 border border-white/10 hover:border-cyan-400/40 p-6 flex flex-col justify-between backdrop-blur-md shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
                    <span className="flex items-center gap-1.5 font-medium text-stone-300">
                      <span>{proj.author.avatar}</span>
                      <span>@{proj.author.username}</span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-300">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      <span>{proj.likesCount}</span>
                    </span>
                  </div>

                  <h4 className="font-serif text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                    {proj.title}
                  </h4>
                  <p className="text-xs text-stone-300 font-sans leading-relaxed line-clamp-2 mb-4">
                    {proj.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {proj.techStack.map((tech: string) => (
                      <span
                        key={tech}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-cyan-200 border border-white/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <Link
                    to={`/projects/${proj.id}`}
                    className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
                  >
                    <span>View Project</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    {proj.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom All Projects CTA */}
          <div className="mt-14 text-center">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-md hover:scale-105"
            >
              <span>Explore All {projects.length}+ Projects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── SEAMLESS BIOME TRANSITION 3: Lake Shore into Abyssal Trench ── */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-16 sm:h-24 md:h-32 text-[#061822]"
            viewBox="0 0 1440 120"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,45 C280,10 600,95 900,40 C1140,85 1320,30 1440,65 L1440,120 L0,120 Z"
              fill="rgba(8, 28, 38, 0.7)"
            />
            <path
              d="M0,80 Q320,30 640,85 T1280,50 T1440,75 L1440,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BIOME 3: THE ABYSSAL TRENCH & DEEP TECH ECOSYSTEM (#ecosystem)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="ecosystem"
        className="relative z-10 bg-[#061822] text-stone-100 px-6 md:px-14 pt-16 pb-32 border-t border-[#0e2c3c]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 40%, rgba(56, 189, 248, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 85% 65%, rgba(168, 85, 247, 0.08) 0%, transparent 45%)
          `,
        }}
      >
        <div className="max-w-[1300px] mx-auto">
          {/* Section Kicker & Title */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase px-3 py-1 rounded-full bg-[#0c2838] text-sky-300 border border-sky-500/30">
              BIOME 03 // THE ABYSSAL TRENCH
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-white font-normal tracking-tight mt-4">
              Under the Hood: The DevZ-Go Engine.
            </h2>
            <p className="text-stone-300 font-sans text-sm sm:text-base mt-3 leading-relaxed">
              We engineered a developer-first platform featuring instant code metrics, automated analysis,
              interactive retrospective stories, and collaborative tooling.
            </p>
          </div>

          {/* 4 Feature Pods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Pod 1 */}
            <div className="rounded-2xl bg-stone-900/50 border border-sky-500/20 p-6 backdrop-blur-md flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-300 flex items-center justify-center text-xl mb-4">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">
                  Automated Code Analysis
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed font-sans">
                  Deep AST-level inspection of your project repositories. Get automated complexity metrics, test coverage signals, and file structure insights.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-sky-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero configuration required</span>
              </div>
            </div>

            {/* Pod 2 */}
            <div className="rounded-2xl bg-stone-900/50 border border-amber-500/20 p-6 backdrop-blur-md flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-center justify-center text-xl mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">
                  2026 Monthly Wrap
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed font-sans">
                  Turn your git commit history into an interactive retrospective story. Relive your coding seasons, streak milestones, and top frameworks.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pixel-art story viewer</span>
              </div>
            </div>

            {/* Pod 3 */}
            <div className="rounded-2xl bg-stone-900/50 border border-pink-500/20 p-6 backdrop-blur-md flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/25 text-pink-300 flex items-center justify-center text-xl mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">
                  Student Co-Founder Match
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed font-sans">
                  Need a frontend designer or backend wizard for an upcoming hackathon? Post collaborative opportunities directly to project pages.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-pink-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>University network ready</span>
              </div>
            </div>

            {/* Pod 4 */}
            <div className="rounded-2xl bg-stone-900/50 border border-emerald-500/20 p-6 backdrop-blur-md flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center justify-center text-xl mb-4">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">
                  Verified Source Proof
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed font-sans">
                  Prove genuine student authorship with GitHub sync and verified contributor stamps. Stand out to mentors and engineering recruiters.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Direct GitHub verification</span>
              </div>
            </div>
          </div>

          {/* Interactive Developer Terminal Widget */}
          <div className="rounded-2xl bg-stone-950/85 border border-white/15 overflow-hidden shadow-2xl max-w-4xl mx-auto">
            {/* Terminal Top Bar */}
            <div className="bg-stone-900/90 px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-stone-400 ml-2">devzgo-cli // live-session</span>
              </div>
              <span className="text-[10px] font-mono text-stone-500">v2.4.0 (active)</span>
            </div>

            {/* Terminal Body */}
            <div className="p-6 font-mono text-xs text-stone-300 leading-relaxed space-y-3">
              <div>
                <span className="text-emerald-400">visitor@devzgo:~$</span>{" "}
                <span className="text-white">devzgo init --explore</span>
              </div>
              <div className="text-stone-400">
                [OK] Connected to DevZ-Go Infinite Stage Cluster (North America East)
                <br />
                [OK] Synchronized 500+ active student projects and 48 tech ecosystems
              </div>
              <div>
                <span className="text-emerald-400">visitor@devzgo:~$</span>{" "}
                <span className="text-white">devzgo wrap --status</span>
              </div>
              <div className="text-amber-300">
                ★ 2026 Monthly Wrap is tuned and streaming: 6 chapters, pixel retro player ready.
              </div>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-emerald-400">visitor@devzgo:~$</span>
                <span className="inline-block w-2.5 h-4 bg-cyan-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* ── SEAMLESS BIOME TRANSITION 4: Abyssal Trench into Aurora Starlight ── */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-16 sm:h-24 md:h-32 text-[#080c16]"
            viewBox="0 0 1440 120"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,35 C360,95 640,15 980,75 C1220,115 1360,40 1440,65 L1440,120 L0,120 Z"
              fill="rgba(9, 18, 32, 0.7)"
            />
            <path
              d="M0,65 Q280,20 560,75 T1120,45 T1440,75 L1440,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BIOME 4: THE AURORA CLEARING & CAMPFIRE FAQS (#faq)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="faq"
        className="relative z-10 bg-[#080c16] text-stone-100 px-6 md:px-14 pt-16 pb-32 border-t border-[#131d33]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 10%, rgba(34, 197, 94, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 80% 30%, rgba(217, 70, 239, 0.08) 0%, transparent 50%)
          `,
        }}
      >
        <div className="max-w-[1000px] mx-auto">
          {/* Section Kicker & Title */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase px-3 py-1 rounded-full bg-[#142340] text-amber-200 border border-amber-500/30 inline-flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>BIOME 04 // THE AURORA CAMPFIRE</span>
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-white font-normal tracking-tight mt-4">
              Gather Around the Campfire.
            </h2>
            <p className="text-stone-300 font-sans text-sm sm:text-base mt-3 leading-relaxed">
              Frequently asked questions from student builders, mentors, and hackathon hackers.
            </p>
          </div>

          {/* Interactive Accordion FAQs */}
          <div className="space-y-4 mb-20">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl bg-stone-900/60 border border-white/10 overflow-hidden backdrop-blur-md transition-all shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <span className="font-serif text-base sm:text-lg text-white font-medium">
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-stone-400 shrink-0"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-1 text-sm text-stone-300 font-sans leading-relaxed border-t border-white/5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Final Call To Action Pod */}
          <div className="relative rounded-3xl bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-cyan-500/15 border border-white/20 p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-xl mx-auto">
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 inline-block mb-4">
                READY TO BUILD?
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-white font-normal mb-3">
                Plant Your Project in the Wild.
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 mb-8 leading-relaxed">
                Join hundreds of student developers showcasing work, getting peer feedback, and building the future.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/add-project"
                  className="px-8 py-3 rounded-full bg-[#fced96] hover:bg-[#fae77c] text-stone-900 font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  Submit Your Project
                </Link>
                <Link
                  to="/explore"
                  className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans text-xs font-bold uppercase tracking-widest transition-all backdrop-blur-md hover:scale-105 active:scale-95"
                >
                  Explore All Builds
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── SEAMLESS BIOME TRANSITION 5: Starlight into Subterranean Bedrock ── */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-16 sm:h-20 text-[#07080a]"
            viewBox="0 0 1440 100"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,40 C320,80 640,20 960,60 C1200,90 1360,30 1440,55 L1440,100 L0,100 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BEDROCK ROOTS & WORLD FOOTER (Seamless Dark Bedrock Finish)
      ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 bg-[#07080a] text-stone-400 px-6 md:px-14 pt-12 pb-16 border-t border-white/10">
        <div className="max-w-[1300px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left Brand & Story */}
          <div className="text-center md:text-left">
            <Link
              to="/home"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="font-serif text-2xl text-white tracking-tight hover:text-[#fced96] transition-colors"
            >
              DevZ-Go
            </Link>
            <p className="text-xs text-stone-400 mt-1 max-w-sm">
              The continuous showcase ecosystem for student hackers, developers, and creators.
            </p>
          </div>

          {/* Center Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-stone-300">
            <Link to="/home" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/explore" className="hover:text-white transition-colors">
              Explore
            </Link>
            <Link to="/explore/tv" className="hover:text-white transition-colors">
              TV World
            </Link>
            <Link to="/explore/cards" className="hover:text-white transition-colors">
              House of Cards
            </Link>
            <Link to="/wrap" className="hover:text-amber-300 transition-colors">
              '26 Wrap
            </Link>
            <Link to="/add-project" className="hover:text-white transition-colors">
              Submit Work
            </Link>
            <Link to="/profile" className="hover:text-white transition-colors">
              Profile
            </Link>
          </div>

          {/* Right Copyright & Heart */}
          <div className="text-xs text-stone-400 text-center md:text-right">
            <p>© {new Date().getFullYear()} DevZ-Go. Open Source & Student Crafted.</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Built with passion for developers, everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
