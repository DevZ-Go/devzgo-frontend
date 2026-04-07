import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, Trash2, User } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import { Navbar } from "../components/Navbar";
import {
  deleteProject,
  fetchProject,
  fetchProjectFileContent,
  fetchProjectFiles,
} from "../api/projects";
import type { ProjectFileEntry } from "../api/projects";
import { resolveApiAssetUrl } from "../api/config";
import { getApiErrorMessage } from "../utils/apiError";
import type { ApiProject } from "../types/project";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { ProjectFileTree } from "../components/ProjectFileTree";
import { buildFileTreeFromEntries } from "../utils/buildFileTree";
import { useAuth } from "../auth/AuthContext";
import { isProjectOwner } from "../utils/projectOwnership";
import type { FileTreeNode } from "../utils/buildFileTree";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function languageFromPath(path: string | null): string {
  if (!path) return "none";
  const ext = path.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = {
    html: "markup",
    xml: "markup",
    css: "css",
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    json: "json",
    py: "python",
    java: "java",
    sh: "bash",
    bash: "bash",
    yml: "yaml",
    yaml: "yaml",
    md: "markdown",
  };
  return byExt[ext] ?? "none";
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token, refreshUser } = useAuth();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [files, setFiles] = useState<ProjectFileEntry[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>("");
  const [loadingFileContent, setLoadingFileContent] = useState(false);
  const [fileContentError, setFileContentError] = useState<string | null>(null);

  const fileTreeRoots = useMemo(
    () => buildFileTreeFromEntries(files),
    [files]
  );
  const highlightedFile = useMemo(() => {
    const language = languageFromPath(activeFilePath);
    if (!activeFilePath) {
      return { language: "none", html: "" };
    }
    if (language !== "none" && Prism.languages[language]) {
      return {
        language,
        html: Prism.highlight(activeFileContent, Prism.languages[language], language),
      };
    }
    return { language: "none", html: escapeHtml(activeFileContent) };
  }, [activeFilePath, activeFileContent]);

  const isOwner =
    project?.is_owner === true ||
    (project != null &&
      project.is_owner !== false &&
      isProjectOwner(project, user));

  useEffect(() => {
    if (token && user == null) {
      void refreshUser();
    }
  }, [token, user, refreshUser]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing project id.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFilesError(null);
    setFiles([]);
    setActiveFilePath(null);
    setActiveFileContent("");
    setFileContentError(null);

    (async () => {
      try {
        const p = await fetchProject(id);
        if (cancelled) return;
        setProject(p);
        try {
          const fileList = await fetchProjectFiles(id);
          if (!cancelled) setFiles(fileList);
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

  async function handleDeleteProject() {
    if (!id || !project || deleting) return;
    const ok = window.confirm(
      "Delete this project permanently? All files, cover image, and demo video will be removed."
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      navigate("/profile", { replace: true });
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  async function handleFileClick(node: FileTreeNode) {
    if (!id || node.is_directory) return;
    setActiveFilePath(node.path);
    setFileContentError(null);
    setLoadingFileContent(true);
    try {
      const res = await fetchProjectFileContent(id, node.path);
      setActiveFileContent(typeof res.content === "string" ? res.content : "");
    } catch (err) {
      setActiveFileContent("");
      setFileContentError(getApiErrorMessage(err));
    } finally {
      setLoadingFileContent(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-28 pb-20">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-600">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p>Loading project…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && project && (
          <article className="space-y-8">
            <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm">
              <div className="aspect-[21/9] max-h-[320px] bg-slate-100">
                <ImageWithFallback
                  src={coverUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 sm:p-10">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {stacks.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-100"
                    >
                      {t}
                    </span>
                  ))}
                  {project.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {project.category}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
                  {project.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-slate-600 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 shrink-0" />
                    <span>@{owner}</span>
                    {project.visibility && (
                      <span className="text-slate-400">· {project.visibility}</span>
                    )}
                  </div>
                  {isOwner && id && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/project/${id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={handleDeleteProject}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
                {project.short_description && (
                  <p className="text-lg text-slate-700 leading-relaxed mb-6">
                    {project.short_description}
                  </p>
                )}
                {project.full_description && (
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {project.full_description}
                    </p>
                  </div>
                )}
              </div>
            </div>

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

            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Project files</h2>
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
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-950 text-slate-100 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-800 text-xs font-mono text-slate-300">
                      {activeFilePath ?? "Select a file to preview"}
                    </div>
                    <div className="p-4">
                      {loadingFileContent ? (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading file…
                        </div>
                      ) : fileContentError ? (
                        <p className="text-sm text-red-300">{fileContentError}</p>
                      ) : activeFilePath ? (
                        <pre
                          className="text-xs font-mono max-h-[420px] overflow-y-auto overflow-x-auto bg-transparent !m-0 whitespace-pre"
                          style={{ whiteSpace: "pre" }}
                        >
                          <code
                            className={`language-${highlightedFile.language} !bg-transparent block whitespace-pre`}
                            dangerouslySetInnerHTML={{ __html: highlightedFile.html }}
                          />
                        </pre>
                      ) : (
                        <p className="text-sm text-slate-400">
                          Click any file in the tree to view its content.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          </article>
        )}
      </main>
    </div>
  );
}
