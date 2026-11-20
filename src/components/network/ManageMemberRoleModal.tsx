import React, { useState } from "react";
import { X, ShieldCheck, UserCheck, Check } from "lucide-react";
import type { GroupMember } from "../../types/groups";
import { updateMemberRole } from "../../api/groups";

interface ManageMemberRoleModalProps {
  groupId: string;
  member: GroupMember;
  onClose: () => void;
  onSuccess: (updatedMember: GroupMember) => void;
}

export function ManageMemberRoleModal({
  groupId,
  member,
  onClose,
  onSuccess,
}: ManageMemberRoleModalProps) {
  const [role, setRole] = useState<"executive" | "member">(
    member.role === "executive" ? "executive" : "member"
  );
  const [customTitle, setCustomTitle] = useState(member.customTitle || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateMemberRole(groupId, member.userId, role, customTitle.trim());
      onSuccess({
        ...member,
        role,
        customTitle: customTitle.trim() || (role === "executive" ? "Executive Member" : "Member"),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(false);
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
        className="relative w-full max-w-md rounded-3xl bg-[#FFFDF0] border-2 border-[#2D120D]/25 shadow-2xl p-6 space-y-5 text-[#2D120D]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#2D120D]/10">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-full bg-[#6B0B0C] text-[#FFF8CA]">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="font-serif text-lg font-bold">Assign Member Role &amp; Title</h3>
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

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF8CA] border border-[#2D120D]/15">
          <div className="w-10 h-10 rounded-full bg-[#6B0B0C] text-[#FFF8CA] font-bold text-sm flex items-center justify-center">
            {member.name[0]}
          </div>
          <div>
            <p className="font-bold text-sm text-[#2D120D]">{member.name}</p>
            <p className="font-sans text-xs text-[#2D120D]/70">@{member.username}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Permission Level
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRole("member")}
                className={`p-3 rounded-xl border-2 font-semibold transition cursor-pointer ${
                  role === "member"
                    ? "border-[#6B0B0C] bg-[#FFF8CA] text-[#2D120D]"
                    : "border-stone-200 bg-white text-stone-600"
                }`}
              >
                <UserCheck className="w-4 h-4 mx-auto mb-1 text-[#2D120D]" />
                <span>General Member</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("executive")}
                className={`p-3 rounded-xl border-2 font-semibold transition cursor-pointer ${
                  role === "executive"
                    ? "border-[#6B0B0C] bg-[#FFF8CA] text-[#2D120D]"
                    : "border-stone-200 bg-white text-stone-600"
                }`}
              >
                <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-[#6B0B0C]" />
                <span>Executive Member</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              {role === "executive"
                ? "Executives can publish official announcements and pin updates."
                : "General members can participate, view announcements, and showcase projects."}
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Custom Title / Officer Designation
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Lead Hardware Architect, VP of Software, Team Captain"
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
            <p className="text-[11px] text-stone-500">
              This title will be proudly displayed next to their name on the group page and posts.
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
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#6B0B0C] hover:bg-[#2D120D] text-[#FFF8CA] text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Role & Title"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
