import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, Loader2, AlertCircle } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ProjectCard } from "../components/ProjectCard";
import { fetchProjects, fetchTechStacks } from "../api/projects";
import type { TechStackItem } from "../api/projects";
import { transformApiProject } from "../utils/projectTransform";
import { getApiErrorMessage } from "../utils/apiError";
import type { Project } from "../types/project";

function stackNumericId(t: TechStackItem): number | null {
  const n = typeof t.id === "number" ? t.id : Number(t.id);
  return Number.isFinite(n) ? n : null;
}

export function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [techStacks, setTechStacks] = useState<TechStackItem[]>([]);
  const [filterStackId, setFilterStackId] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async (stackId: number | "all") => {
    setLoading(true);
    setError(null);
    try {
      const params =
        stackId === "all"
          ? undefined
          : { tech_stack_id: stackId };
      const list = await fetchProjects(params);
      setProjects(list.map((api, i) => transformApiProject(api, i)));
    } catch (err) {
      setError(getApiErrorMessage(err));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchTechStacks()
      .then((stacks) => {
        if (!cancelled) setTechStacks(stacks);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load tech stack filters.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadProjects(filterStackId);
  }, [filterStackId, loadProjects]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-8 pt-28 pb-16">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-600 mb-2">
              <Compass className="w-6 h-6" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Community
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Explore projects
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Public projects from everyone on DevZ-Go. Open a card to view details.
            </p>
          </div>
          <Link
            to="/home"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 shrink-0"
          >
            ← Back to home
          </Link>
        </div>

        {techStacks.length > 0 && (
          <div className="mb-10">
            <p className="text-sm font-medium text-gray-500 mb-3">Filter by tech stack</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterStackId("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  filterStackId === "all"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                All projects
              </button>
              {techStacks.map((t) => {
                const id = stackNumericId(t);
                if (id === null) return null;
                const active = filterStackId === id;
                return (
                  <button
                    key={`${t.id}-${t.name}`}
                    type="button"
                    onClick={() => setFilterStackId(id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 mb-8">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-600">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p>Loading projects…</p>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 px-8 py-16 text-center text-gray-600">
            <p className="mb-4">No public projects match this filter yet.</p>
            <Link
              to="/add-project"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Be the first to add one
            </Link>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} variant="compact" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
