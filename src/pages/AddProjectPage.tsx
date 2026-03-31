import { useEffect, useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createProject,
  fetchTechStacks,
  type ProjectVisibility,
} from "../api/projects";
import type { TechStackItem } from "../api/projects";
import { Navbar } from "../components/Navbar";
import {
  PROJECT_CATEGORIES,
  PROJECT_VISIBILITY_OPTIONS,
} from "../data/projectFormOptions";
import { getApiErrorMessage } from "../utils/apiError";

export function AddProjectPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [visibility, setVisibility] = useState<ProjectVisibility>("Public");
  const [stackOptions, setStackOptions] = useState<TechStackItem[]>([]);
  const [selectedStackNames, setSelectedStackNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStacks, setLoadingStacks] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTechStacks()
      .then((list) => {
        if (!cancelled) setStackOptions(list);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load tech stacks.");
      })
      .finally(() => {
        if (!cancelled) setLoadingStacks(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleStack(name: string) {
    setSelectedStackNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createProject({
        title: title.trim(),
        short_description: shortDescription.trim(),
        full_description: fullDescription.trim(),
        category,
        visibility,
        tech_stacks: selectedStackNames,
      });
      navigate("/home", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-8 pt-28 pb-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add a project</h1>
        <p className="text-gray-600 mb-8">
          Submit your work to the DevZ-Go community.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="short_description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Short description
            </label>
            <textarea
              id="short_description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              required
              rows={3}
              placeholder="One line summary"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-y"
            />
          </div>

          <div>
            <label
              htmlFor="full_description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full description
            </label>
            <textarea
              id="full_description"
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              required
              rows={6}
              placeholder="Describe your project in detail"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-y"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              <option value="" disabled>
                Select a category
              </option>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
              Visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as ProjectVisibility)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              {PROJECT_VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Tech stacks
            </span>
            {loadingStacks ? (
              <p className="text-sm text-gray-500">Loading options…</p>
            ) : stackOptions.length === 0 ? (
              <p className="text-sm text-gray-500">No tech stacks returned from API.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stackOptions.map((t) => (
                  <label
                    key={`${t.id}-${t.name}`}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                      selectedStackNames.includes(t.name)
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedStackNames.includes(t.name)}
                      onChange={() => toggleStack(t.name)}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create project"}
            </button>
            <Link
              to="/home"
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
