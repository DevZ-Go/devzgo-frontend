import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  FolderKanban,
  Trash2,
  X,
  Mail,
  Calendar,
  Sparkles,
  Send,
  UserPlus,
  Check,
  Github,
  MapPin,
  Pencil,
  Users,
  Code2,
  Heart,
  MessageSquare,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ProjectCard } from "../components/ProjectCard";
import { deleteProject, fetchMyProjects, fetchProjects } from "../api/projects";
import { fetchUserProfile, updateMyProfile } from "../api/profiles";
import {
  fetchConnectionStatus,
  sendConnectionRequest,
  acceptConnection,
} from "../api/connections";
import { fetchFeed } from "../api/network";
import { transformApiProject } from "../utils/projectTransform";
import { getApiErrorMessage } from "../utils/apiError";
import type { Project } from "../types/project";
import type { DeveloperProfile, FeedActivity } from "../types/network";
import { useAuth } from "../auth/AuthContext";

function formatMemberSince(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(d);
}

function initials(username: string | undefined, email: string | undefined): string {
  const u = (username ?? "").trim();
  if (u.length >= 2) return u.slice(0, 2).toUpperCase();
  const e = (email ?? "").trim();
  if (e.includes("@")) return e[0]!.toUpperCase() + (e[1] ?? "").toUpperCase();
  return "U";
}

