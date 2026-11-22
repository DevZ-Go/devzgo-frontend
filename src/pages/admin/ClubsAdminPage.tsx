import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchGroup, fetchGroups } from "../../api/groups";
import type { ClubMemberRole, GroupMember, NetworkGroup } from "../../types/groups";
import { clubRoleLabel } from "../../types/groups";
import { VerifiedClubBadge } from "../../components/network/VerifiedClubBadge";
import { getApiErrorMessage } from "../../utils/apiError";
import { ui } from "../../styles/editorial";
import { Banner, Loading, panel } from "./bits";
import { useAdminAction } from "./guard";

const ROLES: ClubMemberRole[] = ["vice_president", "treasurer", "executive", "member"];
const FILTERS = ["all", "pending", "verified", "rejected", "none"] as const;

export function AdminClubsPage() {
  const perform = useAdminAction();
  const [clubs, setClubs] = useState<NetworkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<NetworkGroup | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState("");
  const [editName, setEditName] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    setLoading(true);
    void fetchGroups()
      .then(setClubs)
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (!openId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    void fetchGroup(openId)
      .then((club) => {
        setDetail(club);
        setEditName(club.name);
        setEditTagline(club.tagline || "");
        setEditAbout(club.about || "");
        setEditInstitution(club.institution || "");
      })
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [openId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clubs.filter((club) => {
      const status = (club.verificationStatus || (club.verified ? "verified" : "none")).toLowerCase();
      if (filter !== "all" && status !== filter) return false;
      if (!q) return true;
      return [club.name, club.institution, club.hostUsername, club.slug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [clubs, filter, query]);

  async function run(action: string, target_id: string, payload: Record<string, unknown> = {}) {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const result = await perform({ action, target_id, payload });
      if (!result) return;
      if (result.status === "pending") {
        setMessage(`Queued (${result.approvals ?? 1}/${result.required_approvals}).`);
      } else {
        setMessage(result.summary || "Saved.");
      }
      reload();
      if (openId) {
        const club = await fetchGroup(openId);
        setDetail(club);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={ui.heading}>Clubs</h2>
          <p className="mt-1 text-xs text-stone-500">{clubs.length} total · verify, roles, delete</p>
        </div>
        <Link to="/admin/browse/clubs/network_clubs" className={`${ui.btn} ${ui.neutral} px-3 py-1.5`}>
          All tables
        </Link>
      </div>

      {message && <Banner tone="ok">{message}</Banner>}
      {error && <Banner tone="bad">{error}</Banner>}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={ui.input}
          placeholder="Search clubs"
          aria-label="Search clubs"
        />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize ${
                filter === item ? "bg-[#6B0B0C] text-[#FFF8CA]" : "bg-white border border-stone-200 text-stone-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-2">
          {visible.map((club) => {
            const status = club.verificationStatus || (club.verified ? "verified" : "none");
            const open = openId === club.id;
            return (
              <article key={club.id} className={`${panel} !p-3`}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => setOpenId(open ? null : club.id)}
                >
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-bold text-[#2D120D] inline-flex items-center gap-1.5">
                      <span className="truncate">{club.name}</span>
                      {club.verified && <VerifiedClubBadge />}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500 truncate">
                      {status}
                      {club.institution ? ` · ${club.institution}` : ""}
                      {` · ${club.memberCount} members`}
                      {club.hostUsername ? ` · @${club.hostUsername}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#6B0B0C]">{open ? "Hide" : "Manage"}</span>
                </button>

                {open && (
                  <div className="mt-3 border-t border-stone-200 pt-3 space-y-3">
                    {detailLoading || !detail ? (
                      <Loading label="Loading club" />
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          <Tiny disabled={busy} onClick={() => void run("club.verify", club.id)}>Verify</Tiny>
                          <Tiny disabled={busy} onClick={() => void run("club.reject", club.id, { note })}>Reject</Tiny>
                          <Tiny disabled={busy || !club.verified} onClick={() => void run("club.revoke_verify", club.id)}>
                            Revoke
                          </Tiny>
                          <Tiny disabled={busy} onClick={() => void run("club.delete", club.id)} danger>
                            Delete
                          </Tiny>
                          <Link to={`/network/groups/${club.slug || club.id}`} className={`${ui.btn} ${ui.neutral} px-3 py-1.5`}>
                            Open
                          </Link>
                        </div>

                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className={ui.input}
                          placeholder="Reject note"
                          aria-label="Reject note"
                        />

                        <div className="grid gap-2 sm:grid-cols-2">
                          <Field label="Name" value={editName} onChange={setEditName} />
                          <Field label="Institution" value={editInstitution} onChange={setEditInstitution} />
                          <Field label="Tagline" value={editTagline} onChange={setEditTagline} className="sm:col-span-2" />
                          <label className="sm:col-span-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                            About
                            <textarea
                              value={editAbout}
                              onChange={(e) => setEditAbout(e.target.value)}
                              className={`${ui.input} mt-1`}
                              rows={3}
                            />
                          </label>
                        </div>
                        <Tiny
                          disabled={busy}
                          onClick={() =>
                            void run("club.edit", club.id, {
                              fields: {
                                name: editName,
                                tagline: editTagline,
                                about: editAbout,
                                institution: editInstitution || null,
                              },
                            })
                          }
                        >
                          Save profile
                        </Tiny>

                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                            Members · {detail.members.length}
                          </p>
                          <div className="space-y-2">
                            {detail.members.map((member) => (
                              <MemberRow
                                key={member.userId}
                                member={member}
                                busy={busy}
                                onPresident={() => void run("club.set_president", club.id, { user_id: member.userId })}
                                onRole={(role) => void run("club.set_role", club.id, { user_id: member.userId, role })}
                                onRemove={() => void run("club.remove_member", club.id, { user_id: member.userId })}
                              />
                            ))}
                            {detail.members.length === 0 && (
                              <p className="text-xs text-stone-500">No members yet.</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
          {visible.length === 0 && <p className={ui.empty}>No clubs match.</p>}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`${className} text-[10px] font-semibold uppercase tracking-wider text-stone-500`}>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`${ui.input} mt-1`} />
    </label>
  );
}

function MemberRow({
  member,
  busy,
  onPresident,
  onRole,
  onRemove,
}: {
  member: GroupMember;
  busy: boolean;
  onPresident: () => void;
  onRole: (role: ClubMemberRole) => void;
  onRemove: () => void;
}) {
  const isPresident = member.role === "president" || member.role === "host";
  return (
    <div className="rounded-xl border border-stone-200 bg-[#FAF7EE]/70 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#2D120D]">
            {member.name || member.username} · @{member.username}
          </p>
          <p className="text-[11px] text-stone-500">
            {clubRoleLabel(member.role)}
            {member.customTitle ? ` · ${member.customTitle}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {!isPresident && (
            <Tiny disabled={busy} onClick={onPresident}>
              President
            </Tiny>
          )}
          {!isPresident && (
            <select
              className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs"
              value={member.role === "host" ? "president" : member.role}
              disabled={busy}
              onChange={(e) => onRole(e.target.value as ClubMemberRole)}
              aria-label={`Role for ${member.username}`}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {clubRoleLabel(role)}
                </option>
              ))}
            </select>
          )}
          {!isPresident && (
            <Tiny disabled={busy} onClick={onRemove} danger>
              Remove
            </Tiny>
          )}
          <Link to={`/admin/people/${member.userId}`} className={`${ui.btn} ${ui.neutral} px-2 py-1`}>
            User
          </Link>
        </div>
      </div>
    </div>
  );
}

function Tiny({
  children,
  disabled,
  onClick,
  danger,
}: {
  children: string;
  disabled?: boolean;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${ui.btn} ${danger ? ui.danger : ui.neutral} px-3 py-1.5`}
    >
      {children}
    </button>
  );
}
