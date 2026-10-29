import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Activity, ArrowLeft, BadgeCheck, Briefcase, CalendarDays, Code2, ExternalLink, FileText, GitBranch, Globe, Heart, Linkedin, Loader2, Lock, MapPin, Send, ShieldCheck, Users } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { MemberAvatar } from "../components/MemberAvatar";
import { Select } from "../components/ui/Select";
import { CandidateStanding } from "../components/CandidateStanding";
import { ShortlistPicker } from "../components/recruiting/ShortlistPicker";
import { InviteToChallenge } from "../components/recruiting/InviteToChallenge";
import { SharedAssessments } from "../components/evidence/SharedAssessments";
import { SkillMatrix } from "../components/evidence/SkillMatrix";
import { mapProfile } from "../api/profiles";
import {
  ENTRY_STATUSES, WORK_TYPES, fetchCandidate, sendRecruitmentRequest, updateEntry, type CandidateView, type EntryStatus,
} from "../api/recruiting";
import { ui } from "../styles/editorial";

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function MembershipRow({ row, candidateId }: { row: CandidateView["shortlists"][number]; candidateId: string }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState(row.note ?? "");
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: (change: { status?: EntryStatus; note?: string | null }) => updateEntry(row.shortlist_id, row.entry_id, change),
    onSuccess: () => {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
      void queryClient.invalidateQueries({ queryKey: ["candidate", candidateId] });
      void queryClient.invalidateQueries({ queryKey: ["recruiting-dashboard"] });
    },
  });
  return (
    <li className="rounded-xl border border-stone-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <Link to={`/recruit/shortlists/${row.shortlist_id}`} className="truncate text-sm font-semibold text-stone-900 hover:text-maroon-800">
          {row.shortlist_name}
        </Link>
        <Select
          value={row.status} aria-label={`Status in ${row.shortlist_name}`}
          onChange={(v) => save.mutate({ status: v as EntryStatus })}
          options={ENTRY_STATUSES}
          className="w-36 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs"
        />
      </div>
      <label className="mt-2 block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        Private note
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000}
          onBlur={() => note !== (row.note ?? "") && save.mutate({ note })}
          className={`${ui.input} mt-1 normal-case tracking-normal`} placeholder="Only you can see this" />
      </label>
      <p className="mt-1 h-4 text-[11px] text-forest-700" aria-live="polite">{saved ? "Saved" : save.isError ? "Could not save" : ""}</p>
    </li>
  );
}

function ContactPanel({ view, candidateId }: { view: CandidateView; candidateId: string }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState("");
  const [workType, setWorkType] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const send = useMutation({
    mutationFn: () => sendRecruitmentRequest({ candidate_id: candidateId, role_title: role.trim(), work_type: workType || undefined, message: message.trim() }),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["candidate", candidateId] });
      void queryClient.invalidateQueries({ queryKey: ["recruiting-dashboard"] });
    },
    onError: (err) => {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detail === "string" ? detail : "The request could not be sent");
    },
  });
  const { contact } = view;

  if (!contact.allowed) {
    return (
      <div className="rounded-xl bg-[#FAF7EE] p-3 text-sm text-stone-700">
        <p>{contact.reason}</p>
        {contact.accepted && (
          <Link to={`/messages?user=${candidateId}`} className={`${ui.btn} ${ui.primary} mt-3`}><Send className="h-3.5 w-3.5" /> Open conversation</Link>
        )}
        {contact.pending_request_id && <Link to="/recruit/inbox" className={`${ui.link} mt-2 inline-block`}>See it in your inbox</Link>}
      </div>
    );
  }
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
      <label className="block text-xs font-semibold text-stone-600">
        Role
        <input value={role} onChange={(e) => setRole(e.target.value)} required minLength={2} maxLength={120}
          placeholder="Junior frontend developer" className={`${ui.input} mt-1`} />
      </label>
      <label className="block text-xs font-semibold text-stone-600">
        Work type
        <Select
          aria-label="Work type" value={workType} onChange={setWorkType}
          options={[["", "Not specified"], ...WORK_TYPES.map((t) => [t, t] as const)]}
          className={`${ui.input} mt-1 font-normal`}
        />
      </label>
      <label className="block text-xs font-semibold text-stone-600">
        Message
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={20} maxLength={1500} rows={4}
          placeholder="What the role is, and what in their work caught your eye." className={`${ui.input} mt-1`} />
        <span className="mt-1 block text-[11px] font-normal text-stone-400">{message.trim().length}/1500 · at least 20 characters</span>
      </label>
      {error && <p className={ui.error}>{error}</p>}
      <button type="submit" disabled={send.isPending || role.trim().length < 2 || message.trim().length < 20}
        className={`${ui.btn} ${ui.primary} w-full py-2`}>
        {send.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send contact request
      </button>
      <p className="text-[11px] leading-relaxed text-stone-500">They can accept or decline. Accepting opens Messages between you. Requests are limited per day.</p>
    </form>
  );
}

