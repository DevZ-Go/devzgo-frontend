// src/pages/WrapPage.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, CalendarDays, Volume2, VolumeX, ArrowDown } from "lucide-react";
import { WrapChapter } from "../components/wrap/WrapChapter";
import { PixelSprite } from "../components/wrap/PixelSprite";
import { POTION, INVADER, CHERRIES, HEART, GHOST } from "../components/wrap/sprites";
import { fetchCurrentWrap, fetchWrap, fetchWrapMonths, shareWrap, type Wrap } from "../api/wraps";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";

const COLORS = ["#4cc9f0", "#39ff14", "#ff5d3a", "#e63946", "#ff9f1c", "#b388ff", "#ffd60a"];
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const monthName = (month: string) =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString(undefined, { month: "long", year: "numeric" });

type Chapter = { label: string; title: string; text: string; sprite: ReactNode; file: string; code: string };

/** One slide per metric that actually happened; nothing is shown for zero or missing data. */
function chapters(w: Wrap): Chapter[] {
  const m = w.metrics;
  const out: Chapter[] = [];
  const add = (show: unknown, label: string, title: string, text: string, sprite: typeof HEART, file: string, code: string) =>
    show && out.push({ label, title, text, sprite: <PixelSprite sprite={sprite} size={18} />, file, code });

  add(m.projects_created, "Shipped", `You started ${plural(m.projects_created, "project")}`, "Every one of them is on your profile.", POTION,
    "projects.ts", `export const projectsCreated = ${m.projects_created};`);
  add(m.top_tech.length, "Stack", `Your stack: ${m.top_tech[0]}`, m.top_tech.join(" • "), INVADER,
    "tech.stack.ts", `export const topTech = [${m.top_tech.map((t) => `"${t}"`).join(", ")}];`);
  add(m.project_likes_received + m.project_comments_received, "Noticed", "People noticed your work",
    `${plural(m.project_likes_received, "like")} and ${plural(m.project_comments_received, "comment")} on your projects.`, HEART,
    "feedback.ts", `const likes = ${m.project_likes_received};\nconst comments = ${m.project_comments_received};`);
  add(m.posts_published, "Posts", `You posted ${plural(m.posts_published, "time")}`,
    `${plural(m.post_likes_received, "like")} and ${plural(m.post_comments_received, "comment")} came back.`, CHERRIES,
    "posts.ts", `const posts = ${m.posts_published};\nconst likes = ${m.post_likes_received};\nconst comments = ${m.post_comments_received};`);
  add(m.connections_made, "Network", `${plural(m.connections_made, "new connection")}`, "Your network grew.", GHOST,
    "network.ts", `export const newConnections = ${m.connections_made};`);
  add(m.projects_joined + m.members_joined_my_projects + m.invitations_sent, "Collab", "Built together",
    `${plural(m.projects_joined, "project")} joined, ${plural(m.members_joined_my_projects, "member")} joined yours, ${plural(m.invitations_sent, "invitation")} sent.`, HEART,
    "collaborations.ts", `const joined = ${m.projects_joined};\nconst membersJoinedMine = ${m.members_joined_my_projects};\nconst invitesSent = ${m.invitations_sent};`);
  add(m.top_liked_category, "Taste", `You liked ${m.top_liked_category} projects the most`, "Based on the projects you liked.", CHERRIES,
    "taste.ts", `export const favoriteCategory = "${m.top_liked_category}";`);
  return out;
}

