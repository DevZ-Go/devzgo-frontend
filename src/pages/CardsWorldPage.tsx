import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ExploreStage } from "../components/explore/ExploreStage";
import { useExploreProjects } from "../hooks/useExploreProjects";
import { toTvProject } from "../components/tvworld/worldLayout";
import type { TvProject } from "../components/tvworld/types";
import { useProjectLike } from "../hooks/useProjectLike";
import { useAuth } from "../auth/AuthContext";

const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7"];

const RED = "#e11d48";
const INK = "#1c1917";

function Suit({ name, className }: { name: (typeof SUITS)[number]; className?: string }) {
  const ink = name === "hearts" || name === "diamonds" ? RED : INK;
  if (name === "clubs") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle cx="12" cy="7.1" r="3.15" fill={ink} />
        <circle cx="7.35" cy="12.7" r="3.15" fill={ink} />
        <circle cx="16.65" cy="12.7" r="3.15" fill={ink} />
        <path d="M10.7 14.2h2.6l.9 6.2h-4.4l.9-6.2z" fill={ink} />
      </svg>
    );
  }
  if (name === "spades") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M12 1.8c2.7 3.5 7.6 6 7.6 10.6a4.7 4.7 0 0 1-7.8 3.5 4.7 4.7 0 0 1-7.8-3.5C4.4 7.8 9.3 5.3 12 1.8z" fill={ink} />
        <path d="M10.7 15.2h2.6l.9 6.2h-4.4l.9-6.2z" fill={ink} />
      </svg>
    );
  }
  const path = name === "hearts"
    ? "M12 20.6S4.6 16 4.6 11.2a4.15 4.15 0 0 1 7.4-2.6 4.15 4.15 0 0 1 7.4 2.6C19.4 16 12 20.6 12 20.6z"
    : "M12 2.2 20.2 12 12 21.8 3.8 12 12 2.2z";
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={path} fill={ink} />
    </svg>
  );
}