export function ProfilePage() {
  const { id: routeId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, refreshUser } = useAuth();
  const clearedState = useRef(false);

  const isOwnProfile = useMemo(() => {
    if (!routeId) return true;
    if (user?.id && String(user.id) === routeId) return true;
    if (user?.username && user.username.toLowerCase() === routeId.toLowerCase()) return true;
    return false;
  }, [routeId, user]);

  const [devProfile, setDevProfile] = useState<DeveloperProfile | null>(null);
  const [connectionState, setConnectionState] = useState<{
    status: "none" | "pending_sent" | "pending_received" | "connected";
    connectionId?: string;
  }>({ status: "none" });

  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "network" | "activity">("projects");

  // Edit profile modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Delete project state
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; title: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (clearedState.current) return;
    const w = (location.state as { uploadWarnings?: string[] } | undefined)?.uploadWarnings;
    if (w?.length) {
      setUploadWarnings(w);
      clearedState.current = true;
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location.state, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (token && user == null) {
      void refreshUser();
    }
  }, [token, user, refreshUser]);

  // Load Profile & Projects Data
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const targetIdentifier = routeId || (user?.username ?? "janasi");
        const profileData = await fetchUserProfile(targetIdentifier);
        if (cancelled) return;
        setDevProfile(profileData);

        if (!isOwnProfile) {
          const cStatus = await fetchConnectionStatus(profileData.userId || profileData.id);
          if (!cancelled) setConnectionState(cStatus);
        }

        // Projects
        if (isOwnProfile) {
          const list = await fetchMyProjects();
          if (!cancelled) setProjects(list.map((api, i) => transformApiProject(api, i)));
        } else {
          const allProjects = await fetchProjects();
          const filtered = allProjects
            .filter(
              (p) =>
                p.owner_username?.toLowerCase() === profileData.username.toLowerCase() ||
                p.owner?.username?.toLowerCase() === profileData.username.toLowerCase()
            )
            .map((api, i) => transformApiProject(api, i));
          if (!cancelled) setProjects(filtered);
        }

        // Recent feed activities for this user
        const allFeed = await fetchFeed("all");
        if (!cancelled) {
          const userActs = allFeed.filter(
            (a) =>
              a.authorUsername.toLowerCase() === profileData.username.toLowerCase() ||
              a.userId === profileData.userId
          );
          setActivities(userActs);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [routeId, isOwnProfile, user]);

  function handleOpenEdit() {
    if (!devProfile) return;
    setEditFullName(devProfile.fullName || "");
    setEditHeadline(devProfile.headline || "");
    setEditBio(devProfile.bio || "");
    setEditSkills(devProfile.skills || "");
    setEditLocation(devProfile.location || "");
    setEditGithub(devProfile.githubUrl || "");
    setEditWebsite(devProfile.websiteUrl || "");
    setEditModalOpen(true);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateMyProfile({
        fullName: editFullName,
        headline: editHeadline,
        bio: editBio,
        skills: editSkills,
        location: editLocation,
        githubUrl: editGithub,
        websiteUrl: editWebsite,
      });
      setDevProfile(updated);
      setEditModalOpen(false);
    } catch {
      // Ignore
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleConnectToggle() {
    if (!devProfile) return;
    if (connectionState.status === "pending_received" && connectionState.connectionId) {
      await acceptConnection(connectionState.connectionId);
      setConnectionState({ status: "connected" });
      setDevProfile((prev) =>
        prev ? { ...prev, connectionsCount: prev.connectionsCount + 1 } : null
      );
    } else if (connectionState.status === "none") {
      await sendConnectionRequest(devProfile.userId || devProfile.id);
      setConnectionState({ status: "pending_sent" });
    }
  }

  const memberSince = formatMemberSince(
    typeof user?.created_at === "string" ? user.created_at : undefined
  );

  async function handleDeleteProject(projectId: string) {
    setDeletingId(projectId);
    setDeleteError(null);
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setDeleteDialog(null);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const displayName =
    devProfile?.fullName || devProfile?.username || user?.username || "Developer";
  const displayEmail = devProfile?.email || (typeof user?.email === "string" ? user.email : null);
  const skillsList = useMemo(() => {
    if (!devProfile?.skills) return [];
    return devProfile.skills.split(",").map((s) => s.trim()).filter(Boolean);
  }, [devProfile?.skills]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 pt-28 pb-20">
        {error && (
          <div className="mb-8 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800 text-sm">
            {error}
          </div>
        )}

        {uploadWarnings.length > 0 && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 text-sm flex items-center justify-between">
            <div>
              <p className="font-semibold mb-1">Upload warnings:</p>
              <ul className="list-disc list-inside">
                {uploadWarnings.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setUploadWarnings([])}
              className="p-1 rounded-lg hover:bg-amber-100 text-amber-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Profile Header Card */}
        <header className="mb-10 grid gap-8 lg:grid-cols-[1.2fr_minmax(0,1fr)] items-start">
          <div className="rounded-3xl border border-gray-200/90 bg-white p-8 sm:p-10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {devProfile?.avatarUrl ? (
                <img
                  src={devProfile.avatarUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-3xl object-cover ring-2 ring-gray-100 shadow-md shrink-0"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-3xl font-bold tracking-tight text-white shadow-md shadow-blue-500/25">
                  {initials(displayName, displayEmail ?? undefined)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/80">
                    <Sparkles className="w-3.5 h-3.5" />
                    Verified Developer
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    @{devProfile?.username || "user"}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-1">
                  {displayName}
                </h1>

                {devProfile?.headline && (
                  <p className="text-sm font-medium text-gray-600 mb-3">
                    {devProfile.headline}
                  </p>
                )}

                {devProfile?.bio && (
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-4">
                    {devProfile.bio}
                  </p>
                )}

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                  {displayEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{displayEmail}</span>
                    </div>
                  )}
                  {devProfile?.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{devProfile.location}</span>
                    </div>
                  )}
                  {devProfile?.githubUrl && (
                    <a
                      href={devProfile.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {memberSince && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Joined {memberSince}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {isOwnProfile ? (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenEdit}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Profile
                      </button>
                      <Link
                        to="/add-project"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:shadow-lg transition"
                      >
                        New project
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleConnectToggle}
                        disabled={connectionState.status === "pending_sent"}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition ${
                          connectionState.status === "connected"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : connectionState.status === "pending_sent"
                            ? "bg-gray-100 text-gray-500 cursor-default"
                            : connectionState.status === "pending_received"
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg"
                        }`}
                      >
                        {connectionState.status === "connected" ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Connected
                          </>
                        ) : connectionState.status === "pending_sent" ? (
                          <>Pending Request</>
                        ) : connectionState.status === "pending_received" ? (
                          <>Accept Request</>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" /> Connect
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/messages?user=${devProfile?.userId || devProfile?.id || routeId}`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition"
                      >
                        <Send className="w-3.5 h-3.5 text-blue-600" />
                        Message
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                Projects
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums">
                {loading ? "—" : projects.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">Published in portfolio</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Connections
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums">
                {loading ? "—" : devProfile?.connectionsCount || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Network peers</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Collaborations
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums">
                {loading ? "—" : devProfile?.collaborationsCount || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Team projects joined</p>
            </div>
          </div>
        </header>

        {/* Skills & Technologies Pills */}
        {skillsList.length > 0 && (
          <div className="mb-10 p-6 rounded-3xl border border-gray-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              <Code2 className="w-4 h-4 text-blue-600" />
              Verified Skills & Tech Stack
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "projects"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Portfolio Projects ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "activity"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Recent Activity ({activities.length})
          </button>
        </div>

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <section>
            {loading && (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-500">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm">Loading projects…</p>
              </div>
            )}

            {!loading && projects.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 px-8 py-20 text-center shadow-sm">
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
                  {isOwnProfile
                    ? "You haven't uploaded any projects yet. Showcase your stack by adding a project!"
                    : "This developer hasn't published any public projects yet."}
                </p>
                {isOwnProfile && (
                  <Link
                    to="/add-project"
                    className="inline-flex px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold hover:shadow-lg transition"
                  >
                    Add your first project
                  </Link>
                )}
              </div>
            )}

            {!loading && projects.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="flex flex-col gap-3">
                    <ProjectCard project={project} variant="compact" />
                    {isOwnProfile && (
                      <div className="flex flex-wrap items-center gap-3 px-1 text-xs">
                        <Link
                          to={`/project/${project.id}/edit`}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Edit project
                        </Link>
                        <span className="text-gray-300">·</span>
                        <Link
                          to={`/project/${project.id}`}
                          className="font-medium text-gray-600 hover:text-gray-900"
                        >
                          View details
                        </Link>
                        <span className="text-gray-300">·</span>
                        <button
                          type="button"
                          disabled={deletingId === project.id}
                          onClick={() =>
                            setDeleteDialog({ id: project.id, title: project.title })
                          }
                          className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingId === project.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <section className="space-y-4">
            {activities.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 px-8 py-16 text-center text-gray-500 text-sm">
                No recent activity recorded for this developer.
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-sm flex items-start justify-between gap-4"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                      {act.activityType.replace(/_/g, " ")}
                    </span>
                    {act.title && (
                      <h4 className="font-bold text-gray-900 text-sm mb-1">
                        {act.title}
                      </h4>
                    )}
                    {act.content && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {act.content}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {act.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {act.commentsCount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </main>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Developer Profile</h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Backend Lead | Distributed Systems"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, FastAPI, PostgreSQL, Docker, TypeScript"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="text"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete project?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Delete “{deleteDialog.title}”? This cannot be undone.
            </p>
            {deleteError && (
              <p className="text-sm text-red-700 mb-3">{deleteError}</p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteDialog(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                disabled={deletingId === deleteDialog.id}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProject(deleteDialog.id)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
                disabled={deletingId === deleteDialog.id}
              >
                {deletingId === deleteDialog.id ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