function Center({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center text-stone-100">{children}</div>;
}

const pill = "rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-800 shadow-xl";
const button = "rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-300 disabled:opacity-60";

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
  const code = axios.isAxiosError(wrap.error) ? (wrap.error.response?.data as { code?: string } | undefined)?.code : undefined;
  const slides = w && !w.empty ? chapters(w) : [];
  const nav = [{ label: "Intro" }, ...slides, { label: "Persona" }];

  const scrollRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [sound, setSound] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollTop / window.innerHeight));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  const jump = (i: number) => scrollRef.current?.scrollTo({ top: i * window.innerHeight, behavior: "smooth" });
  const color = (i: number) => COLORS[i % COLORS.length]!;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-stone-950 font-sans selection:bg-amber-400 selection:text-black">
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between gap-3 pointer-events-none">
        <div className={`pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 text-white text-xs font-mono ${pill}`}>
          <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold tracking-wider">DEVZ-GO</span>
          <span className="text-stone-500">|</span>
          <span className="text-stone-400 font-medium">WRAP</span>
        </div>

        {slides.length > 0 && (
          <div className={`hidden md:flex pointer-events-auto items-center gap-2 px-3 py-1.5 ${pill}`}>
            {nav.map((ch, i) => (
              <button key={ch.label + i} type="button" onClick={() => jump(i)} title={ch.label}
                className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono cursor-pointer">
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${active === i ? "scale-125" : "opacity-40 group-hover:opacity-80"}`}
                  style={{ backgroundColor: active === i ? color(i) : "#a8a29e", boxShadow: active === i ? `0 0 8px ${color(i)}` : "none" }} />
                {active === i && <span style={{ color: color(i) }} className="font-bold">{ch.label}</span>}
              </button>
            ))}
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-2">
          <select value={picked ?? ""} aria-label="Wrap month" className={`px-3 py-1.5 text-xs text-stone-200 ${pill}`}
            onChange={(e) => setParams(e.target.value ? { month: e.target.value } : {})}>
            <option value="">This month (so far)</option>
            {(months.data ?? []).map((m) => <option key={m} value={m}>{monthName(m)}</option>)}
          </select>
          <button type="button" onClick={() => setSound((v) => !v)} aria-label="Toggle audio"
            className={`p-2 text-stone-300 hover:bg-stone-800 cursor-pointer ${pill}`}>
            {sound ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <Link to="/home" title="Exit Wrap"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-stone-300 hover:text-white text-xs font-semibold ${pill}`}>
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {active === 0 && slides.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-1 font-mono text-[11px] text-stone-400 tracking-wider uppercase">
            <span>Scroll or swipe down</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
              <ArrowDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main ref={scrollRef} className="h-screen overflow-y-scroll snap-y snap-mandatory bg-stone-950 scroll-smooth">
        {wrap.isPending ? (
          <Center>
            <div className="h-10 w-64 animate-pulse rounded bg-stone-800" />
            <div className="h-4 w-48 animate-pulse rounded bg-stone-800" />
          </Center>
        ) : code === "not_ready" ? (
          <Center>
            <h2 className="font-serif text-3xl font-bold text-stone-50">Your wrap is being prepared</h2>
            <p className="text-stone-400">Finished months are stored a few hours after they end. Check back soon.</p>
          </Center>
        ) : wrap.isError ? (
          <Center>
            <h2 className="font-serif text-2xl font-bold text-stone-50">Could not load your wrap</h2>
            <p className="text-stone-400">{getApiErrorMessage(wrap.error)}</p>
            <button className={button} onClick={() => void wrap.refetch()}>Try again</button>
          </Center>
        ) : w!.empty ? (
          <Center>
            <h2 className="font-serif text-3xl font-bold text-stone-50">{w!.status === "completed" ? `Nothing happened in ${monthName(w!.month)}` : "Your month is just getting started"}</h2>
            <p className="max-w-md text-stone-400">Your wrap fills in from real activity: projects, posts, connections and collaborations.</p>
            <div className="flex gap-3">
              <Link to="/add-project" className={button}>Add a project</Link>
              <Link to="/network" className="rounded-full border border-stone-700 px-4 py-2 text-sm font-semibold text-stone-200">Visit the network</Link>
            </div>
          </Center>
        ) : (
          <>
            <section className="flex h-screen snap-start flex-col items-center justify-center gap-3 px-8 text-center text-stone-100">
              <span className="font-mono text-sm tracking-widest text-stone-400">
                {w!.status === "completed" ? "MONTHLY WRAP" : `SO FAR · AS OF ${new Date(w!.as_of!).toLocaleString()}`}
              </span>
              <h1 className="font-serif text-5xl font-bold text-stone-50 md:text-7xl">{monthName(w!.month)}</h1>
              <p className="text-stone-400">Times in {w!.period.timezone}.</p>
            </section>
            {slides.map((c, i) => (
              <WrapChapter key={c.title} index={String(i + 1).padStart(2, "0")} title={c.title} text={c.text}
                accentColor={color(i + 1)} nextColor={color(i + 2)} codeFilename={c.file} codeSnippet={c.code}
                nextCodeSnippet={slides[i + 1]?.code.split("\n")[0]}>
                {c.sprite}
              </WrapChapter>
            ))}
            <WrapChapter index={String(slides.length + 1).padStart(2, "0")} title={w!.persona?.label ?? "That's your month"} text={w!.persona ? `Why: ${w!.persona.rule}.` : ""}
              accentColor={color(slides.length + 1)} isLast onReplay={() => jump(0)}>
              <div className="flex flex-col items-center gap-3">
                <PixelSprite sprite={GHOST} size={18} />
                {w!.status === "completed" && (w!.shared || share.isSuccess ? (
                  <Link to="/network" className="text-sm font-semibold text-emerald-400">Shared to your feed ✓</Link>
                ) : (
                  <button className={button} disabled={share.isPending} onClick={() => share.mutate()}>Share to feed</button>
                ))}
                {share.isError && <p className="text-sm text-red-400">{getApiErrorMessage(share.error)}</p>}
              </div>
            </WrapChapter>
          </>
        )}
      </main>
    </div>
  );
}
