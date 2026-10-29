import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Ban, BellOff, EyeOff, Loader2, Users } from "lucide-react";
import {
  clearPersonSafety,
  fetchSafety,
  setGroupMuted,
  setPersonMuted,
  setPersonSafetyByUsername,
  type SafetyOverview,
} from "../../api/safety";
import { announceUnreadChange } from "../../api/messages";
import type { ConnectionUserSummary, SafetyRelation } from "../../types/network";
import { ui } from "../../styles/editorial";
import { getApiErrorMessage } from "../../utils/apiError";
import { MemberAvatar } from "../MemberAvatar";
import { Select } from "../ui/Select";

const since = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));

function PersonRow({ person, note, action, onAction, busy }: {
  person: ConnectionUserSummary;
  note: string;
  action: string;
  onAction: () => void;
  busy: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2.5">
      <MemberAvatar name={person.fullName || person.username} src={person.avatarUrl} size="sm" />
      <Link to={`/profile/${person.id}`} className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-stone-900">{person.fullName || person.username}</span>
        <span className="block truncate text-xs text-stone-500">@{person.username} · {note}</span>
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={onAction}
        className="shrink-0 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-maroon-800 transition hover:bg-amber-50 disabled:opacity-50"
      >
        {action}
      </button>
    </li>
  );
}

function Group({ icon, title, hint, empty, children }: {
  icon: ReactNode;
  title: string;
  hint: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-serif text-xl text-stone-900">{title}</h3>
      </div>
      <p className="text-xs text-stone-500">{hint}</p>
      {empty ? (
        <p className="rounded-2xl border border-dashed border-stone-200 bg-[#f8f6f0] px-4 py-3 text-sm text-stone-500">No one here.</p>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  );
}

/** Settings → Blocked & muted: everyone you've blocked, restricted, or muted, with undo, plus add by username. */
export function SafetySettings() {
  const [data, setData] = useState<SafetyOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState("");
  const [kind, setKind] = useState<SafetyRelation>("block");

  const load = useCallback(async () => {
    try {
      setData(await fetchSafety());
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(work: () => Promise<unknown>, done: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await work();
      await load();
      announceUnreadChange();
      setNotice(done);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function add(e: FormEvent) {
    e.preventDefault();
    const handle = username.trim().replace(/^@/, "");
    if (!handle) return;
    void run(async () => {
      await setPersonSafetyByUsername(handle, kind);
      setUsername("");
    }, `@${handle} is now ${kind === "block" ? "blocked" : "restricted"}.`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-stone-900">Blocked & muted</h2>
        <p className="mt-1 text-sm text-stone-500">
          Nobody is told when you block, restrict or mute them. You can also do this from the ⋯ menu in any chat.
        </p>
      </div>

      <form onSubmit={add} className="space-y-3 rounded-2xl border border-stone-200 bg-[#f8f6f0] p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Add someone</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            aria-label="Username"
            className={`${ui.input} py-2.5 sm:flex-1`}
          />
          <Select
            aria-label="What to do"
            value={kind}
            onChange={(value) => setKind(value === "restrict" ? "restrict" : "block")}
            options={[["block", "Block"], ["restrict", "Restrict"]]}
            className={`${ui.input} py-2.5 sm:w-40`}
          />
          <button type="submit" disabled={busy || !username.trim()} className={`${ui.btn} ${ui.primary} rounded-xl px-5 py-2.5 text-sm`}>
            {busy ? "Saving…" : "Add"}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-forest-700">{notice}</p>}

      {!data ? (
        <div className="flex justify-center py-8">
          {!error && <Loader2 className="h-6 w-6 animate-spin text-stone-400" />}
        </div>
      ) : (
        <>
          <Group
            icon={<Ban className="h-4 w-4 text-rose-700" />}
            title="Blocked"
            hint="Neither of you can message the other or send a connection request, and you can't be added to the same new group."
            empty={data.blocked.length === 0}
          >
            {data.blocked.map((row) => (
              <PersonRow
                key={row.user.id} person={row.user} note={`since ${since(row.since)}`} action="Unblock" busy={busy}
                onAction={() => void run(() => clearPersonSafety(row.user.id), `Unblocked @${row.user.username}.`)}
              />
            ))}
          </Group>

          <Group
            icon={<EyeOff className="h-4 w-4 text-stone-600" />}
            title="Restricted"
            hint="They can still message you, but you aren't notified and they can't see when you've read their messages."
            empty={data.restricted.length === 0}
          >
            {data.restricted.map((row) => (
              <PersonRow
                key={row.user.id} person={row.user} note={`since ${since(row.since)}`} action="Unrestrict" busy={busy}
                onAction={() => void run(() => clearPersonSafety(row.user.id), `Unrestricted @${row.user.username}.`)}
              />
            ))}
          </Group>

          <Group
            icon={<BellOff className="h-4 w-4 text-stone-600" />}
            title="Muted chats"
            hint="Messages still arrive, but they don't notify you or add to your unread count."
            empty={data.muted.length === 0}
          >
            {data.muted.map((row) =>
              row.user ? (
                <PersonRow
                  key={`u-${row.user.id}`} person={row.user} note="direct messages" action="Unmute" busy={busy}
                  onAction={() => void run(() => setPersonMuted(row.user!.id, false), `Unmuted @${row.user!.username}.`)}
                />
              ) : (
                <li key={`r-${row.roomId}`} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-stone-900">{row.roomTitle || "Group"}</span>
                    <span className="block text-xs text-stone-500">group · since {since(row.since)}</span>
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void run(() => setGroupMuted(row.roomId!, false), `Unmuted ${row.roomTitle || "the group"}.`)}
                    className="shrink-0 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-maroon-800 transition hover:bg-amber-50 disabled:opacity-50"
                  >
                    Unmute
                  </button>
                </li>
              ),
            )}
          </Group>
        </>
      )}
    </div>
  );
}
