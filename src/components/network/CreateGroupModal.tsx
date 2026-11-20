import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, X, Users, Check, Maximize2, Minimize2, UserCheck, Lock, Globe } from "lucide-react";
import type { NetworkGroup, GroupCategory, ClubMemberRole, GroupVisibility } from "../../types/groups";
import { useAuth } from "../../auth/AuthContext";
import { createNetworkGroup } from "../../api/groups";

const CREATOR_ROLES: { id: ClubMemberRole; label: string; defaultTitle: string }[] = [
  { id: "president", label: "President", defaultTitle: "Club President" },
  { id: "executive", label: "Executive Member", defaultTitle: "Executive Member" },
  { id: "vice_president", label: "Vice President", defaultTitle: "Vice President" },
  { id: "treasurer", label: "Treasurer", defaultTitle: "Treasurer" },
  { id: "member", label: "Member", defaultTitle: "Member" },
];

const MAX_ABOUT_WORDS = 250;
const WARN_ABOUT_WORDS = 200;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function clampWords(text: string, maxWords: number): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: (newGroup: NetworkGroup) => void;
}

const CATEGORIES: { id: GroupCategory; label: string }[] = [
  { id: "robotics", label: "Robotics & Hardware" },
  { id: "ai_ml", label: "AI & Machine Learning" },
  { id: "web_cloud", label: "Web, Cloud & Distributed" },
  { id: "game_dev", label: "Game Dev & Interactive Media" },
  { id: "open_source", label: "Open Source Collective" },
  { id: "general", label: "General Student Organization" },
  { id: "other", label: "Other" },
];

