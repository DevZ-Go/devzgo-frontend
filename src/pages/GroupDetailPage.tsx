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
  Share2,
  Lock,
  Clock,
  X,
  FolderKanban,
  ImagePlus,
  CalendarDays,
  MapPin,
  Trash2,
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
import { isClubExecutiveRole } from "../types/groups";
import {
  fetchGroup,
  fetchGroupAnnouncements,
  fetchGroupEvents,
  fetchGroupProjects,
  fetchClubFunds,
  fetchClubGallery,
  uploadEventMedia,
  addClubFundEntry,
  fetchMyClubPermissions,
  joinGroup,
  leaveGroup,
  patchClub,
  patchMembershipPrivacy,
  approveClubAvatar,
  approveClubJoinRequest,
  declineClubJoinRequest,
  toggleLikeAnnouncement,
  addAnnouncementComment,
  deleteGroupEvent,
} from "../api/groups";
import { ClubBroadcastModal } from "../components/network/ClubBroadcastModal";
import { EditClubModal } from "../components/network/EditClubModal";
import { getApiErrorMessage } from "../utils/apiError";
import { useAuth } from "../auth/AuthContext";
import { DevpostProjectModal } from "../components/network/DevpostProjectModal";
import { ShowcaseProjectModal } from "../components/network/ShowcaseProjectModal";
import { CreateAnnouncementModal } from "../components/network/CreateAnnouncementModal";
import { CreateEventModal } from "../components/network/CreateEventModal";
import { ManageMemberRoleModal } from "../components/network/ManageMemberRoleModal";
import { ClubPermissionsPanel } from "../components/network/ClubPermissionsPanel";
import { ExecutiveBoard } from "../components/network/ExecutiveBoard";
import { ClubMembersList } from "../components/network/ClubMembersList";
import { GalleryLightbox } from "../components/network/GalleryLightbox";
import { VerifiedClubBadge } from "../components/network/VerifiedClubBadge";
import {
  ClubJoinNotice,
  type ClubJoinNoticeKind,
} from "../components/network/ClubJoinNotice";
import { assetUrlOrNull } from "../api/config";
import { useNotice } from "../components/AppNotice";

