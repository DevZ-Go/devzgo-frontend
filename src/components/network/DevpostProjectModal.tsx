import React, { useState } from "react";
import {
  X,
  Heart,
  MessageSquare,
  Github,
  Globe,
  ExternalLink,
  Cpu,
  Layers,
  Users,
  Send,
  Sparkles,
  Wrench,
  BatteryCharging,
} from "lucide-react";
import type { GroupProjectShowcase } from "../../types/groups";
import { useAuth } from "../../auth/AuthContext";
import { toggleLikeGroupProject, addGroupProjectComment } from "../../api/groups";

interface DevpostProjectModalProps {
  project: GroupProjectShowcase;
  groupId: string;
  onClose: () => void;
  onUpdate?: (updated: GroupProjectShowcase) => void;
}

export function DevpostProjectModal({
  project,
  groupId,
  onClose,
  onUpdate,
}: DevpostProjectModalProps) {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState<GroupProjectShowcase>(project);
  const [activeImage, setActiveImage] = useState<string>(
    project.coverImageUrl || project.galleryImages?.[0] || ""
  );
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isEmbedded = currentProject.kind === "embedded_hardware";

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await toggleLikeGroupProject(groupId, currentProject.id);
      const updated = {
        ...currentProject,
        isLiked: res.isLiked,
        likesCount: res.likesCount,
      };
      setCurrentProject(updated);
      onUpdate?.(updated);
    } catch {
      // ignore
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const updated = await addGroupProjectComment(groupId, currentProject.id, {
        authorId: String(user?.id ?? "guest"),
        authorName: user?.username || "Community Developer",
        authorUsername: user?.username || "developer",
        text: commentText.trim(),
      });
      setCurrentProject(updated);
      setCommentText("");
      onUpdate?.(updated);
    } catch {
      // ignore
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl bg-[#FFFDF0] border-2 border-[#2D120D]/25 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#2D120D] text-[#FFF8CA] border-b border-[#CDE3E8]/20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                isEmbedded
                  ? "bg-[#6B0B0C] text-[#FFF8CA] border border-[#FFF8CA]/30"
                  : "bg-[#CDE3E8] text-[#2D120D]"
              }`}
            >
              {isEmbedded ? <Cpu className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
              {isEmbedded ? "Embedded & Hardware" : "Software"}
            </span>
            <span className="text-[#CDE3E8]/40 text-xs hidden sm:inline">/</span>
            <span className="text-xs font-mono text-[#CDE3E8] truncate hidden sm:inline">
              {currentProject.subCategory || "Group Showcase"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close project modal"
            className="p-1.5 rounded-full text-[#FFF8CA]/80 hover:text-[#FFF8CA] hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-8 text-[#2D120D]">
          {/* Title & Tagline & Author */}
          <div>
            <h1
              id="modal-project-title"
              className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2D120D]"
            >
              {currentProject.title}
            </h1>
            <p className="font-sans text-base sm:text-lg text-[#2D120D]/80 mt-1.5 font-medium leading-relaxed">
              {currentProject.tagline}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-[#2D120D]/10 text-xs text-[#2D120D]/75">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#6B0B0C]">Presented by:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-[#2D120D]">
                  <span className="w-5 h-5 rounded-full bg-[#6B0B0C] text-[#FFF8CA] inline-flex items-center justify-center text-[10px]">
                    {currentProject.ownerName[0]}
                  </span>
                  {currentProject.ownerName} (@{currentProject.ownerUsername})
                </span>
              </div>
              <span>·</span>
              <span>
                Added {new Date(currentProject.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Action Links Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {currentProject.githubUrl && (
              <a
                href={currentProject.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2D120D] hover:bg-[#6B0B0C] text-[#FFF8CA] text-xs font-semibold tracking-wide transition shadow-xs"
              >
                <Github className="w-4 h-4 text-[#CDE3E8]" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {currentProject.hardwareCadUrl && (
              <a
                href={currentProject.hardwareCadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6B0B0C] hover:bg-[#2D120D] text-[#FFF8CA] text-xs font-semibold tracking-wide transition shadow-xs"
              >
                <Wrench className="w-4 h-4 text-[#FFF8CA]" />
                <span>CAD, Schematics &amp; 3D Files</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {currentProject.liveUrl && (
              <a
                href={currentProject.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#CDE3E8] hover:bg-[#2D120D] text-[#2D120D] hover:text-[#FFF8CA] text-xs font-semibold tracking-wide transition shadow-xs"
              >
                <Globe className="w-4 h-4" />
                <span>Live Project Demo</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition shadow-xs ml-auto cursor-pointer ${
                currentProject.isLiked
                  ? "bg-[#6B0B0C] text-[#FFF8CA]"
                  : "bg-white hover:bg-stone-100 text-[#2D120D] border border-[#2D120D]/20"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  currentProject.isLiked ? "fill-current text-[#FFF8CA]" : "text-[#6B0B0C]"
                }`}
              />
              <span>{currentProject.likesCount} {currentProject.likesCount === 1 ? "Like" : "Likes"}</span>
            </button>
          </div>

          {/* Media / Gallery Section */}
          {activeImage && (
            <div className="space-y-3">
              <div className="relative w-full aspect-video sm:aspect-[21/9] rounded-2xl overflow-hidden bg-stone-900 border-2 border-[#2D120D]/20 shadow-md">
                <img
                  src={activeImage}
                  alt={currentProject.title}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {currentProject.galleryImages && currentProject.galleryImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {currentProject.galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                        activeImage === img
                          ? "border-[#6B0B0C] ring-2 ring-[#6B0B0C]/40"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Embedded Hardware Specifications (Devpost-inspired spec card) */}
          {isEmbedded && currentProject.embeddedSpecs && (
            <div className="rounded-2xl bg-[#FFF8CA]/80 border-2 border-[#2D120D]/20 p-5 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
                <Cpu className="w-4 h-4 text-[#6B0B0C]" />
                <span>Embedded Hardware &amp; Component Specs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {currentProject.embeddedSpecs.microcontroller && (
                  <div className="p-3 rounded-xl bg-white/90 border border-[#2D120D]/15">
                    <span className="block font-mono text-[10px] uppercase text-[#6B0B0C] font-bold">
                      Compute / Microcontroller
                    </span>
                    <span className="font-semibold text-[#2D120D]">
                      {currentProject.embeddedSpecs.microcontroller}
                    </span>
                  </div>
                )}

                {currentProject.embeddedSpecs.powerSupply && (
                  <div className="p-3 rounded-xl bg-white/90 border border-[#2D120D]/15">
                    <span className="block font-mono text-[10px] uppercase text-[#6B0B0C] font-bold flex items-center gap-1">
                      <BatteryCharging className="w-3 h-3" /> Power Supply
                    </span>
                    <span className="font-semibold text-[#2D120D]">
                      {currentProject.embeddedSpecs.powerSupply}
                    </span>
                  </div>
                )}

                {currentProject.embeddedSpecs.cadTool && (
                  <div className="p-3 rounded-xl bg-white/90 border border-[#2D120D]/15">
                    <span className="block font-mono text-[10px] uppercase text-[#6B0B0C] font-bold flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> CAD &amp; Fabrication
                    </span>
                    <span className="font-semibold text-[#2D120D]">
                      {currentProject.embeddedSpecs.cadTool}
                    </span>
                  </div>
                )}

                {currentProject.embeddedSpecs.sensorsActuators && currentProject.embeddedSpecs.sensorsActuators.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/90 border border-[#2D120D]/15 sm:col-span-2">
                    <span className="block font-mono text-[10px] uppercase text-[#6B0B0C] font-bold mb-1">
                      Sensors &amp; Actuators
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentProject.embeddedSpecs.sensorsActuators.map((sensor, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[#FFF8CA] text-[#2D120D] border border-[#2D120D]/20 font-medium"
                        >
                          {sensor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Project Story: What It Does & Architecture */}
          <div className="space-y-6">
            <section className="space-y-2">
              <h2 className="font-serif text-xl font-bold text-[#2D120D] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6B0B0C]" /> What It Does
              </h2>
              <p className="font-sans text-sm text-[#2D120D]/85 leading-relaxed whitespace-pre-line">
                {currentProject.description}
              </p>
            </section>

            {currentProject.howWeBuiltIt && (
              <section className="space-y-2">
                <h2 className="font-serif text-xl font-bold text-[#2D120D] flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#6B0B0C]" /> How We Built It
                </h2>
                <p className="font-sans text-sm text-[#2D120D]/85 leading-relaxed whitespace-pre-line">
                  {currentProject.howWeBuiltIt}
                </p>
              </section>
            )}

            {currentProject.challengesAccomplishments && (
              <section className="space-y-2">
                <h2 className="font-serif text-xl font-bold text-[#2D120D] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#6B0B0C]" /> Challenges &amp; Accomplishments
                </h2>
                <p className="font-sans text-sm text-[#2D120D]/85 leading-relaxed whitespace-pre-line">
                  {currentProject.challengesAccomplishments}
                </p>
              </section>
            )}
          </div>

          {/* Technologies Used */}
          <section className="space-y-2.5 pt-4 border-t border-[#2D120D]/10">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Technologies &amp; Tools Used
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentProject.techStacks.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-[#2D120D] text-[#FFF8CA] text-xs font-semibold tracking-wide border border-[#CDE3E8]/30 shadow-2xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* Team Members Section */}
          {currentProject.teamMembers && currentProject.teamMembers.length > 0 && (
            <section className="space-y-3 pt-4 border-t border-[#2D120D]/10">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6B0B0C] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Project Builders &amp; Contributors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentProject.teamMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 border border-[#2D120D]/15"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#6B0B0C] text-[#FFF8CA] flex items-center justify-center font-bold text-xs">
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-[#2D120D]">{member.name}</p>
                      <p className="font-sans text-[11px] text-[#6B0B0C]">{member.roleInProject}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Comments Thread */}
          <section className="space-y-4 pt-6 border-t border-[#2D120D]/15">
            <h3 className="font-serif text-xl font-bold text-[#2D120D] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#6B0B0C]" />
              <span>Feedback &amp; Community Discussion ({currentProject.commentsCount || 0})</span>
            </h3>

            {/* Post comment input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ask a technical question or leave feedback on this project..."
                className="flex-1 px-4 py-2.5 rounded-full border border-[#2D120D]/25 bg-white text-xs text-[#2D120D] placeholder:text-stone-400 focus:outline-none focus:border-[#6B0B0C]"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#6B0B0C] hover:bg-[#2D120D] text-[#FFF8CA] text-xs font-semibold tracking-wide transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>

            {/* Comment list */}
            {currentProject.comments && currentProject.comments.length > 0 ? (
              <div className="space-y-2.5 pt-2">
                {currentProject.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#2D120D]/15 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#6B0B0C]">
                      <span className="font-bold">{c.authorName}</span>
                      <span className="text-stone-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-[#2D120D] leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">
                Be the first to ask a question or leave feedback on this project!
              </p>
            )}
          </section>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#FFF8CA] border-t border-[#2D120D]/15 text-xs shrink-0">
          <span className="text-[#2D120D]/75 font-mono text-[11px]">
            DevZ-Go Community Showcase · Devpost Inspired
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#2D120D] hover:bg-[#6B0B0C] text-[#FFF8CA] font-semibold transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
