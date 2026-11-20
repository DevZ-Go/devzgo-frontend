import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Megaphone,
  Cpu,
  Layers,
  Plus,
  Heart,
  MessageSquare,
  ShieldCheck,
  Check,
  Pin,
  Sparkles,
  Share2,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { NetworkPlaces } from "../components/network/NetworkPlaces";
import type {
  NetworkGroup,
  GroupAnnouncement,
  GroupProjectShowcase,
  GroupMember,
  ProjectKind,
} from "../types/groups";
import { clubRoleLabel, isClubExecutiveRole } from "../types/groups";
import {
  fetchGroup,
  fetchGroupAnnouncements,
  fetchGroupProjects,
  joinGroup,
  leaveGroup,
  patchClub,
  toggleLikeAnnouncement,
  addAnnouncementComment,
} from "../api/groups";
import { getApiErrorMessage } from "../utils/apiError";
import { useAuth } from "../auth/AuthContext";
import { DevpostProjectModal } from "../components/network/DevpostProjectModal";
import { ShowcaseProjectModal } from "../components/network/ShowcaseProjectModal";
import { CreateAnnouncementModal } from "../components/network/CreateAnnouncementModal";
import { ManageMemberRoleModal } from "../components/network/ManageMemberRoleModal";

export function GroupDetailPage() {
  const { groupId = "robotics-club" } = useParams<{ groupId: string }>();
  const { user } = useAuth();

  const [group, setGroup] = useState<NetworkGroup | null>(null);
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>([]);
  const [projects, setProjects] = useState<GroupProjectShowcase[]>([]);
  const [loading, setLoading] = useState(true);

  // Active tab: "projects" (showcase) | "announcements" | "members"
  const [activeTab, setActiveTab] = useState<"projects" | "announcements" | "members">("projects");
  const [projectKindFilter, setProjectKindFilter] = useState<ProjectKind | "all">("all");

  // Modals state
  const [selectedShowcaseProject, setSelectedShowcaseProject] = useState<GroupProjectShowcase | null>(null);
  const [showcaseModalOpen, setShowcaseModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [managingMember, setManagingMember] = useState<GroupMember | null>(null);

  // Quick announcement comment inputs state
  const [annCommentTexts, setAnnCommentTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      fetchGroup(groupId, user?.id ? String(user.id) : undefined),
      fetchGroupAnnouncements(groupId),
      fetchGroupProjects(groupId),
    ])
      .then(([g, a, p]) => {
        if (!active) return;
        setGroup(g);
        setAnnouncements(a);
        setProjects(p);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [groupId, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF0] text-[#2D120D] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-3">
          <div className="w-8 h-8 border-3 border-[#6B0B0C] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-[#6B0B0C]">
            Opening Club Channel...
          </p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#FFFDF0] text-[#2D120D] flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-4 py-32 text-center space-y-4">
          <h1 className="font-serif text-3xl font-bold">Group Not Found</h1>
          <p className="text-sm text-[#2D120D]/75">
            This club channel may have moved or does not exist.
          </p>
          <Link
            to="/network/groups"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6B0B0C] text-[#FFF8CA] text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Clubs &amp; Groups
          </Link>
        </div>
      </div>
    );
  }

  const isHost =
    group.hostId === user?.id ||
    group.userRole === "host" ||
    group.userRole === "president";
  const isExecutive = isHost || isClubExecutiveRole(group.userRole);
  const isMember = group.isMember || isHost;

  const handleJoinLeave = async () => {
    if (isMember) {
      if (isHost) {
        alert("As president, transfer the presidency to someone else before leaving the club.");
        return;
      }
      try {
        const updated = await leaveGroup(group.id, String(user?.id ?? "usr-me"));
        setGroup(updated);
      } catch (err) {
        alert(getApiErrorMessage(err) || "Could not leave club");
      }
    } else {
      const updated = await joinGroup(group.id, {
        id: String(user?.id ?? "usr-me"),
        name: user?.username || "DevZ-Go Member",
        username: user?.username || "developer",
      });
      setGroup(updated);
    }
  };

  const handleToggleLikeAnnouncement = async (annId: string) => {
    const res = await toggleLikeAnnouncement(group.id, annId);
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === annId ? { ...a, isLiked: res.isLiked, likesCount: res.likesCount } : a))
    );
  };

  const handleAddAnnouncementComment = async (annId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = annCommentTexts[annId]?.trim();
    if (!text) return;
    const updated = await addAnnouncementComment(group.id, annId, {
      authorId: String(user?.id ?? "usr-me"),
      authorName: user?.username || "Club Member",
      authorUsername: user?.username || "developer",
      text,
    });
    setAnnouncements((prev) => prev.map((a) => (a.id === annId ? updated : a)));
    setAnnCommentTexts((prev) => ({ ...prev, [annId]: "" }));
  };

  const filteredProjects =
    projectKindFilter === "all"
      ? projects
      : projects.filter((p) => p.kind === projectKindFilter);

  const executives = group.members.filter((m) => isClubExecutiveRole(m.role));
  const generalMembers = group.members.filter((m) => !isClubExecutiveRole(m.role));

  return (
    <div className="min-h-screen bg-[#FFFDF0] text-[#2D120D] font-sans antialiased selection:bg-[#6B0B0C] selection:text-[#FFF8CA]">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pt-28 pb-20">
        <NetworkPlaces current="groups" />

        {/* Breadcrumb Back Link */}
        <div className="mb-4">
          <Link
            to="/network/groups"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B0B0C] hover:text-[#2D120D] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to all clubs
          </Link>
        </div>

        {/* Group Hero Header Banner */}
        <header className="relative rounded-3xl overflow-hidden bg-[#2D120D] text-[#FFF8CA] border-2 border-[#CDE3E8]/30 shadow-xl mb-8">
          {/* Banner Graphic Background */}
          <div className="relative h-48 sm:h-64 w-full overflow-hidden">
            {group.bannerUrl && (
              <img
                src={group.bannerUrl}
                alt=""
                className="w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D120D] via-[#2D120D]/60 to-transparent" />

            <div className="absolute top-4 left-4 sm:left-6 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6B0B0C] text-[#FFF8CA] text-xs font-mono font-bold uppercase tracking-wider border border-[#FFF8CA]/30 shadow-xs">
                {group.category === "robotics" ? <Cpu className="w-3.5 h-3.5 text-[#CDE3E8]" /> : <Users className="w-3.5 h-3.5" />}
                {group.category.replace("_", " ")}
              </span>

              {group.isMember && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#CDE3E8] text-[#2D120D] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
                  <Check className="w-3.5 h-3.5" /> Member
                </span>
              )}
            </div>

            <div className="absolute top-4 right-4 sm:right-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert("Club link copied to clipboard!");
                }}
                className="p-2 rounded-full bg-[#2D120D]/80 hover:bg-[#6B0B0C] text-[#FFF8CA] border border-[#FFF8CA]/30 transition cursor-pointer shadow-sm"
                title="Share club link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Group Info Strip */}
          <div className="p-6 sm:p-8 pt-0 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#FFF8CA] leading-tight">
                {group.name}
              </h1>

              <p className="font-sans text-sm sm:text-base text-[#FFF8CA]/90 leading-relaxed font-medium">
                {group.tagline}
              </p>

              {/* Host & Executives summary pill */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#FFF8CA]/80">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-[#FFF8CA]/20">
                  <span className="text-[#CDE3E8] font-bold">President:</span>
                  <Link
                    to={`/profile/${group.hostUsername || group.hostId}`}
                    className="font-bold text-[#FFF8CA] hover:text-[#CDE3E8] underline decoration-[#FFF8CA]/40 underline-offset-2"
                  >
                    {group.hostName}
                  </Link>
                  {group.hostTitle && (
                    <span className="text-[#FFF8CA]/70 text-[11px] italic">
                      ({group.hostTitle})
                    </span>
                  )}
                </div>

                <span>·</span>
                <span className="font-mono text-xs text-[#CDE3E8]">
                  {group.memberCount} Members
                </span>
                <span>·</span>
                <span className="font-mono text-xs text-[#CDE3E8]">
                  {projects.length} Showcased Projects
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleJoinLeave}
                className={`px-6 py-2.5 rounded-full font-sans text-xs sm:text-sm font-bold tracking-wide transition shadow-md cursor-pointer ${
                  isMember
                    ? "bg-[#FFF8CA] hover:bg-white text-[#2D120D]"
                    : "bg-[#6B0B0C] hover:bg-[#8B1A1E] text-[#FFF8CA] border border-[#FFF8CA]/30"
                }`}
              >
                {isMember ? (isHost ? "President" : "Leave Club") : "Join This Club"}
              </button>

              <button
                type="button"
                onClick={() => setShowcaseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#CDE3E8] hover:bg-white text-[#2D120D] text-xs sm:text-sm font-bold tracking-wide transition shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#6B0B0C]" />
                <span>Showcase Project</span>
              </button>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b-2 border-[#2D120D]/15 pb-2 mb-8">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "projects"
                  ? "bg-[#6B0B0C] text-[#FFF8CA] shadow-xs"
                  : "bg-white text-[#2D120D] hover:bg-[#FFF8CA] border border-[#2D120D]/15"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Project Showcase ({projects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("announcements")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "announcements"
                  ? "bg-[#6B0B0C] text-[#FFF8CA] shadow-xs"
                  : "bg-white text-[#2D120D] hover:bg-[#FFF8CA] border border-[#2D120D]/15"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Announcements ({announcements.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "members"
                  ? "bg-[#6B0B0C] text-[#FFF8CA] shadow-xs"
                  : "bg-white text-[#2D120D] hover:bg-[#FFF8CA] border border-[#2D120D]/15"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Members &amp; Execs ({group.members.length})</span>
            </button>
          </div>

          {/* Quick executive contextual actions */}
          {isExecutive && (
            <div className="hidden sm:flex items-center gap-2">
              {activeTab === "announcements" && (
                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2D120D] hover:bg-[#6B0B0C] text-[#FFF8CA] text-xs font-semibold tracking-wide transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#CDE3E8]" />
                  <span>New Announcement</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PROJECT SHOWCASE (Devpost Inspired) */}
        {/* ======================================================== */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            {/* Filter Sub-Bar: All vs Embedded vs Software */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFF8CA]/80 border border-[#2D120D]/15">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-[#6B0B0C] mr-1 hidden sm:inline">
                  Filter by Type:
                </span>
                <button
                  type="button"
                  onClick={() => setProjectKindFilter("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    projectKindFilter === "all"
                      ? "bg-[#2D120D] text-[#FFF8CA]"
                      : "bg-white text-[#2D120D] border border-[#2D120D]/20 hover:bg-[#CDE3E8]"
                  }`}
                >
                  All Projects ({projects.length})
                </button>

                <button
                  type="button"
                  onClick={() => setProjectKindFilter("embedded_hardware")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    projectKindFilter === "embedded_hardware"
                      ? "bg-[#6B0B0C] text-[#FFF8CA]"
                      : "bg-white text-[#2D120D] border border-[#2D120D]/20 hover:bg-[#CDE3E8]"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Embedded &amp; Robotics ({projects.filter((p) => p.kind === "embedded_hardware").length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectKindFilter("software")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    projectKindFilter === "software"
                      ? "bg-[#284E45] text-[#FFF8CA]"
                      : "bg-white text-[#2D120D] border border-[#2D120D]/20 hover:bg-[#CDE3E8]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Software ({projects.filter((p) => p.kind === "software").length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowcaseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#6B0B0C] hover:bg-[#2D120D] text-[#FFF8CA] text-xs font-bold tracking-wide transition shadow-xs cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Showcase Your Project</span>
              </button>
            </div>

            {/* Showcase Projects Grid (Devpost Style) */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 rounded-3xl bg-white border-2 border-dashed border-[#2D120D]/20 p-8 space-y-3">
                <Sparkles className="w-10 h-10 mx-auto text-[#6B0B0C]/60" />
                <h3 className="font-serif text-xl font-bold">No Showcased Projects Yet</h3>
                <p className="font-sans text-xs text-[#2D120D]/70 max-w-sm mx-auto">
                  Be the first member to showcase a project in the {group.name}!
                </p>
                <button
                  type="button"
                  onClick={() => setShowcaseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#6B0B0C] text-[#FFF8CA] text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Showcase Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((p) => {
                  const isEmb = p.kind === "embedded_hardware";
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedShowcaseProject(p)}
                      className="group flex flex-col justify-between rounded-3xl bg-white border-2 border-[#2D120D]/15 hover:border-[#6B0B0C] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                      {/* Thumbnail / Cover */}
                      <div className="relative h-44 w-full bg-stone-900 overflow-hidden">
                        {p.coverImageUrl && (
                          <img
                            src={p.coverImageUrl}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        <div className="absolute top-3 left-3">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm ${
                              isEmb
                                ? "bg-[#6B0B0C] text-[#FFF8CA] border border-[#FFF8CA]/30"
                                : "bg-[#CDE3E8] text-[#2D120D]"
                            }`}
                          >
                            {isEmb ? <Cpu className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                            {isEmb ? "Embedded & Hardware" : "Software"}
                          </span>
                        </div>

                        {p.subCategory && (
                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="text-[11px] font-mono text-[#FFF8CA] font-medium truncate block">
                              {p.subCategory}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-serif text-xl font-bold text-[#2D120D] group-hover:text-[#6B0B0C] transition-colors leading-tight">
                            {p.title}
                          </h3>
                          <p className="font-sans text-xs text-[#2D120D]/75 line-clamp-2 leading-relaxed">
                            {p.tagline}
                          </p>
                        </div>

                        {/* Tech Stacks Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {p.techStacks.slice(0, 4).map((tech, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-md bg-[#FFF8CA] text-[#2D120D] text-[10px] font-semibold border border-[#2D120D]/15"
                            >
                              {tech}
                            </span>
                          ))}
                          {p.techStacks.length > 4 && (
                            <span className="text-[10px] text-stone-400 self-center">
                              +{p.techStacks.length - 4}
                            </span>
                          )}
                        </div>

                        {/* Hardware specific chip */}
                        {isEmb && p.embeddedSpecs?.microcontroller && (
                          <div className="p-2 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-700 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-[#6B0B0C]" />
                            <span className="font-semibold">{p.embeddedSpecs.microcontroller}</span>
                          </div>
                        )}

                        {/* Card Footer: Owner + Likes/Comments */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#2D120D]/10 text-xs">
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <span className="w-5 h-5 rounded-full bg-[#2D120D] text-[#FFF8CA] inline-flex items-center justify-center text-[10px] font-bold">
                              {p.ownerName[0]}
                            </span>
                            <span className="font-medium text-[11px] truncate max-w-[100px]">
                              {p.ownerName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-stone-500 font-mono text-[11px]">
                            <span className="inline-flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-[#6B0B0C]" /> {p.likesCount}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" /> {p.commentsCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ANNOUNCEMENTS & UPDATES */}
        {/* ======================================================== */}
        {activeTab === "announcements" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Executive Announcement Composer Banner */}
            {isExecutive && (
              <div className="flex items-center justify-between p-5 rounded-3xl bg-[#FFF8CA] border-2 border-[#2D120D]/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6B0B0C] text-[#FFF8CA] flex items-center justify-center">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#2D120D]">
                      Executive Announcement Board
                    </h3>
                    <p className="font-sans text-xs text-[#2D120D]/75">
                      Publish official club announcements, meeting reminders, or project calls.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#6B0B0C] hover:bg-[#2D120D] text-[#FFF8CA] text-xs font-bold tracking-wide transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish Update</span>
                </button>
              </div>
            )}

            {/* Announcements List */}
            {announcements.length === 0 ? (
              <div className="text-center py-16 rounded-3xl bg-white border border-stone-200 p-8 space-y-2">
                <Megaphone className="w-8 h-8 mx-auto text-stone-400" />
                <h3 className="font-serif text-lg font-bold">No Announcements Yet</h3>
                <p className="text-xs text-stone-500">
                  Club executives have not published any announcements yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {announcements.map((ann) => (
                  <article
                    key={ann.id}
                    className={`rounded-3xl bg-white border-2 p-6 sm:p-8 space-y-4 shadow-sm transition-all ${
                      ann.pinned
                        ? "border-[#6B0B0C] ring-2 ring-[#6B0B0C]/10 bg-[#FFFDF0]"
                        : "border-[#2D120D]/15"
                    }`}
                  >
                    {/* Header with Badge & Author */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#6B0B0C] text-[#FFF8CA] text-[10px] font-mono font-bold uppercase tracking-wider">
                            <Megaphone className="w-3 h-3" />
                            {ann.badge}
                          </span>

                          {ann.pinned && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF8CA] text-[#6B0B0C] border border-[#6B0B0C]/30 text-[10px] font-mono font-bold uppercase">
                              <Pin className="w-3 h-3" /> Pinned
                            </span>
                          )}
                        </div>

                        <h2 className="font-serif text-2xl font-bold text-[#2D120D] leading-tight pt-1">
                          {ann.title}
                        </h2>
                      </div>

                      {/* Author Info */}
                      <div className="text-right">
                        <p className="font-bold text-xs text-[#2D120D]">{ann.authorName}</p>
                        <p className="text-[11px] text-[#6B0B0C] font-semibold italic">
                          {ann.authorTitle || (ann.authorRole === "host" ? "Host" : "Executive")}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {new Date(ann.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Announcement Body */}
                    <div className="font-sans text-sm text-[#2D120D]/85 leading-relaxed whitespace-pre-line pt-2">
                      {ann.content}
                    </div>

                    {/* Actions: Likes & Comment Count */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#2D120D]/10 text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleLikeAnnouncement(ann.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition cursor-pointer ${
                          ann.isLiked
                            ? "bg-[#6B0B0C] text-[#FFF8CA]"
                            : "bg-stone-100 hover:bg-stone-200 text-[#2D120D]"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${ann.isLiked ? "fill-current" : ""}`} />
                        <span>{ann.likesCount} {ann.likesCount === 1 ? "Like" : "Likes"}</span>
                      </button>

                      <span className="text-xs text-stone-500 font-medium">
                        {ann.commentsCount} {ann.commentsCount === 1 ? "Comment" : "Comments"}
                      </span>
                    </div>

                    {/* Comments Thread on Announcement */}
                    <div className="space-y-3 pt-2">
                      {ann.comments && ann.comments.length > 0 && (
                        <div className="space-y-2">
                          {ann.comments.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 rounded-2xl bg-[#FFF8CA]/50 border border-[#2D120D]/10 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-semibold text-[#6B0B0C]">
                                <span>{c.authorName}</span>
                                <span className="text-[10px] text-stone-400 font-normal">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[#2D120D] leading-relaxed">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment to announcement */}
                      <form
                        onSubmit={(e) => handleAddAnnouncementComment(ann.id, e)}
                        className="flex gap-2 pt-1"
                      >
                        <input
                          type="text"
                          value={annCommentTexts[ann.id] || ""}
                          onChange={(e) =>
                            setAnnCommentTexts((prev) => ({ ...prev, [ann.id]: e.target.value }))
                          }
                          placeholder="Reply to this announcement..."
                          className="flex-1 px-4 py-2 rounded-full border border-[#2D120D]/20 bg-white text-xs text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-full bg-[#2D120D] hover:bg-[#6B0B0C] text-[#FFF8CA] text-xs font-semibold transition cursor-pointer"
                        >
                          Reply
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MEMBERS & EXECUTIVE BOARD */}
        {/* ======================================================== */}
        {activeTab === "members" && (
          <div className="space-y-10 max-w-5xl mx-auto">
            {/* Host Controls Guide Note */}
            {isHost && (
              <div className="p-4 rounded-2xl bg-[#FFF8CA] border-2 border-[#6B0B0C]/30 text-xs text-[#2D120D] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#6B0B0C] shrink-0" />
                  <span>
                    <strong>President access:</strong> Assign President, Vice President, Treasurer,
                    Executive, or Member. You can transfer the presidency (a person may only be
                    president of one club). Add custom executive titles for your club&apos;s policy.
                  </span>
                </div>
              </div>
            )}

            {(group.policies || isExecutive) && (
              <section className="rounded-3xl border border-[#2D120D]/15 bg-white p-5 space-y-3">
                <h2 className="font-serif text-xl font-bold text-[#2D120D]">Club policies</h2>
                {isExecutive ? (
                  <ClubPoliciesEditor
                    groupId={group.id}
                    policies={group.policies || ""}
                    onSaved={(policies) => setGroup((prev) => (prev ? { ...prev, policies } : prev))}
                  />
                ) : (
                  <p className="text-sm text-[#2D120D]/80 whitespace-pre-wrap">
                    {group.policies || "No club policies published yet."}
                  </p>
                )}
              </section>
            )}

            {/* Executive Board Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#2D120D]/15 pb-2">
                <ShieldCheck className="w-5 h-5 text-[#6B0B0C]" />
                <h2 className="font-serif text-2xl font-bold text-[#2D120D]">
                  Executive Board &amp; Club Leadership ({executives.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {executives.map((member) => (
                  <div
                    key={member.userId}
                    className="p-5 rounded-3xl bg-white border-2 border-[#2D120D]/15 hover:border-[#6B0B0C] shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B0B0C] to-[#2D120D] text-[#FFF8CA] font-serif font-bold text-lg flex items-center justify-center shrink-0 border border-[#CDE3E8]/40 shadow-xs">
                        {member.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/profile/${member.username || member.userId}`}
                            className="font-bold text-sm text-[#2D120D] hover:text-[#6B0B0C] underline decoration-stone-300 underline-offset-2 truncate"
                          >
                            {member.name}
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                              member.role === "host" || member.role === "president"
                                ? "bg-[#2D120D] text-[#FFF8CA]"
                                : "bg-[#6B0B0C] text-[#FFF8CA]"
                            }`}
                          >
                            {clubRoleLabel(member.role)}
                          </span>
                        </div>

                        {member.customTitle && (
                          <p className="font-semibold text-xs text-[#6B0B0C] mt-0.5 leading-snug">
                            {member.customTitle}
                          </p>
                        )}

                        {member.headline && (
                          <p className="text-[11px] text-stone-500 line-clamp-1 mt-1">
                            {member.headline}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#2D120D]/10 flex items-center justify-between text-xs">
                      <Link
                        to={`/profile/${member.username || member.userId}`}
                        className="text-[#6B0B0C] hover:text-[#2D120D] font-semibold text-[11px]"
                      >
                        View Profile →
                      </Link>

                      {isHost && (
                        <button
                          type="button"
                          onClick={() => setManagingMember(member)}
                          className="px-3 py-1 rounded-full bg-[#FFF8CA] hover:bg-[#2D120D] hover:text-[#FFF8CA] border border-[#2D120D]/20 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          Manage Role
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* General Members Section */}
            <section className="space-y-4 pt-4">
              <div className="flex items-center gap-2 border-b border-[#2D120D]/15 pb-2">
                <Users className="w-5 h-5 text-[#284E45]" />
                <h2 className="font-serif text-2xl font-bold text-[#2D120D]">
                  Club Members ({generalMembers.length})
                </h2>
              </div>

              {generalMembers.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-4">
                  No additional general members yet. New joiners will appear here!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {generalMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="p-5 rounded-3xl bg-white border border-[#2D120D]/15 hover:border-[#6B0B0C] shadow-2xs flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-200 text-[#2D120D] font-bold text-sm flex items-center justify-center shrink-0">
                          {member.name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/profile/${member.username || member.userId}`}
                            className="font-bold text-xs text-[#2D120D] hover:text-[#6B0B0C] truncate block"
                          >
                            {member.name}
                          </Link>

                          {member.customTitle && (
                            <p className="text-[11px] text-[#6B0B0C] font-medium leading-snug">
                              {member.customTitle}
                            </p>
                          )}

                          {member.headline && (
                            <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                              {member.headline}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#2D120D]/10 flex items-center justify-between text-xs">
                        <Link
                          to={`/profile/${member.username || member.userId}`}
                          className="text-[#6B0B0C] hover:text-[#2D120D] font-semibold text-[11px]"
                        >
                          View Profile →
                        </Link>

                        {isHost && (
                          <button
                            type="button"
                            onClick={() => setManagingMember(member)}
                            className="px-3 py-1 rounded-full bg-stone-100 hover:bg-[#2D120D] hover:text-[#FFF8CA] text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                          >
                            Assign Role
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Devpost Project Details Modal */}
      {selectedShowcaseProject && (
        <DevpostProjectModal
          project={selectedShowcaseProject}
          groupId={group.id}
          onClose={() => setSelectedShowcaseProject(null)}
          onUpdate={(updated) => {
            setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          }}
        />
      )}

      {/* Showcase Submission Modal */}
      {showcaseModalOpen && (
        <ShowcaseProjectModal
          groupId={group.id}
          onClose={() => setShowcaseModalOpen(false)}
          onSuccess={(newProj) => {
            setProjects((prev) => [newProj, ...prev]);
            setSelectedShowcaseProject(newProj);
          }}
        />
      )}

      {/* Create Announcement Modal */}
      {announcementModalOpen && isExecutive && (
        <CreateAnnouncementModal
          groupId={group.id}
          userRole={
            isHost
              ? "host"
              : group.userRole === "vice_president" ||
                  group.userRole === "treasurer" ||
                  group.userRole === "executive"
                ? group.userRole
                : "executive"
          }
          userCustomTitle={group.userCustomTitle}
          onClose={() => setAnnouncementModalOpen(false)}
          onSuccess={(newAnn) => {
            setAnnouncements((prev) => [newAnn, ...prev]);
          }}
        />
      )}

      {/* Manage Member Title & Role Modal */}
      {managingMember && (
        <ManageMemberRoleModal
          groupId={group.id}
          member={managingMember}
          customRoles={group.customRoles}
          onClose={() => setManagingMember(null)}
          onSuccess={(updated, club) => {
            if (club) {
              setGroup(club);
              return;
            }
            setGroup((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                members: prev.members.map((m) => (m.userId === updated.userId ? updated : m)),
              };
            });
          }}
        />
      )}
    </div>
  );
}

function ClubPoliciesEditor({
  groupId,
  policies,
  onSaved,
}: {
  groupId: string;
  policies: string;
  onSaved: (policies: string) => void;
}) {
  const [value, setValue] = useState(policies);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(policies);
  }, [policies]);

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        placeholder="Describe how your club runs elections, exec roles, meeting rules…"
        className="w-full rounded-2xl border border-[#2D120D]/20 bg-[#FFFDF0] px-3 py-2 text-sm text-[#2D120D] focus:border-[#6B0B0C] focus:outline-none"
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <button
        type="button"
        disabled={saving || value === policies}
        onClick={async () => {
          setSaving(true);
          setError(null);
          try {
            const club = await patchClub(groupId, { policies: value });
            onSaved(club.policies || value);
          } catch (err) {
            setError(getApiErrorMessage(err) || "Failed to save policies");
          } finally {
            setSaving(false);
          }
        }}
        className="rounded-full bg-[#6B0B0C] px-4 py-2 text-xs font-bold text-[#FFF8CA] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save policies"}
      </button>
    </div>
  );
}
