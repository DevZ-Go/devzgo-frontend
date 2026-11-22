import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Shield, Wallet, Star, ChevronRight, Settings2 } from "lucide-react";
import type { ClubMemberRole, GroupMember } from "../../types/groups";
import { clubRoleLabel } from "../../types/groups";
import { assetUrlOrNull } from "../../api/config";

const ROLE_RANK: Record<string, number> = {
  host: 0,
  president: 0,
  vice_president: 1,
  treasurer: 2,
  executive: 3,
};

const ROLE_META: Record<
  string,
  { short: string; Icon: typeof Crown; accent: string; ring: string; glow: string }
> = {
  host: {
    short: "PRES",
    Icon: Crown,
    accent: "from-[#780D18] to-[#2D120D]",
    ring: "ring-[#780D18]",
    glow: "shadow-[#780D18]/35",
  },
  president: {
    short: "PRES",
    Icon: Crown,
    accent: "from-[#780D18] to-[#2D120D]",
    ring: "ring-[#780D18]",
    glow: "shadow-[#780D18]/35",
  },
  vice_president: {
    short: "VP",
    Icon: Shield,
    accent: "from-[#5C1A1A] to-[#780D18]",
    ring: "ring-[#9A3A3A]",
    glow: "shadow-[#9A3A3A]/30",
  },
  treasurer: {
    short: "TREAS",
    Icon: Wallet,
    accent: "from-[#284E45] to-[#1A332E]",
    ring: "ring-[#284E45]",
    glow: "shadow-[#284E45]/30",
  },
  executive: {
    short: "EXEC",
    Icon: Star,
    accent: "from-[#6E5952] to-[#2D120D]",
    ring: "ring-[#6E5952]",
    glow: "shadow-[#6E5952]/25",
  },
};

function initials(name: string) {
  return name.replace(/^@/, "").slice(0, 2).toUpperCase() || "?";
}

function Portrait({
  member,
  size,
  selected,
  onSelect,
}: {
  member: GroupMember;
  size: "hero" | "tile";
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = ROLE_META[member.role] || ROLE_META.executive;
  const Icon = meta.Icon;
  const src = assetUrlOrNull(member.avatarUrl) || member.avatarUrl;
  const isHero = size === "hero";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex flex-col items-center text-left transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#780D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F1E8] ${
        selected ? "scale-[1.02]" : "hover:scale-[1.03] hover:-translate-y-1"
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          isHero ? "h-44 w-36 sm:h-56 sm:w-44 rounded-2xl" : "h-28 w-24 sm:h-32 sm:w-28 rounded-xl"
        } ${selected ? `ring-2 ${meta.ring} shadow-lg ${meta.glow}` : "ring-1 ring-[#DECDBA]/80 shadow-md"}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent} opacity-90`} />
        {src ? (
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover mix-blend-normal opacity-95 group-hover:scale-105 transition duration-500"
          />
        ) : (
          <span
            className={`absolute inset-0 flex items-center justify-center font-serif font-bold text-[#F7F1E8]/90 ${
              isHero ? "text-4xl" : "text-2xl"
            }`}
          >
            {initials(member.name)}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2D120D]/85 via-[#2D120D]/20 to-transparent" />
        <span
          className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-[#2D120D]/70 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold tracking-[0.14em] text-[#F7F1E8]`}
        >
          <Icon className="w-3 h-3" />
          {meta.short}
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
          <p
            className={`font-serif font-bold text-[#F7F1E8] leading-tight line-clamp-2 ${
              isHero ? "text-base sm:text-lg" : "text-xs sm:text-sm"
            }`}
          >
            {member.name}
          </p>
          {(member.customTitle || isHero) && (
            <p className="text-[10px] sm:text-[11px] text-[#F7F1E8]/75 line-clamp-1 mt-0.5">
              {member.customTitle || clubRoleLabel(member.role)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export function ExecutiveBoard({
  executives,
  canManageRoles,
  onManage,
}: {
  executives: GroupMember[];
  canManageRoles: boolean;
  onManage: (member: GroupMember) => void;
}) {
  const sorted = useMemo(
    () =>
      [...executives].sort(
        (a, b) => (ROLE_RANK[a.role] ?? 9) - (ROLE_RANK[b.role] ?? 9) || a.name.localeCompare(b.name)
      ),
    [executives]
  );

  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.userId ?? null);
  useEffect(() => {
    if (!sorted.some((m) => m.userId === activeId)) {
      setActiveId(sorted[0]?.userId ?? null);
    }
  }, [sorted, activeId]);
  const active = sorted.find((m) => m.userId === activeId) || sorted[0] || null;
  const president = sorted.find((m) => m.role === "host" || m.role === "president");
  const rest = sorted.filter((m) => m !== president);

  if (sorted.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-[#DECDBA] bg-white/60 px-6 py-10 text-center">
        <Shield className="w-8 h-8 text-[#780D18] mx-auto mb-2 opacity-70" />
        <p className="font-serif text-lg font-bold text-[#2D120D]">No executives yet</p>
        <p className="text-xs text-[#6E5952] mt-1">Promote members from the list below.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#780D18]">Leadership</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D120D]">Executive Board</h2>
        </div>
        <span className="text-[11px] font-mono text-[#6E5952] tabular-nums">{sorted.length}</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#DECDBA] bg-[#2D120D]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 20% 0%, #780D18 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, #284E45 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F7F1E8' fill-opacity='1'%3E%3Cpath d='M0 0h1v1H0z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative p-4 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-8 items-center sm:items-stretch">
          {president && (
            <Portrait
              member={president}
              size="hero"
              selected={active?.userId === president.userId}
              onSelect={() => setActiveId(president.userId)}
            />
          )}

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {rest.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin">
                {rest.map((member) => (
                  <div key={member.userId} className="snap-start shrink-0">
                    <Portrait
                      member={member}
                      size="tile"
                      selected={active?.userId === member.userId}
                      onSelect={() => setActiveId(member.userId)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center sm:justify-start">
                <p className="text-xs text-[#F7F1E8]/55 italic">Tap a portrait to focus leadership.</p>
              </div>
            )}

            {active && (
              <div
                key={active.userId}
                className="rounded-xl bg-[#F7F1E8]/95 border border-[#F7F1E8]/30 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-opacity duration-200"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-serif text-lg font-bold text-[#2D120D] truncate">{active.name}</p>
                    <RoleChip role={active.role} />
                  </div>
                  {active.customTitle && (
                    <p className="text-xs font-semibold text-[#780D18] mt-0.5">{active.customTitle}</p>
                  )}
                  {active.headline && (
                    <p className="text-[11px] text-[#6E5952] line-clamp-1 mt-1">{active.headline}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/profile/${active.username || active.userId}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#780D18] text-[#F7F1E8] px-3.5 py-2 text-xs font-bold hover:bg-[#5c0a12] transition"
                  >
                    Profile <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  {canManageRoles && (
                    <button
                      type="button"
                      onClick={() => onManage(active)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DECDBA] bg-white px-3 py-2 text-xs font-bold text-[#2D120D] hover:border-[#780D18] transition"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-[#780D18]" />
                      Role
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleChip({ role }: { role: ClubMemberRole }) {
  const meta = ROLE_META[role] || ROLE_META.executive;
  const Icon = meta.Icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#780D18] text-[#F7F1E8] px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
      <Icon className="w-3 h-3" />
      {clubRoleLabel(role)}
    </span>
  );
}
