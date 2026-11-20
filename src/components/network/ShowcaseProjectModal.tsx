import React, { useEffect, useState } from "react";
import {
  X,
  Cpu,
  Layers,
  Sparkles,
  Github,
  Globe,
  Wrench,
  Check,
} from "lucide-react";
import type { GroupProjectShowcase, ProjectKind } from "../../types/groups";
import { fetchMyProjects } from "../../api/projects";
import type { ApiProject } from "../../types/project";
import { useAuth } from "../../auth/AuthContext";
import { showcaseProjectInGroup } from "../../api/groups";

interface ShowcaseProjectModalProps {
  groupId: string;
  onClose: () => void;
  onSuccess: (newProject: GroupProjectShowcase) => void;
}

export function ShowcaseProjectModal({
  groupId,
  onClose,
  onSuccess,
}: ShowcaseProjectModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [myProjects, setMyProjects] = useState<ApiProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Form fields
  const [kind, setKind] = useState<ProjectKind>("embedded_hardware");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [howWeBuiltIt, setHowWeBuiltIt] = useState("");
  const [challenges, setChallenges] = useState("");
  const [subCategory, setSubCategory] = useState("Robotics & Embedded");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [techStacksInput, setTechStacksInput] = useState("C++, ROS 2, ESP32, Python");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [hardwareCadUrl, setHardwareCadUrl] = useState("");

  // Hardware specs
  const [microcontroller, setMicrocontroller] = useState("ESP32-S3");
  const [sensors, setSensors] = useState("LiDAR, IMU MPU6050");
  const [powerSupply, setPowerSupply] = useState("3S 11.1V LiPo");
  const [cadTool, setCadTool] = useState("Onshape / 3D Printing");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingProjects(true);
    fetchMyProjects()
      .then((projs) => {
        if (!active) return;
        setMyProjects(projs || []);
        if (projs && projs.length > 0) {
          const first = projs[0];
          setSelectedProjectId(String(first.id));
          setTitle(first.title);
          setTagline(first.short_description || first.title);
          setDescription(first.full_description || first.short_description || "");
          if (first.cover_image_url) setCoverImageUrl(first.cover_image_url);
          if (first.github_url) setGithubUrl(first.github_url);
          if (first.live_url) setLiveUrl(first.live_url);
          if (first.tech_stacks && first.tech_stacks.length > 0) {
            setTechStacksInput(first.tech_stacks.join(", "));
          }
        } else {
          setMode("new");
        }
      })
      .catch(() => {
        if (active) setMode("new");
      })
      .finally(() => {
        if (active) setLoadingProjects(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    const proj = myProjects.find((p) => String(p.id) === projId);
    if (proj) {
      setTitle(proj.title);
      setTagline(proj.short_description || proj.title);
      setDescription(proj.full_description || proj.short_description || "");
      if (proj.cover_image_url) setCoverImageUrl(proj.cover_image_url);
      if (proj.github_url) setGithubUrl(proj.github_url);
      if (proj.live_url) setLiveUrl(proj.live_url);
      if (proj.tech_stacks && proj.tech_stacks.length > 0) {
        setTechStacksInput(proj.tech_stacks.join(", "));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a project title");
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

      const newProject = await showcaseProjectInGroup(groupId, {
        projectId: mode === "existing" ? selectedProjectId : null,
        title: title.trim(),
        tagline: tagline.trim() || title.trim(),
        description: description.trim() || "A showcased project by the community.",
        howWeBuiltIt: howWeBuiltIt.trim() || undefined,
        challengesAccomplishments: challenges.trim() || undefined,
        kind,
        subCategory: subCategory.trim() || (kind === "embedded_hardware" ? "Embedded & Hardware" : "Software Application"),
        coverImageUrl: coverImageUrl.trim() || (kind === "embedded_hardware" ? "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80" : "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"),
        techStacks: techStacks.length > 0 ? techStacks : ["Python", "C++"],
        ownerId: String(user?.id || "usr-me"),
        ownerName: user?.username || "DevZ-Go Builder",
        ownerUsername: user?.username || "developer",
        githubUrl: githubUrl.trim() || null,
        liveUrl: liveUrl.trim() || null,
        hardwareCadUrl: kind === "embedded_hardware" ? hardwareCadUrl.trim() || null : null,
        embeddedSpecs:
          kind === "embedded_hardware"
            ? {
                microcontroller: microcontroller.trim() || "ESP32",
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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#FFFDF0] border-2 border-[#2D120D]/25 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#2D120D] text-[#FFF8CA] border-b border-[#CDE3E8]/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-full bg-[#6B0B0C] text-[#FFF8CA]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight">
              Showcase Project in Club
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#FFF8CA]/80 hover:text-[#FFF8CA] hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6 text-[#2D120D]">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {loadingProjects && (
            <p className="text-xs text-[#2D120D]/60 animate-pulse">
              Loading your DevZ-Go projects...
            </p>
          )}

          {/* Mode switch: pick existing DevZ-Go project or create new */}
          {myProjects.length > 0 && (
            <div className="flex rounded-2xl p-1 bg-[#2D120D]/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                  mode === "existing"
                    ? "bg-[#6B0B0C] text-[#FFF8CA] shadow-xs"
                    : "text-[#2D120D] hover:bg-white/50"
                }`}
              >
                Choose from My DevZ-Go Projects ({myProjects.length})
              </button>
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                  mode === "new"
                    ? "bg-[#6B0B0C] text-[#FFF8CA] shadow-xs"
                    : "text-[#2D120D] hover:bg-white/50"
                }`}
              >
                Enter New Showcase Project
              </button>
            </div>
          )}

          {mode === "existing" && myProjects.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
                Select Existing DevZ-Go Project to Showcase
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs font-semibold text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
              >
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} {p.category ? `(${p.category})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hardware vs Software selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Project Type / Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setKind("embedded_hardware")}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 text-xs font-bold transition cursor-pointer ${
                  kind === "embedded_hardware"
                    ? "border-[#6B0B0C] bg-[#FFF8CA] text-[#2D120D] shadow-xs"
                    : "border-[#2D120D]/15 bg-white text-stone-600 hover:border-[#2D120D]/40"
                }`}
              >
                <Cpu className="w-4 h-4 text-[#6B0B0C]" />
                <div className="text-left">
                  <span className="block">Embedded &amp; Hardware</span>
                  <span className="block text-[10px] font-normal text-stone-500">Robotics, IoT, CAD &amp; Microcontrollers</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setKind("software")}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 text-xs font-bold transition cursor-pointer ${
                  kind === "software"
                    ? "border-[#6B0B0C] bg-[#FFF8CA] text-[#2D120D] shadow-xs"
                    : "border-[#2D120D]/15 bg-white text-stone-600 hover:border-[#2D120D]/40"
                }`}
              >
                <Layers className="w-4 h-4 text-[#284E45]" />
                <div className="text-left">
                  <span className="block">Software Application</span>
                  <span className="block text-[10px] font-normal text-stone-500">Code, Web, AI, Mobile &amp; Algorithms</span>
                </div>
              </button>
            </div>
          </div>

          {/* Project Title & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hexapod Rover v2"
                className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
                Sub-Category / Domain
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Autonomous Robotics, Computer Vision"
                className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Short Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. 18-DOF hexapod powered by ESP32-S3 and ROS 2"
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              What It Does (Description)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project goals, functionality, and how it works..."
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none resize-none"
            />
          </div>

          {/* How We Built It */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              How We Built It
            </label>
            <textarea
              rows={2}
              value={howWeBuiltIt}
              onChange={(e) => setHowWeBuiltIt(e.target.value)}
              placeholder="Hardware components, manufacturing, algorithms, libraries..."
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none resize-none"
            />
          </div>

          {/* Challenges & Accomplishments */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Challenges &amp; Accomplishments
            </label>
            <textarea
              rows={2}
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Key technical hurdles overcome, design trade-offs, calibration insights..."
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none resize-none"
            />
          </div>

          {/* Hardware Specs Section if Embedded */}
          {kind === "embedded_hardware" && (
            <div className="p-4 rounded-2xl bg-[#FFF8CA]/80 border-2 border-[#2D120D]/20 space-y-3">
              <span className="block font-mono text-[11px] font-bold uppercase text-[#6B0B0C] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Hardware &amp; Embedded Component Specs
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#2D120D] mb-0.5">
                    Microcontroller / Compute Board
                  </label>
                  <input
                    type="text"
                    value={microcontroller}
                    onChange={(e) => setMicrocontroller(e.target.value)}
                    placeholder="e.g. ESP32-S3, STM32F4, Raspberry Pi"
                    className="w-full rounded-xl border border-[#2D120D]/20 bg-white px-3 py-1.5 text-xs text-[#2D120D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#2D120D] mb-0.5">
                    Power Supply
                  </label>
                  <input
                    type="text"
                    value={powerSupply}
                    onChange={(e) => setPowerSupply(e.target.value)}
                    placeholder="e.g. 3S 11.1V 2200mAh LiPo"
                    className="w-full rounded-xl border border-[#2D120D]/20 bg-white px-3 py-1.5 text-xs text-[#2D120D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#2D120D] mb-0.5">
                    Sensors &amp; Actuators (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={sensors}
                    onChange={(e) => setSensors(e.target.value)}
                    placeholder="e.g. RPLIDAR A1, MPU6050, 18x Servos"
                    className="w-full rounded-xl border border-[#2D120D]/20 bg-white px-3 py-1.5 text-xs text-[#2D120D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#2D120D] mb-0.5">
                    CAD Tool / Manufacturing
                  </label>
                  <input
                    type="text"
                    value={cadTool}
                    onChange={(e) => setCadTool(e.target.value)}
                    placeholder="e.g. Onshape, Fusion 360, PETG 3D Printed"
                    className="w-full rounded-xl border border-[#2D120D]/20 bg-white px-3 py-1.5 text-xs text-[#2D120D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tech Stacks & Links */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Technologies Used (comma-separated)
            </label>
            <input
              type="text"
              value={techStacksInput}
              onChange={(e) => setTechStacksInput(e.target.value)}
              placeholder="e.g. C++, ROS 2, ESP32, Python, React"
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C] flex items-center gap-1">
                <Github className="w-3.5 h-3.5" /> GitHub Repository URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
              />
            </div>

            {kind === "embedded_hardware" ? (
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C] flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" /> CAD / Schematics URL
                </label>
                <input
                  type="url"
                  value={hardwareCadUrl}
                  onChange={(e) => setHardwareCadUrl(e.target.value)}
                  placeholder="https://onshape.com/... or grabcad"
                  className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C] flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Live Project Demo URL
                </label>
                <input
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2D120D]/15">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#2D120D]/20 text-[#2D120D] text-xs font-semibold hover:bg-stone-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#6B0B0C] hover:bg-[#2D120D] text-[#FFF8CA] text-xs font-bold tracking-wide transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? "Showcasing..." : "Showcase Project"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
