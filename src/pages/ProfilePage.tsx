import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, AlertTriangle, FolderKanban, Trash2, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ProjectCard } from "../components/ProjectCard";
import { deleteProject, fetchMyProjects } from "../api/projects";
import { transformApiProject } from "../utils/projectTransform";
import { getApiErrorMessage } from "../utils/apiError";
import type { Project } from "../types/project";

export function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const clearedState = useRef(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; title: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (clearedState.current) return;
    const w = (location.state as { uploadWarnings?: string[] } | undefined)
      ?.uploadWarnings;
    if (w?.length) {
      setUploadWarnings(w);
      clearedState.current = true;
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location.state, location.pathname, location.search, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchMyProjects();
        if (!cancelled) {
          setProjects(list.map((api, i) => transformApiProject(api, i)));
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDeleteProject(projectId: string) {
    setDeletingId(projectId);
    setDeleteError(null);
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setDeleteDialog(null);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-8 pt-28 pb-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">
            Your account and projects in one place.
          </p>
        </div>

        {uploadWarnings.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm mb-1">Project saved — some uploads failed</p>
                <ul className="text-sm space-y-1 list-disc list-inside opacity-90">
                  {uploadWarnings.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setUploadWarnings([])}
                className="p-1 rounded-lg hover:bg-amber-100 text-amber-900 shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <section aria-labelledby="my-projects-heading" className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <FolderKanban className="w-6 h-6 text-blue-600" />
            <h2 id="my-projects-heading" className="text-2xl font-bold text-gray-900">
              My projects
            </h2>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-gray-600">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p>Loading your projects…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 px-8 py-16 text-center">
              <p className="text-gray-600 mb-4">You have not created any projects yet.</p>
              <Link
                to="/add-project"
                className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-shadow"
              >
                Create your first project
              </Link>
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="flex flex-col gap-2">
                  <ProjectCard project={project} variant="compact" />
                  <div className="flex flex-wrap items-center gap-3 px-1 text-sm">
                    <Link
                      to={`/project/${project.id}/edit`}
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Edit project
                    </Link>
                    <span className="text-gray-300" aria-hidden>
                      ·
                    </span>
                    <Link
                      to={`/project/${project.id}`}
                      className="font-medium text-gray-600 hover:text-gray-900"
                    >
                      View details
                    </Link>
                    <span className="text-gray-300" aria-hidden>
                      ·
                    </span>
                    <button
                      type="button"
                      disabled={deletingId === project.id}
                      onClick={() => setDeleteDialog({ id: project.id, title: project.title })}
                      className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === project.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {deleteDialog && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete project?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Delete “{deleteDialog.title}”? This cannot be undone.
            </p>
            {deleteError && (
              <p className="text-sm text-red-700 mb-3">{deleteError}</p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteDialog(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                disabled={deletingId === deleteDialog.id}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProject(deleteDialog.id)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
                disabled={deletingId === deleteDialog.id}
              >
                {deletingId === deleteDialog.id ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
