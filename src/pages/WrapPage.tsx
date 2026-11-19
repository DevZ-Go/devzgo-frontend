// src/pages/WrapPage.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Volume2,
  VolumeX,
  ArrowDown,
  FolderPlus,
  Users,
} from "lucide-react";
import { WrapChapter, type WrapThemeVariant } from "../components/wrap/WrapChapter";
import { Select } from "../components/ui/Select";
import { fetchCurrentWrap, fetchWrap, fetchWrapMonths, shareWrap, type Wrap } from "../api/wraps";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";
import { StickerBadge } from "../components/StickerBadge";

const SLIDE_THEMES: Array<{ color: string; variant: WrapThemeVariant }> = [
  { color: "#CDE3E8", variant: "binary-folder" }, // Slide 0: Intro
  { color: "#FFF8CA", variant: "retro-os" },      // Slide 1: Rosewood & Lemon Chiffon
  { color: "#CBE4EE", variant: "system-alert" },  // Slide 2: Midnight Navy & Botticelli Blue
  { color: "#E2F0CB", variant: "hacker-source" }, // Slide 3: Forest Teal & Mint Sage
  { color: "#D5BEEA", variant: "cyber-plum" },    // Slide 4: Velvet Plum & Lilac
  { color: "#FDE68A", variant: "crt-cobalt" },    // Slide 5: Deep Sapphire & Gold
  { color: "#CDE3E8", variant: "binary-folder" }, // Slide 6: Twilight Slate
  { color: "#D5BEEA", variant: "cyber-plum" },    // Slide 7: Persona Finale
];

const plural = (n: number, singular: string, pluralForm = `${singular}s`) =>
  `${n} ${n === 1 ? singular : pluralForm}`;

const monthName = (month: string) =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const CONFETTI_COLORS = [
  "#FFF8CA", // Lemon Chiffon
  "#CDE3E8", // Botticelli Blue
  "#D5BEEA", // Lilac Purple
  "#E2F0CB", // Mint Sage
  "#FF758F", // Festive Coral Pink
  "#FDE047", // Party Gold
  "#60A5FA", // Sky Blue
];

/**
 * Synthesizes an upbeat ~3.2s Party Popper + Celebration Fanfare:
 * 1) Quick party-whistle rise into crisp, punchy confetti cannon cracks + paper-streamer crackle
 * 2) Bright, bouncy celebratory brass-synth fanfare riff
 * 3) Cascading confetti micro-pops & sparkling bell chimes
 */
function playPartyPopperSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const now = ctx.currentTime;

    // Master dynamics compressor so the pops and fanfare stay punchy without clipping
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-14, now);
    comp.knee.setValueAtTime(18, now);
    comp.ratio.setValueAtTime(6, now);
    comp.attack.setValueAtTime(0.003, now);
    comp.release.setValueAtTime(0.2, now);
    comp.connect(ctx.destination);

    // 1. Quick playful party-horn / slide-whistle anticipation sweep (0.00s -> 0.14s)
    const whistle = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    whistle.type = "sine";
    whistle.frequency.setValueAtTime(420, now);
    whistle.frequency.exponentialRampToValueAtTime(1250, now + 0.12);
    whistleGain.gain.setValueAtTime(0.001, now);
    whistleGain.gain.linearRampToValueAtTime(0.14, now + 0.04);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    whistle.connect(whistleGain);
    whistleGain.connect(comp);
    whistle.start(now);
    whistle.stop(now + 0.15);

    // Helper: crisp confetti cannon crack + punchy sub-thump + paper crackle burst
    const fireCannon = (offset: number, pitch: number, gainAmt: number) => {
      const t = now + offset;

      // Punchy body thump
      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thump.type = "sine";
      thump.frequency.setValueAtTime(pitch, t);
      thump.frequency.exponentialRampToValueAtTime(48, t + 0.13);
      thumpGain.gain.setValueAtTime(gainAmt, t);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      thump.connect(thumpGain);
      thumpGain.connect(comp);
      thump.start(t);
      thump.stop(t + 0.15);

      // Crisp paper-popper crackle burst
      const len = Math.floor(ctx.sampleRate * 0.55);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const env = Math.exp(-i / (ctx.sampleRate * 0.12));
        // Add occasional sharp crackle spikes for realistic confetti flutter
        const spike = i % 190 < 12 ? 1.45 : 0.85;
        data[i] = (Math.random() * 2 - 1) * env * spike;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.setValueAtTime(900, t);

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(2400, t);
      bp.frequency.exponentialRampToValueAtTime(4200, t + 0.45);
      bp.Q.setValueAtTime(0.7, t);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(gainAmt * 0.75, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.52);

      noise.connect(hp);
      hp.connect(bp);
      bp.connect(nGain);
      nGain.connect(comp);
      noise.start(t);
      noise.stop(t + 0.54);
    };

    // Dual party-popper cannons: main blast + secondary echo pop
    fireCannon(0.11, 240, 0.7);
    fireCannon(0.36, 310, 0.5);

    // 2. Upbeat syncopated celebratory brass-synth fanfare riff
    const fanfare = [
      { freq: 392.0, at: 0.16, dur: 0.14, vol: 0.14 },  // G4
      { freq: 523.25, at: 0.28, dur: 0.14, vol: 0.16 }, // C5
      { freq: 659.25, at: 0.4, dur: 0.14, vol: 0.16 },  // E5
      { freq: 783.99, at: 0.52, dur: 0.24, vol: 0.18 }, // G5
      { freq: 659.25, at: 0.74, dur: 0.14, vol: 0.15 }, // E5
      { freq: 783.99, at: 0.86, dur: 0.16, vol: 0.17 }, // G5
      { freq: 1046.5, at: 1.0, dur: 1.15, vol: 0.2 },   // C6!
    ];

    fanfare.forEach(({ freq, at, dur, vol }) => {
      const start = now + at;
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      oscA.type = "sawtooth";
      oscB.type = "triangle";
      oscA.frequency.setValueAtTime(freq, start);
      oscB.frequency.setValueAtTime(freq * 1.004, start); // slight chorus detune

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3400, start);
      filter.frequency.exponentialRampToValueAtTime(1600, start + dur);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(comp);

      oscA.start(start);
      oscB.start(start);
      oscA.stop(start + dur + 0.03);
      oscB.stop(start + dur + 0.03);
    });

    // 3. Warm celebratory harmony chord under the finale C6
    [523.25, 659.25, 783.99, 987.77].forEach((freq) => {
      const start = now + 1.0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.5);
      osc.connect(gain);
      gain.connect(comp);
      osc.start(start);
      osc.stop(start + 1.55);
    });

    // 4. Sparkling confetti bell chimes & tiny micro-pops (1.1s -> 2.8s)
    const chimes = [1567.98, 2093.0, 2637.02, 1975.53, 2349.32, 3135.96, 2637.02];
    chimes.forEach((freq, i) => {
      const start = now + 1.12 + i * 0.21;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.085, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.42);
      osc.connect(gain);
      gain.connect(comp);
      osc.start(start);
      osc.stop(start + 0.45);
    });

    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 3400);
  } catch {
    // Ignore audio context errors if blocked by browser settings
  }
}

/**
 * Party Popper Confetti Cannon that bursts across the screen as soon as you enter the Wrap page
 * (and whenever you click the Party Popper button!).
 */
