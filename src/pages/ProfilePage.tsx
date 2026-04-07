import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  AlertTriangle,
  FolderKanban,
  Trash2,
  X,
  UserCircle2,
  Mail,
  Calendar,
  Compass,
  Sparkles,
  Lock,
  Globe,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ProjectCard } from "../components/ProjectCard";
import { deleteProject, fetchMyProjects } from "../api/projects";
import { transformApiProject } from "../utils/projectTransform";
import { getApiErrorMessage } from "../utils/apiError";
import type { Project } from "../types/project";
import { useAuth } from "../auth/AuthContext";

function formatMemberSince(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(d);
}

function initials(username: string | undefined, email: string | undefined): string {
  const u = (username ?? "").trim();
  if (u.length >= 2) return u.slice(0, 2).toUpperCase();
  const e = (email ?? "").trim();
  if (e.includes("@")) return e[0]!.toUpperCase() + (e[1] ?? "").toUpperCase();
  return "U";
}

export function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, refreshUser } = useAuth();
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
    if (token && user == null) {
      void refreshUser();
    }
  }, [token, user, refreshUser]);

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

  const stats = useMemo(() => {
    const total = projects.length;
    const publicCount = projects.filter((p) => p.visibility === "Public").length;
    const privateCount = projects.filter((p) => p.visibility === "Private").length;
    return { total, publicCount, privateCount };
  }, [projects]);

  const memberSince = formatMemberSince(
    typeof user?.created_at === "string" ? user.created_at : undefined
  );

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

  const displayName = user?.username ?? "Creator";
  const email = typeof user?.email === "string" ? user.email : null;
  const userIdShort =
    user?.id != null ? String(user.id).replace(/-/g, "").slice(0, 8) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 pt-28 pb-20">
        <header className="mb-12 grid gap-8 lg:grid-cols-[1.1fr_minmax(0,1fr)] items-start">
          <div className="rounded-3xl border border-gray-200/80 bg-white p-8 sm:p-10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-bold tracking-tight text-white shadow-md shadow-blue-500/25">
                {initials(user?.username, email ?? undefined)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/80">
                    <Sparkles className="w-3.5 h-3.5" />
                    Active
                  </span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    DevZ-Go profile
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
                  {displayName}
                </h1>
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  {email && (
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                  )}
                  {memberSince && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Member since {memberSince}</span>
                    </div>
                  )}
                  {userIdShort && (
                    <p className="text-xs text-gray-500 font-mono">
                      ID · {userIdShort}…
                    </p>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/add-project"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:shadow-lg transition"
                  >
                    New project
                  </Link>
                  <Link
                    to="/explore"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 transition"
                  >
                    <Compass className="w-4 h-4 text-blue-600" />
                    Explore
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                Projects
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {loading ? "—" : stats.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total in your portfolio</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
                <Globe className="w-4 h-4 text-cyan-600" />
                Public
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {loading ? "—" : stats.publicCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Visible on Explore</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">
                <Lock className="w-4 h-4 text-purple-600" />
                Private
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {loading ? "—" : stats.privateCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Only you can open</p>
            </div>
          </div>
        </header>

        {uploadWarnings.length > 0 && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
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
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <UserCircle2 className="w-6 h-6" />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Dashboard
                </span>
              </div>
              <h2 id="my-projects-heading" className="text-2xl font-bold text-gray-900">
                Your projects
              </h2>
              <p className="text-gray-600 mt-1 max-w-xl">
                Edit, publish, or remove work you have uploaded. Cards stay in sync with the API.
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-600">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p>Loading your projects…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 px-8 py-20 text-center shadow-sm">
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You have not published any projects yet. Create one to showcase your stack and
                workspace.
              </p>
              <Link
                to="/add-project"
                className="inline-flex px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-shadow"
              >
                Create your first project
              </Link>
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="flex flex-col gap-3">
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
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete project?</h3>
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
