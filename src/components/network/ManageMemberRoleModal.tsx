import React, { useState } from "react";
import { X, ShieldCheck, UserCheck, Check, Crown, Wallet, UserCog } from "lucide-react";
import type { ClubMemberRole, GroupMember, NetworkGroup } from "../../types/groups";
import { clubRoleLabel } from "../../types/groups";
import { addClubCustomRole, updateMemberRole } from "../../api/groups";
import { getApiErrorMessage } from "../../utils/apiError";

interface ManageMemberRoleModalProps {
  groupId: string;
  member: GroupMember;
  clubName?: string;
  customRoles?: NetworkGroup["customRoles"];
  onClose: () => void;
  onSuccess: (updatedMember: GroupMember, club?: NetworkGroup) => void;
}

const ROLE_OPTIONS: { role: ClubMemberRole; label: string; hint: string; Icon: typeof Crown }[] = [
  {
    role: "host",
    label: "President",
    hint: "One president per person across clubs. Transfers leadership of this club.",
    Icon: Crown,
  },
  {
    role: "vice_president",
    label: "Vice President",
    hint: "Can help run announcements and club operations.",
    Icon: UserCog,
  },
  {
    role: "treasurer",
    label: "Treasurer",
    hint: "Executive role for budgets and club finances.",
    Icon: Wallet,
  },
  {
    role: "executive",
    label: "Executive",
    hint: "Can publish official announcements and pin updates.",
    Icon: ShieldCheck,
  },
  {
    role: "member",
    label: "Member",
    hint: "General members can participate and showcase projects.",
    Icon: UserCheck,
  },
];

export function ManageMemberRoleModal({
  groupId,
  member,
  clubName = "",
  customRoles = [],
  onClose,
  onSuccess,
}: ManageMemberRoleModalProps) {
  const initialRole: ClubMemberRole =
    member.role === "president" ? "host" : member.role || "member";
  const [role, setRole] = useState<ClubMemberRole>(initialRole);
  const [customTitle, setCustomTitle] = useState(member.customTitle || "");
  const [newCustomRole, setNewCustomRole] = useState("");
  const [roles, setRoles] = useState(customRoles || []);
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transferring = role === "host" || role === "president";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferring && clubName && confirmation.trim().toLowerCase() !== clubName.trim().toLowerCase()) {
      setError(`Type “${clubName}” to confirm presidency transfer.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const club = await updateMemberRole(
        groupId,
        member.userId,
        role,
        customTitle.trim(),
        transferring ? confirmation.trim() : undefined
      );
      const updated = club.members.find((m) => m.userId === member.userId) || {
        ...member,
        role: role === "president" ? "host" : role,
        customTitle: customTitle.trim() || clubRoleLabel(role),
      };
      onSuccess(updated, club);
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomRole = async () => {
    const title = newCustomRole.trim();
    if (!title) return;
    setError(null);
    try {
      const created = await addClubCustomRole(groupId, title);
      setRoles((prev) => [...prev, created]);
      setCustomTitle(title);
      setNewCustomRole("");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || "Failed to add custom role");
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
        className="relative w-full max-w-lg rounded-3xl bg-[#FFFDF0] border-2 border-[#2D120D]/25 shadow-2xl p-6 space-y-5 text-[#2D120D] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#2D120D]/10">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-full bg-[#6B0B0C] text-[#FFF8CA]">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="font-serif text-lg font-bold">Assign Club Position</h3>
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
              Club position
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              {ROLE_OPTIONS.map(({ role: option, label, Icon }) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setRole(option);
                    if (!customTitle || ROLE_OPTIONS.some((r) => r.label === customTitle)) {
                      setCustomTitle(label);
                    }
                  }}
                  className={`p-3 rounded-xl border-2 font-semibold transition cursor-pointer ${
                    role === option
                      ? "border-[#6B0B0C] bg-[#FFF8CA] text-[#2D120D]"
                      : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1 text-[#6B0B0C]" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500">
              {ROLE_OPTIONS.find((r) => r.role === role)?.hint}
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Display title
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Lead Hardware Architect, VP of Software"
              className="w-full rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
            />
            {roles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setCustomTitle(r.title);
                      if (role === "member") setRole("executive");
                    }}
                    className="rounded-full border border-[#2D120D]/20 bg-white px-2.5 py-1 text-[10px] font-semibold text-[#2D120D] hover:border-[#6B0B0C]"
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B0B0C]">
              Add custom executive role for this club
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCustomRole}
                onChange={(e) => setNewCustomRole(e.target.value)}
                placeholder="e.g. Events Lead"
                className="flex-1 rounded-xl border border-[#2D120D]/25 bg-white px-3 py-2 text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleAddCustomRole()}
                className="rounded-xl border border-[#2D120D]/25 px-3 py-2 text-xs font-semibold text-[#2D120D] hover:bg-[#FFF8CA]"
              >
                Add
              </button>
            </div>
          </div>

          {transferring && (
            <div className="rounded-xl border border-[#780D18]/30 bg-[#780D18]/05 p-3 space-y-2">
              <p className="text-xs text-[#2D120D]">
                Transferring presidency is permanent for this club. Type the club name to confirm
                {clubName ? (
                  <>
                    : <strong>{clubName}</strong>
                  </>
                ) : (
                  "."
                )}
              </p>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={clubName || "Club name"}
                className="w-full rounded-lg border border-[#DECDBA] bg-white px-3 py-2 text-sm"
              />
            </div>
          )}

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
              <span>{saving ? "Saving..." : "Save position"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