function PartyConfetti({ burstKey }: { burstKey: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => {
        const fromLeft = i % 2 === 0;
        const spreadX = fromLeft
          ? 8 + ((i * 17) % 42)
          : 50 + ((i * 19) % 42);
        const driftX = ((i * 29) % 24) - 12;
        const delay = ((i * 7) % 20) * 0.03;
        const duration = 2.1 + ((i * 11) % 12) * 0.12;
        const rotate = ((i * 67) % 360) + 180;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]!;
        const shape = i % 3; // 0: ribbon, 1: circle, 2: star/diamond
        return { id: i, spreadX, driftX, delay, duration, rotate, color, shape };
      }),
    []
  );

  if (burstKey === 0) return null;

  return (
    <div
      key={burstKey}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{
            left: `${p.spreadX}%`,
            top: "-4%",
            opacity: 1,
            scale: 0.6,
            rotate: 0,
          }}
          animate={{
            left: `${p.spreadX + p.driftX}%`,
            top: "106%",
            opacity: [1, 1, 0.85, 0],
            scale: [0.8, 1.1, 1, 0.9],
            rotate: p.rotate,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.2, 0.8, 0.3, 1],
          }}
          style={{
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}66`,
          }}
          className={`absolute block ${
            p.shape === 0
              ? "w-2.5 h-5 rounded-xs"
              : p.shape === 1
                ? "w-3 h-3 rounded-full"
                : "w-3 h-3 rotate-45 rounded-xs"
          }`}
        />
      ))}
    </div>
  );
}

type Chapter = {
  label: string;
  cursiveKicker: string;
  title: string;
  text: string;
  visual: ReactNode;
  file: string;
  code: string;
};

type WrapLangSpec = {
  ext: string;
  formatValue: (v: string | number | string[]) => string;
  formatAssign: (name: string, val: string | number | string[]) => string;
  sep: string;
};

const quote = (s: string) => `"${s}"`;

const LANG_SPECS: Record<string, WrapLangSpec> = {
  typescript: {
    ext: "ts",
    formatValue: (v) => (Array.isArray(v) ? `[${v.map(quote).join(", ")}]` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) => `const ${k} = ${LANG_SPECS.typescript!.formatValue(v)};`,
    sep: " ",
  },
  javascript: {
    ext: "js",
    formatValue: (v) => (Array.isArray(v) ? `[${v.map(quote).join(", ")}]` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) => `const ${k} = ${LANG_SPECS.javascript!.formatValue(v)};`,
    sep: " ",
  },
  python: {
    ext: "py",
    formatValue: (v) => (Array.isArray(v) ? `[${v.map(quote).join(", ")}]` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) => `${k} = ${LANG_SPECS.python!.formatValue(v)}`,
    sep: "; ",
  },
  java: {
    ext: "java",
    formatValue: (v) => (Array.isArray(v) ? `{${v.map(quote).join(", ")}}` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) =>
      `${Array.isArray(v) ? "String[]" : typeof v === "string" ? "String" : "int"} ${k} = ${LANG_SPECS.java!.formatValue(v)};`,
    sep: " ",
  },
  cpp: {
    ext: "cpp",
    formatValue: (v) => (Array.isArray(v) ? `{${v.map(quote).join(", ")}}` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) =>
      `${Array.isArray(v) ? "auto" : typeof v === "string" ? "string" : "int"} ${k} = ${LANG_SPECS.cpp!.formatValue(v)};`,
    sep: " ",
  },
  csharp: {
    ext: "cs",
    formatValue: (v) => (Array.isArray(v) ? `[${v.map(quote).join(", ")}]` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) => `var ${k} = ${LANG_SPECS.csharp!.formatValue(v)};`,
    sep: " ",
  },
  go: {
    ext: "go",
    formatValue: (v) => (Array.isArray(v) ? `[]string{${v.map(quote).join(", ")}}` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) => `${k} := ${LANG_SPECS.go!.formatValue(v)}`,
    sep: "; ",
  },
  rust: {
    ext: "rs",
    formatValue: (v) => (Array.isArray(v) ? `vec![${v.map(quote).join(", ")}]` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) => `let ${k} = ${LANG_SPECS.rust!.formatValue(v)};`,
    sep: " ",
  },
  ruby: {
    ext: "rb",
    formatValue: (v) => (Array.isArray(v) ? `[${v.map(quote).join(", ")}]` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) => `${k} = ${LANG_SPECS.ruby!.formatValue(v)}`,
    sep: "; ",
  },
  php: {
    ext: "php",
    formatValue: (v) => (Array.isArray(v) ? `[${v.map(quote).join(", ")}]` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) => `$${k} = ${LANG_SPECS.php!.formatValue(v)};`,
    sep: " ",
  },
  swift: {
    ext: "swift",
    formatValue: (v) => (Array.isArray(v) ? `[${v.map(quote).join(", ")}]` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) => `let ${k} = ${LANG_SPECS.swift!.formatValue(v)}`,
    sep: "; ",
  },
  kotlin: {
    ext: "kt",
    formatValue: (v) => (Array.isArray(v) ? `listOf(${v.map(quote).join(", ")})` : typeof v === "string" ? quote(v) : String(v)),
    formatAssign: (k, v) => `val ${k} = ${LANG_SPECS.kotlin!.formatValue(v)}`,
    sep: "; ",
  },
};

const TECH_TO_LANG: Array<[RegExp, keyof typeof LANG_SPECS]> = [
  [/\btypescript\b|\bts\b/i, "typescript"],
  [/\bpython\b|\bdjango\b|\bflask\b|\bfastapi\b|\bpytorch\b/i, "python"],
  [/\bjavascript\b|\bnode(\.js)?\b|\breact\b|\bnext(\.js)?\b|\bvue\b|\bexpress\b/i, "javascript"],
  [/\bjava\b|\bspring\b/i, "java"],
  [/c\+\+|\bcpp\b/i, "cpp"],
  [/c#|\bcsharp\b|\.net\b/i, "csharp"],
  [/\bgolang\b|\bgo\b/i, "go"],
  [/\brust\b/i, "rust"],
  [/\bruby\b|\brails\b/i, "ruby"],
  [/\bphp\b|\blaravel\b/i, "php"],
  [/\bswift\b/i, "swift"],
  [/\bkotlin\b/i, "kotlin"],
];

/** Picks the user's most-used language for the month, defaulting to TypeScript if none. */
function detectWrapLanguage(topTech: string[]): WrapLangSpec {
  for (const tech of topTech) {
    for (const [pattern, key] of TECH_TO_LANG) {
      if (pattern.test(tech)) return LANG_SPECS[key]!;
    }
  }
  return LANG_SPECS.typescript!;
}

function formatWrapCode(
  lang: WrapLangSpec,
  baseName: string,
  entries: Array<[string, string | number | string[]]>
): { file: string; code: string } {
  return {
    file: `${baseName}.${lang.ext}`,
    code: entries.map(([k, v]) => lang.formatAssign(k, v)).join(lang.sep),
  };
}

/**
 * Clean chapters using the website's illustrated stickers (no blocky pixel art)
 * and the website's signature serif + cursive typography.
 */
function chapters(w: Wrap): Chapter[] {
  const m = w.metrics;
  const lang = detectWrapLanguage(m.top_tech ?? []);
  const out: Chapter[] = [];
  const add = (
    show: unknown,
    label: string,
    cursiveKicker: string,
    title: string,
    text: string,
    visual: ReactNode,
    snippet: { file: string; code: string }
  ) =>
    show &&
    out.push({
      label,
      cursiveKicker,
      title,
      text,
      visual,
      file: snippet.file,
      code: snippet.code,
    });

  add(
    m.projects_created,
    "Shipped",
    "Fresh builds, in code",
    `You started ${plural(m.projects_created, "project")}`,
    "Every build is compiled and showcased on your profile.",
    <StickerBadge name="keycapsDone" size="md" variant="polaroid" caption="shipped" />,
    formatWrapCode(lang, "projects", [["projectsCreated", m.projects_created]])
  );
  add(
    m.top_tech.length,
    "Stack",
    "Your favorite tools",
    `Core Stack: ${m.top_tech[0]}`,
    m.top_tech.join(" • "),
    <StickerBadge name="escKeycap" size="md" variant="polaroid" caption="tech stack" />,
    formatWrapCode(lang, "tech_stack", [["topTech", m.top_tech]])
  );
  add(
    m.project_likes_received + m.project_comments_received,
    "Signal",
    "Community applause",
    "People noticed your work",
    `Your builds received ${plural(m.project_likes_received, "like")} and ${plural(m.project_comments_received, "comment")} across the community.`,
    <StickerBadge name="starHatKid" size="md" variant="polaroid" caption="crowd favorite" />,
    formatWrapCode(lang, "feedback", [
      ["likes", m.project_likes_received],
      ["comments", m.project_comments_received],
    ])
  );
  add(
    m.posts_published,
    "Notes",
    "Dev Social highlights",
    `You shared ${plural(m.posts_published, "note")}`,
    `${plural(m.post_likes_received, "like")} and ${plural(m.post_comments_received, "reply", "replies")} came back from the community.`,
    <StickerBadge name="blueMiffy" size="md" variant="polaroid" caption="dev social" />,
    formatWrapCode(lang, "posts", [
      ["posts", m.posts_published],
      ["reactions", m.post_likes_received + m.post_comments_received],
    ])
  );
  add(
    m.connections_made,
    "Network",
    "Creators & connections",
    `${plural(m.connections_made, "new connection")}`,
    "Your creative circle grew this month.",
    <StickerBadge name="offlineDino" size="md" variant="polaroid" caption="connected" />,
    formatWrapCode(lang, "network", [["newConnections", m.connections_made]])
  );
  add(
    m.projects_joined + m.members_joined_my_projects + m.invitations_sent,
    "Collab",
    "Building together",
    "Teamwork in motion",
    `${plural(m.projects_joined, "project")} joined, ${plural(m.members_joined_my_projects, "builder")} joined yours, ${plural(m.invitations_sent, "invite")} sent.`,
    <StickerBadge name="snoopyMeadow" size="md" variant="polaroid" caption="collab crew" />,
    formatWrapCode(lang, "collaborations", [
      ["joined", m.projects_joined],
      ["teamGrowth", m.members_joined_my_projects],
    ])
  );
  add(
    m.top_liked_category,
    "Taste",
    "Curated inspiration",
    `Top vibe: ${m.top_liked_category}`,
    "Based on the builds you starred and explored.",
    <StickerBadge name="sageMiffy" size="md" variant="polaroid" caption="curated taste" />,
    formatWrapCode(lang, "taste", [["favoriteCategory", m.top_liked_category ?? "All"]])
  );

  if (out.length === 0) {
    out.push(
      {
        label: "Status",
        cursiveKicker: "Ready for takeoff",
        title: "Fresh Canvas Unlocked",
        text: "Your monthly wrap is initialized and ready for your first shipped build.",
        visual: <StickerBadge name="keycapsDone" size="md" variant="polaroid" caption="you got this" />,
        ...formatWrapCode(lang, "status", [["status", "READY_TO_BUILD"]]),
      },
      {
        label: "Create",
        cursiveKicker: "Dream big, build bold",
        title: "Start Your Next Build",
        text: "Upload a repo, import from GitHub, or collaborate with builders across DevZ-Go.",
        visual: <StickerBadge name="blueMiffy" size="md" variant="polaroid" caption="projects studio" />,
        ...formatWrapCode(lang, "next_build", [["mode", "building"]]),
      }
    );
  }

  return out;
}

function Center({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 px-8 text-center text-[#FFF8CA] bg-[#140A1C]">
      {children}
    </div>
  );
}

const pill =
  "rounded-full bg-[#1C1226]/90 backdrop-blur-xl border border-[#FFF8CA]/20 shadow-lg";
const button =
  "rounded-full bg-[#FFF8CA] hover:bg-[#CDE3E8] px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-[#2D120D] disabled:opacity-60 transition-all cursor-pointer";

export function WrapPage() {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const picked = params.get("month");
  const months = useQuery({ queryKey: [...queryKeys.wrap("list")], queryFn: fetchWrapMonths });
  const wrap = useQuery({
    queryKey: queryKeys.wrap(picked ?? "current"),
    queryFn: () => (picked ? fetchWrap(picked) : fetchCurrentWrap()),
    retry: (count, err) => count < 1 && !(axios.isAxiosError(err) && err.response?.status === 404),
  });
  const share = useMutation({
    mutationFn: () => shareWrap(wrap.data!.month),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.wrap(wrap.data!.month) });
      void client.invalidateQueries({ queryKey: queryKeys.feed });
    },
  });

  const w = wrap.data;
  const code = axios.isAxiosError(wrap.error)
    ? (wrap.error.response?.data as { code?: string } | undefined)?.code
    : undefined;
  const slides = w ? chapters(w) : [];
  const nav = [{ label: "Intro" }, ...slides, { label: "Persona" }];

  const scrollRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [sound, setSound] = useState(true);
  // Fires Party Popper Confetti immediately on page entry (burstKey = 1) and whenever triggered!
  const [burstKey, setBurstKey] = useState(1);

  const popConfetti = useCallback(
    (forceSound = false) => {
      setBurstKey((k) => k + 1);
      if (sound || forceSound) {
        playPartyPopperSound();
      }
    },
    [sound]
  );

  // Play party popper sound on initial entry into the Wrap page
  useEffect(() => {
    playPartyPopperSound();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / window.innerHeight);
      const clamped = Math.max(0, Math.min(nav.length - 1, idx));
      setActive((prev) => {
        if (prev !== clamped && (clamped === 0 || clamped === nav.length - 1)) {
          setBurstKey((k) => k + 1);
          if (sound) playPartyPopperSound();
        }
        return clamped;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [nav.length, sound]);

  const jump = (i: number) => {
    const clamped = Math.max(0, Math.min(nav.length - 1, i));
    scrollRef.current?.scrollTo({ top: clamped * window.innerHeight, behavior: "smooth" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        jump(active + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        jump(active - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const themeAt = (i: number) => SLIDE_THEMES[i % SLIDE_THEMES.length]!;

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-[#0E1626] font-sans selection:bg-[#CDE3E8] selection:text-[#2D120D]">
      {/* ── PARTY POPPER CONFETTI CANNON ON PAGE ENTRY ── */}
      <PartyConfetti burstKey={burstKey} />

      {/* ── CLEAN TOP BAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-wrap items-center justify-between gap-2 px-3 py-2 pointer-events-none sm:px-6 sm:py-3">
        <div
          className={`pointer-events-auto flex min-w-0 items-center gap-2 px-3 py-1.5 text-[#FFF8CA] text-xs font-sans sm:px-4 ${pill}`}
        >
          <span className="font-serif font-bold tracking-tight text-base text-[#FFF8CA]">DevZ</span>
          <span className="font-cursive italic font-bold text-xl text-[#CDE3E8] -ml-1">Go</span>
          <span className="text-white/30">·</span>
          <span className="text-[#FFF8CA]/90 font-semibold">Wrap</span>
        </div>

        {slides.length > 0 && (
          <div className={`hidden md:flex pointer-events-auto items-center gap-1.5 px-3 py-1.5 ${pill}`}>
            {nav.map((ch, i) => {
              const t = themeAt(i);
              return (
                <button
                  key={ch.label + i}
                  type="button"
                  onClick={() => jump(i)}
                  title={ch.label}
                  className="group flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans cursor-pointer transition-all"
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      active === i ? "scale-125" : "opacity-40 group-hover:opacity-80"
                    }`}
                    style={{
                      backgroundColor: active === i ? t.color : "#94a3b8",
                      boxShadow: active === i ? `0 0 8px ${t.color}` : "none",
                    }}
                  />
                  {active === i && (
                    <span style={{ color: t.color }} className="font-semibold">
                      {ch.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="pointer-events-auto ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setSound(true);
              popConfetti(true);
            }}
            title="Pop party confetti!"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-sans font-bold text-[#FFF8CA] hover:bg-white/15 cursor-pointer transition-transform active:scale-95 ${pill}`}
          >
            <span>Celebrate</span>
          </button>

          <Select
            value={picked ?? ""}
            aria-label="Wrap month"
            className={`max-w-[9.5rem] px-3 py-1.5 text-xs font-sans font-medium text-[#FFF8CA] sm:max-w-none ${pill}`}
            onChange={(value) => setParams(value ? { month: value } : {})}
            options={[
              ["", "This month (so far)"],
              ...(months.data ?? []).map((m) => [m, monthName(m)] as const),
            ]}
          />
          <button
            type="button"
            onClick={() => {
              setSound((prev) => {
                const next = !prev;
                if (next) {
                  setBurstKey((k) => k + 1);
                  playPartyPopperSound();
                }
                return next;
              });
            }}
            aria-label="Toggle audio"
            title={sound ? "Party sound ON (click to mute)" : "Party sound OFF (click to play party popper)"}
            className={`p-2 text-[#FFF8CA] hover:bg-white/10 cursor-pointer ${pill}`}
          >
            {sound ? <Volume2 className="w-4 h-4 text-[#FDE047]" /> : <VolumeX className="w-4 h-4 text-white/50" />}
          </button>
          <Link
            to="/home"
            title="Exit Wrap"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[#FFF8CA] hover:text-white text-xs font-sans font-semibold ${pill}`}
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </Link>
        </div>
      </header>

      {/* Bottom Scroll Hint on Slide 0 */}
      <AnimatePresence>
        {active === 0 && slides.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-1 font-sans text-xs font-medium text-[#FFF8CA]/80 tracking-wide"
          >
            <span className="sm:hidden">Scroll</span>
            <span className="hidden sm:inline">Scroll or use the arrow keys</span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            >
              <ArrowDown className="w-4 h-4 text-[#CDE3E8]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN SNAP SCROLL CONTAINER ── */}
      <main
        ref={scrollRef}
        className="relative h-dvh overflow-y-scroll snap-y snap-mandatory bg-[#0E1626] scroll-smooth"
      >
        {wrap.isPending ? (
          <Center>
            <div className="font-cursive text-3xl text-[#CDE3E8] animate-pulse">
              Wrapping up your month…
            </div>
          </Center>
        ) : code === "not_ready" ? (
          <Center>
            <h2 className="font-serif text-4xl font-bold text-[#FFF8CA]">
              Your wrap is being prepared
            </h2>
            <p className="font-sans text-sm text-[#CDE3E8]">
              Finished months are stored a few hours after they end. Check back soon.
            </p>
          </Center>
        ) : wrap.isError ? (
          <Center>
            <StickerBadge name="offlineDino" size="md" variant="polaroid" caption="offline" />
            <h2 className="font-serif text-3xl font-bold text-[#FFF8CA]">
              Could not load your wrap
            </h2>
            <p className="font-sans text-xs text-[#CDE3E8]">{getApiErrorMessage(wrap.error)}</p>
            <button className={button} onClick={() => void wrap.refetch()}>
              Try again
            </button>
          </Center>
        ) : (
          <>
            {/* ── SLIDE 0: PARTY POPPER CELEBRATION INTRO WITH WEBSITE TYPOGRAPHY ── */}
            <section className="relative flex h-dvh max-h-dvh snap-start flex-col items-center justify-center px-4 sm:px-6 pt-14 pb-4 text-center overflow-hidden bg-gradient-to-b from-[#170C1F] via-[#261334] to-[#0B1320]">
              {/* Ambient Starlight */}
              <div
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  backgroundImage: "radial-gradient(#FFF8CA 1.2px, transparent 1.2px)",
                  backgroundSize: "32px 32px",
                }}
              />

              {/* Celebration Card */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 max-h-[calc(100dvh-6.5rem)] w-full max-w-xl overflow-y-auto rounded-[2.2rem] border-2 border-[#CDE3E8]/50 bg-[#2D120D]/90 text-center shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl"
              >
                {/* Rosewood Header Bar */}
                <div className="flex items-center justify-between gap-2 border-b border-[#FFF8CA]/25 bg-[#6B0B0C] px-4 py-2.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF5F56]" />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FFBD2E]" />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#27C93F]" />
                    <span className="ml-1.5 truncate font-sans text-xs font-semibold tracking-wide text-[#FFF8CA]">
                      DevZ-Go · Monthly Wrap
                    </span>
                  </div>
                  <span className="shrink-0 whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-widest text-[#CDE3E8]">
                    {w!.status === "completed" ? "COMPLETED" : "LIVE WRAP"}
                  </span>
                </div>

                {/* Body */}
                <div className="px-6 py-6 sm:px-10 sm:py-7 flex flex-col items-center gap-3.5">
                  <motion.button
                    type="button"
                    onClick={() => popConfetti(true)}
                    whileHover={{ scale: 1.06, rotate: -3 }}
                    whileTap={{ scale: 0.94 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF8CA] text-[#6B0B0C] font-sans text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    <span>Your monthly wrap is here</span>
                  </motion.button>

                  <div>
                    <span className="font-cursive text-3xl sm:text-4xl text-[#CDE3E8] block">
                      Where coders celebrate
                    </span>
                    <h1 className="m-0 mt-0.5 break-words font-serif text-4xl font-bold leading-tight tracking-tight text-[#FFF8CA] sm:text-6xl">
                      {monthName(w!.month)}
                    </h1>
                  </div>

                  <StickerBadge
                    name="snoopyAutumn"
                    size="md"
                    variant="polaroid"
                    caption="monthly highlights"
                  />

                  <p className="font-sans text-xs sm:text-sm text-[#FFF8CA]/85 leading-relaxed max-w-md m-0">
                    {w!.empty
                      ? "Your month is just getting started—explore your wrap cards below or ship a new build!"
                      : "Every project you shipped, note you shared, and creator you connected with—wrapped up to celebrate."}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        popConfetti();
                        jump(1);
                      }}
                      className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#FFF8CA] hover:bg-[#CDE3E8] text-[#2D120D] font-sans text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      <span>Open your month</span>
                    </button>

                    {w!.empty && (
                      <Link
                        to="/add-project"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-[#CDE3E8]/45 bg-white/10 hover:bg-white/20 text-[#FFF8CA] font-sans text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-[#CDE3E8]" />
                        <span>Add project</span>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            </section>

            {/* ── CHAPTER SLIDES ── */}
            {slides.map((c, i) => {
              const currentTheme = themeAt(i + 1);
              const nextTheme = themeAt(i + 2);
              return (
                <WrapChapter
                  key={c.title + i}
                  index={String(i + 1).padStart(2, "0")}
                  label={c.label}
                  cursiveKicker={c.cursiveKicker}
                  title={c.title}
                  text={c.text}
                  variant={currentTheme.variant}
                  accentColor={currentTheme.color}
                  nextColor={nextTheme.color}
                  codeFilename={c.file}
                  codeSnippet={c.code}
                  nextCodeSnippet={slides[i + 1]?.code.split("\n")[0]}
                  onNext={() => jump(i + 2)}
                >
                  {c.visual}
                </WrapChapter>
              );
            })}

            {/* ── FINAL PERSONA / CELEBRATION SLIDE ── */}
            <WrapChapter
              index={String(slides.length + 1).padStart(2, "0")}
              label="Persona"
              cursiveKicker="Your builder identity"
              title={w!.persona?.label ?? "The Explorer"}
              text={
                w!.persona
                  ? `${w!.persona.rule}.`
                  : "Keep shipping projects and connecting with fellow builders to level up your monthly wrap."
              }
              variant="cyber-plum"
              accentColor="#D5BEEA"
              isLast
              onReplay={() => {
                popConfetti();
                jump(0);
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <StickerBadge
                  name="cloverLadybug"
                  size="md"
                  variant="polaroid"
                  caption="keep building"
                />

                {w!.empty && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                    <Link to="/add-project" className={button}>
                      + Add a Project
                    </Link>
                    <Link
                      to="/network"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 px-4 py-2 font-sans text-xs font-semibold text-[#FFF8CA]"
                    >
                      <Users className="w-3.5 h-3.5 text-[#D5BEEA]" />
                      <span>Visit Network</span>
                    </Link>
                  </div>
                )}

                {w!.status === "completed" &&
                  (w!.shared || share.isSuccess ? (
                    <Link to="/network" className="font-sans text-xs font-semibold text-emerald-300">
                      Shared to your feed ✓
                    </Link>
                  ) : (
                    <button
                      className={button}
                      disabled={share.isPending}
                      onClick={() => share.mutate()}
                    >
                      Share to feed
                    </button>
                  ))}
                {share.isError && (
                  <p className="font-sans text-xs text-rose-400">
                    {getApiErrorMessage(share.error)}
                  </p>
                )}
              </div>
            </WrapChapter>
          </>
        )}
      </main>
    </div>
  );
}
