import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useParams } from "react-router-dom";
import { ArrowLeft, GitCommit, GitPullRequest, Loader2 } from "lucide-react";
import { queryClient, queryKeys } from "../api/queryKeys";
import {
  commitFile, commitFiles, compareBranches, createWorkspaceBranch, discardDraft, fetchBranches,
  fetchDrafts, fetchLiveFile, fetchLiveTree, fetchWorkspace, openPullRequest, refreshWorkspace,
  retrySync, saveDraft, type WorkspaceDraft,
} from "../api/workspace";
import { Navbar } from "../components/Navbar";
import { FilePreview } from "../components/files/FilePreview";
import { ProjectFileTree } from "../components/ProjectFileTree";
import { Select } from "../components/ui/Select";
import { CodeEditor, DiffView } from "../components/workspace/CodeEditor";
import { ui } from "../styles/editorial";
import { getApiErrorMessage } from "../utils/apiError";
import { branchProblem } from "../utils/branchName";
import { buildFileTreeFromEntries } from "../utils/buildFileTree";
import { githubTreeEntries } from "../utils/githubTree";
import { hasBom, lineEndingOf } from "../utils/lineEndings";

export function ProjectWorkspacePage() {
  const { id = "" } = useParams();
  const status = useQuery({
    queryKey: queryKeys.workspace(id),
    queryFn: () => fetchWorkspace(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const sync = query.state.data?.sync?.status;
      return sync === "pending" || sync === "running" ? 4000 : false;
    },
  });
  const info = status.data;
  const connected = Boolean(info?.connection.connected);
  const [branch, setBranch] = useState("");
  const branches = useQuery({
    queryKey: [...queryKeys.workspace(id), "branches"],
    queryFn: () => fetchBranches(id),
    enabled: connected && info?.source_kind === "github",
  });
  const activeBranch = branch || info?.tracked_branch || info?.default_branch || "";
  const tree = useQuery({
    queryKey: [...queryKeys.workspace(id), "tree", activeBranch],
    queryFn: () => fetchLiveTree(id, activeBranch),
    enabled: connected && Boolean(activeBranch),
  });
  const drafts = useQuery({
    queryKey: [...queryKeys.workspace(id), "drafts", activeBranch],
    queryFn: () => fetchDrafts(id, activeBranch),
    enabled: connected && Boolean(activeBranch) && Boolean(info?.can_edit),
  });
  const roots = useMemo(() => buildFileTreeFromEntries(githubTreeEntries(tree.data?.entries ?? [])), [tree.data]);
  const headSha = branches.data?.find((item) => item.name === activeBranch)?.sha ?? tree.data?.sha ?? "";

  const [path, setPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState("");
  const [base, setBase] = useState("");
  const [blobSha, setBlobSha] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [textFile, setTextFile] = useState(false);
  const [loadToken, setLoadToken] = useState(0);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [prOpen, setPrOpen] = useState(false);
  const idempotency = useRef(crypto.randomUUID());
  const dirty = textFile && content !== saved;
  const blocker = useBlocker(dirty);

  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("You have an unsaved draft on this file. Leave anyway?")) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    if (!dirty || !path || !info?.can_edit) return;
    const timer = window.setTimeout(() => {
      void saveDraft(id, {
        branch: activeBranch, path, content, base_blob_sha: blobSha, base_commit_sha: headSha || null,
        line_ending: lineEndingOf(content), has_bom: hasBom(content),
      }).then(() => {
        setSaved(content);
        void queryClient.invalidateQueries({ queryKey: [...queryKeys.workspace(id), "drafts", activeBranch] });
      }).catch((err: unknown) => setError(getApiErrorMessage(err)));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [dirty, content, path, activeBranch, id, blobSha, headSha, info?.can_edit]);

  async function openFile(nextPath: string) {
    setError(null);
    setShowDiff(false);
    setPath(nextPath);
    setTextFile(false);
    try {
      const file = await fetchLiveFile(id, activeBranch, nextPath);
      const draft = (drafts.data ?? []).find((item) => item.path === nextPath);
      const text = draft?.content ?? file.content ?? "";
      setBlocked(file.blocked);
      setTextFile(file.content != null && !file.blocked);
      setContent(text);
      setSaved(text);
      setBase(file.content ?? "");
      setBlobSha(draft?.base_blob_sha ?? file.sha);
      setLoadToken((n) => n + 1);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function commit(all: boolean) {
    if (!path && !all) return;
    setBusy(true);
    setError(null);
    try {
      if (all) {
        const rows = (drafts.data ?? []).map((row) => row.path === path ? { ...row, content, base_blob_sha: blobSha } : row);
        if (path && !rows.some((row) => row.path === path)) {
          rows.push({ id: "open", branch: activeBranch, path, content, base_blob_sha: blobSha, base_commit_sha: headSha, line_ending: "lf", has_bom: false, revision: 0 });
        }
        const result = await commitFiles(id, {
          branch: activeBranch,
          message,
          parent_sha: headSha,
          idempotency_key: idempotency.current,
          files: rows.map((row) => ({ path: row.path, content: row.content, base_blob_sha: row.base_blob_sha })),
        });
        setNotice(result.url ? `Committed. ${result.url}` : "Committed. The snapshot is updating.");
      } else if (path) {
        const result = await commitFile(id, {
          branch: activeBranch, path, content, message, base_blob_sha: blobSha, idempotency_key: idempotency.current,
        });
        setNotice(result.replayed ? "That commit was already sent." : "Committed to GitHub. The stored snapshot is updating separately.");
        setSaved(content);
        setBase(content);
      }
      idempotency.current = crypto.randomUUID();
      setMessage("");
      void status.refetch();
      void drafts.refetch();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function makeBranch(name: string) {
    const problem = branchProblem(name);
    if (problem) {
      setError(problem);
      return null;
    }
    const made = await createWorkspaceBranch(id, name, headSha);
    setBranch(made.name);
    void branches.refetch();
    return made.name;
  }

  const canWrite = Boolean(info?.can_edit && connected && info.configured);
  const sync = info?.sync;

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-6xl`}>
        <Link to={`/project/${id}`} className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-maroon-800">
          <ArrowLeft className="h-4 w-4" /> Back to the project
        </Link>
        <h1 className={`${ui.title} mt-4 text-4xl`}>Code</h1>
        {status.isLoading && <p className="mt-6 flex items-center gap-2 text-sm text-stone-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading workspace…</p>}
        {status.isError && <p className="mt-6 text-sm text-stone-600">Only the owner and teammates who can edit files can open the code workspace. The GitHub link on the project page stays available.</p>}
        {info && (
          <div className="mt-6 space-y-4">
            <WorkspaceBanner info={info} onRefresh={(kind) => void refreshWorkspace(id, kind).then(() => status.refetch()).catch((err: unknown) => setError(getApiErrorMessage(err)))} />
            {sync && sync.status !== "ok" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p>Snapshot sync is {sync.status}{sync.error ? `: ${sync.error}` : "."} The GitHub commit is separate from this copy.</p>
                {sync.status === "failed" && (
                  <button type="button" className={`${ui.btn} ${ui.neutral} mt-2`} onClick={() => void retrySync(id, sync.id).then(() => status.refetch())}>Retry sync</button>
                )}
              </div>
            )}
            {error && <p className={ui.error}>{error}</p>}
            {notice && <p className="text-sm font-medium text-forest-800">{notice}</p>}
            {info.source_kind === "github" && connected && (
              <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
                <section className={`${ui.card} p-3`}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Branch
                    <Select
                      aria-label="Branch"
                      value={activeBranch}
                      onChange={(value) => { setBranch(value); setPath(null); }}
                      options={(branches.data ?? [{ name: activeBranch, sha: headSha, protected: false, default: true }]).map((item) => ({
                        value: item.name, label: `${item.name}${item.protected ? " (protected)" : ""}`,
                      }))}
                      className={`${ui.input} mt-1 font-mono normal-case tracking-normal`}
                    />
                  </label>
                  {tree.data?.truncated && <p className="mt-2 text-xs text-amber-800">GitHub truncated this file list.</p>}
                  <div className="mt-3 max-h-[32rem] overflow-auto">
                    <ProjectFileTree roots={roots} selectedPath={path} onFileClick={(node) => void openFile(node.path)} />
                  </div>
                </section>
                <section className={`${ui.card} p-4`}>
                  {!path && <p className="text-sm text-stone-500">Choose a file. Text files open in the editor. Other files use the stored snapshot preview.</p>}
                  {path && blocked && <p className="text-sm text-stone-700">{blocked}</p>}
                  {path && textFile && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="break-all font-mono text-xs text-stone-500">{path}{dirty ? " · unsaved" : ""}</p>
                        <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={() => setShowDiff((v) => !v)}>{showDiff ? "Hide changes" : "Show changes"}</button>
                      </div>
                      {showDiff ? <DiffView key={`${path}-diff`} path={path} original={base} value={content} /> : (
                        <CodeEditor key={`${path}:${loadToken}`} path={path} value={content} readOnly={!canWrite} onChange={setContent} />
                      )}
                      {canWrite && (
                        <CommitBar
                          message={message}
                          busy={busy}
                          drafts={headSha ? (drafts.data ?? []) : []}
                          onMessage={setMessage}
                          onCommit={() => void commit(false)}
                          onCommitAll={() => void commit(true)}
                          onDiscard={() => path && void discardDraft(id, activeBranch, path).then(() => openFile(path))}
                        />
                      )}
                    </div>
                  )}
                  {path && !textFile && !blocked && <FilePreview projectId={id} path={path} />}
                </section>
              </div>
            )}
            {canWrite && headSha && (
              <div className="flex flex-wrap gap-2">
                <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={() => setPrOpen(true)}>
                  <GitPullRequest className="h-3.5 w-3.5" /> Open a pull request
                </button>
              </div>
            )}
            {prOpen && (
              <PullDialog
                baseBranch={info.tracked_branch || info.default_branch || "main"}
                headBranch={activeBranch}
                onClose={() => setPrOpen(false)}
                onCreate={async (title, body, head, baseName, create) => {
                  setBusy(true);
                  setError(null);
                  try {
                    const headName = create ? await makeBranch(head) : head;
                    if (!headName) return;
                    const compared = await compareBranches(id, baseName, headName);
                    if (compared.ahead_by === 0) {
                      setError("That branch has no commits ahead of the base.");
                      return;
                    }
                    const opened = await openPullRequest(id, { title, body, head: headName, base: baseName });
                    setNotice(`Pull request #${opened.number} is open. It is not merged.`);
                    setPrOpen(false);
                  } catch (err) {
                    setError(getApiErrorMessage(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function WorkspaceBanner({ info, onRefresh }: {
  info: { source_kind: string; repository: string | null; configured: boolean; can_edit: boolean; connection: { connected: boolean; login: string | null } };
  onRefresh: (kind: "history" | "source" | "analysis") => void;
}) {
  if (info.source_kind !== "github") {
    return <p className={ui.empty}>This project was uploaded as a ZIP, so it stays read-only. Import it from GitHub to commit from here.</p>;
  }
  if (!info.configured) {
    return <p className={ui.empty}>Editing isn’t configured on this server yet. Files can still be previewed on the project page.</p>;
  }
  if (!info.connection.connected) {
    return (
      <p className={ui.empty}>
        Connect GitHub for editing in <Link to="/settings?section=github" className={ui.link}>Settings</Link> before committing.
        {info.repository ? ` Repository: ${info.repository}.` : ""}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-stone-600">
        {info.repository} · connected as {info.connection.login || "your GitHub account"}
        {!info.can_edit && " · you can read this repository, not commit to it"}
      </p>
      {info.can_edit && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={() => onRefresh("history")}>Refresh history</button>
          <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={() => onRefresh("source")}>Refresh snapshot</button>
          <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={() => onRefresh("analysis")}>Re-analyse</button>
        </div>
      )}
    </div>
  );
}

function CommitBar({ message, busy, drafts, onMessage, onCommit, onCommitAll, onDiscard }: {
  message: string;
  busy: boolean;
  drafts: WorkspaceDraft[];
  onMessage: (value: string) => void;
  onCommit: () => void;
  onCommitAll: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
        Commit message
        <input value={message} onChange={(event) => onMessage(event.target.value)} className={`${ui.input} mt-1 normal-case tracking-normal`} placeholder="What changed" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${ui.btn} ${ui.primary}`} disabled={busy || !message.trim()} onClick={onCommit}>
          <GitCommit className="h-3.5 w-3.5" /> Commit to GitHub
        </button>
        {drafts.length > 1 && (
          <button type="button" className={`${ui.btn} ${ui.neutral}`} disabled={busy || !message.trim()} onClick={onCommitAll}>
            Commit {drafts.length} files
          </button>
        )}
        <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={onDiscard}>Discard draft</button>
      </div>
    </div>
  );
}

function PullDialog({ baseBranch, headBranch, onClose, onCreate }: {
  baseBranch: string;
  headBranch: string;
  onClose: () => void;
  onCreate: (title: string, body: string, head: string, baseName: string, create: boolean) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [head, setHead] = useState(headBranch);
  const [base, setBase] = useState(baseBranch);
  const [create, setCreate] = useState(false);
  return (
    <form className={`${ui.card} space-y-3 p-4`} onSubmit={(event) => { event.preventDefault(); void onCreate(title, body, head, base, create); }}>
      <h2 className={ui.heading}>Open a pull request</h2>
      <p className={ui.muted}>GitHub opens the request. Nothing is merged from here.</p>
      <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Title" className={ui.input} />
      <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="What should reviewers know?" className={`${ui.input} min-h-24`} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={base} onChange={(event) => setBase(event.target.value)} className={ui.input} aria-label="Base branch" />
        <input value={head} onChange={(event) => setHead(event.target.value)} className={ui.input} aria-label="Head branch" />
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" checked={create} onChange={(event) => setCreate(event.target.checked)} className="accent-maroon-800" />
        Create the head branch from the current commit
      </label>
      <div className="flex gap-2">
        <button type="submit" className={`${ui.btn} ${ui.primary}`} disabled={!title.trim()}>Open pull request</button>
        <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}
