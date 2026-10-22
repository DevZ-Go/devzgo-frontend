import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Code2, ExternalLink, Github, Loader2, MessageSquare, Pencil, Share2, Trash2, User, Users, Heart } from "lucide-react";
import { ProjectQualityReport } from "../components/evidence/ProjectQualityReport";
import { FilePreview } from "../components/files/FilePreview";
import { useProjectLike } from "../hooks/useProjectLike";
import { Navbar } from "../components/Navbar";
import { ProjectComments } from "../components/ProjectComments";
import { TeamPanel } from "../components/TeamPanel";
import { GitHubInsights } from "../components/GitHubInsights";
import { ProjectSourceLine } from "../components/ProjectSourceLine";
import {
  deleteProject,
  fetchProject,
  fetchProjectFiles,
} from "../api";
import type { ProjectFileEntry } from "../api";
import { resolveApiAssetUrl } from "../api/config";
import { getApiErrorMessage } from "../utils/apiError";
import type { ApiProject } from "../types/project";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { ProjectFileTree } from "../components/ProjectFileTree";
import { buildFileTreeFromEntries } from "../utils/buildFileTree";
import { useAuth } from "../auth/AuthContext";
import { CollaborationModal } from "../components/CollaborationModal";
import { ShareProjectDialog } from "../components/ShareProjectDialog";
import { isProjectOwner } from "../utils/projectOwnership";
import type { FileTreeNode } from "../utils/buildFileTree";
import {
  getProjectCategoryChipClasses,
  getTechStackChipClasses,
} from "../utils/techStackChipStyle";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop";

