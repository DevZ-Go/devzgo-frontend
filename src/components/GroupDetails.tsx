import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Check, Loader2, LogOut, Pencil, ShieldCheck, UserMinus, UserPlus, X } from "lucide-react";
import {
  addGroupMembers,
  fetchGroupDetails,
  leaveGroup,
  removeGroupMember,
  renameGroup,
  setGroupPhoto,
  type ChatRoomDetails,
} from "../api/messages";
import type { ConnectionUserSummary } from "../types/network";
import { getApiErrorMessage } from "../utils/apiError";
import { MemberAvatar } from "./MemberAvatar";
import { PhotoCropper } from "./PhotoCropper";

const since = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso)) : null;

/** Who is in a group, who runs it, and the admin's controls: photo, name, members. Anyone can leave a custom group. */
export function GroupDetails({ roomId, meId, connections, onClose, onChanged, onLeft }: {
  roomId: string;
  meId?: string;
  connections: ConnectionUserSummary[];
  onClose: () => void;
  onChanged: (details: ChatRoomDetails) => void;
  onLeft: () => void;
}) {
  const [details, setDetails] = useState<ChatRoomDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchGroupDetails(roomId)
      .then((d) => { if (!cancelled) setDetails(d); })
      .catch((err) => { if (!cancelled) setError(getApiErrorMessage(err)); });
    return () => { cancelled = true; };
  }, [roomId]);

  async function act(work: () => Promise<ChatRoomDetails>) {
    setBusy(true);
    setError(null);
    try {
      const next = await work();
      setDetails(next);
      onChanged(next);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setBusy(true);
    setError(null);
    try {
      await leaveGroup(roomId);
      onLeft();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setBusy(false);
    }
  }

  const custom = details ? !details.project_id : false;
  const memberIds = new Set(details?.members.map((m) => m.user_id));
  const addable = connections.filter((c) => !memberIds.has(c.id));

  return (
    <aside className="fixed inset-0 z-[60] flex flex-col bg-white md:absolute md:left-auto md:z-20 md:w-[360px] md:border-l md:border-stone-200 md:shadow-xl" aria-label="Group details">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <h3 className="font-serif text-lg text-stone-900">Group details</h3>
        <button type="button" onClick={onClose} aria-label="Close group details" className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      {!details ? (
        <div className="flex flex-1 items-center justify-center">
          {error ? <p className="px-6 text-center text-sm text-rose-700">{error}</p> : <Loader2 className="h-6 w-6 animate-spin text-stone-400" />}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center gap-3 border-b border-stone-100 px-5 py-6 text-center">
            <div className="relative">
              <MemberAvatar name={details.title} src={details.avatar_url} size="lg" className="!h-24 !w-24 text-2xl" />
              {details.is_admin && (
                <label className="absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-maroon-800 text-white shadow ring-2 ring-white hover:bg-maroon-900" title="Change group photo">
                  <Camera className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Change group photo</span>
                  <input
                    type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only"
                    onChange={(e) => { setPhoto(e.target.files?.[0] ?? null); e.target.value = ""; }}
                  />
                </label>
              )}
            </div>

            {editingName ? (
              <form
                className="flex w-full items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(() => renameGroup(roomId, name.trim())).then(() => setEditingName(false));
                }}
              >
                <input
                  value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required autoFocus aria-label="Group name"
                  className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button type="submit" disabled={busy || !name.trim()} aria-label="Save name" className="rounded-xl bg-maroon-800 p-2 text-white disabled:opacity-50">
                  <Check className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setEditingName(false)} aria-label="Cancel" className="rounded-xl p-2 text-stone-500 hover:bg-stone-100">
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <h4 className="break-words font-serif text-2xl text-stone-900">{details.title}</h4>
                {details.is_admin && custom && (
                  <button type="button" onClick={() => { setName(details.title); setEditingName(true); }} aria-label="Rename group" className="rounded-full p-1 text-stone-400 hover:text-maroon-800">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-stone-500">
              {details.project_id ? (
                <>Project team for <Link to={`/project/${details.project_id}`} className="font-semibold text-maroon-800 hover:underline">{details.project_title || "this project"}</Link></>
              ) : (
                <>Group{since(details.created_at) ? ` · started ${since(details.created_at)}` : ""}</>
              )}
              {` · ${details.members.length} ${details.members.length === 1 ? "member" : "members"}`}
            </p>
          </div>

          <section className="px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Members</h4>
              {details.is_admin && custom && addable.length > 0 && (
                <button type="button" onClick={() => setAdding((open) => !open)} className="inline-flex items-center gap-1 rounded-full bg-[#fced96] px-2.5 py-1 text-[11px] font-semibold text-stone-900">
                  <UserPlus className="h-3.5 w-3.5" /> Add people
                </button>
              )}
            </div>

            {adding && (
              <div className="mb-3 space-y-2 rounded-2xl border border-stone-200 bg-[#faf7ee] p-3">
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {addable.map((person) => (
                    <label key={person.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox" checked={picked.includes(person.id)}
                        onChange={(e) => setPicked((ids) => (e.target.checked ? [...ids, person.id] : ids.filter((id) => id !== person.id)))}
                      />
                      <MemberAvatar name={person.username} src={person.avatarUrl} size="xs" />
                      <span className="min-w-0 truncate">{person.fullName || person.username}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button" disabled={busy || picked.length === 0}
                  onClick={() => void act(() => addGroupMembers(roomId, picked)).then(() => { setPicked([]); setAdding(false); })}
                  className="w-full rounded-lg bg-maroon-800 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {picked.length ? `Add ${picked.length} to group` : "Pick people to add"}
                </button>
              </div>
            )}

            <ul className="space-y-1">
              {details.members.map((member) => {
                const isMe = member.user_id === meId;
                return (
                  <li key={member.user_id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-stone-50">
                    <MemberAvatar name={member.username} src={member.avatar_url} size="sm" />
                    <Link to={`/profile/${member.user_id}`} className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-stone-900">
                        {member.full_name || member.username}{isMe ? " (you)" : ""}
                      </span>
                      <span className="block truncate text-xs text-stone-500">
                        @{member.username}{member.team_role ? ` · ${member.team_role}` : ""}
                      </span>
                    </Link>
                    {member.is_admin && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-maroon-800 px-2 py-0.5 text-[10px] font-semibold text-[#fced96]">
                        <ShieldCheck className="h-3 w-3" aria-hidden /> Admin
                      </span>
                    )}
                    {details.is_admin && custom && !isMe && !member.is_admin && (
                      <button
                        type="button" disabled={busy} aria-label={`Remove ${member.username}`} title="Remove from group"
                        onClick={() => void act(() => removeGroupMember(roomId, member.user_id))}
                        className="shrink-0 rounded-full p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="border-t border-stone-100 px-4 py-4">
            {error && <p role="alert" className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
            {custom ? (
              confirmLeave ? (
                <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <p>Leave {details.title}? You will stop getting its messages.</p>
                  <div className="flex gap-2">
                    <button type="button" disabled={busy} onClick={() => void leave()} className="flex-1 rounded-lg bg-rose-700 py-2 text-xs font-semibold text-white disabled:opacity-50">
                      Leave group
                    </button>
                    <button type="button" onClick={() => setConfirmLeave(false)} className="flex-1 rounded-lg bg-white py-2 text-xs font-semibold text-stone-700">
                      Stay
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmLeave(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                  <LogOut className="h-4 w-4" /> Leave group
                </button>
              )
            ) : (
              <p className="text-xs text-stone-500">
                This chat follows the project team. To leave it, leave the project from its{" "}
                <Link to={`/project/${details.project_id}`} className="font-semibold text-maroon-800 hover:underline">project page</Link>.
              </p>
            )}
          </section>
        </div>
      )}

      {photo && (
        <PhotoCropper
          file={photo}
          title="Crop group photo"
          onCancel={() => setPhoto(null)}
          onDone={async (cropped) => {
            setPhoto(null);
            await act(() => setGroupPhoto(roomId, cropped));
          }}
        />
      )}
    </aside>
  );
}
