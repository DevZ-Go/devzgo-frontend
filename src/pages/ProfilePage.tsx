import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Loader2,
  FolderKanban,
  Trash2,
  X,
  Mail,
  Calendar,
  CalendarDays,
  Handshake,
  Send,
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
import { deleteProject } from "../api/projects";
import { fetchMyProfile, fetchProfileProjects, fetchUserProfile, PROFILE_ROLES, updateMyProfile } from "../api/profiles";
import { fetchFeed } from "../api/network";
import { ConnectButton } from "../components/ConnectButton";
import { ProfileCompletion } from "../components/ProfileCompletion";
import { ProfilePortfolio } from "../components/ProfilePortfolio";
import { ProfileTeams } from "../components/ProfileTeams";
import { CandidateStanding } from "../components/CandidateStanding";
import { transformApiProject } from "../utils/projectTransform";
import { getApiErrorMessage } from "../utils/apiError";
import type { ApiProject, Project } from "../types/project";
import type { DeveloperProfile, FeedActivity } from "../types/network";
import { useAuth } from "../auth/AuthContext";

const TABS = ["projects", "collaborations", "portfolio", "activity"] as const;
type ProfileTab = (typeof TABS)[number];

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [rawProjects, setRawProjects] = useState<ApiProject[]>([]);
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const activeTab = TABS.find((t) => t === params.get("tab")) ?? "projects";
  const graphic = activeTab === "portfolio" && params.get("view") === "graphic";
  const setActiveTab = (tab: ProfileTab) => {
    const next = new URLSearchParams();
    if (tab !== "projects") next.set("tab", tab);
    if (tab === "portfolio" && params.get("view") === "graphic") next.set("view", "graphic");
    setParams(next, { replace: true });
  };
  const openWork = (tab: "projects" | "collaborations") => {
    setActiveTab(tab);
    requestAnimationFrame(() => document.getElementById("profile-work")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const setGraphic = (on: boolean) => {
    const next = new URLSearchParams(params);
    next.set("tab", "portfolio");
    if (on) next.set("view", "graphic");
    else next.delete("view");
    setParams(next, { replace: true });
  };

  // Edit profile modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
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
        const profileData = isOwnProfile ? await fetchMyProfile() : await fetchUserProfile(routeId!);
        if (cancelled) return;
        setDevProfile(profileData);

        // Projects
        const list = await fetchProfileProjects(profileData.userId);
        if (!cancelled) {
          setRawProjects(list);
          setProjects(list.map((api, i) => transformApiProject(api, i)));
        }

        // Recent feed activities for this user
        const allFeed = await fetchFeed("all", undefined, profileData.userId);
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
    setEditRole(devProfile.role || "");
    setEditCompany(devProfile.company || "");
    setEditBio(devProfile.bio || "");
    setEditSkills(devProfile.skills || "");
    setEditLocation(devProfile.location || "");
    setEditGithub(devProfile.githubUrl || "");
    setEditWebsite(devProfile.websiteUrl || "");
    setEditLinkedin(devProfile.linkedinUrl || "");
    setEditModalOpen(true);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateMyProfile({
        fullName: editFullName,
        headline: editHeadline,
        role: editRole,
        company: editCompany,
        bio: editBio,
        skills: editSkills,
        location: editLocation,
        githubUrl: editGithub,
        websiteUrl: editWebsite,
        linkedinUrl: editLinkedin,
      });
      setDevProfile(updated);
      setEditModalOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSavingProfile(false);
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
      setRawProjects((prev) => prev.filter((p) => String(p.id) !== projectId));
      setDeleteDialog(null);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const displayName =
    devProfile?.fullName || devProfile?.username || user?.username || "Developer";
  const displayEmail = isOwnProfile
    ? devProfile?.email || (typeof user?.email === "string" ? user.email : null)
    : devProfile?.email || null;
  const skillsList = useMemo(() => {
    if (!devProfile?.skills) return [];
    return devProfile.skills.split(",").map((s) => s.trim()).filter(Boolean);
  }, [devProfile?.skills]);

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-5 pt-24 pb-16 sm:px-8">
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
        <header className="mb-8 grid gap-4">
          <div className="rounded-3xl border border-stone-200/90 bg-white/90 p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {devProfile?.avatarUrl ? (
                <img
                  src={devProfile.avatarUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-3xl object-cover ring-2 ring-stone-200 shadow-md shrink-0"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-maroon-800 via-maroon-700 to-autumn-rust text-3xl font-serif font-normal tracking-tight text-amber-100 shadow-md shadow-maroon-900/30">
                  {initials(displayName, displayEmail ?? undefined)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="mb-2">
                  <span className="break-all font-mono text-sm text-stone-500">
                    @{devProfile?.username || "user"}
                  </span>
                </div>

                <h1 className="mb-1 break-words font-serif text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">
                  {displayName}
                </h1>

                {devProfile?.role === "Recruiter" ? (
                  <p className="mb-2 inline-flex items-center rounded-full bg-[#fced96] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-900">
                    Recruiter{devProfile.company ? ` · ${devProfile.company}` : ""}
                  </p>
                ) : devProfile?.role ? (
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-maroon-800">{devProfile.role}</p>
                ) : null}
                {devProfile?.headline && (
                  <p className="text-sm font-medium text-stone-600 mb-3">
                    {devProfile.headline}
                  </p>
                )}

                {devProfile?.bio && (
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-4">
                    {devProfile.bio}
                  </p>
                )}

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500">
                  {displayEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span className="break-all">{displayEmail}</span>
                    </div>
                  )}
                  {devProfile?.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>{devProfile.location}</span>
                    </div>
                  )}
                  {devProfile?.githubUrl && (
                    <a
                      href={devProfile.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-stone-600 hover:text-stone-900 font-medium"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {memberSince && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
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
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-maroon-800/20 hover:from-maroon-900 hover:to-autumn-amber transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Profile
                      </button>
                      <Link
                        to="/add-project"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust hover:from-maroon-900 hover:to-autumn-amber px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-maroon-800/20 hover:shadow-lg transition"
                      >
                        New project
                      </Link>
                      <Link
                        to="/import/github"
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition"
                      >
                        <Github className="w-3.5 h-3.5 text-stone-700" /> Import from GitHub
                      </Link>
                      <Link
                        to="/network/connections"
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition"
                      >
                        <Users className="w-3.5 h-3.5 text-forest-700" /> Connections
                      </Link>
                      <Link
                        to="/wrap"
                        className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition"
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-amber-300" /> View your Wrap
                      </Link>
                      {devProfile?.role === "Recruiter" && (
                        <button
                          type="button"
                          onClick={() => window.dispatchEvent(new Event("devzgo:recruiting-guide"))}
                          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition"
                        >
                          Recruiting guide
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {devProfile && (devProfile.acceptsConnections === false && !devProfile.connectionStatus ? (
                        <span className="inline-flex items-center rounded-xl border border-stone-200 px-5 py-2.5 text-xs font-semibold text-stone-500">
                          Not accepting requests
                        </span>
                      ) : (
                        <ConnectButton userId={devProfile.userId || devProfile.id} />
                      ))}

                      {devProfile?.canMessage !== false && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/messages?user=${devProfile?.userId || devProfile?.id || routeId}`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition"
                        >
                          <Send className="w-3.5 h-3.5 text-maroon-700" />
                          Message
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => openWork("projects")}
              disabled={Boolean(devProfile?.restricted)}
              className="rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:border-maroon-800 disabled:cursor-default disabled:hover:border-stone-200"
            >
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase tracking-wide mb-2">
                <FolderKanban className="w-4 h-4 shrink-0 text-maroon-700" />
                Projects
              </div>
              <p className="text-3xl font-serif font-normal text-stone-900 tabular-nums">
                {loading ? "—" : projects.length}
              </p>
              <p className="text-xs text-stone-400 mt-1">Visible to you</p>
            </button>

            {isOwnProfile ? (
              <Link to="/network/connections" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-maroon-800">
                <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase tracking-wide mb-2">
                  <Users className="w-4 h-4 shrink-0 text-forest-700" />
                  Connections
                </div>
                <p className="text-3xl font-serif font-normal text-stone-900 tabular-nums">
                  {loading ? "—" : devProfile?.connectionsCount || 0}
                </p>
                <p className="text-xs text-stone-400 mt-1">Accepted connections</p>
              </Link>
            ) : (
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase tracking-wide mb-2">
                  <Users className="w-4 h-4 shrink-0 text-forest-700" />
                  Connections
                </div>
                <p className="text-3xl font-serif font-normal text-stone-900 tabular-nums">
                  {loading || devProfile?.connectionsVisible === false ? "—" : devProfile?.connectionsCount || 0}
                </p>
                <p className="text-xs text-stone-400 mt-1">{devProfile?.connectionsVisible === false ? "Hidden" : "Accepted connections"}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => openWork("collaborations")}
              disabled={Boolean(devProfile?.restricted)}
              className="rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:border-maroon-800 disabled:cursor-default disabled:hover:border-stone-200"
            >
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase tracking-wide mb-2">
                <Handshake className="w-4 h-4 shrink-0 text-maroon-700" />
                Collaborations
              </div>
              <p className="text-3xl font-serif font-normal text-stone-900 tabular-nums">
                {loading ? "—" : devProfile?.collaborationsCount || 0}
              </p>
              <p className="text-xs text-stone-400 mt-1">Teams and joined projects</p>
            </button>
          </div>
        </header>

        {isOwnProfile && devProfile && <ProfileCompletion profile={devProfile} onEdit={handleOpenEdit} />}

        {devProfile?.restricted && (
          <p className="mb-8 rounded-3xl border border-stone-200 bg-white px-6 py-5 text-sm text-stone-600">
            This profile and its projects are visible to connections.
          </p>
        )}

        {!devProfile?.restricted && <>
        {/* Skills & Technologies Pills */}
        {skillsList.length > 0 && (
          <div className="mb-10 p-6 rounded-3xl border border-stone-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
              <Code2 className="w-4 h-4 text-maroon-700" />
              Verified Skills & Tech Stack
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div id="profile-work" className="mb-8 flex gap-6 overflow-x-auto whitespace-nowrap border-b border-stone-200 font-serif">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`pb-3 text-base sm:text-lg font-normal border-b-2 transition ${
              activeTab === "projects"
                ? "border-maroon-700 text-maroon-800 font-medium"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Projects ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("collaborations")}
            className={`shrink-0 pb-3 text-base sm:text-lg font-normal border-b-2 transition ${
              activeTab === "collaborations"
                ? "border-maroon-700 text-maroon-800 font-medium"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Collaborations ({devProfile?.collaborationsCount || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("portfolio")}
            className={`pb-3 text-base sm:text-lg font-normal border-b-2 transition ${
              activeTab === "portfolio"
                ? "border-maroon-700 text-maroon-800 font-medium"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Portfolio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`pb-3 text-base sm:text-lg font-normal border-b-2 transition ${
              activeTab === "activity"
                ? "border-maroon-700 text-maroon-800 font-medium"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Recent Activity ({activities.length})
          </button>
        </div>

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <section>
            {loading && (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-stone-500">
                <Loader2 className="w-8 h-8 text-maroon-700 animate-spin" />
                <p className="text-sm">Loading projects…</p>
              </div>
            )}

            {!loading && projects.length === 0 && (
              <div className="rounded-3xl border border-dashed border-stone-200 bg-white/80 px-8 py-20 text-center shadow-sm">
                <p className="text-stone-600 mb-6 max-w-md mx-auto text-sm">
                  {isOwnProfile
                    ? "You haven't uploaded any projects yet. Showcase your stack by adding a project!"
                    : "No projects are visible to you. Private work stays hidden, and a connections-only profile hides its public projects too."}
                </p>
                {isOwnProfile && (
                  <Link
                    to="/add-project"
                    className="inline-flex px-6 py-2.5 rounded-xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust text-white text-xs font-semibold hover:shadow-lg transition"
                  >
                    Add your first project
                  </Link>
                )}
                {isOwnProfile && (
                  <Link
                    to="/import/github"
                    className="mx-auto mt-4 flex w-fit items-center gap-1.5 text-xs font-semibold text-forest-700 hover:underline"
                  >
                    <Github className="w-3.5 h-3.5" /> or import them from GitHub
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
                          className="font-semibold text-maroon-700 hover:text-maroon-800"
                        >
                          Edit project
                        </Link>
                        <span className="text-stone-300">·</span>
                        <Link
                          to={`/project/${project.id}`}
                          className="font-medium text-stone-600 hover:text-stone-900"
                        >
                          View details
                        </Link>
                        <span className="text-stone-300">·</span>
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

        {activeTab === "collaborations" && devProfile && (
          <ProfileTeams userId={devProfile.userId || devProfile.id} own={isOwnProfile} />
        )}

        {activeTab === "portfolio" && devProfile && (
          <div>
            <div className="mb-4 flex gap-2">
              <button type="button" onClick={() => setGraphic(false)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${graphic ? "border border-stone-200 bg-white text-stone-600" : "bg-maroon-800 text-amber-50"}`}>
                Write-up
              </button>
              <button type="button" onClick={() => setGraphic(true)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${graphic ? "bg-maroon-800 text-amber-50" : "border border-stone-200 bg-white text-stone-600"}`}>
                Graphic
              </button>
            </div>
            {graphic ? (
              <CandidateStanding userId={devProfile.userId || devProfile.id} />
            ) : (
              <ProfilePortfolio profile={devProfile} projects={projects} raw={rawProjects} own={isOwnProfile} onUpdated={setDevProfile} />
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <section className="space-y-4">
            {activities.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-stone-200 bg-white/80 px-8 py-16 text-center text-stone-500 text-sm">
                No recent activity recorded for this developer.
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-5 rounded-2xl border border-stone-200/80 bg-white shadow-sm flex items-start justify-between gap-4"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-maroon-700 uppercase tracking-wider block mb-1">
                      {act.activityType.replace(/_/g, " ")}
                    </span>
                    {act.title && (
                      <h4 className="font-bold text-stone-900 text-sm mb-1">
                        {act.title}
                      </h4>
                    )}
                    {act.content && (
                      <p className="text-xs text-stone-600 line-clamp-2">
                        {act.content}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-400 shrink-0">
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
        </>}
      </main>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-normal text-stone-900">Edit profile</h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                  <option value="">Choose a role</option>
                  {PROFILE_ROLES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              {editRole === "Recruiter" && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Company or agency
                  </label>
                  <input
                    type="text"
                    required
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    placeholder="Where you recruit from"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Backend Lead | Distributed Systems"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, FastAPI, PostgreSQL, Docker, TypeScript"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="text"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="text"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-maroon-800 text-white text-xs font-semibold hover:bg-maroon-900 transition disabled:opacity-50"
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
          <div className="w-full max-w-md rounded-2xl bg-white border border-stone-200 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Delete project?</h3>
            <p className="text-sm text-stone-600 mb-4">
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
                className="px-4 py-2 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50"
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
