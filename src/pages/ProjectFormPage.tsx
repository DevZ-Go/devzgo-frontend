import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FileArchive,
  ImagePlus,
  Layers,
  LayoutList,
  Loader2,
  Trash2,
  UploadCloud,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { getTechStackToggleClasses } from "../utils/techStackChipStyle";

const TOTAL_STEPS = 3;
const STEP_META = [
  {
    n: 1,
    title: "Details",
    subtitle: "Title & descriptions",
    icon: LayoutList,
  },
  { n: 2, title: "Classification", subtitle: "Category & visibility", icon: Layers },
  { n: 3, title: "Assets", subtitle: "Media & workspace", icon: UploadCloud },
] as const;

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
  const [categoryOther, setCategoryOther] = useState("");
  const [visibility, setVisibility] = useState<ProjectVisibility>("Public");
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<string | null>(null);
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
  const [detectingStacks, setDetectingStacks] = useState(false);
  const [showTechConfirmModal, setShowTechConfirmModal] = useState(false);
  const [techConfirmContext, setTechConfirmContext] = useState<{
    projectId: string;
    warnings: string[];
  } | null>(null);
  const [confirmingTechStacks, setConfirmingTechStacks] = useState(false);

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
    // Needed for edit override and post-upload detection confirmation.
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
        setCategoryOther(
          typeof p.category_other === "string" ? p.category_other : ""
        );
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

  function projectPayloadBase() {
    return {
      title: title.trim(),
      short_description: shortDescription.trim(),
      full_description: fullDescription.trim(),
      category: category as ProjectCategory,
      category_other: category === "Other" ? categoryOther.trim() || null : null,
      visibility,
      tech_stack_ids: selectedStackIds,
    };
  }

  function categoryOtherWordCount(): number {
    return categoryOther.trim().split(/\s+/).filter(Boolean).length;
  }

  function validateStep1(): boolean {
    if (!title.trim() || !shortDescription.trim() || !fullDescription.trim()) {
      setStepError("Please fill in title, short description, and full description.");
      return false;
    }
    setStepError(null);
    return true;
  }

  function validateStep2(): boolean {
    if (!category || !PROJECT_CATEGORIES.includes(category as ProjectCategory)) {
      setStepError("Select a category from the list.");
      return false;
    }
    if (category === "Other" && categoryOther.trim()) {
      if (categoryOther.trim().length > 64) {
        setStepError("Custom label is too long (max 64 characters).");
        return false;
      }
      if (categoryOtherWordCount() > 4) {
        setStepError("Use a short label (1–2 words work best).");
        return false;
      }
    }
    setStepError(null);
    return true;
  }

  function goNext() {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
    }
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < 3) return;
    if (submitLock.current || loading || loadingProject) return;
    if (!validateStep1() || !validateStep2()) {
      setStepError("Please review steps 1 and 2.");
      return;
    }
    submitLock.current = true;
    setError(null);
    setLoading(true);
    setSubmitPhase(null);
    const warnings: string[] = [];
    try {
      const coverForPut =
        coverRemoved && !coverFile ? null : savedCoverUrl;
      const demoForPut =
        demoRemoved && !demoVideoFile ? null : savedDemoUrl;

      let projectId: string;

      if (isEdit && editProjectId) {
        setSubmitPhase("Saving project…");
        await updateProject(editProjectId, {
          ...projectPayloadBase(),
          cover_image_url: coverForPut,
          demo_video_url: demoForPut,
        });
        projectId = editProjectId;
      } else {
        setSubmitPhase("Creating project…");
        const created = await createProject(projectPayloadBase());
        projectId = String(created?.id ?? "").trim();
        if (!projectId) {
          throw new Error("Server did not return a project id. Try again.");
        }
      }

      try {
        setSubmitPhase("Uploading media…");
        await uploadProjectMedia(projectId, {
          cover_image: coverFile,
          demo_video: demoVideoFile,
        });
      } catch (err) {
        warnings.push(`Media: ${getApiErrorMessage(err)}`);
      }

      try {
        if (workspaceZip) {
          setSubmitPhase("Uploading workspace & detecting tech…");
          setDetectingStacks(true);
          await uploadProjectWorkspace(projectId, workspaceZip);
          const fresh = await fetchProject(projectId);
          const rawIds = Array.isArray(fresh.tech_stack_ids) ? fresh.tech_stack_ids : [];
          const fromServer = [
            ...new Set(
              rawIds
                .map((id) => (typeof id === "number" ? id : Number(id)))
                .filter((id): id is number => Number.isFinite(id))
            ),
          ];
          if (fromServer.length > 0) {
            setSelectedStackIds(fromServer);
          }
          setTechConfirmContext({ projectId, warnings: [...warnings] });
          setShowTechConfirmModal(true);
          setDetectingStacks(false);
          setLoading(false);
          setSubmitPhase(null);
          submitLock.current = false;
          return;
        }
      } catch (err) {
        warnings.push(`Workspace ZIP: ${getApiErrorMessage(err)}`);
      } finally {
        setDetectingStacks(false);
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
      setSubmitPhase(null);
      submitLock.current = false;
    }
  }

  async function confirmTechStacksAndFinish() {
    if (!techConfirmContext) return;
    setConfirmingTechStacks(true);
    setError(null);
    try {
      const latest = await fetchProject(techConfirmContext.projectId);
      await updateProject(techConfirmContext.projectId, {
        ...projectPayloadBase(),
        tech_stack_ids: selectedStackIds,
        cover_image_url:
          typeof latest.cover_image_url === "string" ? latest.cover_image_url : null,
        demo_video_url:
          typeof latest.demo_video_url === "string" ? latest.demo_video_url : null,
      });
      const w = techConfirmContext.warnings;
      const pid = techConfirmContext.projectId;
      setShowTechConfirmModal(false);
      setTechConfirmContext(null);
      const target = isEdit ? `/project/${pid}` : "/profile";
      navigate(target, {
        replace: true,
        state: w.length > 0 ? { uploadWarnings: w } : undefined,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setConfirmingTechStacks(false);
    }
  }

  function dismissTechModalAndFinish() {
    if (!techConfirmContext) return;
    const w = techConfirmContext.warnings;
    const pid = techConfirmContext.projectId;
    setShowTechConfirmModal(false);
    setTechConfirmContext(null);
    const target = isEdit ? `/project/${pid}` : "/profile";
    navigate(target, {
      replace: true,
      state: w.length > 0 ? { uploadWarnings: w } : undefined,
    });
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
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-6 sm:p-8 shadow-sm shadow-slate-200/50 ring-1 ring-slate-100">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Your progress
              </p>
              <div className="mt-6 flex w-full items-start justify-between gap-0 sm:gap-1">
                {STEP_META.map((s, stepIdx) => {
                  const Icon = s.icon;
                  const n = stepIdx + 1;
                  const active = step === n;
                  const done = step > n;
                  const segmentComplete = step > n;
                  return (
                    <Fragment key={s.n}>
                      <div className="flex min-w-0 flex-1 flex-col items-center">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-11 sm:w-11 ${
                            active
                              ? "border-indigo-500 bg-white text-indigo-600 shadow-lg shadow-indigo-500/20 ring-[3px] ring-indigo-100"
                              : done
                                ? "border-transparent bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"
                                : "border-slate-200 bg-white text-slate-400"
                          }`}
                        >
                          {done ? (
                            <span className="text-sm font-bold" aria-hidden>
                              ✓
                            </span>
                          ) : (
                            <Icon className="h-[18px] w-[18px]" aria-hidden />
                          )}
                        </div>
                        <p className="mt-3 max-w-[100px] text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 sm:max-w-none sm:text-[11px]">
                          {s.title}
                        </p>
                        <p className="mt-1 hidden max-w-[120px] text-center text-[10px] leading-snug text-slate-500 sm:block">
                          {s.subtitle}
                        </p>
                      </div>
                      {stepIdx < TOTAL_STEPS - 1 && (
                        <div
                          className="relative mx-0.5 mt-[18px] h-[3px] min-w-[1rem] flex-[1.15] shrink self-start sm:mx-1 sm:min-w-[1.5rem]"
                          aria-hidden
                        >
                          <div className="absolute inset-0 rounded-full bg-slate-100" />
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 via-violet-500 to-fuchsia-500 transition-[width] duration-500 ease-out"
                            style={{
                              width: segmentComplete ? "100%" : "0%",
                            }}
                          />
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
              <div className="mx-auto mt-8 max-w-lg px-1">
                <div className="relative h-2 overflow-hidden rounded-full bg-slate-100/90 shadow-inner">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_0_12px_-2px_rgba(99,102,241,0.5)] transition-[width] duration-500 ease-out"
                    style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                  />
                </div>
              </div>
              <p className="mt-5 text-center text-sm text-slate-600">
                <span className="font-semibold text-slate-800">
                  Step {step} of {TOTAL_STEPS}
                </span>
                <span className="text-slate-300"> · </span>
                <span className="text-slate-500">
                  {STEP_META[step - 1]?.subtitle ?? ""}
                </span>
              </p>
              {stepError && step < 3 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  {stepError}
                </div>
              )}
            </div>

            <section
              className={`rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5 ${
                step === 1 ? "" : "hidden"
              }`}
              aria-hidden={step !== 1}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Project details
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
                  className={fieldClass}
                  placeholder="e.g. Campus food finder"
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
                  rows={6}
                  placeholder="What it does, what you learned, stack highlights…"
                  className={`${fieldClass} resize-y min-h-[160px]`}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>

            <section
              className={`rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5 ${
                step === 2 ? "" : "hidden"
              }`}
              aria-hidden={step !== 2}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Category & visibility
              </h2>
              <p className="text-sm text-slate-600">
                Categories match the platform taxonomy. If you pick{" "}
                <span className="font-medium">Other</span>, add a short custom label (one or two
                words).
              </p>
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
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value !== "Other") setCategoryOther("");
                    }}
                    className={fieldClass}
                  >
                    <option value="">Select category</option>
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
              {category === "Other" && (
                <div>
                  <label
                    htmlFor="category_other"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Custom label <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="category_other"
                    value={categoryOther}
                    onChange={(e) => setCategoryOther(e.target.value)}
                    className={fieldClass}
                    placeholder="e.g. IoT, Blockchain, DevOps"
                    maxLength={64}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Shown as “Other — your label” on the project page.
                  </p>
                </div>
              )}
              {!isEdit ? (
                <p className="text-sm text-slate-500 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  After you upload a workspace ZIP, tech stacks are set from your files (catalog matches only).
                </p>
              ) : (
                <div>
                  <span className="block text-sm font-medium text-slate-700 mb-2">
                    Tech stacks (manual override on edit)
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
                        const selected = selectedStackIds.includes(id);
                        return (
                          <button
                            key={`${t.id}-${t.name}`}
                            type="button"
                            onClick={() => toggleStackId(id)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${getTechStackToggleClasses(t.name, selected)}`}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Uploading a new ZIP re-indexes files and updates stacks from file types when you save.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>

            <section
              className={`rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6 ${
                step === 3 ? "" : "hidden"
              }`}
              aria-hidden={step !== 3}
            >
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

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Workspace
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      <FileArchive className="w-4 h-4 text-indigo-600" />
                      Project folder (.zip)
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
                    <p className="text-sm text-slate-600 truncate">{workspaceZip.name}</p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {isEdit
                        ? "Optional. Upload a new ZIP to replace the indexed workspace."
                        : "Optional. Zip your project root — files are indexed and known tech stacks are set from file types."}
                    </p>
                  )}
                </div>
              </div>

              {detectingStacks && (
                <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/70 p-4">
                  <p className="text-sm font-medium text-indigo-900 mb-2">
                    Detecting technologies from workspace files…
                  </p>
                  <div className="h-2 rounded-full bg-indigo-100 overflow-hidden">
                    <div className="h-full w-2/3 bg-indigo-500 animate-pulse" />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to={isEdit && editProjectId ? `/project/${editProjectId}` : "/profile"}
                    className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {submitPhase ?? (isEdit ? "Saving…" : "Creating…")}
                      </>
                    ) : isEdit ? (
                      "Save changes"
                    ) : (
                      "Create project"
                    )}
                  </button>
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}
          </form>
        )}
      </main>

      {showTechConfirmModal && techConfirmContext && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]">
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:max-w-2xl sm:p-8"
            role="dialog"
            aria-labelledby="tech-confirm-title"
            aria-modal="true"
          >
            <h3
              id="tech-confirm-title"
              className="text-lg font-semibold text-slate-900 sm:text-xl"
            >
              Confirm tech stacks
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              We matched stacks from your workspace files. Toggle the ones that best describe this
              project, then continue.
            </p>
            {loadingStacks ? (
              <p className="mt-6 text-sm text-slate-500">Loading options…</p>
            ) : stackOptions.length === 0 ? (
              <p className="mt-6 text-sm text-amber-800">
                Tech stack list could not be loaded. You can set stacks later from the project edit
                page.
              </p>
            ) : (
              <div className="mt-6 flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
                {stackOptions.map((t) => {
                  const id = stackNumericId(t);
                  if (id === null) return null;
                  const active = selectedStackIds.includes(id);
                  return (
                    <button
                      key={`${t.id}-${t.name}`}
                      type="button"
                      onClick={() => toggleStackId(id)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${getTechStackToggleClasses(t.name, active)}`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
            {!loadingStacks && stackOptions.length > 0 && selectedStackIds.length === 0 && (
              <p className="mt-3 text-xs text-slate-500">
                None selected — you can add stacks above, or continue with no stacks (they will be
                cleared on save).
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={dismissTechModalAndFinish}
                disabled={confirmingTechStacks}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={confirmTechStacksAndFinish}
                disabled={confirmingTechStacks}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {confirmingTechStacks ? "Saving…" : "Save & continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
