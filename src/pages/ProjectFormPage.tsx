import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  FileArchive,
  Github,
  ImagePlus,
  Layers,
  Loader2,
  Link2,
  Trash2,
  UploadCloud,
  Video,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  createProject,
  fetchProject,
  fetchTechStacks,
  updateProject,
  uploadProjectMedia,
  uploadProjectWorkspace,
  type ProjectVisibility,
} from "../api";
import type { TechStackItem } from "../api";
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
import { inviteCollaborator } from "../api/collaborations";
import { TeammatePicker, type Teammate } from "../components/TeammatePicker";
import { PhotoCropper } from "../components/PhotoCropper";
import { GenerateWithAiPanel } from "../components/projectIntelligence/GenerateWithAiPanel";
import { ProjectIntelligenceControls } from "../components/projectIntelligence/ProjectIntelligenceControls";
import { Select } from "../components/ui/Select";

const COVER_MAX_BYTES = 10 * 1024 * 1024;
/** Must stay aligned with backend `MAX_UPLOAD_BYTES` in workspace_extract.py */
const WORKSPACE_ZIP_MAX_BYTES = 200 * 1024 * 1024;
const WORKSPACE_ZIP_MAX_MB = WORKSPACE_ZIP_MAX_BYTES / (1024 * 1024);

const TOTAL_STEPS = 3;
const STEP_META = [
  {
    n: 1,
    title: "Source & story",
    subtitle: "Title, ZIP, tech & description",
    icon: FileArchive,
  },
  { n: 2, title: "Classification", subtitle: "Category & visibility", icon: Layers },
  { n: 3, title: "Polish", subtitle: "Media & teammates", icon: UploadCloud },
] as const;

