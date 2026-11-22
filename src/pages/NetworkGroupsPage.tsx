import { useEffect, useState, type ComponentType, type MouseEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { NetworkPlaces } from "../components/network/NetworkPlaces";
import type { NetworkGroup } from "../types/groups";
import { fetchGroups, joinGroup } from "../api/groups";
import { useAuth } from "../auth/AuthContext";
import { CreateGroupModal } from "../components/network/CreateGroupModal";
import { VerifiedClubBadge } from "../components/network/VerifiedClubBadge";

const CATEGORY_TABS: { id: string; label: string; icon?: ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All Communities" },
  { id: "robotics", label: "Hardware", icon: Cpu },
  { id: "ai_ml", label: "AI & ML", icon: Sparkles },
  { id: "web_cloud", label: "Web & Cloud", icon: Layers },
  { id: "game_dev", label: "Game Dev" },
  { id: "open_source", label: "Open Source" },
  { id: "general", label: "General" },
];

export function NetworkGroupsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const categoryFilter = params.get("category") ?? "all";
  const [searchQuery, setSearchQuery] = useState(params.get("q") ?? "");
  const [institution, setInstitution] = useState(params.get("institution") ?? "");
  const [onlyVerified, setOnlyVerified] = useState(params.get("verified") === "1");
  const [onlyJoined, setOnlyJoined] = useState(params.get("joined") === "1");
  const [openToJoin, setOpenToJoin] = useState(params.get("open") === "1");
  const [upcomingEvents, setUpcomingEvents] = useState(params.get("events") === "1");

  const [groups, setGroups] = useState<NetworkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchGroups(searchQuery, categoryFilter, {
      institution: institution || undefined,
      verified: onlyVerified || undefined,
      joined: onlyJoined || undefined,
      openToJoin: openToJoin || undefined,
      upcomingEvents: upcomingEvents || undefined,
    })
      .then((data) => {
        if (active) setGroups(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [categoryFilter, searchQuery, institution, onlyVerified, onlyJoined, openToJoin, upcomingEvents]);

  const handleJoin = async (e: MouseEvent, grp: NetworkGroup) => {
    e.preventDefault();
    e.stopPropagation();
    if (joiningId) return;
    setJoiningId(grp.id);
    try {
      const updated = await joinGroup(grp.id, {
        id: String(user?.id ?? "usr-me"),
        name: user?.username || "DevZ-Go Member",
        username: user?.username || "developer",
      });
      setGroups((prev) => prev.map((g) => (g.id === grp.id ? updated : g)));
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1E8] text-[#2D120D] font-sans antialiased selection:bg-[#780D18] selection:text-[#F7F1E8]">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pt-28 pb-20">
        <NetworkPlaces current="groups" />

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#780D18] via-[#5C0A12] to-[#2D120D] text-[#F7F1E8] border border-[#780D18]/35 shadow-[0_14px_40px_rgba(120,13,24,0.22)] p-6 sm:p-10 mb-8 sm:mb-10">
          <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
            <p className="inline-flex items-center gap-2 text-[11px] font-mono font-bold tracking-[0.14em] uppercase text-[#DECDBA]">
              <Users className="w-3.5 h-3.5" />
              Network Clubs
            </p>

            <h1 className="font-serif text-[1.75rem] sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">
              Where Education Clubs &amp; Project Builders Connect.
            </h1>

            <p className="font-sans text-sm sm:text-base text-[#F7F1E8]/90 leading-relaxed max-w-2xl">
              Discover student organizations, join open clubs, and run announcements, events, and showcases
              with clear leadership.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F7F1E8] hover:bg-white text-[#780D18] font-sans text-xs sm:text-sm font-bold tracking-wide transition"
              >
                <Plus className="w-4 h-4" />
                <span>Start a Club</span>
              </button>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 mb-5">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E5952]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs, topics, tags…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-[#DECDBA] text-sm text-[#2D120D] placeholder:text-[#6E5952]/70 focus:outline-none focus:border-[#780D18] focus:ring-2 focus:ring-[#780D18]/20"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {CATEGORY_TABS.map((tab) => {
              const active = categoryFilter === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setParams((prev) => {
                      const next = new URLSearchParams(prev);
                      if (tab.id === "all") next.delete("category");
                      else next.set("category", tab.id);
                      return next;
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? "bg-[#780D18] text-[#F7F1E8]"
                      : "bg-white text-[#2D120D] hover:border-[#780D18]/40 border border-[#DECDBA]"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 opacity-80" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="Institution"
            className="rounded-lg border border-[#DECDBA] bg-white px-3 py-2 text-xs text-[#2D120D] placeholder:text-[#6E5952]/70 focus:outline-none focus:border-[#780D18] focus:ring-2 focus:ring-[#780D18]/15 min-w-[10rem] flex-1 sm:flex-none"
          />
          {(
            [
              ["Verified", onlyVerified, setOnlyVerified],
              ["Joined", onlyJoined, setOnlyJoined],
              ["Open to join", openToJoin, setOpenToJoin],
              ["Upcoming events", upcomingEvents, setUpcomingEvents],
            ] as const
          ).map(([label, on, setOn]) => (
            <button
              key={label}
              type="button"
              onClick={() => setOn(!on)}
              className={`rounded-lg px-3 py-2 text-[11px] font-semibold border transition ${
                on
                  ? "bg-[#780D18] text-white border-[#780D18]"
                  : "bg-white text-[#2D120D] border-[#DECDBA] hover:border-[#780D18]/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-[#780D18] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest text-[#780D18]">Loading clubs…</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[#DECDBA] p-6 sm:p-8 space-y-4">
            <Users className="w-10 h-10 mx-auto text-[#780D18]/70" />
            <h3 className="font-serif text-2xl font-bold text-[#2D120D]">No clubs found</h3>
            <p className="font-sans text-sm text-[#6E5952] max-w-md mx-auto">
              No groups matched your filters. Start a club for your community.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#780D18] text-[#F7F1E8] text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Start a Club
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {groups.map((group) => {
              return (
                <Link
                  key={group.id}
                  to={`/network/groups/${group.slug || group.id}`}
                  onClick={(e) => {
                    if (group.visibility === "private" && !group.isMember) {
                      e.preventDefault();
                      if (!group.hasPendingRequest) {
                        void handleJoin(e, group);
                      }
                    }
                  }}
                  className="group relative flex flex-col rounded-2xl overflow-hidden border border-[#DECDBA]/90 bg-[#2D120D] shadow-[0_10px_28px_rgba(45,18,13,0.12)] hover:shadow-[0_18px_44px_rgba(120,13,24,0.22)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative h-36 sm:h-40 w-full overflow-hidden">
                    {group.bannerUrl ? (
                      <img
                        src={group.bannerUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "radial-gradient(ellipse 70% 80% at 15% 20%, #780D18 0%, transparent 55%), radial-gradient(ellipse 50% 60% at 90% 90%, #284E45 0%, transparent 50%), linear-gradient(160deg, #2D120D, #5C0A12)",
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2D120D] via-[#2D120D]/35 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F7F1E8]/95 text-[#780D18] text-[10px] font-mono font-bold uppercase tracking-wider">
                        {group.category.replace(/_/g, " ")}
                      </span>
                      {(group.visibility === "private" || group.joinPolicy === "request" || group.joinPolicy === "invite") && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2D120D]/80 text-[#F7F1E8] text-[10px] font-mono font-bold uppercase tracking-wider border border-white/15">
                          <Lock className="w-3 h-3" /> Restricted
                        </span>
                      )}
                    </div>

                    <div className="absolute -bottom-7 left-4 sm:left-5 z-10">
                      <span className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#F7F1E8] bg-[#780D18] shadow-lg">
                        {group.avatarUrl ? (
                          <img src={group.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Users className="w-6 h-6 text-[#F7F1E8]" />
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="relative bg-[#F7F1E8] pt-10 px-4 sm:px-5 pb-4 sm:pb-5 flex-1 flex flex-col gap-3">
                    <div className="space-y-1.5">
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2D120D] group-hover:text-[#780D18] transition-colors leading-tight inline-flex items-center gap-1.5 flex-wrap">
                        {group.name}
                        {group.verified && <VerifiedClubBadge />}
                      </h2>
                      <p className="font-sans text-xs sm:text-sm text-[#6E5952] line-clamp-2 leading-relaxed">
                        {group.tagline}
                      </p>
                      {group.institution && (
                        <p className="text-[11px] font-semibold text-[#780D18]">{group.institution}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#6E5952]">
                      <span>
                        <span className="font-bold text-[#2D120D]">{group.memberCount}</span> members
                      </span>
                      <span className="truncate text-right">
                        Pres. <span className="font-semibold text-[#2D120D]">{group.hostName}</span>
                      </span>
                    </div>

                    {group.tags && group.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {group.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-white text-[#2D120D] text-[10px] font-medium border border-[#DECDBA]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#DECDBA] text-xs gap-2">
                      <span className="inline-flex items-center gap-1 font-bold text-[#780D18]">
                        Open club
                        <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
                      </span>

                      <button
                        type="button"
                        disabled={Boolean(group.isMember || group.hasPendingRequest || joiningId === group.id)}
                        onClick={(e) => handleJoin(e, group)}
                        className={`px-3.5 py-1.5 rounded-lg font-semibold transition disabled:cursor-default shrink-0 ${
                          group.isMember
                            ? "bg-white text-[#2D120D] border border-[#DECDBA]"
                            : "bg-[#780D18] hover:bg-[#5C0A12] text-[#F7F1E8]"
                        }`}
                      >
                        {group.isMember
                          ? "Joined"
                          : joiningId === group.id
                            ? "Joining…"
                            : "Join"}
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {createOpen && (
        <CreateGroupModal
          onClose={() => setCreateOpen(false)}
          onSuccess={(newGrp) => {
            setGroups((prev) => [newGrp, ...prev]);
          }}
        />
      )}
    </div>
  );
}
