import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { changePassword, changeUsername } from "../api/auth";
import { Link } from "react-router-dom";
import { fetchMyProfile, MEMBER_ROLES, updateMyProfile, uploadAvatar } from "../api/profiles";
import { WORK_ARRANGEMENTS, WORK_TYPES } from "../api/recruiting";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../auth/account";
import { Navbar } from "../components/Navbar";
import { PasswordField } from "../components/PasswordField";
import { PasswordInput } from "../components/PasswordInput";
import { PhotoCropper } from "../components/PhotoCropper";
import { GitHubEditing } from "../components/settings/GitHubEditing";
import { ThemeToggle } from "../components/ThemeToggle";
import { UsernameField } from "../components/UsernameField";
import { getApiErrorMessage } from "../utils/apiError";
import { passwordValid } from "../utils/passwordPolicy";
import { ui } from "../styles/editorial";

const inputClass = `${ui.input} py-3`;
const ZONES = ["America/Toronto", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Vancouver", "Europe/London", "UTC"];
const SECTIONS = [
  ["account", "Account"],
  ["profile", "Profile"],
  ["availability", "Availability"],
  ["privacy", "Privacy"],
  ["notifications", "Notifications"],
  ["github", "GitHub"],
  ["appearance", "Appearance"],
] as const;
type Section = (typeof SECTIONS)[number][0];
const AUDIENCE = [
  ["public", "Anyone"],
  ["connections", "Accepted connections"],
  ["private", "Only you"],
] as const;
const REACH = [
  ["anyone", "Anyone"],
  ["connections", "Accepted connections"],
] as const;

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-1 normal-case tracking-normal`}>
        {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
  );
}

function SwitchRow({ label, hint, checked, onChange }: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-[#f8f6f0] px-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        {hint && <span className="mt-0.5 block text-xs font-normal normal-case tracking-normal text-stone-500">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 shrink-0 accent-maroon-800" />
    </label>
  );
}

function Save({ busy, disabled, children }: { busy: boolean; disabled?: boolean; children: string }) {
  return (
    <button type="submit" disabled={busy || disabled} className={`${ui.btn} ${ui.primary} rounded-xl px-5 py-2.5 text-sm`}>
      {busy ? "Saving…" : children}
    </button>
  );
}

export function SettingsPage() {
  const { user, login, refreshUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const { recruiter } = useAccount();
  const sections = SECTIONS.filter(([id]) => !(recruiter && id === "availability"));
  const requested = params.get("section");
  const section: Section = sections.some(([id]) => id === requested) ? requested as Section : "account";
  const hasPassword = user?.has_password !== false;
  const [ready, setReady] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [timezone, setTimezone] = useState("America/Toronto");
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [messagePolicy, setMessagePolicy] = useState("anyone");
  const [commentPolicy, setCommentPolicy] = useState("anyone");
  const [activityVisibility, setActivityVisibility] = useState("public");
  const [connectionVisibility, setConnectionVisibility] = useState("public");
  const [collaborationPolicy, setCollaborationPolicy] = useState("anyone");
  const [emailVisibility, setEmailVisibility] = useState("private");
  const [resumeVisibility, setResumeVisibility] = useState("connections");
  const [discoverable, setDiscoverable] = useState(true);
  const [allowRequests, setAllowRequests] = useState(true);
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyShares, setNotifyShares] = useState(true);
  const [notifyConnections, setNotifyConnections] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyCollaborations, setNotifyCollaborations] = useState(true);
  const [notifyChallenges, setNotifyChallenges] = useState(false);
  const [startPage, setStartPage] = useState<"home" | "resume">("home");
  const [openToWork, setOpenToWork] = useState(false);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [workArrangements, setWorkArrangements] = useState<string[]>([]);
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [nameReady, setNameReady] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const onAvailable = useCallback((ok: boolean) => setNameReady(ok), []);

  useEffect(() => {
    let cancelled = false;
    fetchMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setFullName(profile.fullName || "");
        setRole(profile.role || "");
        setCompany(profile.company || "");
        setHeadline(profile.headline || "");
        setBio(profile.bio || "");
        setLocation(profile.location || "");
        setSkills(profile.skills || "");
        setGithubUrl(profile.githubUrl || "");
        setLinkedinUrl(profile.linkedinUrl || "");
        setWebsiteUrl(profile.websiteUrl || "");
        setTimezone(profile.timezone || "America/Toronto");
        setAvatarUrl(profile.avatarUrl || null);
        setProfileVisibility(profile.profileVisibility === "connections" ? "connections" : "public");
        setMessagePolicy(profile.messagePolicy === "connections" ? "connections" : "anyone");
        setCommentPolicy(profile.commentPolicy === "connections" ? "connections" : "anyone");
        setActivityVisibility(profile.activityVisibility === "connections" ? "connections" : "public");
        setConnectionVisibility(profile.connectionVisibility || "public");
        setCollaborationPolicy(profile.collaborationPolicy || "anyone");
        setEmailVisibility(profile.emailVisibility || "private");
        setResumeVisibility(profile.resumeVisibility || "connections");
        setDiscoverable(profile.discoverable !== false);
        setAllowRequests(profile.allowConnectionRequests !== false);
        setNotifyLikes(profile.notifyLikes !== false);
        setNotifyComments(profile.notifyComments !== false);
        setNotifyShares(profile.notifyShares !== false);
        setNotifyConnections(profile.notifyConnections !== false);
        setNotifyMessages(profile.notifyMessages !== false);
        setNotifyCollaborations(profile.notifyCollaborations !== false);
        setNotifyChallenges(profile.notifyChallenges === true);
        setStartPage(profile.startPage === "resume" ? "resume" : "home");
        setOpenToWork(profile.openToWork === true);
        setWorkTypes(profile.workTypes ?? []);
        setWorkArrangements(profile.workArrangements ?? []);
        setAvailabilityNote(profile.availabilityNote || "");
        setReady(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user?.username && !user.username_needs_choice) setUsername(user.username);
  }, [user?.username, user?.username_needs_choice]);

  function open(nextSection: Section) {
    setMessage(null);
    setParams(nextSection === "account" ? {} : { section: nextSection });
  }

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setMessage(null);
    try {
      await work();
    } catch (err) {
      setMessage({ text: getApiErrorMessage(err), ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const saved = await updateMyProfile({
        fullName, role: recruiter ? undefined : role, company: recruiter ? company : undefined,
        headline, bio, location, skills, githubUrl, linkedinUrl, websiteUrl, timezone,
      });
      setSkills(saved.skills || "");
      setAvatarUrl(saved.avatarUrl || null);
      setMessage({ text: "Profile saved.", ok: true });
    });
  }

  async function savePrivacy(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      await updateMyProfile({
        profileVisibility: profileVisibility as "public" | "connections",
        messagePolicy: messagePolicy as "anyone" | "connections",
        commentPolicy: commentPolicy as "anyone" | "connections",
        activityVisibility: activityVisibility as "public" | "connections",
        connectionVisibility: connectionVisibility as "public" | "connections" | "private",
        collaborationPolicy: collaborationPolicy as "anyone" | "connections" | "none",
        emailVisibility: emailVisibility as "public" | "connections" | "private",
        resumeVisibility: resumeVisibility as "public" | "connections" | "private",
        discoverable,
        allowConnectionRequests: allowRequests,
      });
      setMessage({ text: "Privacy saved.", ok: true });
    });
  }

  async function saveAvailability(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      await updateMyProfile({ openToWork, workTypes, workArrangements, availabilityNote });
      setMessage({ text: "Availability saved.", ok: true });
    });
  }

  const toggleIn = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  async function saveNotifications(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      await updateMyProfile({
        notifyLikes, notifyComments, notifyShares, notifyConnections, notifyMessages, notifyCollaborations, notifyChallenges,
      });
      setMessage({ text: "Notifications saved.", ok: true });
    });
  }

  async function savePhoto(file: File) {
    setPendingPhoto(null);
    await run(async () => {
      const saved = await uploadAvatar(file);
      setAvatarUrl(saved.avatarUrl || null);
      setMessage({ text: "Photo saved.", ok: true });
    });
  }

  async function saveUsername(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      await changeUsername(username);
      await refreshUser();
      setMessage({ text: "Username saved.", ok: true });
    });
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      login(await changePassword(next, hasPassword ? current : undefined));
      await refreshUser();
      setCurrent("");
      setNext("");
      setMessage({ text: "Password saved. Other devices have been signed out.", ok: true });
    });
  }

  const zones = timezone && !ZONES.includes(timezone) ? [timezone, ...ZONES] : ZONES;
  const sameName = username.trim().toLowerCase() === (user?.username || "").toLowerCase();
  let panel: ReactNode = null;

  if (section === "account") {
    panel = (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-maroon-800 font-serif text-xl text-amber-100">
              {(user?.username || "?").slice(0, 2).toUpperCase()}
            </span>
          )}
          <label className="cursor-pointer rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50">
            {avatarUrl ? "Change photo" : "Add a photo"}
            <input
              type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only"
              onChange={(e) => { setPendingPhoto(e.target.files?.[0] ?? null); e.target.value = ""; }}
            />
          </label>
          {pendingPhoto && (
            <PhotoCropper file={pendingPhoto} onCancel={() => setPendingPhoto(null)} onDone={savePhoto} />
          )}
        </div>
        <form onSubmit={saveUsername} className="space-y-3">
          <h2 className="font-serif text-2xl text-stone-900">Username</h2>
          <UsernameField value={username} onChange={setUsername} onAvailable={onAvailable} className={inputClass} />
          <Save busy={busy} disabled={!ready || sameName || !nameReady}>Save username</Save>
        </form>
        <div>
          <h2 className="font-serif text-2xl text-stone-900">Email</h2>
          <p className="mt-2 break-all font-mono text-sm text-stone-600">{user?.email}</p>
          <p className="mt-1 text-xs text-stone-500">This is the address you sign in with. Who else can see it is under Privacy.</p>
        </div>
        <form onSubmit={savePassword} className="space-y-3">
          <h2 className="font-serif text-2xl text-stone-900">{hasPassword ? "Password" : "Set a password"}</h2>
          {!hasPassword && <p className="text-sm text-stone-500">You sign in with GitHub. A password lets you sign in with email too.</p>}
          {hasPassword && (
            <PasswordInput required value={current} onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password" placeholder="Current password" aria-label="Current password" className={inputClass} />
          )}
          <PasswordField value={next} onChange={setNext} className={inputClass} />
          <Save busy={busy} disabled={!passwordValid(next)}>Save password</Save>
        </form>
        <form onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await updateMyProfile({ startPage });
            setMessage({ text: "Sign-in page saved.", ok: true });
          });
        }} className="space-y-3">
          <h2 className="font-serif text-2xl text-stone-900">After you sign in</h2>
          <SelectField label="Open" value={startPage} onChange={(value) => setStartPage(value === "resume" ? "resume" : "home")} options={[["home", recruiter ? "Recruiter home" : "Home"], ["resume", "The last page you had open"]]} />
          <Save busy={busy} disabled={!ready}>Save</Save>
        </form>
      </div>
    );
  } else if (section === "profile") {
    panel = (
      <form onSubmit={saveProfile} className="space-y-4">
        <h2 className="font-serif text-2xl text-stone-900">Profile</h2>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
        {recruiter ? (
          <>
            <p className="rounded-2xl border border-stone-200 bg-[#f8f6f0] px-4 py-3 text-sm text-stone-700">
              <span className="font-semibold">Recruiter account.</span> The account type is set when you sign up and does not change here.
            </p>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Company or agency
              <input required value={company} onChange={(e) => setCompany(e.target.value)} className={`${inputClass} mt-1`} placeholder="Where you recruit from" />
            </label>
          </>
        ) : (
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} mt-1 normal-case tracking-normal`} required>
              <option value="">Choose a role</option>
              {MEMBER_ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        )}
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Headline
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={`${inputClass} mt-1`} placeholder="What you work on" />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Bio
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Location
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Skills
          <input value={skills} onChange={(e) => setSkills(e.target.value)} className={`${inputClass} mt-1`} placeholder="React, Python, Figma" />
          <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-stone-500">Languages and tools from your projects are added here.</span>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          GitHub
          <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className={`${inputClass} mt-1`} placeholder="https://" />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          LinkedIn
          <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={`${inputClass} mt-1`} placeholder="https://" />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Website
          <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={`${inputClass} mt-1`} placeholder="https://" />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Time zone
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={`${inputClass} mt-1 normal-case tracking-normal`}>
            {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
        </label>
        <Save busy={busy} disabled={!ready || (recruiter ? company.trim().length < 2 : !role)}>Save profile</Save>
      </form>
    );
  } else if (section === "privacy") {
    panel = (
      <form onSubmit={savePrivacy} className="space-y-4">
        <h2 className="font-serif text-2xl text-stone-900">Privacy</h2>
        <SelectField label="Who can see your profile and projects" value={profileVisibility} onChange={setProfileVisibility} options={AUDIENCE.filter(([id]) => id !== "private")} />
        <SelectField label="Who can see your posts" value={activityVisibility} onChange={setActivityVisibility} options={AUDIENCE.filter(([id]) => id !== "private")} />
        <SelectField label="Who can see your connections" value={connectionVisibility} onChange={setConnectionVisibility} options={AUDIENCE} />
        <SelectField label="Who can see your email" value={emailVisibility} onChange={setEmailVisibility} options={AUDIENCE} />
        <SelectField label="Who can see your resume" value={resumeVisibility} onChange={setResumeVisibility} options={AUDIENCE} />
        <SelectField label="Who can message you" value={messagePolicy} onChange={setMessagePolicy} options={REACH} />
        <SelectField label="Who can comment" value={commentPolicy} onChange={setCommentPolicy} options={REACH} />
        <SelectField label="Who can invite you to a project" value={collaborationPolicy} onChange={setCollaborationPolicy} options={[...REACH, ["none", "No one"]]} />
        <SwitchRow label="Appear in search and suggestions" checked={discoverable} onChange={setDiscoverable} />
        <SwitchRow label="Accept connection requests" checked={allowRequests} onChange={setAllowRequests} />
        <Save busy={busy} disabled={!ready}>Save privacy</Save>
      </form>
    );
  } else if (section === "availability") {
    const chip = (on: boolean) =>
      `rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-maroon-700 bg-maroon-800 text-white" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"}`;
    panel = (
      <form onSubmit={saveAvailability} className="space-y-5">
        <div>
          <h2 className="font-serif text-2xl text-stone-900">Availability</h2>
          <p className="mt-1 text-sm text-stone-500">
            Off by default. Recruiters only see this when you turn it on and they can see your profile. It also lets recruiters send you a
            contact request even if you only take messages from connections; you can accept or decline each one.
          </p>
        </div>
        <SwitchRow label="Open to work" hint="Show recruiters that you are looking" checked={openToWork} onChange={setOpenToWork} />
        <fieldset disabled={!openToWork} className="space-y-4 disabled:opacity-50">
          <legend className="sr-only">What you are open to</legend>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Work types</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {WORK_TYPES.map((t) => (
                <button key={t} type="button" aria-pressed={workTypes.includes(t)} onClick={() => setWorkTypes((v) => toggleIn(v, t))} className={chip(workTypes.includes(t))}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Arrangements</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {WORK_ARRANGEMENTS.map((t) => (
                <button key={t} type="button" aria-pressed={workArrangements.includes(t)} onClick={() => setWorkArrangements((v) => toggleIn(v, t))} className={chip(workArrangements.includes(t))}>{t}</button>
              ))}
            </div>
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Note for recruiters
            <input value={availabilityNote} onChange={(e) => setAvailabilityNote(e.target.value)} maxLength={160}
              placeholder="e.g. Available from May 2027" className={`${inputClass} mt-1 normal-case tracking-normal`} />
          </label>
        </fieldset>
        <div className="flex flex-wrap items-center gap-4">
          <Save busy={busy} disabled={!ready}>Save availability</Save>
          <Link to="/opportunities" className={ui.link}>See recruiter requests</Link>
        </div>
      </form>
    );
  } else if (section === "notifications") {
    panel = (
      <form onSubmit={saveNotifications} className="space-y-3">
        <h2 className="font-serif text-2xl text-stone-900">Notifications</h2>
        <p className="text-sm text-stone-500">These control the bell. Turn one off and that kind of notice stops arriving.</p>
        <SwitchRow label="Likes and milestones" hint="Including when a post reaches 5, 10, or 25 likes" checked={notifyLikes} onChange={setNotifyLikes} />
        <SwitchRow label="Comments" checked={notifyComments} onChange={setNotifyComments} />
        <SwitchRow label="Shares" checked={notifyShares} onChange={setNotifyShares} />
        <SwitchRow label="Connections" hint="Requests and acceptances" checked={notifyConnections} onChange={setNotifyConnections} />
        <SwitchRow label="Messages" checked={notifyMessages} onChange={setNotifyMessages} />
        <SwitchRow label="Collaboration" hint="Invites, requests, and people joining or leaving" checked={notifyCollaborations} onChange={setNotifyCollaborations} />
        {!recruiter && <SwitchRow label="Technical challenges" hint="Off until you turn it on. You are notified when a recruiter posts a public challenge." checked={notifyChallenges} onChange={setNotifyChallenges} />}
        <Save busy={busy} disabled={!ready}>Save notifications</Save>
      </form>
    );
  } else if (section === "github") {
    panel = <GitHubEditing />;
  } else {
    panel = (
      <div>
        <h2 className="font-serif text-2xl text-stone-900">Appearance</h2>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-[#f8f6f0] px-4 py-3">
          <span className="text-sm font-semibold text-stone-800">Theme</span>
          <ThemeToggle variant="pill" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900">
      <Navbar />
      <div className={`${ui.main} max-w-5xl`}>
        <h1 className="font-serif text-4xl font-normal text-stone-900">Settings</h1>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Settings sections">
            {sections.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => open(id)}
                className={`shrink-0 rounded-full px-4 py-2 text-left text-sm font-semibold lg:rounded-xl ${
                  section === id ? "bg-maroon-800 text-amber-50" : "bg-white text-stone-700 hover:bg-stone-100"
                }`}
                aria-current={section === id ? "page" : undefined}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            {panel}
            {message && <p role="status" className={`mt-4 font-sans text-sm ${message.ok ? "text-forest-700" : "text-crimson-700"}`}>{message.text}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
