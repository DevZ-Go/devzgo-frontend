import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Compass,
  Loader2,
  AlertCircle,
  Users,
  UserPlus,
  Send,
  Check,
  MapPin,
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
import type { DeveloperProfile } from "../types/network";
import { searchDevelopers } from "../api/profiles";
import { sendConnectionRequest } from "../api/connections";
import { getTechStackFilterClasses } from "../utils/techStackChipStyle";

function stackNumericId(t: TechStackItem): number | null {
  const n = typeof t.id === "number" ? t.id : Number(t.id);
  return Number.isFinite(n) ? n : null;
}

export function ExplorePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"projects" | "developers">("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [devSearch, setDevSearch] = useState("");
  const [techStacks, setTechStacks] = useState<TechStackItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [filterStackId, setFilterStackId] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestedUsers, setRequestedUsers] = useState<Record<string, boolean>>({});

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

  const loadDevelopers = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const devs = await searchDevelopers(query);
      setDevelopers(devs);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (activeTab === "projects") {
      void loadProjects();
    } else {
      void loadDevelopers(devSearch);
    }
  }, [activeTab, filterStackId, devSearch, sortBy, category, loadProjects, loadDevelopers]);

  async function handleConnect(devId: string) {
    setRequestedUsers((prev) => ({ ...prev, [devId]: true }));
    try {
      await sendConnectionRequest(devId);
    } catch {
      // Ignore
    }
  }

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-6 sm:px-8 pt-28 pb-16">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-600 mb-2 font-semibold uppercase tracking-wider text-xs">
              <Compass className="w-4 h-4" />
              Talent & Project Discovery
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Explore DevZ-Go
            </h1>
            <p className="text-gray-600 max-w-2xl mt-1">
              Discover engineering talent, explore open source portfolios, and form project collaborations.
            </p>
          </div>

          <Link
            to="/home"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 shrink-0"
          >
            ← Back to home
          </Link>
        </div>

        {/* Explore Sub-navigation Tabs */}
        <div className="flex border-b border-gray-200/80 mb-8 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "projects"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Compass className="w-4 h-4" />
            Explore Projects
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("developers")}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "developers"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Find Developers & Recruiter View
          </button>
        </div>

        {/* Tab 1: Projects Discovery */}
        {activeTab === "projects" && (
          <div>
            {/* Filters */}
            <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Find a project</h2>
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
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Desktop Application">Desktop Application</option>
                    <option value="Game Development">Game Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Cloud/DevOps">Cloud/DevOps</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mb-5">
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
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                        filterStackId === "all"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      All technologies
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
                          className={getTechStackFilterClasses(t.name, active)}
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
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
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
                    <div key={project.id} className="flex flex-col gap-2">
                      <ProjectCard project={project} variant="compact" />
                      {project.author?.username && (
                        <div className="flex items-center justify-between px-2 pt-1">
                          <Link
                            to={`/profile/${project.author.username}`}
                            className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition flex items-center gap-1.5"
                          >
                            <img
                              src={project.author.avatar}
                              alt={project.author.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span>By @{project.author.username}</span>
                          </Link>
                          <Link
                            to={`/profile/${project.author.username}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            View Profile →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Developers & Talent Discovery */}
        {activeTab === "developers" && (
          <div>
            <div className="mb-8 max-w-md">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, skill (Python, React...), or title..."
                  value={devSearch}
                  onChange={(e) => setDevSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-600">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-sm">Finding developers…</p>
              </div>
            ) : developers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 px-8 py-16 text-center text-gray-500 text-sm">
                No developers match your query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {developers.map((dev) => {
                  const hasRequested = requestedUsers[dev.userId || dev.id];
                  const skills = dev.skills
                    ? dev.skills.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];

                  return (
                    <div
                      key={dev.id}
                      className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start gap-4 mb-4">
                          <Link to={`/profile/${dev.userId || dev.id || dev.username}`}>
                            {dev.avatarUrl ? (
                              <img
                                src={dev.avatarUrl}
                                alt={dev.fullName || dev.username}
                                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-100 shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-sm">
                                {dev.username.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/profile/${dev.userId || dev.id || dev.username}`}
                                className="font-bold text-gray-900 text-base hover:text-blue-600 truncate block"
                              >
                                {dev.fullName || dev.username}
                              </Link>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">
                              @{dev.username}
                            </span>
                            {dev.headline && (
                              <p className="text-xs text-gray-600 font-medium line-clamp-1 mt-1">
                                {dev.headline}
                              </p>
                            )}
                            {dev.location && (
                              <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>{dev.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {dev.bio && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                            {dev.bio}
                          </p>
                        )}

                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="text-[11px] px-2.5 py-0.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {skills.length > 4 && (
                              <span className="text-[11px] px-2 py-0.5 rounded-lg text-gray-400">
                                +{skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                        <Link
                          to={`/profile/${dev.userId || dev.id || dev.username}`}
                          className="text-xs font-semibold text-gray-700 hover:text-blue-600 transition"
                        >
                          View Profile
                        </Link>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/messages?user=${dev.userId || dev.id || dev.username}`
                              )
                            }
                            className="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition"
                            title="Direct Message"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={hasRequested}
                            onClick={() => handleConnect(dev.userId || dev.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                              hasRequested
                                ? "bg-gray-100 text-gray-500"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm hover:shadow"
                            }`}
                          >
                            {hasRequested ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Pending
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" /> Connect
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}