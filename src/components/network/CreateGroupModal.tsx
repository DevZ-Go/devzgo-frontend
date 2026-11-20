import React, { useState } from "react";
import { X, Users, Check } from "lucide-react";
import type { NetworkGroup, GroupCategory } from "../../types/groups";
import { useAuth } from "../../auth/AuthContext";
import { createNetworkGroup } from "../../api/groups";

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
];

export function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [category, setCategory] = useState<GroupCategory>("robotics");
  const [hostTitle, setHostTitle] = useState("Club President & Lead Architect");
  const [tagsInput, setTagsInput] = useState("Robotics, Hardware, ROS 2, Embedded");
  const [bannerUrl, setBannerUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a group name");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await createNetworkGroup({
        name: name.trim(),
        tagline: tagline.trim() || `Community of passionate builders in ${category}`,
        about: about.trim() || "A collaborative space for club members to build, showcase, and share updates.",
        category,
        tags: tags.length > 0 ? tags : ["Student Organization", "Tech"],
        bannerUrl: bannerUrl.trim() || undefined,
        host: {
          id: String(user?.id ?? "usr-me"),
          name: user?.username || "Club Founder",
          username: user?.username || "founder",
        },
        hostTitle: hostTitle.trim() || "Host & Founder",
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
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#FFFDF0] border-2 border-[#2D120D]/25 shadow-2xl p-6 space-y-5 text-[#2D120D]"
        onClick={(e) => e.stopPropagation()}
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
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
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

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              About the Club
            </label>
            <textarea
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Describe your club activities, meeting schedules, projects, and who should join..."
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
                Your Role / Title as Host
              </label>
              <input
                type="text"
                value={hostTitle}
                onChange={(e) => setHostTitle(e.target.value)}
                placeholder="e.g. Club President, Founder"
                className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
              />
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
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Cover / Banner Image URL (Optional)
            </label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
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
              disabled={submitting}
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
