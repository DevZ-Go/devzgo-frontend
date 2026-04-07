import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FileArchive, ImagePlus, Loader2, Trash2, Video } from "lucide-react";
import {
  createProject,
  fetchProject,
  fetchTechStacks,
  updateProject,
  uploadProjectMedia,
  uploadProjectWorkspace,
  type ProjectVisibility,
} from "../api/projects";
import type { TechStackItem } from "../api/projects";
import { Navbar } from "../components/Navbar";
import {
  PROJECT_CATEGORIES,
  PROJECT_VISIBILITY_OPTIONS,
} from "../data/projectFormOptions";
import { getApiErrorMessage } from "../utils/apiError";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { useAuth } from "../auth/AuthContext";
import { resolveApiAssetUrl } from "../api/config";
import type { ApiProject } from "../types/project";
import type { ProjectCategory } from "../data/projectFormOptions";
import { isProjectOwner } from "../utils/projectOwnership";

export function ProjectFormPage() {
  const { id: editProjectId } = useParams<{ id: string }>();
  const isEdit = Boolean(editProjectId?.trim());
  const navigate = useNavigate();
  const { user, token, refreshUser } = useAuth();
  const submitLock = useRef(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [visibility, setVisibility] = useState<ProjectVisibility>("Public");
  const [stackOptions, setStackOptions] = useState<TechStackItem[]>([]);
  const [selectedStackIds, setSelectedStackIds] = useState<number[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [demoVideoFile, setDemoVideoFile] = useState<File | null>(null);
  const [workspaceZip, setWorkspaceZip] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStacks, setLoadingStacks] = useState(true);
  const [loadingProject, setLoadingProject] = useState(isEdit);

  /** Server URLs when editing (for PUT when user does not replace media). */
  const [savedCoverUrl, setSavedCoverUrl] = useState<string | null>(null);
  const [savedDemoUrl, setSavedDemoUrl] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [demoRemoved, setDemoRemoved] = useState(false);
  const [loadedProject, setLoadedProject] = useState<ApiProject | null>(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const existingCoverDisplayUrl = useMemo(() => {
    if (coverFile || coverRemoved || !savedCoverUrl) return null;
    return resolveApiAssetUrl(savedCoverUrl);
  }, [coverFile, coverRemoved, savedCoverUrl]);

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

  useEffect(() => {
    if (!isEdit || !editProjectId) {
      setLoadingProject(false);
      return;
    }
    let cancelled = false;
    setLoadingProject(true);
    setForbidden(false);
    setError(null);
    setLoadedProject(null);
    fetchProject(editProjectId)
      .then((p: ApiProject) => {
        if (cancelled) return;
        setLoadedProject(p);
        setTitle(p.title ?? "");
        setShortDescription(p.short_description ?? "");
        setFullDescription(p.full_description ?? "");
        const cat = p.category ?? "";
        if (PROJECT_CATEGORIES.includes(cat as ProjectCategory)) {
          setCategory(cat);
        } else if (cat) {
          setCategory(cat);
        }
        const vis = p.visibility;
        if (vis === "Public" || vis === "Private") {
          setVisibility(vis);
        }
        setSelectedStackIds(
          Array.isArray(p.tech_stack_ids) ? p.tech_stack_ids : []
        );
        setSavedCoverUrl(
          typeof p.cover_image_url === "string" ? p.cover_image_url : null
        );
        setSavedDemoUrl(
          typeof p.demo_video_url === "string" ? p.demo_video_url : null
        );
        setCoverRemoved(false);
        setDemoRemoved(false);
        setCoverFile(null);
        setDemoVideoFile(null);
        setWorkspaceZip(null);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingProject(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, editProjectId]);

  useEffect(() => {
    if (!isEdit) {
      setForbidden(false);
      return;
    }
    if (!loadedProject) return;
    if (loadedProject.is_owner === true) {
      setForbidden(false);
      return;
    }
    if (loadedProject.is_owner === false) {
      setForbidden(true);
      return;
    }
    setForbidden(!isProjectOwner(loadedProject, user));
  }, [isEdit, loadedProject, user]);

  useEffect(() => {
    if (!token || user != null) return;
    if (!isEdit || !loadedProject) return;
    if (loadedProject.is_owner !== undefined) return;
    void refreshUser();
  }, [token, user, isEdit, loadedProject, refreshUser]);

  function stackNumericId(t: TechStackItem): number | null {
    const n = typeof t.id === "number" ? t.id : Number(t.id);
    return Number.isFinite(n) ? n : null;
  }

  function toggleStackId(id: number) {
    setSelectedStackIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function clearCover() {
    setCoverFile(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (isEdit) setCoverRemoved(true);
  }

  function clearVideo() {
    setDemoVideoFile(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (isEdit) setDemoRemoved(true);
  }

  function clearZip() {
    setWorkspaceZip(null);
    if (zipInputRef.current) zipInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitLock.current || loading || loadingProject) return;
    submitLock.current = true;
    setError(null);
    setLoading(true);
    const warnings: string[] = [];
    try {
      const coverForPut =
        coverRemoved && !coverFile ? null : savedCoverUrl;
      const demoForPut =
        demoRemoved && !demoVideoFile ? null : savedDemoUrl;

      let projectId: string;

      if (isEdit && editProjectId) {
        await updateProject(editProjectId, {
          title: title.trim(),
          short_description: shortDescription.trim(),
          full_description: fullDescription.trim(),
          category: category as ProjectCategory,
          visibility,
          tech_stack_ids: selectedStackIds,
          cover_image_url: coverForPut,
          demo_video_url: demoForPut,
        });
        projectId = editProjectId;
      } else {
        const created = await createProject({
          title: title.trim(),
          short_description: shortDescription.trim(),
          full_description: fullDescription.trim(),
          category: category as ProjectCategory,
          visibility,
          tech_stack_ids: selectedStackIds,
        });
        projectId = String(created?.id ?? "").trim();
        if (!projectId) {
          throw new Error("Server did not return a project id. Try again.");
        }
      }

      try {
        await uploadProjectMedia(projectId, {
          cover_image: coverFile,
          demo_video: demoVideoFile,
        });
      } catch (err) {
        warnings.push(`Media: ${getApiErrorMessage(err)}`);
      }

      try {
        if (workspaceZip) {
          await uploadProjectWorkspace(projectId, workspaceZip);
        }
      } catch (err) {
        warnings.push(`Workspace ZIP: ${getApiErrorMessage(err)}`);
      }

      if (isEdit) {
        navigate(`/project/${projectId}`, {
          replace: true,
          state: warnings.length > 0 ? { uploadWarnings: warnings } : undefined,
        });
      } else {
        navigate("/profile", {
          replace: true,
          state: warnings.length > 0 ? { uploadWarnings: warnings } : undefined,
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      submitLock.current = false;
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition";

  const coverHeroSrc = coverPreviewUrl ?? existingCoverDisplayUrl;

  const verifyingOwner =
    isEdit &&
    loadedProject != null &&
    loadedProject.is_owner === undefined &&
    user == null &&
    Boolean(token);

  if (forbidden) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
        <Navbar />
        <main className="relative z-10 max-w-2xl mx-auto px-6 sm:px-8 pt-28 pb-20">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900">
            You can only edit projects you created.
          </div>
          <Link
            to="/home"
            className="inline-block mt-6 text-indigo-600 font-medium hover:underline"
          >
            Back to home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
      <Navbar />
      <main className="relative z-10 max-w-2xl mx-auto px-6 sm:px-8 pt-28 pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isEdit ? "Edit project" : "New project"}
          </h1>
          <p className="mt-2 text-slate-600">
            {isEdit
              ? "Update details or replace media and workspace."
              : "Tell us about your work. Media and files are optional."}
          </p>
        </div>

        {loadingProject ? (
          <div className="flex items-center gap-3 text-slate-600 py-16 justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            Loading project…
          </div>
        ) : verifyingOwner ? (
          <div className="flex items-center gap-3 text-slate-600 py-16 justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            Verifying access…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Basics
              </h2>
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Title
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={fieldClass}
                />
              </div>
              <div>
                <label
                  htmlFor="short_description"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
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
                  className={`${fieldClass} resize-y min-h-[88px]`}
                />
              </div>
              <div>
                <label
                  htmlFor="full_description"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Full description
                </label>
                <textarea
                  id="full_description"
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  required
                  rows={6}
                  className={`${fieldClass} resize-y min-h-[160px]`}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className={fieldClass}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {PROJECT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="visibility"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Visibility
                  </label>
                  <select
                    id="visibility"
                    value={visibility}
                    onChange={(e) =>
                      setVisibility(e.target.value as ProjectVisibility)
                    }
                    required
                    className={fieldClass}
                  >
                    {PROJECT_VISIBILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  Tech stacks
                </span>
                {loadingStacks ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : stackOptions.length === 0 ? (
                  <p className="text-sm text-slate-500">No options available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {stackOptions.map((t) => {
                      const id = stackNumericId(t);
                      if (id === null) return null;
                      return (
                        <button
                          key={`${t.id}-${t.name}`}
                          type="button"
                          onClick={() => toggleStackId(id)}
                          className={`px-3 py-2 rounded-xl border text-sm font-medium transition ${
                            selectedStackIds.includes(id)
                              ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Media
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-indigo-600" />
                    Cover image
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {(coverFile || (isEdit && savedCoverUrl && !coverRemoved)) && (
                      <button
                        type="button"
                        onClick={clearCover}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100"
                    >
                      {coverFile || existingCoverDisplayUrl ? "Replace" : "Choose"}
                    </button>
                  </div>
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setCoverFile(f);
                    if (f) setCoverRemoved(false);
                  }}
                />
                {coverHeroSrc ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video max-h-56">
                    <ImageWithFallback
                      src={coverHeroSrc}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 py-10 text-sm text-slate-500 transition"
                  >
                    Click to add a cover preview
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                    <Video className="w-4 h-4 text-indigo-600" />
                    Demo video
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {(demoVideoFile ||
                      (isEdit && savedDemoUrl && !demoRemoved)) && (
                      <button
                        type="button"
                        onClick={clearVideo}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100"
                    >
                      {demoVideoFile ? "Replace" : "Choose"}
                    </button>
                  </div>
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setDemoVideoFile(f);
                    if (f) setDemoRemoved(false);
                  }}
                />
                {demoVideoFile ? (
                  <p className="text-sm text-slate-600 truncate pl-1">
                    {demoVideoFile.name}
                  </p>
                ) : isEdit && savedDemoUrl && !demoRemoved ? (
                  <p className="text-xs text-slate-600">
                    Current demo is kept unless you replace or remove it.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Optional.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Files
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                    <FileArchive className="w-4 h-4 text-indigo-600" />
                    Workspace (.zip)
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {workspaceZip && (
                      <button
                        type="button"
                        onClick={clearZip}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => zipInputRef.current?.click()}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100"
                    >
                      {workspaceZip ? "Replace" : "Choose"}
                    </button>
                  </div>
                </div>
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={(e) => setWorkspaceZip(e.target.files?.[0] ?? null)}
                />
                {workspaceZip ? (
                  <p className="text-sm text-slate-600 truncate">
                    {workspaceZip.name}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    {isEdit
                      ? "Optional. Upload a new ZIP to replace the indexed workspace."
                      : "Optional. Full project folder as zip."}
                  </p>
                )}
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isEdit ? "Saving…" : "Creating…"}
                  </>
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Create project"
                )}
              </button>
              <Link
                to={isEdit && editProjectId ? `/project/${editProjectId}` : "/profile"}
                className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
