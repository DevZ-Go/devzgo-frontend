import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ExploreStage } from "../components/explore/ExploreStage";
import { useExploreProjects } from "../hooks/useExploreProjects";
import { toTvProject } from "../components/tvworld/worldLayout";

/** Projects hung as framed prints. The wall stays on one screen; the frames slide sideways. */
export function StudioWallPage() {
  const data = useExploreProjects();
  const scroller = useRef<HTMLDivElement>(null);
  const projects = useMemo(() => (data.projects ?? []).map((p, i) => toTvProject(p, i)), [data.projects]);

  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 });
  }, [data.appliedKey]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const el = scroller.current;
      if (!el) return;
      if (e.key === "ArrowRight") el.scrollBy({ left: 320, behavior: "smooth" });
      if (e.key === "ArrowLeft") el.scrollBy({ left: -320, behavior: "smooth" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ExploreStage title="Studio Wall" tone="paper" data={data}>
      {data.projects === null ? (
        <p className="flex h-full items-center justify-center font-serif text-stone-500">Hanging the prints…</p>
      ) : projects.length === 0 ? (
        <p className="flex h-full items-center justify-center text-stone-500">No projects match these filters.</p>
      ) : (
        <div
          ref={scroller}
          className="flex h-full items-stretch gap-6 overflow-x-auto overflow-y-hidden px-6 py-6 snap-x snap-mandatory sm:px-10"
        >
          {projects.map((project) => (
            <article
              key={project.id}
              className="flex w-[280px] shrink-0 snap-center flex-col rounded-sm bg-white p-3 shadow-md ring-1 ring-stone-200"
            >
              <div className="min-h-0 flex-1 overflow-hidden bg-stone-200">
                {project.coverUrl ? (
                  <img src={project.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-serif text-stone-400">No cover</div>
                )}
              </div>
              <div className="pt-3">
                <h2 className="break-words font-serif text-xl leading-tight text-stone-900">{project.title}</h2>
                <p className="mt-1 break-all font-mono text-[11px] text-stone-500">@{project.author}</p>
                <p className="mt-2 line-clamp-2 text-sm text-stone-600">{project.shortDescription}</p>
                <Link to={`/project/${project.id}`} className="mt-3 inline-block text-xs font-semibold uppercase tracking-wider text-maroon-800">
                  Open project
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </ExploreStage>
  );
}