const PROJECT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "report" ? "report" : "overview";
  const { user, token, refreshUser } = useAuth();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [files, setFiles] = useState<ProjectFileEntry[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const activeFilePath = searchParams.get("file");

  const fileTreeRoots = useMemo(
    () => buildFileTreeFromEntries(files),
    [files]
  );

  const isOwner =
    project?.is_owner === true ||
    (project != null &&
      project.is_owner !== false &&
      isProjectOwner(project, user));
  const canEditCode = Boolean(project?.access?.files || project?.access?.owner || isOwner);

  useEffect(() => {
    if (token && user == null) {
      void refreshUser();
    }
  }, [token, user, refreshUser]);

  useEffect(() => {
    if (!id || !PROJECT_UUID.test(id)) {
      setLoading(false);
      setProject(null);
      setError(id ? "This project isn't available." : "Missing project id.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFilesError(null);
    setFiles([]);

    (async () => {
      try {
        const p = await fetchProject(id);
        if (cancelled) return;
        setProject(p);
        try {
          const fileList = await fetchProjectFiles(id);
          if (cancelled) return;
          setFiles(fileList);
        } catch (fe) {
          if (!cancelled) {
            setFilesError(getApiErrorMessage(fe));
            setFiles([]);
          }
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const coverRaw = project?.cover_image_url ?? project?.image_url;
  const coverUrl =
    typeof coverRaw === "string" && coverRaw
      ? resolveApiAssetUrl(coverRaw)
      : PLACEHOLDER;
  const videoUrl =
    project?.demo_video_url && typeof project.demo_video_url === "string"
      ? resolveApiAssetUrl(project.demo_video_url)
      : null;
  const owner =
    project?.owner_username ?? project?.owner?.username ?? "Creator";
  const stacks = project?.tech_stacks ?? [];
  const categoryDisplay =
    project?.category === "Other" && project?.category_other?.trim()
      ? `Other — ${project.category_other.trim()}`
      : project?.category ?? "";

  async function handleDeleteProject() {
    if (!id || !project || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProject(id);
      navigate("/profile", { replace: true });
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  function handleFileClick(node: FileTreeNode) {
    if (!id || node.is_directory) return;
    setSearchParams((params) => {
      params.set("file", node.path);
      return params;
    }, { replace: true });
  }

  /** Report evidence opens the file in the Overview viewer, scrolled into view. */
  function openFromReport(path: string) {
    if (!id) return;
    setSearchParams((params) => {
      params.delete("tab");
      params.set("file", path);
      return params;
    }, { replace: true });
    requestAnimationFrame(() => document.getElementById("project-files")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900">
      <Navbar />
      <main className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-28 pb-20">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-maroon-800 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-600">
            <Loader2 className="w-10 h-10 text-maroon-700 animate-spin" />
            <p className="font-serif">Loading project…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && project && (
          <article className="space-y-8">
            <div className="rounded-3xl overflow-hidden border border-stone-200/90 bg-white/95 shadow-sm">
              {/* Full-bleed cover: span the padded main column edge-to-edge */}
              <div className="-mx-6 sm:-mx-8">
                <div className="relative w-full aspect-[2.4/1] min-h-[200px] max-h-[min(42vh,420px)] bg-stone-100">
                  <ImageWithFallback
                    src={coverUrl}
                    alt={project.title}
                    className="absolute inset-0 block h-full w-full object-cover object-center"
                  />
                </div>
              </div>
              <div className="p-8 sm:p-10">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {stacks.map((t) => (
                    <span key={t} className={getTechStackChipClasses(t, "onLight")}>
                      {t}
                    </span>
                  ))}
                  {categoryDisplay && (
                    <span className={getProjectCategoryChipClasses(project.category ?? "Other")}>
                      {categoryDisplay}
                    </span>
                  )}
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-stone-900 tracking-tight mb-3">
                  {project.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-slate-600 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 shrink-0" />
                    <Link to={project.owner_id ? `/profile/${project.owner_id}` : `/profile/${owner}`} className="font-semibold text-stone-800 hover:text-maroon-800">
                      @{owner}
                    </Link>
                    {project.visibility && (
                      <span className="text-slate-400">· {project.visibility}</span>
                    )}
                  </div>
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-stone-700 hover:text-maroon-800"
                    >
                      <Github className="w-4 h-4 shrink-0" /> View on GitHub
                    </a>
                  )}
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-stone-700 hover:text-maroon-800"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" /> Live demo
                    </a>
                  )}
                  {id && canEditCode && (
                    <Link
                      to={`/project/${id}/workspace`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Code
                    </Link>
                  )}
                  {id && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchParams((params) => {
                          params.delete("tab");
                          return params;
                        }, { replace: true });
                        window.setTimeout(() => document.getElementById("project-comments")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Comment
                    </button>
                  )}
                  {id && token && (
                    <button type="button" onClick={() => setShowShare(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </button>
                  )}
                  {id && token && !isOwner && (
                    <button type="button" onClick={() => setShowCollab(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <Users className="w-3.5 h-3.5" />
                      Collaborate
                    </button>
                  )}
                  {id && (
                    <ProjectLikeButton
                      projectId={id}
                      count={project.likes_count ?? 0}
                      liked={Boolean(project.is_liked)}
                      canLike={Boolean(token)}
                    />
                  )}
                  {id && (isOwner || project.access?.edit) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/project/${id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      {isOwner && <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting ? "Deleting…" : "Delete"}
                      </button>}
                    </div>
                  )}
                </div>
                {project.short_description && (
                  <p className="text-lg text-slate-700 leading-relaxed mb-6">
                    {project.short_description}
                  </p>
                )}
                {project.full_description && project.full_description !== project.short_description && (
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {project.full_description}
                    </p>
                  </div>
                )}
                {Array.isArray(project.languages) && project.languages.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-sm font-semibold text-slate-900 mb-3">
                      Languages (auto-detected)
                    </h2>
                    <ul className="space-y-2.5">
                      {project.languages.map((lang) => (
                        <li key={lang.name}>
                          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                            <span className="font-medium text-slate-800">{lang.name}</span>
                            <span className="font-mono tabular-nums">
                              {Number(lang.percentage).toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                              style={{
                                width: `${Math.min(100, Math.max(0, Number(lang.percentage)))}%`,
                              }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div role="tablist" aria-label="Project sections" className="flex gap-1 rounded-full border border-stone-200 bg-white p-1 shadow-sm w-fit">
              {(["overview", "report"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setSearchParams((params) => {
                    if (key === "report") params.set("tab", "report");
                    else params.delete("tab");
                    return params;
                  }, { replace: true })}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    tab === key ? "bg-maroon-800 text-amber-50" : "text-stone-600 hover:text-maroon-800"
                  }`}
                >
                  {key === "overview" ? "Overview" : "Project report"}
                </button>
              ))}
            </div>

            {tab === "report" && id && <ProjectQualityReport projectId={id} onOpenFile={openFromReport} />}

            {tab === "overview" && <>
            {videoUrl && (
              <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Demo video</h2>
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-xl bg-black max-h-[480px]"
                />
              </section>
            )}

            {id && <TeamPanel projectId={id} projectTitle={project.title} />}

            {id && project.github_url && <GitHubInsights projectId={id} />}

            <section id="project-files" className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Project files</h2>
              <ProjectSourceLine source={project.source} />
              {filesError && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                  {filesError}
                </p>
              )}
              {files.length === 0 && !filesError ? (
                <p className="text-sm text-slate-500">
                  No files indexed yet. Add a workspace ZIP when you create a project (or replace it
                  from edit) to see the folder structure here.
                </p>
              ) : (
                <>
                  <ProjectFileTree
                    roots={fileTreeRoots}
                    selectedPath={activeFilePath}
                    onFileClick={handleFileClick}
                  />
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                    {id && <FilePreview projectId={id} path={activeFilePath} />}
                  </div>
                </>
              )}
            </section>

            {id && <ProjectComments projectId={id} enabled={project.comments_enabled !== false} signedIn={Boolean(token)}
              readOnly={Boolean(project.access?.member && project.access.comment === false)} />}
            </>}
          </article>
        )}
      </main>

      {id && project && (
        <>
          <ShareProjectDialog projectId={id} title={project.title} open={showShare} onClose={() => setShowShare(false)} />
          <CollaborationModal projectId={id} projectTitle={project.title} isOpen={showCollab} onClose={() => setShowCollab(false)} />
        </>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete project?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              This action cannot be undone. Workspace files, cover image, and demo video will be removed.
            </p>
            {deleteError && (
              <p className="text-sm text-red-700 mb-3">{deleteError}</p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ProjectLikeButton({ projectId, count: initialCount, liked: initialLiked, canLike }: {
  projectId: string;
  count: number;
  liked: boolean;
  canLike: boolean;
}) {
  const { count, liked, busy, toggle } = useProjectLike(projectId, initialCount, initialLiked);
  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={!canLike || busy}
      title={canLike ? undefined : "Log in to like projects"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default ${
        liked ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Heart className={`w-3.5 h-3.5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
      {count}
    </button>
  );
}