export function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const aboutRef = useRef<HTMLTextAreaElement>(null);
  const expandedAboutRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [category, setCategory] = useState<GroupCategory>("robotics");
  const [customCategory, setCustomCategory] = useState("");
  const [visibility, setVisibility] = useState<GroupVisibility>("public");
  const [hostRole, setHostRole] = useState<ClubMemberRole>("president");
  const [hostTitle, setHostTitle] = useState("Club President");
  const [tagsInput, setTagsInput] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aboutWordCount = countWords(about);

  const handleAboutChange = (nextValue: string) => {
    setAbout(clampWords(nextValue, MAX_ABOUT_WORDS));
  };

  // Auto-grow inline textarea as you type so there is no cramped inner scrollbar
  useEffect(() => {
    const el = aboutRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 84)}px`;
  }, [about]);

  // Auto-focus and auto-grow the expanded pop-up editor when opened
  useEffect(() => {
    if (!aboutExpanded) return;
    const el = expandedAboutRef.current;
    if (!el) return;
    el.focus();
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 220)}px`;
  }, [aboutExpanded, about]);

  const onPickBanner = (file: File | null) => {
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    if (!file) {
      setBannerFile(null);
      setBannerPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Banner must be an image (PNG, JPG, GIF, or WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Banner must be 8 MB or smaller.");
      return;
    }
    setError(null);
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setBannerUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError("Sign in to create a club.");
      return;
    }
    if (!name.trim()) {
      setError("Please provide a group name");
      return;
    }
    if (category === "other" && !customCategory.trim()) {
      setError("Please enter a custom category name");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const finalCategory: GroupCategory =
        category === "other" ? customCategory.trim() : category;

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await createNetworkGroup({
        name: name.trim(),
        tagline: tagline.trim() || `Community of passionate builders in ${finalCategory}`,
        about: about.trim() || "A collaborative space for club members to build, showcase, and share updates.",
        category: finalCategory,
        visibility,
        tags,
        bannerUrl: bannerFile ? undefined : bannerUrl.trim() || undefined,
        bannerFile,
        host: {
          id: String(user.id),
          name: user.username || "Club Founder",
          username: user.username || "founder",
        },
        hostRole,
        hostTitle: hostTitle.trim() || "President",
      });

      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#FFFDF0] border-2 border-[#2D120D]/25 shadow-2xl p-6 space-y-5 text-[#2D120D] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#2D120D]/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-[#6B0B0C] text-[#FFF8CA]">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="font-serif text-lg font-bold">Start a Club or Community Group</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Club / Group Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Autonomous Robotics Club, Web Dev Society"
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GroupCategory)}
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {category === "other" && (
              <input
                type="text"
                required
                maxLength={40}
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category (e.g. Cybersecurity, Design, BioTech)"
                className="mt-2 w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
              />
            )}
          </div>

          {/* Public vs Private Club Visibility */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Club Privacy
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition cursor-pointer ${
                  visibility === "public"
                    ? "border-[#6B0B0C] bg-[#FFF8CA]/80 shadow-xs"
                    : "border-[#2D120D]/20 bg-white hover:border-[#6B0B0C]/40"
                }`}
              >
                <Globe className={`w-4 h-4 mt-0.5 shrink-0 ${visibility === "public" ? "text-[#6B0B0C]" : "text-[#2D120D]/60"}`} />
                <div>
                  <p className="text-xs font-bold text-[#2D120D]">Public</p>
                  <p className="text-[11px] text-[#2D120D]/70 leading-snug">
                    Anyone can enter &amp; join immediately.
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition cursor-pointer ${
                  visibility === "private"
                    ? "border-[#6B0B0C] bg-[#FFF8CA]/80 shadow-xs"
                    : "border-[#2D120D]/20 bg-white hover:border-[#6B0B0C]/40"
                }`}
              >
                <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${visibility === "private" ? "text-[#6B0B0C]" : "text-[#2D120D]/60"}`} />
                <div>
                  <p className="text-xs font-bold text-[#2D120D]">Private</p>
                  <p className="text-[11px] text-[#2D120D]/70 leading-snug">
                    Sends a request in Messages to President &amp; Execs to approve entry.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Tagline / Mission in One Sentence
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Building autonomous hardware, hexapods, and ROS 2 robotics."
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
                About the Club
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    aboutWordCount >= MAX_ABOUT_WORDS
                      ? "bg-red-50 text-red-700 border-red-200"
                      : aboutWordCount >= WARN_ABOUT_WORDS
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-[#FFF8CA]/70 text-[#2D120D]/75 border-[#2D120D]/15"
                  }`}
                >
                  {aboutWordCount} / {MAX_ABOUT_WORDS} words
                </span>
                <button
                  type="button"
                  onClick={() => setAboutExpanded(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#6B0B0C]/25 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#6B0B0C] hover:bg-[#FFF8CA] transition cursor-pointer"
                  title="Open larger writing view"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Expand</span>
                </button>
              </div>
            </div>
            <textarea
              ref={aboutRef}
              rows={3}
              value={about}
              onChange={(e) => handleAboutChange(e.target.value)}
              placeholder="Describe your club activities, meeting schedules, projects, and who should join... (up to 250 words)"
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#2D120D] focus:border-[#6B0B0C] focus:ring-2 focus:ring-[#6B0B0C]/15 focus:shadow-md focus:outline-none resize-none overflow-hidden transition-all"
            />
            {aboutWordCount >= MAX_ABOUT_WORDS && (
              <p className="text-[11px] font-medium text-red-700">
                Maximum of {MAX_ABOUT_WORDS} words reached.
              </p>
            )}
          </div>

          {aboutExpanded && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setAboutExpanded(false);
              }}
            >
              <div
                className="w-full max-w-2xl rounded-3xl bg-[#FFFDF0] border-2 border-[#6B0B0C]/30 shadow-2xl p-6 space-y-4 text-[#2D120D]"
              >
                <div className="flex items-center justify-between border-b border-[#2D120D]/10 pb-3">
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#6B0B0C]">About the Club</h4>
                    <p className="text-[11px] text-[#2D120D]/65">
                      Write comfortably — up to {MAX_ABOUT_WORDS} words.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        aboutWordCount >= MAX_ABOUT_WORDS
                          ? "bg-red-50 text-red-700 border-red-200"
                          : aboutWordCount >= WARN_ABOUT_WORDS
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-[#FFF8CA] text-[#2D120D] border-[#2D120D]/15"
                      }`}
                    >
                      {aboutWordCount} / {MAX_ABOUT_WORDS} words
                    </span>
                    <button
                      type="button"
                      onClick={() => setAboutExpanded(false)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#6B0B0C] px-3.5 py-1.5 text-xs font-semibold text-[#FFF8CA] hover:bg-[#2D120D] transition cursor-pointer"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </button>
                  </div>
                </div>
                <textarea
                  ref={expandedAboutRef}
                  rows={8}
                  value={about}
                  onChange={(e) => handleAboutChange(e.target.value)}
                  placeholder="Describe your club activities, meeting schedules, projects, and who should join..."
                  className="w-full max-h-[60vh] overflow-y-auto rounded-2xl border border-[#2D120D]/25 bg-white px-4 py-3 text-sm leading-relaxed text-[#2D120D] focus:border-[#6B0B0C] focus:ring-2 focus:ring-[#6B0B0C]/15 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Attach Creator Profile & Club Status */}
          <div className="rounded-2xl border border-[#6B0B0C]/20 bg-[#FFF8CA]/45 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#6B0B0C] text-[#FFF8CA]">
                  <UserCheck className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
                    Your Profile &amp; Club Status
                  </p>
                  <p className="text-[11px] text-[#2D120D]/70">
                    Automatically links to your personal profile&apos;s <strong>Clubs</strong> tab with your join date &amp; status.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B0B0C]">
                  Your Club Status
                </label>
                <select
                  value={hostRole}
                  onChange={(e) => {
                    const nextRole = e.target.value as ClubMemberRole;
                    setHostRole(nextRole);
                    const preset = CREATOR_ROLES.find((r) => r.id === nextRole);
                    const isDefaultTitle = CREATOR_ROLES.some((r) => r.defaultTitle === hostTitle);
                    if (preset && (!hostTitle.trim() || isDefaultTitle)) {
                      setHostTitle(preset.defaultTitle);
                    }
                  }}
                  className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
                >
                  {CREATOR_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B0B0C]">
                  Your Role / Title
                </label>
                <input
                  type="text"
                  value={hostTitle}
                  onChange={(e) => setHostTitle(e.target.value)}
                  placeholder="e.g. Club President, Founder, Executive Member"
                  className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/80 border border-[#2D120D]/10 px-3 py-2 text-[11px] text-[#2D120D]/80">
              <span>
                Attached profile: <strong className="text-[#6B0B0C]">@{user?.username || "you"}</strong>
              </span>
              <span className="font-mono text-[10px] font-semibold text-[#2D120D]/70">
                {CREATOR_ROLES.find((r) => r.id === hostRole)?.label || "President"} · Joined{" "}
                {new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Robotics, ROS, ESP32, Python"
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Cover / Banner
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(e) => onPickBanner(e.target.files?.[0] || null)}
            />
            {bannerPreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-[#2D120D]/20">
                <img src={bannerPreview} alt="" className="h-28 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    onPickBanner(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#2D120D]/25 bg-white px-3 py-6 text-xs font-semibold text-[#2D120D] hover:border-[#6B0B0C] hover:bg-[#FFF8CA]/40"
              >
                <ImagePlus className="h-4 w-4 text-[#6B0B0C]" />
                Upload banner from device
              </button>
            )}
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => {
                setBannerUrl(e.target.value);
                if (e.target.value.trim()) onPickBanner(null);
              }}
              placeholder="Or paste an image URL (optional)"
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
            <p className="text-[11px] text-stone-500">
              If you already lead another club as president, you&apos;ll join this one as Founder and can
              appoint a president later.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2D120D]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !user}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#6B0B0C] hover:bg-[#2D120D] text-[#FFF8CA] text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? "Creating Club..." : "Create Club"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
