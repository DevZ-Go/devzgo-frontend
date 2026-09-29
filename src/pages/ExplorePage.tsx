import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Compass,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Navbar } from "../components/Navbar";
import { ProjectCard } from "../components/ProjectCard";
import {
  fetchProjects,
  fetchTechStacks,
} from "../api/projects";
import type { TechStackItem } from "../api/projects";
import { transformApiProject } from "../utils/projectTransform";
import { getApiErrorMessage } from "../utils/apiError";
import type { Project } from "../types/project";
import { getTechStackFilterClasses } from "../utils/techStackChipStyle";

function stackNumericId(t: TechStackItem): number | null {
  const n = typeof t.id === "number" ? t.id : Number(t.id);
  return Number.isFinite(n) ? n : null;
}

export function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [techStacks, setTechStacks] = useState<TechStackItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [filterStackId, setFilterStackId] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: {
        search?: string;
        category?: string;
        tech_stack_ids?: string;
        sort_by?: string;
      } = {};

      const trimmedSearch = search.trim();

      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      if (category) {
        params.category = category;
      }

      if (filterStackId !== "all") {
        params.tech_stack_ids = String(filterStackId);
      }

      params.sort_by = sortBy;

      const list = await fetchProjects(
        Object.keys(params).length > 0 ? params : undefined
      );

      setProjects(
        list.map((api, i) => transformApiProject(api, i))
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, filterStackId, sortBy]);

  useEffect(() => {
    let cancelled = false;

    fetchTechStacks()
      .then((stacks) => {
        if (!cancelled) {
          setTechStacks(stacks);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load tech stack filters.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  function clearFilters() {
    setSearch("");
    setCategory("");
    setFilterStackId("all");
    setSortBy("newest");
  }

  const hasFilters =
    search.trim() !== "" ||
    category !== "" ||
    filterStackId !== "all" ||
    sortBy !== "newest";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-8 pt-28 pb-16">
        {/* Page heading */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-600 mb-2">



            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Explore projects
            </h1>

            <p className="text-gray-600 max-w-2xl">
              Discover public projects from the DevZ-Go community.
              Search by project details or filter by category and
              technology.
            </p>
          </div>

          <Link
            to="/home"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 shrink-0"
          >
            ← Back to home
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />

            <h2 className="font-semibold text-gray-900">
              Find a project
            </h2>
          </div>

          {/* Search + category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Search */}
            <div>
              <label
                htmlFor="project-search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  id="project-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void loadProjects();
                    }
                  }}
                  placeholder="Search projects..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="project-category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category
              </label>

              <select
                id="project-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All categories</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Web Development">
                  Web Development
                </option>
                <option value="Mobile Development">
                  Mobile Development
                </option>
                <option value="Desktop Application">
                  Desktop Application
                </option>
                <option value="Game Development">
                  Game Development
                </option>
                <option value="Data Science">
                  Data Science
                </option>
                <option value="Cybersecurity">
                  Cybersecurity
                </option>
                <option value="Cloud/DevOps">
                  Cloud/DevOps
                </option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="project-sort"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Sort by
            </label>

            <select
              id="project-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="updated">Recently Updated</option>
              <option value="title_asc">Title: A-Z</option>
              <option value="title_desc">Title: Z-A</option>
            </select>
          </div>

          {/* Tech stacks */}
          {techStacks.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Technology
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilterStackId("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${filterStackId === "all"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                >
                  All technologies
                </button>

                {techStacks.map((t) => {
                  const id = stackNumericId(t);

                  if (id === null) {
                    return null;
                  }

                  const active = filterStackId === id;

                  return (
                    <button
                      key={`${t.id}-${t.name}`}
                      type="button"
                      onClick={() => setFilterStackId(id)}
                      className={getTechStackFilterClasses(
                        t.name,
                        active
                      )}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void loadProjects()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}

              Apply filters
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 mb-8">
            <AlertCircle className="w-6 h-6 shrink-0" />

            <p>{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-600">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />

            <p>Loading projects…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 px-8 py-16 text-center text-gray-600">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Search className="w-6 h-6 text-gray-400" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No projects found
            </h3>

            <p className="mb-5">
              Try changing your search or filters.
            </p>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            ) : (
              <Link
                to="/add-project"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Be the first to add one
              </Link>
            )}
          </div>
        )}

        {/* Projects */}
        {!loading && !error && projects.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {projects.length}
                </span>{" "}
                {projects.length === 1 ? "project" : "projects"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  variant="compact"
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}