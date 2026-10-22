import { Link } from "react-router-dom";
import { ExploreStage } from "../components/explore/ExploreStage";
import { useExploreProjects } from "../hooks/useExploreProjects";
import { resolveApiAssetUrl } from "../api/config";

/** A plain catalog: cover, title, and author. The same projects as the other rooms. */
export function CatalogPage() {
  const data = useExploreProjects();
  const projects = data.projects ?? [];

  return (
    <ExploreStage title="Projects" tone="paper" data={data}>
      {data.projects === null ? (
        <p className="flex h-full items-center justify-center font-serif text-stone-500">Loading projects…</p>
      ) : projects.length === 0 ? (
        <p className="flex h-full items-center justify-center text-stone-500">No projects match these filters.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8">
          <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const cover = resolveApiAssetUrl(project.cover_image_url || project.image_url);
              return (
                <li key={project.id}>
                  <Link to={`/project/${project.id}`} className="block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md">
                    <div className="aspect-[16/10] bg-[#efe8d8]">
                      {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 font-serif text-lg text-stone-700">{project.title}</div>
                      )}
                    </div>
                    <div className="px-4 py-3">
                      <h2 className="break-words font-serif text-xl text-stone-900">{project.title}</h2>
                      <p className="mt-1 break-all font-mono text-[11px] text-stone-500">
                        @{project.owner_username || project.owner?.username || "developer"}
                        {project.category ? ` · ${project.category}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ExploreStage>
  );
}