/** A recruiter's evaluation view: only evidence this candidate has made visible to the viewer. */
export function CandidatePage() {
  const { id = "" } = useParams();
  const query = useQuery({ queryKey: ["candidate", id], queryFn: () => fetchCandidate(id), enabled: Boolean(id) });

  if (query.isLoading) {
    return (
      <div className={ui.page}><Navbar />
        <div className="flex justify-center pt-40"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
      </div>
    );
  }
  if (query.error || !query.data) {
    return (
      <div className={ui.page}><Navbar />
        <main className={`${ui.main} max-w-3xl`}>
          <p className={ui.empty}>This candidate could not be found. <Link to="/recruit/talent" className={ui.link}>Back to Find talent</Link></p>
        </main>
      </div>
    );
  }

  const view = query.data;
  const p = mapProfile(view.profile);
  const name = p.fullName || p.username;
  const links = [
    p.githubUrl && { href: p.githubUrl, label: "GitHub", icon: GitBranch },
    p.linkedinUrl && { href: p.linkedinUrl, label: "LinkedIn", icon: Linkedin },
    p.websiteUrl && { href: p.websiteUrl, label: "Website", icon: Globe },
    p.resumeUrl && { href: p.resumeUrl, label: "Resume", icon: FileText },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Globe }[];
  const withSource = view.projects.filter((proj) => proj.has_source).length;

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-6xl`}>
        <Link to="/recruit/talent" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-maroon-800">
          <ArrowLeft className="h-4 w-4" /> Find talent
        </Link>

        <header className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <MemberAvatar name={name} src={p.avatarUrl} size="lg" className="rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-3xl text-stone-900 sm:text-4xl">{name}</h1>
                {p.openToWork && <span className="rounded-full bg-[#fced96] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-stone-800">Open to work</span>}
              </div>
              <p className="text-sm text-stone-500">@{p.username}{p.role ? ` · ${p.role}` : ""}</p>
              {p.headline && <p className="mt-2 text-sm text-stone-700">{p.headline}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                {p.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.location}</span>}
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.connectionsVisible ? `${p.connectionsCount} connections` : "Connections hidden"}</span>
              </div>
              {p.openToWork && (p.workTypes?.length || p.workArrangements?.length || p.availabilityNote) ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                  <Briefcase className="h-3.5 w-3.5 text-maroon-800" />
                  {[...(p.workTypes ?? []), ...(p.workArrangements ?? [])].map((t) => (
                    <span key={t} className="rounded-full border border-stone-200 px-2 py-0.5 text-stone-700">{t}</span>
                  ))}
                  {p.availabilityNote && <span className="text-stone-600">· {p.availabilityNote}</span>}
                </div>
              ) : null}
              {links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {links.map(({ href, label, icon: Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" className={`${ui.btn} ${ui.neutral}`}>
                      <Icon className="h-3.5 w-3.5" /> {label} <ExternalLink className="h-3 w-3 text-stone-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 self-start">
              <Link to={`/profile/${p.userId}/activity`} className={`${ui.btn} ${ui.primary}`}><Activity className="h-3.5 w-3.5" /> Activity log</Link>
              <Link to={`/profile/${p.userId}`} className={`${ui.btn} ${ui.neutral}`}>Full profile</Link>
            </div>
          </div>
          {p.bio && <p className="mt-4 whitespace-pre-line border-t border-stone-100 pt-4 text-sm leading-relaxed text-stone-700">{p.bio}</p>}
          {p.restricted && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-stone-100 p-3 text-xs text-stone-600">
              <Lock className="h-4 w-4" /> This person shares their profile and projects with connections only, so most evidence is hidden.
            </p>
          )}
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            <section aria-label="Evidence summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [view.projects.length, "Visible projects"],
                [withSource, "With source code"],
                [view.standing.commits || (view.standing.contributions.length ? 0 : "—"), view.standing.contributions.length ? "GitHub commits" : "GitHub not imported"],
                [view.collaborations.length, "Teams joined"],
              ].map(([value, label]) => (
                <div key={String(label)} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="font-serif text-2xl tabular-nums text-stone-900">{value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
                </div>
              ))}
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="projects-title">
              <h2 id="projects-title" className="font-serif text-2xl text-stone-900">Projects and source evidence</h2>
              {view.projects.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">No projects are visible to you.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {view.projects.slice(0, 8).map((proj) => (
                    <li key={proj.id} className="rounded-2xl border border-stone-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <Link to={`/project/${proj.id}`} className="font-semibold text-stone-900 hover:text-maroon-800">{proj.title}</Link>
                        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                          {proj.has_source && <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[#14532D]"><Code2 className="h-3 w-3" /> Source code</span>}
                          {proj.commits != null && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-900"><GitBranch className="h-3 w-3" /> {proj.commits} repo commits</span>}
                          {proj.likes_count > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-stone-600"><Heart className="h-3 w-3" /> {proj.likes_count}</span>}
                        </div>
                      </div>
                      {proj.short_description && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{proj.short_description}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {proj.tech_stacks.map((t) => <span key={t} className="rounded-full border border-stone-200 px-2 py-0.5 text-[11px] text-stone-600">{t}</span>)}
                        {proj.languages.slice(0, 3).map((l) => (
                          <span key={l.name} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">{l.name} {Math.round(l.percentage)}%</span>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-stone-400">
                        {[proj.category, proj.complexity, proj.updated_at && `Updated ${when(proj.updated_at)}`].filter(Boolean).join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {!p.restricted && <SkillMatrix userId={p.userId} />}
            <SharedAssessments userId={p.userId} />

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="collab-title">
              <h2 id="collab-title" className="font-serif text-2xl text-stone-900">Collaboration history</h2>
              {view.collaborations.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">No visible team memberships.</p>
              ) : (
                <ul className="mt-3 divide-y divide-stone-100">
                  {view.collaborations.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <div className="min-w-0">
                        <Link to={`/project/${c.id}`} className="font-semibold text-stone-900 hover:text-maroon-800">{c.title}</Link>
                        <p className="text-xs text-stone-500">{c.contribution_info || "Collaborator"}{c.owner_username ? ` on @${c.owner_username}'s team` : ""}</p>
                      </div>
                      {c.joined_at && <span className="text-xs text-stone-400">Joined {when(c.joined_at)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="wraps-title">
              <h2 id="wraps-title" className="font-serif text-2xl text-stone-900">Published Monthly Wraps</h2>
              {view.wraps.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">No published wraps. Wraps appear here only when the person shares them.</p>
              ) : (
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {view.wraps.map((w) => (
                    <li key={w.month} className="rounded-2xl bg-maroon-900 p-4 text-amber-50">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#fced96]"><CalendarDays className="h-3.5 w-3.5" /> {monthLabel(w.month)}</p>
                      {w.persona && <p className="mt-1 font-serif text-xl">{w.persona}</p>}
                      {w.summary && <p className="mt-1 text-sm text-amber-50/80">{w.summary}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <CandidateStanding userId={p.userId} />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="lists-title">
              <div className="flex items-center justify-between gap-2">
                <h2 id="lists-title" className="font-serif text-xl text-stone-900">Your shortlists</h2>
                <ShortlistPicker candidateId={p.userId} />
              </div>
              {view.shortlists.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">Not on any of your lists yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {view.shortlists.map((row) => <MembershipRow key={row.entry_id} row={row} candidateId={id} />)}
                </ul>
              )}
            </section>
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="contact-title">
              <h2 id="contact-title" className="font-serif text-xl text-stone-900">Contact</h2>
              <div className="mt-3"><ContactPanel view={view} candidateId={p.userId} /></div>
            </section>
            {!p.restricted && (
              <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="challenge-title">
                <h2 id="challenge-title" className="font-serif text-xl text-stone-900">Technical challenge</h2>
                <div className="mt-3"><InviteToChallenge developerId={p.userId} /></div>
              </section>
            )}
            <p className="flex items-start gap-2 text-xs leading-relaxed text-stone-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
              You see only what {name} has made visible to you. Private projects, unpublished wraps and hidden counts never appear.
            </p>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-stone-500">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
              Commits are credited per person from imported repositories, so a team project only counts their own work.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