function CardFace({ project, suit, rank }: { project: TvProject; suit: (typeof SUITS)[number]; rank: string }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { count, liked, busy, toggle } = useProjectLike(project.id, project.likes, project.isLiked);
  const media = project.coverUrl || project.videoUrl;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white text-stone-950 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
      <div className="flex items-start justify-between px-4 pt-3">
        <div className="text-center leading-none">
          <div className="font-serif text-2xl">{rank}</div>
          <Suit name={suit} className="mx-auto mt-1 h-4 w-4" />
        </div>
        <span className="rounded-full bg-[#fced96] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-stone-900">
          {project.category || "Project"}
        </span>
        <div className="rotate-180 text-center leading-none">
          <div className="font-serif text-2xl">{rank}</div>
          <Suit name={suit} className="mx-auto mt-1 h-4 w-4" />
        </div>
      </div>
      <div className="relative mx-1 mt-2 min-h-0 flex-1 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
        {media ? (
          <img src={media} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#fff7ed,#fecdd3)]">
            <Suit name={suit} className="h-16 w-16" />
          </div>
        )}
        <Suit name={suit} className="pointer-events-none absolute bottom-2 right-2 h-8 w-8 opacity-80" />
      </div>
      <div className="space-y-3 px-4 py-4">
        <div>
          <h2 className="break-words font-serif text-2xl leading-tight text-stone-950">{project.title}</h2>
          <p className="mt-1 break-all font-mono text-[11px] text-stone-500">@{project.author}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!token) navigate("/login");
              else void toggle();
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${liked ? "bg-rose-600 text-white" : "bg-stone-100 text-stone-800"}`}
          >
            {liked ? "Liked" : "Like"} · {count.toLocaleString()}
          </button>
          <Link to={`/project/${project.id}`} className="rounded-full bg-stone-950 px-3 py-1.5 text-xs font-semibold text-[#fced96]">
            Open
          </Link>
          {project.ownerId && (
            <Link to={`/profile/${project.ownerId}`} className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700">
              Profile
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function CardsWorldPage() {
  const data = useExploreProjects();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const projects = useMemo(() => (data.projects ?? []).map((p, i) => toTvProject(p, i)), [data.projects]);

  useEffect(() => {
    setIndex(0);
  }, [data.appliedKey]);

  function go(next: number) {
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") go(Math.max(0, index - 1));
      if (e.key === "ArrowRight") go(Math.min(projects.length - 1, index + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, projects.length]);

  const current = projects[index];
  const suit = SUITS[index % SUITS.length]!;
  const rank = RANKS[index % RANKS.length]!;

  return (
    <ExploreStage title="House of Cards" tone="deck" data={data}>
      {data.projects === null ? (
        <p className="flex h-full items-center justify-center font-serif text-lg text-fuchsia-100">Shuffling the deck…</p>
      ) : projects.length === 0 ? (
        <p className="flex h-full items-center justify-center text-fuchsia-100/80">No projects match these filters.</p>
      ) : (
        <div className="relative flex h-full flex-col overflow-hidden bg-[#120814]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-[46%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,#2f9d62_0%,#146b3a_46%,transparent_70%)]" />
            <div className="absolute left-1/2 top-1/2 h-[70%] w-[min(880px,88%)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-[12px] border-[#e7c56a] shadow-[inset_0_0_60px_rgba(0,0,0,0.35),0_0_0_8px_rgba(120,53,15,0.45)]" />
          </div>
          {[
            { name: "hearts" as const, className: "left-[8%] top-[18%] h-14 w-14" },
            { name: "diamonds" as const, className: "right-[10%] top-[22%] h-12 w-12" },
            { name: "clubs" as const, className: "left-[14%] bottom-[18%] h-12 w-12" },
            { name: "spades" as const, className: "right-[12%] bottom-[20%] h-14 w-14" },
          ].map((pip, i) => (
            <motion.div
              key={pip.name}
              className={`pointer-events-none absolute ${pip.className}`}
              animate={{ y: [0, -10, 0], rotate: [0, i % 2 ? 10 : -10, 0] }}
              transition={{ duration: 4.5 + i, repeat: Infinity, ease: "easeInOut" }}
            >
              <Suit name={pip.name} className="h-full w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]" />
            </motion.div>
          ))}
          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-3">
            <div className="relative h-[min(32rem,100%)] w-[min(18.5rem,72vw)]">
              <div className="absolute inset-y-2 -left-3 right-6 origin-bottom -rotate-[16deg] rounded-[1.35rem] border border-white/30 bg-[repeating-linear-gradient(135deg,#fb7185_0_14px,#9f1239_14px_28px)] shadow-2xl" />
              <div className="absolute inset-y-1 -right-3 left-6 origin-bottom rotate-[14deg] rounded-[1.35rem] border border-white/30 bg-[radial-gradient(circle_at_30%_20%,#99f6e4,#0f766e)] shadow-2xl" />
              <div className="absolute inset-0 origin-bottom rotate-[4deg] rounded-[1.35rem] border border-[#e7c56a]/50 bg-[repeating-linear-gradient(45deg,#fde68a_0_12px,#b45309_12px_24px)] shadow-2xl" />
              <AnimatePresence mode="wait" custom={direction}>
                {current && (
                  <motion.div
                    key={current.id}
                    custom={direction}
                    initial={{ x: direction * 160, y: 36, rotate: direction * 14, opacity: 0 }}
                    animate={{ x: 0, y: 0, rotate: -2, opacity: 1 }}
                    exit={{ x: direction * -180, y: 24, rotate: direction * -12, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 22 }}
                    className="relative z-10 h-full"
                  >
                    <CardFace project={current} suit={suit} rank={rank} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="relative z-10 flex shrink-0 items-center justify-center gap-3 px-4 pb-4">
            <button type="button" disabled={index === 0} onClick={() => go(Math.max(0, index - 1))} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-950 shadow disabled:opacity-30">
              Previous
            </button>
            <span className="grid h-11 w-11 place-items-center rounded-full border-4 border-dashed border-[#e7c56a] bg-[#b91c1c] font-mono text-[10px] text-white">
              {index + 1}/{projects.length}
            </span>
            <button type="button" disabled={index === projects.length - 1} onClick={() => go(Math.min(projects.length - 1, index + 1))} className="rounded-full bg-[#fced96] px-4 py-2 text-sm font-semibold text-stone-950 shadow disabled:opacity-30">
              Next
            </button>
          </div>
        </div>
      )}
    </ExploreStage>
  );
}
