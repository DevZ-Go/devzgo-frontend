import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, Cpu, Layers, Github, FolderKanban, ImagePlus } from "lucide-react";
import type { GroupProjectShowcase, ProjectKind } from "../../types/groups";
import { fetchMyProjects } from "../../api/projects";
import type { ApiProject } from "../../types/project";
import { useAuth } from "../../auth/AuthContext";
import { showcaseProjectInGroup, uploadShowcaseCover } from "../../api/groups";
import { PhotoCropper } from "../PhotoCropper";
import { assetUrlOrNull } from "../../api/config";

interface ShowcaseProjectModalProps {
  groupId: string;
  onClose: () => void;
  onSuccess: (newProject: GroupProjectShowcase) => void;
}

type SourceMode = "devzgo" | "github" | "manual";

const field =
  "w-full rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm text-[#2D120D] placeholder:text-[#6E5952]/65 focus:outline-none focus:ring-2 focus:ring-[#780D18]/25 focus:border-[#780D18]";
const label = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#780D18] mb-1.5";

export function ShowcaseProjectModal({ groupId, onClose, onSuccess }: ShowcaseProjectModalProps) {
  const { user } = useAuth();
  const coverRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<SourceMode>("devzgo");
  const [myProjects, setMyProjects] = useState<ApiProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [kind, setKind] = useState<ProjectKind>("software");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [howWeBuiltIt, setHowWeBuiltIt] = useState("");
  const [challenges, setChallenges] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [techStacksInput, setTechStacksInput] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [hardwareCadUrl, setHardwareCadUrl] = useState("");
  const [microcontroller, setMicrocontroller] = useState("");
  const [sensors, setSensors] = useState("");
  const [powerSupply, setPowerSupply] = useState("");
  const [cadTool, setCadTool] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingProjects(true);
    fetchMyProjects()
      .then((projs) => {
        if (!active) return;
        setMyProjects(projs || []);
        if (projs?.length) {
          applyProject(projs[0]);
          setSelectedProjectId(String(projs[0].id));
          setSource("devzgo");
        } else {
          setSource("manual");
        }
      })
      .catch(() => {
        if (active) setSource("manual");
      })
      .finally(() => {
        if (active) setLoadingProjects(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const applyProject = (proj: ApiProject) => {
    setTitle(proj.title);
    setTagline(proj.short_description || proj.title);
    setDescription(proj.full_description || proj.short_description || "");
    setCoverImageUrl(proj.cover_image_url || "");
    setCoverPreview(null);
    setCoverFile(null);
    setGithubUrl(proj.github_url || "");
    setLiveUrl(proj.live_url || "");
    setTechStacksInput((proj.tech_stacks || []).join(", "));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a project title");
      return;
    }
    if (source === "github" && !githubUrl.trim()) {
      setError("Add a GitHub repository URL to import from.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const techStacks = techStacksInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const sensorsList = sensors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      let cover = coverImageUrl.trim() || null;
      if (coverFile) {
        cover = await uploadShowcaseCover(groupId, coverFile);
      }

      const newProject = await showcaseProjectInGroup(groupId, {
        projectId: source === "devzgo" && selectedProjectId ? selectedProjectId : null,
        title: title.trim(),
        tagline: tagline.trim() || title.trim(),
        description: description.trim() || "A showcased club project.",
        howWeBuiltIt: howWeBuiltIt.trim() || undefined,
        challengesAccomplishments: challenges.trim() || undefined,
        kind,
        subCategory:
          subCategory.trim() ||
          (kind === "embedded_hardware" ? "Hardware" : "Software"),
        coverImageUrl: cover,
        techStacks: techStacks.length ? techStacks : ["Project"],
        ownerId: String(user?.id || "usr-me"),
        ownerName: user?.username || "Builder",
        ownerUsername: user?.username || "developer",
        githubUrl: githubUrl.trim() || null,
        liveUrl: liveUrl.trim() || null,
        hardwareCadUrl: kind === "embedded_hardware" ? hardwareCadUrl.trim() || null : null,
        embeddedSpecs:
          kind === "embedded_hardware"
            ? {
                microcontroller: microcontroller.trim() || undefined,
                sensorsActuators: sensorsList,
                powerSupply: powerSupply.trim() || undefined,
                cadTool: cadTool.trim() || undefined,
              }
            : undefined,
      });
      onSuccess(newProject);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to showcase project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#2D120D]/50"
        onClick={onClose}
      >
        <div
          className="relative flex flex-col w-full sm:max-w-2xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl bg-[#F7F1E8] border border-[#DECDBA] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 bg-[#780D18] text-[#F7F1E8] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <FolderKanban className="w-4 h-4 shrink-0" />
              <h2 className="font-serif text-lg font-bold truncate">Showcase a project</h2>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5 text-[#2D120D]">
            {error && (
              <div className="p-3 rounded-lg bg-[#780D18]/10 border border-[#780D18]/20 text-xs text-[#780D18]">{error}</div>
            )}

            <div>
              <label className={label}>Source</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["devzgo", "DevZ-Go"],
                    ["github", "GitHub"],
                    ["manual", "Manual"],
                  ] as const
                ).map(([id, text]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSource(id)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                      source === id ? "border-[#780D18] bg-[#780D18] text-white" : "border-[#DECDBA] bg-white"
                    }`}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {source === "devzgo" && (
              <div>
                <label className={label}>Your DevZ-Go project</label>
                {loadingProjects ? (
                  <p className="text-xs text-[#6E5952]">Loading projects…</p>
                ) : myProjects.length === 0 ? (
                  <p className="text-xs text-[#6E5952]">No projects yet — switch to GitHub or Manual.</p>
                ) : (
                  <select
                    className={field}
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      const proj = myProjects.find((p) => String(p.id) === e.target.value);
                      if (proj) applyProject(proj);
                    }}
                  >
                    {myProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {source === "github" && (
              <div>
                <label className={label}>GitHub repository URL *</label>
                <div className="relative">
                  <Github className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E5952]" />
                  <input
                    className={`${field} pl-9`}
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/org/repo"
                  />
                </div>
                <p className="text-[11px] text-[#6E5952] mt-1">We’ll use this link on the showcase card. Fill title &amp; details below.</p>
              </div>
            )}

            <div>
              <label className={label}>Project type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKind("software")}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-left ${
                    kind === "software" ? "border-[#780D18] bg-[#780D18]/08" : "border-[#DECDBA] bg-white"
                  }`}
                >
                  <Layers className="w-4 h-4 mt-0.5 text-[#780D18]" />
                  <div>
                    <p className="text-xs font-bold">Software</p>
                    <p className="text-[11px] text-[#6E5952]">Apps, web, AI, tools</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setKind("embedded_hardware")}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-left ${
                    kind === "embedded_hardware" ? "border-[#780D18] bg-[#780D18]/08" : "border-[#DECDBA] bg-white"
                  }`}
                >
                  <Cpu className="w-4 h-4 mt-0.5 text-[#780D18]" />
                  <div>
                    <p className="text-xs font-bold">Hardware</p>
                    <p className="text-[11px] text-[#6E5952]">Embedded, IoT, CAD</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Title *</label>
                <input className={field} required value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className={label}>Sub-category</label>
                <input className={field} value={subCategory} onChange={(e) => setSubCategory(e.target.value)} placeholder="e.g. Web app" />
              </div>
            </div>

            <div>
              <label className={label}>Tagline</label>
              <input className={field} value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </div>
            <div>
              <label className={label}>Description</label>
              <textarea className={field} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className={label}>How we built it</label>
              <textarea className={field} rows={2} value={howWeBuiltIt} onChange={(e) => setHowWeBuiltIt(e.target.value)} />
            </div>
            <div>
              <label className={label}>Challenges &amp; wins</label>
              <textarea className={field} rows={2} value={challenges} onChange={(e) => setChallenges(e.target.value)} />
            </div>

            <div>
              <label className={label}>Cover image</label>
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#780D18]/40 bg-white px-3 py-5 text-xs font-semibold text-[#780D18]"
              >
                <ImagePlus className="w-4 h-4" />
                Upload &amp; crop cover
              </button>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) setCropFile(f);
                }}
              />
              {(coverPreview || coverImageUrl) && (
                <img
                  src={coverPreview || assetUrlOrNull(coverImageUrl) || coverImageUrl}
                  alt=""
                  className="mt-2 h-32 w-full rounded-lg object-cover border border-[#DECDBA]"
                />
              )}
            </div>

            <div>
              <label className={label}>Tech stack (comma-separated)</label>
              <input className={field} value={techStacksInput} onChange={(e) => setTechStacksInput(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {source !== "github" && (
                <div>
                  <label className={label}>GitHub URL</label>
                  <input className={field} value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
                </div>
              )}
              <div>
                <label className={label}>Live URL</label>
                <input className={field} value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
              </div>
            </div>

            {kind === "embedded_hardware" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-[#DECDBA] bg-white p-3">
                <div>
                  <label className={label}>Microcontroller</label>
                  <input className={field} value={microcontroller} onChange={(e) => setMicrocontroller(e.target.value)} />
                </div>
                <div>
                  <label className={label}>Sensors / actuators</label>
                  <input className={field} value={sensors} onChange={(e) => setSensors(e.target.value)} />
                </div>
                <div>
                  <label className={label}>Power</label>
                  <input className={field} value={powerSupply} onChange={(e) => setPowerSupply(e.target.value)} />
                </div>
                <div>
                  <label className={label}>CAD tool</label>
                  <input className={field} value={cadTool} onChange={(e) => setCadTool(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>CAD / hardware files URL</label>
                  <input className={field} value={hardwareCadUrl} onChange={(e) => setHardwareCadUrl(e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#DECDBA] sticky bottom-0 bg-[#F7F1E8]">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#6E5952]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#780D18] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {saving ? "Publishing…" : "Add to showcase"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {cropFile && (
        <PhotoCropper
          file={cropFile}
          title="Crop project cover"
          aspect={16 / 9}
          cropShape="rect"
          outputWidth={1280}
          outputHeight={720}
          maxBytes={8 * 1024 * 1024}
          hint="16:9 cover · keep under 8 MB"
          confirmLabel="Use cover"
          onCancel={() => setCropFile(null)}
          onDone={(cropped) => {
            if (coverPreview) URL.revokeObjectURL(coverPreview);
            setCoverFile(cropped);
            setCoverPreview(URL.createObjectURL(cropped));
            setCropFile(null);
          }}
        />
      )}
    </>
  );
}