/** Rule-based category guess from detected tech names (no external AI). */
function suggestCategoryFromTech(names: string[]): ProjectCategory {
  const blob = names.map((n) => n.toLowerCase()).join(" ");
  if (/tensorflow|pytorch|scikit|keras|huggingface|openai|langchain|numpy|pandas/.test(blob)) {
    return "AI/ML";
  }
  if (/react native|flutter|swift|kotlin|expo|android|ios/.test(blob)) return "Mobile";
  if (/unity|unreal|godot|phaser|gamemaker/.test(blob)) return "Gaming";
  if (/django|flask|fastapi|express|nestjs|next|react|vue|angular|svelte|node/.test(blob)) {
    return "Web Development";
  }
  return "Other";
}

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
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [likesHidden, setLikesHidden] = useState(false);
  const [liveUrl, setLiveUrl] = useState("");
  const [impactNote, setImpactNote] = useState("");
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<string | null>(null);
  const [stackOptions, setStackOptions] = useState<TechStackItem[]>([]);
  const [selectedStackIds, setSelectedStackIds] = useState<number[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [demoVideoFile, setDemoVideoFile] = useState<File | null>(null);
  const [workspaceZip, setWorkspaceZip] = useState<File | null>(null);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStacks, setLoadingStacks] = useState(true);
  const [loadingProject, setLoadingProject] = useState(isEdit);
  const [detectingStacks, setDetectingStacks] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [zipDragging, setZipDragging] = useState(false);
  const [showTechConfirmModal, setShowTechConfirmModal] = useState(false);
  const [techConfirmContext, setTechConfirmContext] = useState<{
    projectId: string;
    warnings: string[];
    detected: number[];
  } | null>(null);
  const [confirmingTechStacks, setConfirmingTechStacks] = useState(false);
  /** Created early so ZIP can be analyzed / AI used before final publish. */
  const [draftProjectId, setDraftProjectId] = useState<string | null>(null);
  const [sourceIndexed, setSourceIndexed] = useState(false);
  const [categorySuggested, setCategorySuggested] = useState(false);
  /** When false, tech confirm modal only saves stacks and stays on the create form. */
  const [techModalExitsForm, setTechModalExitsForm] = useState(false);

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
    if (isEdit && editProjectId) {
      setDraftProjectId(editProjectId);
      setSourceIndexed(true);
    }
  }, [isEdit, editProjectId]);

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
        setCommentsEnabled(p.comments_enabled !== false);
        setLikesHidden(p.likes_hidden === true);
        setLiveUrl(p.live_url ?? "");
        setImpactNote(p.impact_note ?? "");
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
    if (loadedProject.is_owner === true || loadedProject.access?.edit) {
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
    void refreshUser().catch(() => undefined);
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

  function acceptZipFile(f: File | null) {
    if (!f) {
      setWorkspaceZip(null);
      return;
    }
    const looksZip =
      f.name.toLowerCase().endsWith(".zip") ||
      f.type === "application/zip" ||
      f.type === "application/x-zip-compressed";
    if (!looksZip) {
      setStepError("Choose a .zip of your project folder.");
      setWorkspaceZip(null);
      return;
    }
    if (f.size > WORKSPACE_ZIP_MAX_BYTES) {
      setStepError(
        `ZIP is too large (${(f.size / (1024 * 1024)).toFixed(0)} MB). Max ${WORKSPACE_ZIP_MAX_MB} MB.`
      );
      setWorkspaceZip(null);
      return;
    }
    setStepError(null);
    setWorkspaceZip(f);
    setSourceIndexed(false);
  }

  function projectPayloadBase(overrides?: {
    category?: ProjectCategory;
    visibility?: ProjectVisibility;
  }) {
    const cat = (overrides?.category ?? (category as ProjectCategory)) || "Other";
    return {
      title: title.trim(),
      short_description: shortDescription.trim(),
      full_description: fullDescription.trim(),
      category: cat,
      category_other: cat === "Other" ? categoryOther.trim() || null : null,
      visibility: overrides?.visibility ?? visibility,
      tech_stack_ids: selectedStackIds,
      live_url: liveUrl.trim(),
      impact_note: impactNote.trim(),
      comments_enabled: commentsEnabled,
      likes_hidden: likesHidden,
    };
  }

  function categoryOtherWordCount(): number {
    return categoryOther.trim().split(/\s+/).filter(Boolean).length;
  }

  /** Step 1 next: title required; ZIP strongly encouraged for create. Descriptions can come from AI. */
  function validateStep1ForNext(): boolean {
    if (!title.trim()) {
      setStepError("Add a project title.");
      return false;
    }
    if (!isEdit && !sourceIndexed && !workspaceZip) {
      setStepError("Upload a project ZIP so we can detect tech and unlock AI description.");
      return false;
    }
    if (liveUrl.trim() && !/^https?:\/\/\S+$/i.test(liveUrl.trim())) {
      setStepError("Enter the live demo as a full link starting with http:// or https://.");
      return false;
    }
    setStepError(null);
    return true;
  }

  function validateDescriptionsForSubmit(): boolean {
    if (!title.trim() || !shortDescription.trim() || !fullDescription.trim()) {
      setStepError("Please fill in title, short description, and full description (or generate them with AI).");
      return false;
    }
    if (liveUrl.trim() && !/^https?:\/\/\S+$/i.test(liveUrl.trim())) {
      setStepError("Enter the live demo as a full link starting with http:// or https://.");
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

  function applyDetectedStacks(
    projectId: string,
    detectedIds: number[],
    confirmedIds: number[],
    warnings: string[] = [],
    optionsOverride?: TechStackItem[]
  ) {
    const rawIds = detectedIds.length > 0 ? detectedIds : confirmedIds;
    const fromServer = [
      ...new Set(
        rawIds
          .map((id) => (typeof id === "number" ? id : Number(id)))
          .filter((id): id is number => Number.isFinite(id))
      ),
    ];
    if (fromServer.length > 0) {
      setSelectedStackIds(fromServer);
      const catalog = optionsOverride ?? stackOptions;
      const names = catalog
        .filter((t) => {
          const id = stackNumericId(t);
          return id !== null && fromServer.includes(id);
        })
        .map((t) => t.name);
      if (!categorySuggested || !category) {
        const suggested = suggestCategoryFromTech(names);
        setCategory(suggested);
        setCategorySuggested(true);
      }
    }
    setTechConfirmContext({ projectId, warnings: [...warnings], detected: fromServer });
    return fromServer;
  }

  /** Create a private draft (if needed), upload ZIP, detect tech, suggest category. */
  async function ensureDraftAndUploadZip(): Promise<string | null> {
    if (!title.trim()) {
      setStepError("Add a project title before uploading.");
      return null;
    }
    if (!workspaceZip && !sourceIndexed) {
      setStepError("Choose a .zip of your project folder.");
      return null;
    }
    if (!workspaceZip && sourceIndexed && draftProjectId) {
      return draftProjectId;
    }

    setError(null);
    setStepError(null);
    setDetectingStacks(true);
    setUploadPercent(0);
    try {
      let projectId = draftProjectId;
      if (!projectId) {
        setSubmitPhase("Creating draft…");
        const created = await createProject(
          projectPayloadBase({
            category: (category as ProjectCategory) || "Other",
            visibility: "Private",
          })
        );
        projectId = String(created?.id ?? "").trim();
        if (!projectId) throw new Error("Server did not return a project id.");
        setDraftProjectId(projectId);
      } else {
        // Keep title/descriptions in sync before indexing.
        await updateProject(projectId, {
          ...projectPayloadBase({
            category: (category as ProjectCategory) || "Other",
            visibility: visibility || "Private",
          }),
          cover_image_url: savedCoverUrl,
          demo_video_url: savedDemoUrl,
        });
      }

      if (workspaceZip) {
        setSubmitPhase("Uploading workspace…");
        const uploadRes = await uploadProjectWorkspace(projectId, workspaceZip, (percent) => {
          setUploadPercent(percent);
          setSubmitPhase(percent < 100 ? `Uploading… ${percent}%` : "Detecting tech…");
        });
        const [fresh, options] = await Promise.all([
          fetchProject(projectId),
          fetchTechStacks().catch(() => null),
        ]);
        if (options) setStackOptions(options);
        const detectedIds = Array.isArray(uploadRes.detected_tech_stack_ids)
          ? uploadRes.detected_tech_stack_ids
          : Array.isArray(fresh.detected_tech_stack_ids)
            ? fresh.detected_tech_stack_ids
            : [];
        const confirmedIds = Array.isArray(fresh.tech_stack_ids) ? fresh.tech_stack_ids : [];
        applyDetectedStacks(
          projectId,
          detectedIds,
          confirmedIds,
          [],
          options ?? undefined
        );
        setSourceIndexed(true);
        setWorkspaceZip(null);
        if (zipInputRef.current) zipInputRef.current.value = "";
        // Stay on the form — AI descriptions come next; stacks are already applied as chips.
      }
      return projectId;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return null;
    } finally {
      setDetectingStacks(false);
      setSubmitPhase(null);
    }
  }

  function advanceStep(next: number) {
    // Blur focused controls before unmounting the step (avoids focus + hidden ancestor issues).
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setStepError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function goNext() {
    if (step === 1) {
      if (!validateStep1ForNext()) return;
      if (!isEdit && workspaceZip && !sourceIndexed) {
        const id = await ensureDraftAndUploadZip();
        if (!id) return;
      } else if (!isEdit && !draftProjectId && sourceIndexed === false && !workspaceZip) {
        // validate already blocked this
      } else if (workspaceZip) {
        const id = await ensureDraftAndUploadZip();
        if (!id) return;
      }
      advanceStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      advanceStep(3);
    }
  }

  function goBack() {
    advanceStep(Math.max(1, step - 1));
  }

  function hasCoverImage(): boolean {
    if (coverFile) return true;
    if (isEdit && savedCoverUrl && !coverRemoved) return true;
    return false;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < 3) return;
    if (submitLock.current || loading || loadingProject) return;
    if (!validateDescriptionsForSubmit() || !validateStep2()) {
      setStepError("Please review steps 1 and 2.");
      return;
    }
    if (!hasCoverImage()) {
      setStepError("Add a cover image before publishing — it appears on project cards.");
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

      if (draftProjectId) {
        setSubmitPhase(isEdit ? "Saving project…" : "Publishing project…");
        await updateProject(draftProjectId, {
          ...projectPayloadBase(),
          cover_image_url: coverForPut,
          demo_video_url: demoForPut,
        });
        projectId = draftProjectId;
        if (!isEdit && teammates.length > 0) {
          setSubmitPhase("Inviting teammates…");
          for (const mate of teammates) {
            try {
              await inviteCollaborator(projectId, {
                username: mate.username, role: mate.role.trim() || "Collaborator", access: mate.access,
              });
            } catch (err) {
              warnings.push(`Invite for @${mate.username}: ${getApiErrorMessage(err)}`);
            }
          }
        }
      } else if (isEdit && editProjectId) {
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
        setDraftProjectId(projectId);
        if (teammates.length > 0) setSubmitPhase("Inviting teammates…");
        for (const mate of teammates) {
          try {
            await inviteCollaborator(projectId, {
              username: mate.username, role: mate.role.trim() || "Collaborator", access: mate.access,
            });
          } catch (err) {
            warnings.push(`Invite for @${mate.username}: ${getApiErrorMessage(err)}`);
          }
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
          setSubmitPhase("Uploading workspace…");
          setUploadPercent(0);
          setDetectingStacks(true);
          const uploadRes = await uploadProjectWorkspace(projectId, workspaceZip, (percent) => {
            setUploadPercent(percent);
            setSubmitPhase(percent < 100 ? "Uploading workspace…" : "Detecting tech…");
          });
          const [fresh, options] = await Promise.all([fetchProject(projectId), fetchTechStacks().catch(() => null)]);
          if (options) setStackOptions(options);
          const detectedIds = Array.isArray(uploadRes.detected_tech_stack_ids)
            ? uploadRes.detected_tech_stack_ids
            : Array.isArray(fresh.detected_tech_stack_ids)
              ? fresh.detected_tech_stack_ids
              : [];
          const confirmedIds = Array.isArray(fresh.tech_stack_ids)
            ? fresh.tech_stack_ids
            : [];
          applyDetectedStacks(
            projectId,
            detectedIds,
            confirmedIds,
            warnings,
            options ?? undefined
          );
          setSourceIndexed(true);
          setWorkspaceZip(null);
          setTechModalExitsForm(true);
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

      navigate(`/project/${projectId}`, {
        replace: true,
        state: warnings.length > 0 ? { uploadWarnings: warnings } : undefined,
      });
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
      const shouldExit = techModalExitsForm;
      setShowTechConfirmModal(false);
      setTechConfirmContext(null);
      if (!shouldExit) return;
      navigate(`/project/${pid}`, {
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
    const shouldExit = techModalExitsForm;
    setShowTechConfirmModal(false);
    setTechConfirmContext(null);
    if (!shouldExit) return;
    navigate(`/project/${pid}`, {
      replace: true,
      state: w.length > 0 ? { uploadWarnings: w } : undefined,
    });
  }

  const fieldClass =
    "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 shadow-sm focus:ring-2 focus:ring-amber-200 focus:border-maroon-700 outline-none transition";

  const coverHeroSrc = coverPreviewUrl ?? existingCoverDisplayUrl;

  const verifyingOwner =
    isEdit &&
    loadedProject != null &&
    loadedProject.is_owner === undefined &&
    user == null &&
    Boolean(token);

  if (forbidden) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-50">
        <Navbar />
        <main className="relative z-10 max-w-2xl mx-auto px-6 sm:px-8 pt-28 pb-20">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900">
            You can only edit projects you created.
          </div>
          <Link
            to="/home"
            className="inline-block mt-6 text-maroon-600 font-medium hover:underline"
          >
            Back to home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900">
      <Navbar />
      <main className="relative z-10 max-w-2xl mx-auto px-6 sm:px-8 pt-28 pb-20">
        <div data-tour="add-project-form" className="mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-stone-900 tracking-tight">
            {isEdit ? "Edit project" : "New project"}
          </h1>
          <p className="mt-2 text-stone-600 font-sans">
            {isEdit
              ? "Update details or replace media and workspace."
              : "Tell us about your work. Media and files are optional."}
          </p>
          {!isEdit && (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-maroon-800 text-amber-50">
                  <Github className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">Prefer importing from GitHub?</p>
                  <p className="mt-0.5 text-xs text-stone-600">
                    Pull repositories as projects with languages and visibility filled in for you.
                  </p>
                </div>
              </div>
              <Link
                to="/import/github"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-maroon-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-maroon-900"
              >
                <Github className="h-4 w-4" />
                Import from GitHub
              </Link>
            </div>
          )}
        </div>

        {loadingProject ? (
          <div className="flex items-center gap-3 text-stone-600 py-16 justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-maroon-600" />
            Loading project…
          </div>
        ) : verifyingOwner ? (
          <div className="flex items-center gap-3 text-stone-600 py-16 justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-maroon-600" />
            Verifying access…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-b from-white to-stone-50/80 p-5 sm:p-6 shadow-sm">
              <div className="flex w-full items-center justify-between gap-1">
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
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            active
                              ? "border-maroon-500 bg-white text-maroon-600 shadow-lg shadow-maroon-500/20 ring-[3px] ring-maroon-100"
                              : done
                                ? "border-transparent bg-gradient-to-br from-forest-700 to-forest-800 text-white shadow-md"
                                : "border-stone-200 bg-white text-stone-400"
                          }`}
                          aria-current={active ? "step" : undefined}
                        >
                          {done ? (
                            <span className="text-sm font-bold" aria-hidden>
                              ✓
                            </span>
                          ) : (
                            <Icon className="h-5 w-5" aria-hidden />
                          )}
                        </div>
                        <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-wide text-stone-600">
                          {s.title}
                        </p>
                      </div>
                      {stepIdx < TOTAL_STEPS - 1 && (
                        <div
                          className="relative mx-1 h-1 min-w-[1.25rem] flex-[1.2] self-start mt-5"
                          aria-hidden
                        >
                          <div className="absolute inset-0 rounded-full bg-stone-100" />
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-maroon-800 to-autumn-rust transition-[width] duration-500 ease-out"
                            style={{ width: segmentComplete ? "100%" : "0%" }}
                          />
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
              {stepError && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  {stepError}
                </div>
              )}
            </div>

            {step === 1 && (
            <section className="rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <h2 className="font-serif text-xl font-bold text-stone-900">Project source</h2>

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-stone-700 mb-1.5"
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

              <div className="space-y-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => zipInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      zipInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setZipDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setZipDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setZipDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setZipDragging(false);
                    acceptZipFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition cursor-pointer select-none ${
                    zipDragging
                      ? "border-maroon-500 bg-maroon-100/60 scale-[1.01]"
                      : sourceIndexed
                        ? "border-emerald-300 bg-gradient-to-br from-emerald-50/80 to-stone-50"
                        : workspaceZip
                          ? "border-maroon-300 bg-gradient-to-br from-maroon-50/60 to-stone-50"
                          : "border-maroon-200 bg-gradient-to-br from-maroon-50/40 to-stone-50 hover:border-maroon-400"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_20%,#7f1d1d,transparent_45%),radial-gradient(circle_at_80%_70%,#292524,transparent_40%)]" />
                  <div className="relative flex flex-col items-center justify-center gap-3 px-4 py-10 sm:py-14 text-center">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ${
                        sourceIndexed
                          ? "bg-emerald-600 text-white"
                          : "bg-maroon-800 text-white"
                      }`}
                    >
                      {detectingStacks ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : sourceIndexed ? (
                        <CheckCircle2 className="h-8 w-8" />
                      ) : (
                        <UploadCloud className="h-8 w-8" />
                      )}
                    </div>
                    {workspaceZip ? (
                      <>
                        <div className="max-w-full px-2">
                          <p className="truncate text-base font-bold text-stone-900">{workspaceZip.name}</p>
                          <p className="mt-0.5 text-sm text-stone-500">
                            {(workspaceZip.size / (1024 * 1024)).toFixed(1)} MB
                            {sourceIndexed ? " · ready" : " · tap to replace"}
                          </p>
                        </div>
                      </>
                    ) : sourceIndexed ? (
                      <p className="text-base font-bold text-emerald-900">Workspace ready</p>
                    ) : (
                      <p className="text-base font-bold text-stone-900">
                        {zipDragging ? "Drop ZIP here" : "Drop ZIP or click to browse"}
                      </p>
                    )}
                    <p className="text-[11px] uppercase tracking-wider text-stone-400">
                      .zip · up to {WORKSPACE_ZIP_MAX_MB} MB
                    </p>
                  </div>
                </div>
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    acceptZipFile(f);
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  {workspaceZip && (
                    <button
                      type="button"
                      onClick={clearZip}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white text-red-600 hover:bg-red-50"
                      aria-label="Remove ZIP"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={detectingStacks || !workspaceZip || !title.trim()}
                    onClick={() => void ensureDraftAndUploadZip()}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-maroon-800 px-5 text-sm font-semibold text-white hover:bg-maroon-900 disabled:opacity-50 sm:flex-none sm:ml-auto"
                  >
                    {detectingStacks ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {uploadPercent < 100 ? `${uploadPercent}%` : "Detecting…"}
                      </>
                    ) : sourceIndexed ? (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        Re-scan
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        Upload & detect
                      </>
                    )}
                  </button>
                </div>
                {detectingStacks && (
                  <div className="h-2 overflow-hidden rounded-full bg-maroon-100" role="status" aria-label="Upload progress">
                    <div
                      className={`h-full bg-maroon-600 transition-[width] ${uploadPercent < 100 ? "" : "animate-pulse"}`}
                      style={{ width: `${uploadPercent}%` }}
                    />
                  </div>
                )}
              </div>

              {draftProjectId && sourceIndexed ? (
                <GenerateWithAiPanel
                  projectId={draftProjectId}
                  currentShort={shortDescription}
                  currentFull={fullDescription}
                  onApplied={({ short, full }) => {
                    if (short) setShortDescription(short);
                    if (full) setFullDescription(full);
                  }}
                  onApprovedContinue={() => advanceStep(2)}
                  continueLabel="Continue"
                />
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-maroon-100 text-maroon-700">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-stone-700">AI after upload</span>
                </div>
              )}

              <div className="space-y-5 border-t border-stone-100 pt-5">
                <h3 className="font-serif text-lg font-bold text-stone-900">Descriptions</h3>
                <div>
                  <label
                    htmlFor="short_description"
                    className="block text-sm font-medium text-stone-700 mb-1.5"
                  >
                    Short description
                  </label>
                  <textarea
                    id="short_description"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={3}
                    placeholder="One-line summary visitors see on cards"
                    className={`${fieldClass} resize-y min-h-[88px]`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="full_description"
                    className="block text-sm font-medium text-stone-700 mb-1.5"
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
                  <p className="mt-1.5 text-xs text-stone-500">
                    URLs in the description become clickable on the project page.
                  </p>
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-stone-700 mb-2">
                  Tech stacks
                  {categorySuggested && category ? (
                    <span className="ml-2 text-xs font-normal text-stone-500">
                      · suggested category “{category}” (confirm on next step)
                    </span>
                  ) : null}
                </span>
                {loadingStacks ? (
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </div>
                ) : !sourceIndexed ? (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-200/80 text-stone-500">
                      <Layers className="h-5 w-5" />
                    </span>
                    <span className="text-sm text-stone-500">Stacks appear after upload</span>
                  </div>
                ) : stackOptions.length === 0 ? (
                  <p className="text-sm text-stone-500">No catalog options loaded.</p>
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
              </div>

              <div>
                <label htmlFor="live_url" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Working / live demo link <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <input
                  id="live_url"
                  type="url"
                  inputMode="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  maxLength={500}
                  className={fieldClass}
                  placeholder="https://your-project.example.com"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                    disabled={!liveUrl.trim() || !/^https?:\/\/\S+$/i.test(liveUrl.trim())}
                    onClick={() => {
                      const url = liveUrl.trim();
                      const line = `Working link: ${url}`;
                      setFullDescription((prev) => (prev.trim() ? `${prev.trim()}\n\n${line}` : line));
                    }}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Add link into description
                  </button>
                  <span className="text-xs text-stone-500">Also shown as the Live demo button on the project page.</span>
                </div>
              </div>
              <div>
                <label htmlFor="impact_note" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Outcomes <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="impact_note"
                  value={impactNote}
                  onChange={(e) => setImpactNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Users, results or feedback you can report, e.g. “Used by 40 students during orientation week”"
                  className={`${fieldClass} resize-y min-h-[88px]`}
                />
                <p className="mt-1.5 text-xs text-stone-500">Shown in the project report as reported by you.</p>
              </div>
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void goNext()}
                  disabled={detectingStacks}
                  className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-maroon-800 text-white font-semibold hover:bg-maroon-900 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>
            )}

            {step === 2 && (
            <section className="rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <h2 className="font-serif text-xl font-bold text-stone-900">Category & visibility</h2>
              {categorySuggested && category ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                  Suggested: <span className="font-semibold">{category}</span>
                </p>
              ) : null}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-stone-700 mb-1.5"
                  >
                    Category
                  </label>
                  <Select
                    id="category"
                    aria-label="Category"
                    placeholder="Select category"
                    value={category}
                    onChange={(value) => {
                      setCategory(value);
                      setCategorySuggested(false);
                      if (value !== "Other") setCategoryOther("");
                    }}
                    options={PROJECT_CATEGORIES}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="visibility"
                    className="block text-sm font-medium text-stone-700 mb-1.5"
                  >
                    Visibility
                  </label>
                  <Select
                    id="visibility"
                    aria-label="Visibility"
                    value={visibility}
                    onChange={(value) => setVisibility(value as ProjectVisibility)}
                    options={PROJECT_VISIBILITY_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Engagement</p>
                <label className="flex items-start gap-2 text-sm text-stone-700">
                  <input type="checkbox" checked={commentsEnabled} onChange={(e) => setCommentsEnabled(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-stone-300" />
                  <span>
                    <span className="font-semibold">Allow comments</span>
                    <span className="mt-0.5 block text-xs font-normal text-stone-500">Turn off to stop new comments on this project.</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm text-stone-700">
                  <input type="checkbox" checked={likesHidden} onChange={(e) => setLikesHidden(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-stone-300" />
                  <span>
                    <span className="font-semibold">Hide like count</span>
                    <span className="mt-0.5 block text-xs font-normal text-stone-500">People can still like it; only you see the number.</span>
                  </span>
                </label>
              </div>
              {category === "Other" && (
                <div>
                  <label
                    htmlFor="category_other"
                    className="block text-sm font-medium text-stone-700 mb-1.5"
                  >
                    Custom label <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="category_other"
                    value={categoryOther}
                    onChange={(e) => setCategoryOther(e.target.value)}
                    className={fieldClass}
                    placeholder="e.g. IoT, Blockchain, DevOps"
                    maxLength={64}
                  />
                  <p className="mt-1.5 text-xs text-stone-500">
                    Shown as “Other — your label” on the project page.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium hover:bg-stone-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-maroon-800 text-white font-semibold hover:bg-maroon-900"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>
            )}

            {step === 3 && (
            <section className="rounded-2xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="font-serif text-xl font-bold text-stone-900">Cover & media</h2>

              <div className="space-y-3 rounded-2xl border border-maroon-200/70 bg-gradient-to-br from-maroon-50/50 to-stone-50 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-maroon-600" />
                    Cover image <span className="text-maroon-700 font-bold">*</span>
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
                      className="text-xs font-semibold text-maroon-600 hover:text-maroon-700 px-3 py-1.5 rounded-lg bg-maroon-50 hover:bg-maroon-100"
                    >
                      {coverFile || existingCoverDisplayUrl ? "Replace" : "Choose"}
                    </button>
                  </div>
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    if (!f) return;
                    setPendingCover(f);
                  }}
                />
                <p className="text-xs text-stone-600">
                  Required for publishing. PNG, JPG, GIF, or WebP · under 10 MB · cropped to 16:9.
                </p>
                {coverHeroSrc ? (
                  <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-100 aspect-video max-h-64 shadow-sm">
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
                    className="w-full rounded-xl border-2 border-dashed border-maroon-300/80 bg-white hover:border-maroon-500 hover:bg-maroon-50/40 py-12 text-sm font-medium text-maroon-800 transition"
                  >
                    Add cover image
                  </button>
                )}
                {pendingCover && (
                  <PhotoCropper
                    file={pendingCover}
                    title="Crop cover image"
                    aspect={16 / 9}
                    cropShape="rect"
                    outputWidth={1280}
                    outputHeight={720}
                    maxBytes={COVER_MAX_BYTES}
                    hint="Crop to 16:9 landscape for covers and gallery cards. Keep the file under 10 MB."
                    confirmLabel="Use cover"
                    onCancel={() => setPendingCover(null)}
                    onDone={(cropped) => {
                      setCoverFile(cropped);
                      setCoverRemoved(false);
                      setPendingCover(null);
                    }}
                  />
                )}
              </div>

              <div className="border-t border-stone-100 pt-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-stone-800 flex items-center gap-2">
                    <Video className="w-4 h-4 text-maroon-600" />
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
                      className="text-xs font-semibold text-maroon-600 hover:text-maroon-700 px-3 py-1.5 rounded-lg bg-maroon-50 hover:bg-maroon-100"
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
                  <p className="text-sm text-stone-600 truncate pl-1">
                    {demoVideoFile.name}
                  </p>
                ) : isEdit && savedDemoUrl && !demoRemoved ? (
                  <p className="text-xs text-stone-600">
                    Current demo is kept unless you replace or remove it.
                  </p>
                ) : (
                  <p className="text-xs text-stone-500">Optional.</p>
                )}
              </div>

              <div className="border-t border-stone-100 pt-6 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                  Teammates
                </h3>
                {isEdit ? (
                  <p className="text-xs text-stone-600">
                    Invite people, set their access, and answer join requests from the Team section on the{" "}
                    <Link to={`/project/${editProjectId}`} className="font-semibold text-maroon-700 hover:underline">project page</Link>.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-stone-600">
                      Optional. Each person gets an invitation with the role and access you choose, and joins once they accept.
                      Anyone can also ask to join later from the project page.
                    </p>
                    <TeammatePicker value={teammates} onChange={setTeammates} />
                  </>
                )}
              </div>

              {isEdit && editProjectId && (
                <ProjectIntelligenceControls
                  projectId={editProjectId}
                  shortDescription={shortDescription}
                  fullDescription={fullDescription}
                  onApplyDescriptions={({ short, full }) => {
                    if (short != null) setShortDescription(short);
                    if (full != null) setFullDescription(full);
                  }}
                />
              )}

              <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium hover:bg-stone-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to={isEdit && editProjectId ? `/project/${editProjectId}` : "/profile"}
                    className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl border border-stone-200 bg-white text-stone-700 font-medium hover:bg-stone-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 rounded-xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust text-white font-semibold shadow-md shadow-maroon-800/20 hover:shadow-lg hover:shadow-maroon-800/25 hover:from-maroon-900 hover:to-autumn-amber disabled:opacity-50 disabled:pointer-events-none transition"
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
            )}

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
            className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl sm:max-w-2xl sm:p-8"
            role="dialog"
            aria-labelledby="tech-confirm-title"
            aria-modal="true"
          >
            <h3
              id="tech-confirm-title"
              className="text-lg font-semibold text-stone-900 sm:text-xl"
            >
              Confirm tech stacks
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              {techModalExitsForm
                ? "We detected these from your workspace. Confirm what should appear on the project, then continue."
                : "Confirm stacks for this draft. You stay on the form to finish descriptions and publish."}
            </p>
            {loadingStacks ? (
              <p className="mt-6 text-sm text-stone-500">Loading options…</p>
            ) : stackOptions.length === 0 ? (
              <p className="mt-6 text-sm text-amber-800">
                Tech stack list could not be loaded. You can set stacks later from the project edit
                page.
              </p>
            ) : (
              <div className="mt-6 flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
                {[...stackOptions].sort((a, b) => {
                  const found = (t: TechStackItem) => techConfirmContext.detected.includes(stackNumericId(t) ?? -1);
                  return Number(found(b)) - Number(found(a));
                }).map((t) => {
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
              <p className="mt-3 text-xs text-stone-500">
                None selected — you can add stacks above, or continue with no stacks (they will be
                cleared on save).
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={dismissTechModalAndFinish}
                disabled={confirmingTechStacks}
                className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={confirmTechStacksAndFinish}
                disabled={confirmingTechStacks}
                className="rounded-lg bg-maroon-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-maroon-900 disabled:opacity-60"
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
