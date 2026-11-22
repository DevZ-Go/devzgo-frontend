import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import type { GroupMember } from "../../types/groups";
import { MemberAvatar } from "../MemberAvatar";

export function ClubMembersList({
  members,
  canManageRoles,
  onManage,
}: {
  members: GroupMember[];
  canManageRoles: boolean;
  onManage: (member: GroupMember) => void;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((m) => {
      const hay = [m.name, m.username, m.email, m.headline, m.customTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [members, q]);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-serif text-2xl font-bold text-[#2D120D]">Members</h2>
        <span className="text-[11px] font-mono text-[#6E5952] tabular-nums">{filtered.length}</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E5952]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search username or email…"
          className="w-full rounded-lg border border-[#DECDBA] bg-white pl-10 pr-3 py-2.5 text-sm text-[#2D120D] placeholder:text-[#6E5952]/60 focus:outline-none focus:ring-2 focus:ring-[#780D18]/20 focus:border-[#780D18]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-[#6E5952] py-6 text-center">No members match that search.</p>
      ) : (
        <ul className="rounded-xl border border-[#DECDBA] bg-white divide-y divide-[#DECDBA]/80 overflow-hidden">
          {filtered.map((member) => (
            <li
              key={member.userId}
              className="flex items-center gap-3 px-3 sm:px-4 py-2.5 hover:bg-[#F7F1E8]/70 transition"
            >
              <MemberAvatar name={member.name} src={member.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/profile/${member.username || member.userId}`}
                    className="text-sm font-semibold text-[#2D120D] hover:text-[#780D18] truncate"
                  >
                    {member.name}
                  </Link>
                  <span className="text-[11px] text-[#6E5952] font-mono truncate">@{member.username}</span>
                </div>
                {member.email && (
                  <p className="text-[11px] text-[#6E5952] truncate">{member.email}</p>
                )}
              </div>
              {canManageRoles && (
                <button
                  type="button"
                  onClick={() => onManage(member)}
                  className="shrink-0 rounded-lg border border-[#DECDBA] bg-[#F7F1E8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2D120D] hover:bg-[#780D18] hover:text-white hover:border-[#780D18] transition"
                >
                  Role
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