export function GroupDetailPage() {
  const { groupId = "" } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { notify, confirm } = useNotice();

  const [group, setGroup] = useState<NetworkGroup | null>(null);
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>([]);
  const [projects, setProjects] = useState<GroupProjectShowcase[]>([]);
  const [events, setEvents] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      startsAt?: string | null;
      endsAt?: string | null;
      modality?: string | null;
      venueName?: string | null;
      venueAddress?: string | null;
      roomNumber?: string | null;
      meetingUrl?: string | null;
      meetingPlatform?: string | null;
      posterUrl?: string | null;
      posterFormat?: string | null;
      posterOrientation?: string | null;
      rsvpUrl?: string | null;
      attractions?: string | null;
      status: string;
      academicTerm?: string | null;
      academicYear?: string | null;
      location?: string | null;
    }>
  >([]);
  const [funds, setFunds] = useState<{
    summary: { income: number; expense: number; balance: number };
    entries: Array<{ id: string; amount: number; note: string; entryType: string; currency: string }>;
  } | null>(null);
  const [gallery, setGallery] = useState<
    Array<{
      id: string;
      url: string;
      eventId?: string;
      mediaType?: string;
      academicTerm?: string;
      academicYear?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [myPerms, setMyPerms] = useState<Record<string, boolean | string>>({});

  // Active tab: "projects" | "announcements" | "events" | "members" | "funds" | "gallery"
  const [activeTab, setActiveTab] = useState<
    "projects" | "announcements" | "events" | "members" | "funds" | "gallery"
  >("projects");
  const [projectKindFilter, setProjectKindFilter] = useState<ProjectKind | "all">("all");
  const [eventWhen, setEventWhen] = useState<"upcoming" | "past" | "all">("upcoming");
  const [galleryTerm, setGalleryTerm] = useState("");
  const [galleryYear, setGalleryYear] = useState("");
  const [galleryMediaType, setGalleryMediaType] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // Modals state
  const [selectedShowcaseProject, setSelectedShowcaseProject] = useState<GroupProjectShowcase | null>(null);
  const [showcaseModalOpen, setShowcaseModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announceSeed, setAnnounceSeed] = useState<{
    eventId?: string;
    title?: string;
    content?: string;
    media?: Array<{ url: string; type: string; source: string }>;
  } | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<(typeof events)[number] | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [editClubOpen, setEditClubOpen] = useState(false);
  const [galleryEventId, setGalleryEventId] = useState<string>("");
  const [managingMember, setManagingMember] = useState<GroupMember | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [fundType, setFundType] = useState<"income" | "expense">("expense");
  const [fundSaving, setFundSaving] = useState(false);
  const [joinNotice, setJoinNotice] = useState<{
    kind: ClubJoinNoticeKind;
    emailOptIn: boolean;
  } | null>(null);

  // Quick announcement comment inputs state
  const [annCommentTexts, setAnnCommentTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      fetchGroup(groupId, user?.id ? String(user.id) : undefined),
      fetchGroupAnnouncements(groupId),
      fetchGroupProjects(groupId),
      fetchGroupEvents(groupId, "upcoming").catch(() => []),
    ])
      .then(([g, a, p, e]) => {
        if (!active) return;
        setGroup(g);
        setAnnouncements(a);
        setProjects(p);
        setEvents(e);
        if (g?.isMember) {
          void fetchMyClubPermissions(g.id)
            .then((perms) => {
              if (active) setMyPerms(perms);
            })
            .catch(() => {
              if (active) setMyPerms({});
            });
        }
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
      <div className="min-h-screen bg-[#F7F1E8] text-[#2D120D] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-3">
          <div className="w-8 h-8 border-3 border-[#780D18] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-[#780D18]">
            Opening Club Channel...
          </p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#F7F1E8] text-[#2D120D] flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-4 py-32 text-center space-y-4">
          <h1 className="font-serif text-3xl font-bold">Group Not Found</h1>
          <p className="text-sm text-[#2D120D]/75">
            This club channel may have moved or does not exist.
          </p>
          <Link
            to="/network/groups"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#780D18] text-[#F7F1E8] text-xs font-semibold"
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
  // Founder can manage roles when the club has no president yet (e.g. already leads another club).
  const hasPresident = group.members.some((m) => m.role === "host" || m.role === "president");
  const isFounderManager =
    Boolean(user?.id) &&
    !hasPresident &&
    group.members.some((m) => m.userId === user?.id && isClubExecutiveRole(m.role));
  const isExecutive = isHost || isFounderManager || isClubExecutiveRole(group.userRole);
  const isMember = group.isMember || isHost || isFounderManager;
  const isPrivate = group.visibility === "private";
  const isPending = Boolean(group.hasPendingRequest);
  const pendingRequests = group.pendingRequests ?? [];
  const lockedPrivate = isPrivate && !isMember;
  const can = (key: string) => Boolean(isHost || myPerms[key] === true);
  const canManageRoles = isHost || isFounderManager || can("manage_roles");
  const canEditClub = isHost || can("settings");
  const canAnnounce = can("announcements");
  const canEvents = can("events");
  const canGalleries = can("galleries");
  const canBroadcast = can("broadcast_email");
  const canSeeFunds =
    Boolean(group.isMember) &&
    (group.fundsVisibility !== "executives" || isExecutive || can("funds"));

  const handleJoinLeave = async () => {
    if (isMember) {
      if (isHost) {
        notify("As president, transfer the presidency to someone else before leaving the club.", "info");
        return;
      }
      try {
      const updated = await leaveGroup(group.id, String(user?.id ?? "usr-me"));
      setGroup(updated);
      } catch (err) {
        notify(getApiErrorMessage(err) || "Could not leave club", "bad");
      }
    } else if (!isPending) {
      try {
        const updated = await joinGroup(group.id, {
          id: String(user?.id ?? "usr-me"),
          name: user?.username || "DevZ-Go Member",
          username: user?.username || "developer",
        });
        setGroup(updated);
        setJoinNotice({
          kind: updated.isMember ? "joined" : "pending",
          emailOptIn: updated.emailBroadcastOptIn !== false,
        });
      } catch (err) {
        notify(getApiErrorMessage(err) || "Could not send request", "bad");
      }
    }
  };

  const handleApproveRequest = async (targetUserId: string) => {
    try {
      const updated = await approveClubJoinRequest(group.id, targetUserId);
      setGroup(updated);
    } catch (err) {
      notify(getApiErrorMessage(err) || "Could not approve request", "bad");
    }
  };

  const handleDeclineRequest = async (targetUserId: string) => {
    try {
      const updated = await declineClubJoinRequest(group.id, targetUserId);
      setGroup(updated);
    } catch (err) {
      notify(getApiErrorMessage(err) || "Could not decline request", "bad");
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
    <div className="min-h-screen bg-[#F7F1E8] text-[#2D120D] font-sans antialiased selection:bg-[#780D18] selection:text-[#F7F1E8]">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pt-28 pb-20">
        <NetworkPlaces current="groups" />

        {/* Breadcrumb Back Link */}
        <div className="mb-4">
          <Link
            to="/network/groups"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#780D18] hover:text-[#2D120D] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to all clubs
          </Link>
        </div>

        {/* Group Hero Header Banner */}
        <header className="relative rounded-3xl overflow-hidden bg-[#2D120D] text-[#F7F1E8] border-2 border-[#CDE3E8]/30 shadow-xl mb-8">
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

            <div className="absolute top-4 left-4 sm:left-6 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#780D18] text-[#F7F1E8] text-xs font-mono font-bold uppercase tracking-wider border border-[#F7F1E8]/30 shadow-xs">
                <Users className="w-3.5 h-3.5" />
                {group.category.replace("_", " ")}
              </span>

              {isPrivate && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2D120D]/90 text-[#F7F1E8] text-xs font-mono font-bold uppercase tracking-wider border border-[#F7F1E8]/30 shadow-xs">
                  <Lock className="w-3 h-3 text-[#CDE3E8]" /> Private
                </span>
              )}

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
                  notify("Club link copied to clipboard.", "ok");
                }}
                className="p-2 rounded-full bg-[#2D120D]/80 hover:bg-[#780D18] text-[#F7F1E8] border border-[#F7F1E8]/30 transition cursor-pointer shadow-sm"
                title="Share club link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Group Info Strip */}
          <div className="p-6 sm:p-8 pt-0 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-end gap-3 sm:gap-4">
                {group.avatarUrl && (
                  <img
                    src={assetUrlOrNull(group.avatarUrl) || group.avatarUrl}
                    alt=""
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border-2 border-[#F7F1E8]/80 shadow-md shrink-0"
                  />
                )}
                <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#F7F1E8] leading-tight inline-flex items-center gap-2 flex-wrap">
                {group.name}
                  {group.verified && <VerifiedClubBadge className="text-[#DECDBA]" />}
              </h1>
              </div>

              <p className="font-sans text-sm sm:text-base text-[#F7F1E8]/90 leading-relaxed font-medium">
                {group.tagline}
              </p>

              {/* Host & Executives summary pill */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#F7F1E8]/80">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-[#F7F1E8]/20">
                  <span className="text-[#CDE3E8] font-bold">President:</span>
                  <Link
                    to={`/profile/${group.hostUsername || group.hostId}`}
                    className="font-bold text-[#F7F1E8] hover:text-[#CDE3E8] underline decoration-[#F7F1E8]/40 underline-offset-2"
                  >
                    {group.hostName}
                  </Link>
                  {group.hostTitle && (
                    <span className="text-[#F7F1E8]/70 text-[11px] italic">
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
                disabled={isPending}
                onClick={handleJoinLeave}
                className={`px-5 py-2.5 rounded-lg font-sans text-xs sm:text-sm font-bold tracking-wide transition shadow-sm disabled:cursor-default ${
                  isMember
                    ? "bg-[#F7F1E8] hover:bg-white text-[#2D120D] border border-[#DECDBA]"
                    : isPending
                    ? "bg-[#F7F1E8] text-[#780D18] border border-[#780D18]/30"
                    : "bg-[#780D18] hover:bg-[#5C0A12] text-[#F7F1E8]"
                }`}
              >
                {isMember
                  ? isHost
                    ? "President"
                    : "Leave Club"
                  : isPending
                  ? "Request Sent ✓"
                  : isPrivate
                  ? "Request to Enter"
                  : "Join This Club"}
              </button>

              {!lockedPrivate && isMember && (
              <button
                type="button"
                onClick={() => setShowcaseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-white hover:bg-[#F7F1E8] text-[#2D120D] border border-[#DECDBA] text-xs sm:text-sm font-bold tracking-wide transition"
              >
                  <Plus className="w-4 h-4 text-[#780D18]" />
                <span>Showcase Project</span>
              </button>
              )}
              {canEditClub && (
                <button
                  type="button"
                  onClick={() => setEditClubOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-[#F7F1E8] border border-white/30 text-xs sm:text-sm font-bold tracking-wide transition"
                >
                  Edit club
                </button>
              )}
              {isHost && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("members");
                    requestAnimationFrame(() =>
                      document.getElementById("club-leadership-permissions")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#F7F1E8] text-[#780D18] text-xs sm:text-sm font-bold tracking-wide transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Permissions
                </button>
              )}
            </div>
          </div>
        </header>

        {joinNotice && (
          <ClubJoinNotice
            clubId={group.id}
            clubName={group.name}
            kind={joinNotice.kind}
            emailOptIn={joinNotice.emailOptIn}
            onDismiss={() => setJoinNotice(null)}
            onEmailOptInChange={(value) => {
              setJoinNotice((prev) => (prev ? { ...prev, emailOptIn: value } : prev));
              setGroup((prev) => (prev ? { ...prev, emailBroadcastOptIn: value } : prev));
            }}
          />
        )}

        {isExecutive && group.pendingAvatarUrl && (
          <div className="mb-6 rounded-xl border border-[#780D18]/30 bg-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <img
              src={assetUrlOrNull(group.pendingAvatarUrl) || group.pendingAvatarUrl}
              alt=""
              className="h-14 w-14 rounded-xl object-cover border border-[#DECDBA] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#2D120D]">New club logo awaiting approval</p>
              <p className="text-[11px] text-[#6E5952]">
                {(group.pendingAvatarApprovals || []).length}/{group.pendingAvatarNeeded || 3} executives approved
              </p>
            </div>
            {user?.id && !(group.pendingAvatarApprovals || []).includes(String(user.id)) && (
              <button
                type="button"
                className="rounded-lg bg-[#780D18] px-4 py-2 text-xs font-bold text-white shrink-0"
                onClick={() =>
                  void approveClubAvatar(group.id)
                    .then(setGroup)
                    .catch((err) => notify(getApiErrorMessage(err) || "Approve failed", "bad"))
                }
              >
                Approve logo
              </button>
            )}
          </div>
        )}

        {lockedPrivate ? (
          <div className="rounded-3xl border-2 border-[#780D18]/25 bg-white p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#780D18] text-[#F7F1E8] shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D120D]">
              This is a Private Club Channel
            </h2>
            <p className="text-sm text-[#2D120D]/75 max-w-md mx-auto leading-relaxed">
              {isPending
                ? "Your request to enter has been sent via Messages to the club's President and Executives. Once approved, you'll receive a message and unlock full access."
                : "Request access to enter this channel. A message will automatically be sent to the club's President and Executives so they can let you in."}
            </p>
            <div className="pt-2">
              {isPending ? (
                <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F7F1E8] text-[#780D18] border border-[#780D18]/30 text-xs sm:text-sm font-bold">
                  <Clock className="w-4 h-4" /> Waiting for President / Executive Approval
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleJoinLeave}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#780D18] hover:bg-[#2D120D] text-[#F7F1E8] text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> Request to Enter Channel
                </button>
              )}
            </div>
          </div>
        ) : (
        <>
        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b-2 border-[#2D120D]/15 pb-2 mb-8">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none">
            {(
              [
                ["projects", `Showcase (${projects.length})`, FolderKanban],
                ["announcements", `Updates (${announcements.length})`, Megaphone],
                ["events", `Events (${events.length})`, Clock],
                ["members", `People (${group.members.length})`, Users],
              ] as const
            ).map(([id, text, Icon]) => (
            <button
                key={id}
              type="button"
                onClick={() => {
                  setActiveTab(id);
                  if (id === "events") {
                    void fetchGroupEvents(groupId, eventWhen).then(setEvents).catch(() => setEvents([]));
                  }
                }}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition shrink-0 ${
                  activeTab === id
                    ? "bg-[#780D18] text-[#F7F1E8]"
                    : "bg-white text-[#2D120D] border border-[#DECDBA]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{text}</span>
            </button>
            ))}

            {canSeeFunds && (
            <button
              type="button"
                onClick={() => {
                  setActiveTab("funds");
                  void fetchClubFunds(groupId).then(setFunds).catch(() => setFunds(null));
                }}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition shrink-0 ${
                  activeTab === "funds"
                    ? "bg-[#780D18] text-[#F7F1E8]"
                    : "bg-white text-[#2D120D] border border-[#DECDBA]"
                }`}
              >
                Funds
            </button>
            )}
            {group.isMember && (
            <button
              type="button"
                onClick={() => {
                  setActiveTab("gallery");
                  void fetchClubGallery(groupId).then(setGallery).catch(() => setGallery([]));
                  if (!galleryEventId && events[0]) setGalleryEventId(events[0].id);
                }}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition shrink-0 ${
                  activeTab === "gallery"
                    ? "bg-[#780D18] text-[#F7F1E8]"
                    : "bg-white text-[#2D120D] border border-[#DECDBA]"
                }`}
              >
                Gallery
            </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canBroadcast && (
                <button
                  type="button"
                onClick={() => setBroadcastOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#DECDBA] bg-white text-[#2D120D] text-xs font-semibold"
                >
                Email club
                </button>
              )}
            {activeTab === "announcements" && canAnnounce && (
              <button
                type="button"
                onClick={() => {
                  setAnnounceSeed(null);
                  setAnnouncementModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#780D18] text-[#F7F1E8] text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Announcement</span>
              </button>
            )}
            {activeTab === "events" && canEvents && (
              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setEventModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#780D18] text-[#F7F1E8] text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Event</span>
              </button>
            )}
            {activeTab === "projects" && group.isMember && (
              <button
                type="button"
                onClick={() => setShowcaseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#780D18] text-[#F7F1E8] text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Showcase</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PROJECT SHOWCASE (Devpost Inspired) */}
        {/* ======================================================== */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-white border border-[#DECDBA]">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setProjectKindFilter("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    projectKindFilter === "all"
                      ? "bg-[#780D18] text-[#F7F1E8]"
                      : "bg-[#F7F1E8] text-[#2D120D] border border-[#DECDBA]"
                  }`}
                >
                  All ({projects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectKindFilter("software")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    projectKindFilter === "software"
                      ? "bg-[#780D18] text-[#F7F1E8]"
                      : "bg-[#F7F1E8] text-[#2D120D] border border-[#DECDBA]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Software ({projects.filter((p) => p.kind === "software").length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectKindFilter("embedded_hardware")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    projectKindFilter === "embedded_hardware"
                      ? "bg-[#780D18] text-[#F7F1E8]"
                      : "bg-[#F7F1E8] text-[#2D120D] border border-[#DECDBA]"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Hardware ({projects.filter((p) => p.kind === "embedded_hardware").length})
                </button>
              </div>

              {group.isMember && (
              <button
                type="button"
                onClick={() => setShowcaseModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#780D18] hover:bg-[#5C0A12] text-[#F7F1E8] text-xs font-bold transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                  Showcase project
              </button>
              )}
            </div>

            {/* Showcase Projects Grid (Devpost Style) */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 rounded-3xl bg-white border-2 border-dashed border-[#2D120D]/20 p-8 space-y-3">
                <FolderKanban className="w-10 h-10 mx-auto text-[#780D18]/60" />
                <h3 className="font-serif text-xl font-bold">No Showcased Projects Yet</h3>
                <p className="font-sans text-xs text-[#2D120D]/70 max-w-sm mx-auto">
                  Be the first member to showcase a project in the {group.name}!
                </p>
                <button
                  type="button"
                  onClick={() => setShowcaseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#780D18] text-[#F7F1E8] text-xs font-bold transition shadow-xs cursor-pointer"
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
                      className="group flex flex-col justify-between rounded-xl bg-white border border-[#DECDBA] hover:border-[#780D18]/55 overflow-hidden shadow-sm hover:shadow-[0_12px_32px_rgba(120,13,24,0.1)] transition-all duration-300 cursor-pointer"
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
                                ? "bg-[#780D18] text-[#F7F1E8] border border-[#F7F1E8]/30"
                                : "bg-[#CDE3E8] text-[#2D120D]"
                            }`}
                          >
                            {isEmb ? <Cpu className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                            {isEmb ? "Hardware" : "Software"}
                          </span>
                        </div>

                        {p.subCategory && (
                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="text-[11px] font-mono text-[#F7F1E8] font-medium truncate block">
                              {p.subCategory}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-serif text-xl font-bold text-[#2D120D] group-hover:text-[#780D18] transition-colors leading-tight">
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
                              className="px-2.5 py-0.5 rounded-md bg-[#F7F1E8] text-[#2D120D] text-[10px] font-semibold border border-[#2D120D]/15"
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
                            <Cpu className="w-3.5 h-3.5 text-[#780D18]" />
                            <span className="font-semibold">{p.embeddedSpecs.microcontroller}</span>
                          </div>
                        )}

                        {/* Card Footer: Owner + Likes/Comments */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#2D120D]/10 text-xs">
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <span className="w-5 h-5 rounded-full bg-[#2D120D] text-[#F7F1E8] inline-flex items-center justify-center text-[10px] font-bold">
                              {p.ownerName[0]}
                            </span>
                            <span className="font-medium text-[11px] truncate max-w-[100px]">
                              {p.ownerName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-stone-500 font-mono text-[11px]">
                            <span className="inline-flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-[#780D18]" /> {p.likesCount}
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
              <div className="flex items-center justify-between p-5 rounded-3xl bg-[#F7F1E8] border-2 border-[#2D120D]/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#780D18] text-[#F7F1E8] flex items-center justify-center">
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
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#780D18] hover:bg-[#2D120D] text-[#F7F1E8] text-xs font-bold tracking-wide transition shadow-xs cursor-pointer"
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
                    className={`rounded-xl bg-white border p-5 sm:p-6 space-y-4 shadow-sm ${
                      ann.pinned
                        ? "border-[#780D18] bg-[#F7F1E8]"
                        : "border-[#DECDBA]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#780D18] text-[#F7F1E8] text-[10px] font-mono font-bold uppercase tracking-wider">
                            <Megaphone className="w-3 h-3" />
                            {ann.badge}
                          </span>
                          {ann.pinned && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-[#780D18] border border-[#780D18]/30 text-[10px] font-mono font-bold uppercase">
                              <Pin className="w-3 h-3" /> Pinned
                            </span>
                          )}
                          <span className="text-[11px] text-[#6E5952] inline-flex items-center gap-1">
                            {group.name}
                            {group.verified && <VerifiedClubBadge />}
                          </span>
                        </div>

                        <h2 className="font-serif text-2xl font-bold text-[#2D120D] leading-tight pt-1">
                          {ann.title}
                        </h2>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-xs text-[#2D120D]">{ann.authorName}</p>
                        <p className="text-[11px] text-[#780D18] font-semibold">
                          {ann.authorTitle || (ann.authorRole === "host" || ann.authorRole === "president" ? "President" : "Executive")}
                        </p>
                        <p className="text-[10px] text-[#6E5952]">
                          {new Date(ann.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="font-sans text-sm text-[#2D120D]/85 leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </div>

                    {Array.isArray(ann.mediaUrls) && ann.mediaUrls.length > 0 && (
                      <div className={`gap-2 ${ann.mediaUrls.length === 1 ? "flex flex-col" : "grid grid-cols-1 sm:grid-cols-2"}`}>
                        {ann.mediaUrls.map((item, idx) => {
                          const url = typeof item === "string" ? item : (item as { url?: string }).url;
                          const type =
                            typeof item === "string"
                              ? "image"
                              : (item as { type?: string }).type || "image";
                          if (!url) return null;
                          const src = assetUrlOrNull(url) || url;
                          return type === "video" ? (
                            <a
                              key={idx}
                              href={src}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-[#DECDBA] bg-[#2D120D] text-[#F7F1E8] min-h-[7rem] flex items-center justify-center text-xs font-semibold"
                            >
                              Open video
                            </a>
                          ) : (
                            <img
                              key={idx}
                              src={src}
                              alt=""
                              className="w-full max-h-[28rem] object-contain rounded-xl border border-[#DECDBA] bg-[#2D120D]/5"
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Actions: Likes & Comment Count */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#2D120D]/10 text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleLikeAnnouncement(ann.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition cursor-pointer ${
                          ann.isLiked
                            ? "bg-[#780D18] text-[#F7F1E8]"
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
                              className="p-3 rounded-2xl bg-[#F7F1E8]/50 border border-[#2D120D]/10 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-semibold text-[#780D18]">
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
                          className="flex-1 px-4 py-2 rounded-full border border-[#2D120D]/20 bg-white text-xs text-[#2D120D] focus:border-[#780D18] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-full bg-[#2D120D] hover:bg-[#780D18] text-[#F7F1E8] text-xs font-semibold transition cursor-pointer"
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

        {activeTab === "events" && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2">
              {(["upcoming", "past", "all"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setEventWhen(w);
                    void fetchGroupEvents(groupId, w).then(setEvents).catch(() => setEvents([]));
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    eventWhen === w ? "bg-[#780D18] text-white" : "bg-white border border-[#DECDBA]"
                  }`}
                >
                  {w}
                </button>
              ))}
                </div>
            {events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DECDBA] bg-white px-5 py-10 text-center text-sm text-[#6E5952]">
                No events yet.
                {canEvents && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEvent(null);
                        setEventModalOpen(true);
                      }}
                      className="rounded-lg bg-[#780D18] px-4 py-2 text-xs font-bold text-white"
                    >
                      Create event
                    </button>
              </div>
            )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {events.map((ev) => {
                  const place =
                    ev.modality === "virtual"
                      ? ev.meetingPlatform || ev.meetingUrl || "Virtual"
                      : [ev.venueName, ev.roomNumber ? `Rm ${ev.roomNumber}` : null, ev.venueAddress || ev.location]
                          .filter(Boolean)
                          .join(" · ") || "TBA";
                  const when = ev.startsAt
                    ? new Date(ev.startsAt).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Date TBA";
                  const posterSrc = assetUrlOrNull(ev.posterUrl) || ev.posterUrl || null;
                  return (
                    <article
                      key={ev.id}
                      className="group rounded-2xl border border-[#DECDBA] bg-white overflow-hidden shadow-[0_10px_28px_rgba(45,18,13,0.06)] flex flex-col"
                    >
                      <div className="relative bg-[#2D120D] min-h-[12rem] sm:min-h-[14rem] flex items-center justify-center overflow-hidden">
                        {posterSrc ? (
                          <img
                            src={posterSrc}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full max-h-[22rem] object-contain"
                          />
                        ) : (
                          <div className="px-6 py-10 text-center text-[#F7F1E8]/75">
                            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-80" />
                            <p className="font-serif text-lg font-bold text-[#F7F1E8]">{ev.title}</p>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2D120D]/90 via-[#2D120D]/35 to-transparent p-3 pt-10">
                          <div className="flex items-end justify-between gap-2">
                            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F7F1E8] leading-tight line-clamp-2">
                              {ev.title}
                            </h3>
                            {ev.status !== "published" && (
                              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/15 text-[#F7F1E8] px-2 py-0.5">
                                {ev.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-2.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#2D120D]/80">
                          <span className="inline-flex items-center gap-1.5 font-semibold">
                            <CalendarDays className="w-3.5 h-3.5 text-[#780D18]" />
                            {when}
                          </span>
                          <span className="inline-flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-[#780D18] shrink-0" />
                            <span className="truncate">{place}</span>
                          </span>
                        </div>

                        {ev.attractions && (
                          <p className="text-[11px] font-bold text-[#780D18] line-clamp-1">{ev.attractions}</p>
                        )}

                        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                          {ev.rsvpUrl && (
                            <a
                              href={ev.rsvpUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-[#780D18] px-3 py-1.5 text-[11px] font-bold text-white"
                            >
                              RSVP
                            </a>
                          )}
                          {canAnnounce && (
                            <button
                              type="button"
                              className="rounded-lg border border-[#DECDBA] bg-[#F7F1E8] px-3 py-1.5 text-[11px] font-bold text-[#2D120D] hover:border-[#780D18]/40"
                              onClick={() => {
                                setAnnounceSeed({
                                  eventId: ev.id,
                                  title: ev.title,
                                  content: [
                                    ev.description?.trim() || null,
                                    when !== "Date TBA" ? `When: ${when}` : null,
                                    place ? `Where: ${place}` : null,
                                    ev.attractions ? `Highlights: ${ev.attractions}` : null,
                                    ev.rsvpUrl ? `RSVP: ${ev.rsvpUrl}` : null,
                                  ]
                                    .filter(Boolean)
                                    .join("\n"),
                                  media: ev.posterUrl
                                    ? [{ url: ev.posterUrl, type: "image", source: "event_poster" }]
                                    : [],
                                });
                                setAnnouncementModalOpen(true);
                                setActiveTab("announcements");
                              }}
                            >
                              Share
                            </button>
                          )}
                          <button
                            type="button"
                            className="rounded-lg border border-[#DECDBA] bg-white px-3 py-1.5 text-[11px] font-bold text-[#2D120D] hover:border-[#780D18]/40"
                            onClick={() => {
                              setGalleryEventId(ev.id);
                              setActiveTab("gallery");
                              void fetchClubGallery(groupId, { eventId: ev.id })
                                .then(setGallery)
                                .catch(() => setGallery([]));
                            }}
                          >
                            Photos
                          </button>
                          {canEvents && (
                            <button
                              type="button"
                              className="rounded-lg border border-[#DECDBA] bg-white px-3 py-1.5 text-[11px] font-bold text-[#2D120D] hover:border-[#780D18]/40"
                              onClick={() => {
                                setEditingEvent(ev);
                                setEventModalOpen(true);
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {canEvents && (
                            <button
                              type="button"
                              disabled={deletingEventId === ev.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#780D18]/25 bg-white px-3 py-1.5 text-[11px] font-bold text-[#780D18] hover:bg-[#780D18]/5 disabled:opacity-50 ml-auto"
                              onClick={() => {
                                void (async () => {
                                  const ok = await confirm({
                                    title: "Delete event",
                                    message: `Delete “${ev.title}”? This cannot be undone.`,
                                    confirmLabel: "Delete",
                                  });
                                  if (!ok) return;
                                  setDeletingEventId(ev.id);
                                  try {
                                    await deleteGroupEvent(groupId, ev.id);
                                    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
                                  } catch (err) {
                                    notify(getApiErrorMessage(err) || "Could not delete event", "bad");
                                  } finally {
                                    setDeletingEventId(null);
                                  }
                                })();
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                              {deletingEventId === ev.id ? "…" : "Delete"}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "funds" && canSeeFunds && (
          <div className="space-y-4 max-w-3xl mx-auto">
            {can("funds") && (
              <form
                className="rounded-xl border border-[#DECDBA] bg-white p-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const amount = Number(fundAmount);
                  if (!amount || amount <= 0) return;
                  setFundSaving(true);
                  void addClubFundEntry(group.id, {
                    amount,
                    note: fundNote.trim() || undefined,
                    entryType: fundType,
                  })
                    .then(() => fetchClubFunds(groupId))
                    .then(setFunds)
                    .then(() => {
                      setFundAmount("");
                      setFundNote("");
                    })
                    .catch((err) => notify(getApiErrorMessage(err) || "Could not add entry", "bad"))
                    .finally(() => setFundSaving(false));
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#780D18]">Add ledger entry</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Amount"
                    className="rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#780D18]"
                  />
                  <select
                    value={fundType}
                    onChange={(e) => setFundType(e.target.value as "income" | "expense")}
                    className="rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#780D18]"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <input
                    value={fundNote}
                    onChange={(e) => setFundNote(e.target.value)}
                    placeholder="Note"
                    className="rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#780D18]"
                  />
                </div>
                        <button
                  type="submit"
                  disabled={fundSaving}
                  className="rounded-lg bg-[#780D18] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {fundSaving ? "Saving…" : "Add entry"}
                        </button>
              </form>
            )}
            {!funds ? (
              <p className="text-sm text-[#6E5952]">Loading funds…</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(
                    [
                      ["Income", funds.summary.income],
                      ["Expense", funds.summary.expense],
                      ["Balance", funds.summary.balance],
                    ] as const
                  ).map(([label, val]) => (
                    <div key={label} className="rounded-xl border border-[#DECDBA] bg-white p-3 sm:p-4 text-center">
                      <p className="text-[10px] font-bold uppercase text-[#780D18]">{label}</p>
                      <p className="font-serif text-lg sm:text-xl font-bold mt-1">${Number(val).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {funds.entries.length === 0 && (
                    <p className="text-sm text-[#6E5952]">
                      No ledger entries yet.
                      {group.fundsVisibility === "executives" ? " Visible to executives only." : " Visible to all members."}
                    </p>
                  )}
                  {funds.entries.map((e) => (
                    <div key={e.id} className="flex justify-between gap-3 rounded-lg border border-[#DECDBA] bg-white px-4 py-3 text-sm">
                      <span className="truncate">{e.note || e.entryType}</span>
                      <span className={e.entryType === "income" ? "text-emerald-700 shrink-0" : "text-[#780D18] shrink-0"}>
                        {e.entryType === "income" ? "+" : "-"}${e.amount.toFixed(2)} {e.currency}
                      </span>
                  </div>
                ))}
              </div>
              </>
            )}
              </div>
        )}

        {activeTab === "gallery" && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <select
                value={galleryEventId}
                onChange={(e) => {
                  const id = e.target.value;
                  setGalleryEventId(id);
                  void fetchClubGallery(groupId, {
                    eventId: id || undefined,
                    term: galleryTerm || undefined,
                    year: galleryYear || undefined,
                    mediaType: galleryMediaType || undefined,
                  }).then(setGallery).catch(() => setGallery([]));
                }}
                className="rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm"
              >
                <option value="">All events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
              <select
                value={galleryTerm}
                onChange={(e) => {
                  setGalleryTerm(e.target.value);
                  void fetchClubGallery(groupId, {
                    eventId: galleryEventId || undefined,
                    term: e.target.value || undefined,
                    year: galleryYear || undefined,
                    mediaType: galleryMediaType || undefined,
                  }).then(setGallery).catch(() => setGallery([]));
                }}
                className="rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm"
              >
                <option value="">All terms</option>
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
                <option value="Spring/Summer">Spring/Summer</option>
              </select>
              <input
                value={galleryYear}
                onChange={(e) => {
                  setGalleryYear(e.target.value);
                  void fetchClubGallery(groupId, {
                    eventId: galleryEventId || undefined,
                    term: galleryTerm || undefined,
                    year: e.target.value || undefined,
                    mediaType: galleryMediaType || undefined,
                  }).then(setGallery).catch(() => setGallery([]));
                }}
                placeholder="Year e.g. 2026"
                className="rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm"
              />
              <select
                value={galleryMediaType}
                onChange={(e) => {
                  setGalleryMediaType(e.target.value);
                  void fetchClubGallery(groupId, {
                    eventId: galleryEventId || undefined,
                    term: galleryTerm || undefined,
                    year: galleryYear || undefined,
                    mediaType: e.target.value || undefined,
                  }).then(setGallery).catch(() => setGallery([]));
                }}
                className="rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm"
              >
                <option value="">All media</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
              </select>
                        </div>
            {canGalleries && galleryEventId && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-lg bg-[#780D18] px-4 py-2.5 text-xs font-bold text-white cursor-pointer">
                  <ImagePlus className="w-3.5 h-3.5" />
                  {galleryUploading ? "Uploading…" : "Add photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={galleryUploading}
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      e.target.value = "";
                      if (!files.length || !galleryEventId) return;
                      setGalleryUploading(true);
                      void (async () => {
                        const uploaded: typeof gallery = [];
                        for (const f of files) {
                          try {
                            const row = await uploadEventMedia(group.id, galleryEventId, f, {
                              academicTerm: galleryTerm || undefined,
                              academicYear: galleryYear || undefined,
                            });
                            uploaded.push({
                              id: row.id,
                              url: row.url,
                              eventId: row.eventId,
                              mediaType: row.mediaType,
                              academicTerm: row.academicTerm,
                              academicYear: row.academicYear,
                            });
                          } catch (err) {
                            notify(getApiErrorMessage(err) || `Failed: ${f.name}`, "bad");
                          }
                        }
                        if (uploaded.length) setGallery((prev) => [...uploaded, ...prev]);
                        setGalleryUploading(false);
                      })();
                    }}
                  />
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-[#DECDBA] bg-white px-4 py-2.5 text-xs font-bold cursor-pointer">
                  Add video
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f || !galleryEventId) return;
                      void uploadEventMedia(group.id, galleryEventId, f, {
                        academicTerm: galleryTerm || undefined,
                        academicYear: galleryYear || undefined,
                      })
                        .then((row) =>
                          setGallery((prev) => [
                            {
                              id: row.id,
                              url: row.url,
                              eventId: row.eventId,
                              mediaType: row.mediaType,
                              academicTerm: row.academicTerm,
                              academicYear: row.academicYear,
                            },
                            ...prev,
                          ])
                        )
                        .catch((err) => notify(getApiErrorMessage(err) || "Upload failed", "bad"));
                    }}
                  />
                </label>
                <span className="text-[11px] text-[#6E5952]">Any size · originals kept up to 20 MB</span>
              </div>
            )}
            {gallery.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DECDBA] bg-white px-5 py-10 text-center text-sm text-[#6E5952]">
                {galleryEventId
                  ? "No media for this event yet. Select an event and upload photos."
                  : "Pick an event to upload photos, or browse the collective gallery."}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {gallery.map((g, idx) => (
                  <button
                    key={g.id}
                    type="button"
                    className="rounded-xl overflow-hidden border border-[#DECDBA] bg-white text-left aspect-square"
                    onClick={() => setLightboxIndex(idx)}
                  >
                    {g.mediaType === "video" ? (
                      <div className="h-full w-full bg-[#2D120D] text-[#F7F1E8] flex items-center justify-center text-xs font-semibold">
                        Video
                      </div>
                    ) : (
                      <img
                        src={assetUrlOrNull(g.url) || g.url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
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
            {group.isMember && (
              <div className="rounded-2xl border border-[#DECDBA] bg-white p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Show this club on my profile</p>
                  <p className="text-xs text-[#6E5952]">Default is hidden (private-friendly).</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentlyVisible = group.hideOnProfile === false;
                    void patchMembershipPrivacy(group.id, currentlyVisible).then((res) => {
                      setGroup((g) => (g ? { ...g, hideOnProfile: res.hideOnProfile } : g));
                    });
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    group.hideOnProfile === false
                      ? "bg-[#780D18] text-white"
                      : "bg-[#FAF7F2] border border-[#DECDBA]"
                  }`}
                >
                  {group.hideOnProfile === false ? "Visible" : "Hidden"}
                </button>
              </div>
            )}
            <div id="club-leadership-permissions" className="scroll-mt-28 space-y-4">
              {(isHost || canManageRoles) && (
                <div className="p-4 rounded-xl bg-[#780D18] text-[#F7F1E8] text-sm space-y-1">
                  <p className="font-serif text-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Leadership &amp; permissions
                  </p>
                  <p className="text-xs text-[#F7F1E8]/85">
                    {isHost
                      ? "As president, set what each executive role can do below, then use Manage on a member card to assign that role."
                      : "You can assign roles on member cards. Only the president can edit the permission matrix."}
                  </p>
                </div>
              )}

              {isHost ? (
                <ClubPermissionsPanel
                  groupId={group.id}
                  isPresident
                  fundsVisibility={group.fundsVisibility}
                  onFundsVisibilityChange={(v) =>
                    setGroup((g) => (g ? { ...g, fundsVisibility: v } : g))
                  }
                />
              ) : canManageRoles ? (
                <div className="rounded-xl border border-[#DECDBA] bg-white p-4 text-xs text-[#6E5952]">
                  Role assignment is available on each member card (Manage). Ask the president to grant
                  events, announcements, galleries, funds, or email permissions to executive roles.
                </div>
              ) : null}
            </div>

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

            {/* Pending Join Requests (Visible to President & Executives) */}
            {isExecutive && pendingRequests.length > 0 && (
              <section className="rounded-3xl border-2 border-[#780D18]/30 bg-[#F7F1E8]/50 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[#780D18]/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#780D18]" />
                    <h2 className="font-serif text-xl font-bold text-[#2D120D]">
                      Pending Join Requests ({pendingRequests.length})
                    </h2>
                        </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#780D18] font-semibold">
                    Private Club Approval
                  </span>
                      </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.userId}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-[#2D120D]/15 p-3.5 shadow-2xs"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#780D18] text-[#F7F1E8] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                          {(req.name || "?")[0]}
                        </div>
                        <div className="min-w-0">
                        <Link
                            to={`/profile/${req.username || req.userId}`}
                            className="font-bold text-sm text-[#2D120D] hover:text-[#780D18] truncate block"
                        >
                            {req.name}
                        </Link>
                          <p className="text-[11px] text-[#2D120D]/60 truncate">@{req.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                          onClick={() => handleApproveRequest(req.userId)}
                          className="inline-flex items-center gap-1 rounded-full bg-[#780D18] hover:bg-[#2D120D] px-3 py-1.5 text-[11px] font-bold text-[#F7F1E8] transition cursor-pointer"
                          >
                          <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineRequest(req.userId)}
                          className="inline-flex items-center gap-1 rounded-full border border-[#2D120D]/20 bg-white hover:bg-red-50 hover:text-red-700 px-2.5 py-1.5 text-[11px] font-semibold text-[#2D120D]/75 transition cursor-pointer"
                          title="Decline request"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            </section>
            )}

            <ExecutiveBoard
              executives={executives}
              canManageRoles={canManageRoles}
              onManage={setManagingMember}
            />

            <ClubMembersList
              members={generalMembers}
              canManageRoles={canManageRoles}
              onManage={setManagingMember}
            />
          </div>
        )}
        </>
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

      {announcementModalOpen && canAnnounce && (
        <CreateAnnouncementModal
          groupId={group.id}
          clubName={group.name}
          initialEventId={announceSeed?.eventId}
          initialTitle={announceSeed?.title}
          initialContent={announceSeed?.content}
          initialMedia={announceSeed?.media}
          events={events.map((e) => ({ id: e.id, title: e.title }))}
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
          onClose={() => {
            setAnnouncementModalOpen(false);
            setAnnounceSeed(null);
          }}
          onSuccess={(newAnn) => {
            setAnnouncements((prev) => [newAnn, ...prev]);
          }}
        />
      )}

      {eventModalOpen && canEvents && (
        <CreateEventModal
          groupId={group.id}
          initialEvent={editingEvent}
          onClose={() => {
            setEventModalOpen(false);
            setEditingEvent(null);
          }}
          onSuccess={(ev) => {
            const row = ev as (typeof events)[number];
            setEvents((prev) => {
              const idx = prev.findIndex((e) => e.id === row.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...prev[idx], ...row };
                return next;
              }
              return [row, ...prev];
            });
            setEditingEvent(null);
            setActiveTab("events");
          }}
        />
      )}

      {broadcastOpen && canBroadcast && (
        <ClubBroadcastModal
          groupId={group.id}
          clubName={group.name}
          onClose={() => setBroadcastOpen(false)}
        />
      )}

      {editClubOpen && canEditClub && (
        <EditClubModal
          group={group}
          userId={user?.id ? String(user.id) : undefined}
          onClose={() => setEditClubOpen(false)}
          onSuccess={(club) => setGroup(club)}
        />
      )}

      {lightboxIndex != null && gallery[lightboxIndex] && (
        <GalleryLightbox
          items={gallery}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      {/* Manage Member Title & Role Modal */}
      {managingMember && (
        <ManageMemberRoleModal
          groupId={group.id}
          member={managingMember}
          clubName={group.name}
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
        className="w-full rounded-2xl border border-[#2D120D]/20 bg-[#F7F1E8] px-3 py-2 text-sm text-[#2D120D] focus:border-[#780D18] focus:outline-none"
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
        className="rounded-full bg-[#780D18] px-4 py-2 text-xs font-bold text-[#F7F1E8] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save policies"}
      </button>
    </div>
  );
}
