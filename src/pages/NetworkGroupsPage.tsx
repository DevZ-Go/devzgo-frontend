import { useEffect, useState } from "react";
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

const CATEGORY_TABS: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All Communities" },
  { id: "robotics", label: "Robotics & Hardware", icon: Cpu },
  { id: "ai_ml", label: "AI & Machine Learning", icon: Sparkles },
  { id: "web_cloud", label: "Web & Cloud", icon: Layers },
  { id: "game_dev", label: "Game Development" },
  { id: "open_source", label: "Open Source" },
];

export function NetworkGroupsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const categoryFilter = params.get("category") ?? "all";
  const [searchQuery, setSearchQuery] = useState(params.get("q") ?? "");

  const [groups, setGroups] = useState<NetworkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchGroups(searchQuery, categoryFilter)
      .then((data) => {
        if (active) setGroups(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [categoryFilter, searchQuery]);

  const handleJoin = async (e: React.MouseEvent, grp: NetworkGroup) => {
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
    <div className="min-h-screen bg-[#FFFDF0] text-[#2D120D] font-sans antialiased selection:bg-[#6B0B0C] selection:text-[#FFF8CA]">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pt-28 pb-20">
        {/* Navigation Tabs */}
        <NetworkPlaces current="groups" />

        {/* Hero Section in Maroon & Beige */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#2D120D] via-[#3D1A14] to-[#2D120D] text-[#FFF8CA] border-2 border-[#CDE3E8]/30 shadow-xl p-8 sm:p-12 mb-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#6B0B0C]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#CDE3E8]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6B0B0C] border border-[#FFF8CA]/30 text-xs font-mono font-bold tracking-widest uppercase text-[#FFF8CA]">
              <Users className="w-3.5 h-3.5 text-[#CDE3E8]" />
              <span>Network Clubs &amp; Communities</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#FFF8CA] leading-tight">
              Where Engineering Clubs &amp; Project Builders Connect.
            </h1>

            <p className="font-sans text-base sm:text-lg text-[#FFF8CA]/85 leading-relaxed max-w-2xl">
              Dedicated community channels for robotics teams, student clubs, and open source guilds.
              Publish official announcements, assign executive roles, and showcase embedded hardware
              and software projects side by side.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFF8CA] hover:bg-white text-[#2D120D] font-sans text-xs sm:text-sm font-bold tracking-wide transition shadow-md hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#6B0B0C]" />
                <span>Start a Club or Group</span>
              </button>

              <Link
                to="/network/groups/robotics-club"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#6B0B0C]/80 hover:bg-[#6B0B0C] border border-[#FFF8CA]/30 text-[#FFF8CA] font-sans text-xs sm:text-sm font-semibold tracking-wide transition shadow-sm"
              >
                <Cpu className="w-4 h-4 text-[#CDE3E8]" />
                <span>Featured: Robotics Club →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
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
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? "bg-[#2D120D] text-[#FFF8CA] shadow-xs"
                      : "bg-[#FFF8CA] text-[#2D120D] hover:bg-[#CDE3E8] border border-[#2D120D]/15"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 opacity-80" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs, topics, tags..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-[#2D120D]/20 text-xs text-[#2D120D] placeholder:text-stone-400 focus:outline-none focus:border-[#6B0B0C]"
            />
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-3 border-[#6B0B0C] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest text-[#6B0B0C]">
              Loading Community Groups...
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-[#FFF8CA]/50 border-2 border-dashed border-[#2D120D]/20 p-8 space-y-4">
            <Users className="w-12 h-12 mx-auto text-[#6B0B0C]/60" />
            <h3 className="font-serif text-2xl font-bold text-[#2D120D]">No Clubs Found</h3>
            <p className="font-sans text-sm text-[#2D120D]/70 max-w-md mx-auto">
              No groups matched your search or category filter. Be the first to start a group for your
              club or community!
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6B0B0C] text-[#FFF8CA] text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" /> Start This Club
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const isRobotics = group.category === "robotics";
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
                  className="group relative flex flex-col justify-between rounded-3xl bg-white border-2 border-[#2D120D]/15 hover:border-[#6B0B0C] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Card Banner */}
                  <div className="relative h-32 w-full bg-[#2D120D] overflow-hidden">
                    {group.bannerUrl && (
                      <img
                        src={group.bannerUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2D120D]/90 backdrop-blur-md text-[#FFF8CA] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#FFF8CA]/30">
                        {isRobotics ? <Cpu className="w-3 h-3 text-[#CDE3E8]" /> : <Users className="w-3 h-3" />}
                        {group.category.replace("_", " ")}
                      </span>
                      {group.visibility === "private" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6B0B0C]/95 text-[#FFF8CA] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#FFF8CA]/30">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 text-right">
                      <span className="text-[11px] font-mono text-[#FFF8CA]/90 font-semibold">
                        {group.memberCount} Members · {group.projectCount} Projects
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h2 className="font-serif text-2xl font-bold text-[#2D120D] group-hover:text-[#6B0B0C] transition-colors leading-tight">
                        {group.name}
                      </h2>
                      <p className="font-sans text-xs text-[#2D120D]/75 line-clamp-2 leading-relaxed">
                        {group.tagline}
                      </p>
                    </div>

                    {/* Host & Executives summary */}
                    <div className="p-3 rounded-2xl bg-[#FFF8CA]/70 border border-[#2D120D]/10 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase text-[#6B0B0C]">
                          Club Host / Lead
                        </span>
                        <span className="font-semibold text-[#2D120D]">
                          {group.hostName}
                        </span>
                      </div>
                      {group.hostTitle && (
                        <p className="text-[11px] text-[#2D120D]/70 italic truncate">
                          "{group.hostTitle}"
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    {group.tags && group.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {group.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-md bg-stone-100 text-[#2D120D] text-[10px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                        {group.tags.length > 3 && (
                          <span className="text-[10px] text-stone-400 self-center">
                            +{group.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#2D120D]/10 text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-[#6B0B0C] group-hover:translate-x-1 transition-transform">
                        {group.visibility === "private" && !group.isMember && (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        <span>Enter Channel</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>

                      <button
                        type="button"
                        disabled={Boolean(group.isMember || group.hasPendingRequest || joiningId === group.id)}
                        onClick={(e) => handleJoin(e, group)}
                        className={`px-3.5 py-1.5 rounded-full font-semibold transition cursor-pointer disabled:cursor-default ${
                          group.isMember
                            ? "bg-stone-100 text-[#2D120D] border border-stone-200"
                            : group.visibility === "private" && group.hasPendingRequest
                            ? "bg-[#FFF8CA] text-[#6B0B0C] border border-[#6B0B0C]/30"
                            : "bg-[#2D120D] hover:bg-[#6B0B0C] text-[#FFF8CA]"
                        }`}
                      >
                        {group.isMember
                          ? "Joined ✓"
                          : group.visibility === "private" && group.hasPendingRequest
                          ? "Request Sent"
                          : joiningId === group.id
                          ? "Sending..."
                          : "Join Club"}
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
