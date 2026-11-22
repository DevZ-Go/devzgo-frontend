import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { fetchClubPermissions, updateClubPermissions, patchClub } from "../../api/groups";

const PERM_KEYS: { id: string; label: string }[] = [
  { id: "manage_roles", label: "Manage executive roles" },
  { id: "manage_members", label: "Manage members" },
  { id: "events", label: "Create/edit/delete events" },
  { id: "announcements", label: "Publish announcements" },
  { id: "media", label: "Upload media" },
  { id: "polls", label: "Create/manage polls" },
  { id: "galleries", label: "Manage event galleries" },
  { id: "settings", label: "Manage club settings" },
  { id: "funds", label: "Manage financial disclosures" },
  { id: "broadcast_email", label: "Email all opted-in members" },
];

const ROLES = ["vice_president", "treasurer", "executive", "member"] as const;

export function ClubPermissionsPanel({
  groupId,
  isPresident,
  fundsVisibility,
  onFundsVisibilityChange,
}: {
  groupId: string;
  isPresident: boolean;
  fundsVisibility?: string | null;
  onFundsVisibilityChange?: (v: "members" | "executives") => void;
}) {
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [role, setRole] = useState<(typeof ROLES)[number]>("executive");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fundsVis, setFundsVis] = useState<"members" | "executives">(
    fundsVisibility === "executives" ? "executives" : "members"
  );

  useEffect(() => {
    if (!isPresident) return;
    void fetchClubPermissions(groupId)
      .then(setMatrix)
      .catch(() => setMatrix({}));
  }, [groupId, isPresident]);

  if (!isPresident) return null;

  const current =
    matrix[role] || Object.fromEntries(PERM_KEYS.map((k) => [k.id, false]));

  const toggle = (key: string) => {
    setMatrix((prev) => ({
      ...prev,
      [role]: { ...(prev[role] || {}), [key]: !current[key] },
    }));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = Object.fromEntries(PERM_KEYS.map((k) => [k.id, Boolean(current[k.id])]));
      await updateClubPermissions(groupId, role, payload);
      await patchClub(groupId, { fundsVisibility: fundsVis });
      onFundsVisibilityChange?.(fundsVis);
      setMessage("Permissions saved.");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#DECDBA] bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#780D18]" />
        <h2 className="font-serif text-xl font-bold text-[#2D120D]">Leadership permissions</h2>
      </div>
      <p className="text-xs text-[#6E5952]">
        President always has full access. Other roles only receive the permissions you assign here.
      </p>

      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold border ${
              role === r ? "bg-[#780D18] text-white border-[#780D18]" : "bg-[#F7F1E8] border-[#DECDBA]"
            }`}
          >
            {r.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PERM_KEYS.map((key) => (
          <label
            key={key.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-[#DECDBA] bg-[#F7F1E8] px-3 py-2 text-xs"
          >
            <span className="font-medium">{key.label}</span>
            <input
              type="checkbox"
              checked={Boolean(current[key.id])}
              onChange={() => toggle(key.id)}
              className="rounded text-[#780D18]"
            />
          </label>
        ))}
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#780D18] mb-1.5">
          Funds ledger visible to
        </label>
        <select
          value={fundsVis}
          onChange={(e) => setFundsVis(e.target.value as "members" | "executives")}
          className="w-full rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm"
        >
          <option value="members">All members</option>
          <option value="executives">Executives only</option>
        </select>
      </div>

      {message && <p className="text-xs text-[#780D18]">{message}</p>}

      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="rounded-lg bg-[#780D18] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save permissions"}
      </button>
    </section>
  );
}
