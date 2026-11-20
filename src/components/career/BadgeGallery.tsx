import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, MoreHorizontal, RefreshCw, X } from "lucide-react";
import {
  fetchMyBadges,
  fetchUserBadges,
  recalculateBadges,
  setBadgeVisibility,
  type Audience,
  type Badge,
} from "../../api/career";
import { ui } from "../../styles/editorial";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  BADGE_FAMILY_ORDER,
  badgeCardBlurb,
  familyLabel,
  groupBadgesByLadder,
  type BadgeLadderGroup,
} from "../../utils/badgeTiers";
import { BadgeArtwork } from "./BadgeArtwork";

function isShowcased(badge: Badge) {
  return badge.visibility === "public";
}

function formatEarned(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ShowcaseSwitch({
  checked,
  busy,
  onChange,
}: {
  checked: boolean;
  busy?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600">
      <input
        type="checkbox"
        className="h-3.5 w-3.5 accent-maroon-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-800"
        checked={checked}
        disabled={busy}
        onChange={(e) => onChange(e.target.checked)}
      />
      Show on portfolio
    </label>
  );
}

function OwnerMenu({ onRecalculate, busy }: { onRecalculate: () => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className={`${ui.btn} ${ui.neutral} px-2.5`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Badge options"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            onClick={() => {
              setOpen(false);
              onRecalculate();
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
            Recalculate badges
          </button>
        </div>
      )}
    </div>
  );
}

function BadgeDetailDialog({
  badge,
  editable,
  busy,
  error,
  onClose,
  onShowcase,
  onVisibility,
}: {
  badge: Badge;
  editable: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onShowcase: (on: boolean) => void;
  onVisibility: (v: Audience) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-detail-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <BadgeArtwork badge={badge} size={80} />
            <div>
              <h3 id="badge-detail-title" className="font-serif text-2xl text-stone-900">{badge.name}</h3>
              <p className="text-xs text-stone-500">{familyLabel(badge.family)}</p>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm text-stone-700">{badge.description}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">Requirements</dt>
            <dd className="mt-0.5 text-stone-700">{badge.criteria}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">Earned</dt>
            <dd className="mt-0.5 text-stone-700">{formatEarned(badge.awarded_at)}</dd>
          </div>
          {badge.provenance_label && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">Source</dt>
              <dd className="mt-0.5 text-stone-700">{badge.provenance_label}</dd>
            </div>
          )}
        </dl>
        {badge.limitations && (
          <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">{badge.limitations}</p>
        )}

        {editable && (
          <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
            <ShowcaseSwitch checked={isShowcased(badge)} busy={busy} onChange={onShowcase} />
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Visibility
              <select
                className={`${ui.input} mt-1 normal-case`}
                value={badge.visibility}
                disabled={busy}
                onChange={(e) => onVisibility(e.target.value as Audience)}
              >
                <option value="private">Private</option>
                <option value="connections">Connections</option>
                <option value="recruiters">Authorized recruiters</option>
                <option value="public">Public (portfolio)</option>
              </select>
            </label>
            {error && <p role="alert" className={ui.error}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function LadderCard({
  group,
  editable,
  busyId,
  onDetails,
  onShowcase,
}: {
  group: BadgeLadderGroup;
  editable: boolean;
  busyId: string | null;
  onDetails: (badge: Badge) => void;
  onShowcase: (badge: Badge, on: boolean) => void;
}) {
  const [openEarlier, setOpenEarlier] = useState(false);
  const badge = group.primary;
  const showcased = isShowcased(badge);
  const earlierShowcased = group.earlier.filter(isShowcased);

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm ${
        showcased ? "border-maroon-800/25" : "border-stone-200"
      }`}
    >
      <div className="flex flex-1 flex-col items-center text-center">
        <BadgeArtwork badge={badge} size={92} />
        <h3 className="mt-3 font-serif text-lg leading-snug text-stone-900">{badge.name}</h3>
        <p className="mt-1.5 text-sm text-stone-600 line-clamp-2">{badgeCardBlurb(badge)}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 border-t border-stone-100 pt-3">
        <button
          type="button"
          className={`${ui.btn} ${ui.neutral} w-full justify-center py-2 text-xs`}
          onClick={() => onDetails(badge)}
        >
          View details
        </button>
        {editable && (
          <div className="flex justify-center">
            <ShowcaseSwitch
              checked={showcased}
              busy={busyId === badge.id}
              onChange={(on) => onShowcase(badge, on)}
            />
          </div>
        )}
        {group.earlier.length > 0 && (
          <div>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-1 text-xs font-semibold text-maroon-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-800"
              aria-expanded={openEarlier}
              onClick={() => setOpenEarlier((v) => !v)}
            >
              {openEarlier ? "Hide earlier tiers" : "View earlier tiers"}
              <ChevronDown className={`h-3.5 w-3.5 transition ${openEarlier ? "rotate-180" : ""}`} />
              {earlierShowcased.length > 0 && !openEarlier && (
                <span className="ml-1 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
                  {earlierShowcased.length} on portfolio
                </span>
              )}
            </button>
            {openEarlier && (
              <ul className="mt-2 space-y-2 rounded-xl border border-stone-100 bg-[#FAF7EE]/60 p-2">
                {group.earlier.map((earlier) => (
                  <li key={earlier.id} className="flex items-center gap-2 rounded-lg bg-white px-2 py-2">
                    <BadgeArtwork badge={earlier} size={40} />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-xs font-semibold text-stone-900">{earlier.name}</p>
                      <p className="text-[10px] text-stone-500">Earned {formatEarned(earlier.awarded_at)}</p>
                      {editable && (
                        <ShowcaseSwitch
                          checked={isShowcased(earlier)}
                          busy={busyId === earlier.id}
                          onChange={(on) => onShowcase(earlier, on)}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-[11px] font-semibold text-maroon-800 hover:underline"
                      onClick={() => onDetails(earlier)}
                    >
                      Details
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function BadgeGallery({ userId, editable = false }: { userId?: string; editable?: boolean }) {
  const qc = useQueryClient();
  const badges = useQuery({
    queryKey: ["badges", userId || "me"],
    queryFn: () => (userId ? fetchUserBadges(userId) : fetchMyBadges()),
  });
  const [detail, setDetail] = useState<Badge | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useMutation({
    mutationFn: recalculateBadges,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["badges"] });
      setToast("Badges recalculated.");
    },
    onError: (err) => setActionError(getApiErrorMessage(err)),
  });

  const rows = badges.data || [];
  const groups = useMemo(() => groupBadgesByLadder(rows), [rows]);
  const familiesPresent = BADGE_FAMILY_ORDER.filter((f) => groups.some((g) => g.family === f));

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function applyVisibility(badge: Badge, visibility: Audience) {
    setBusyId(badge.id);
    setActionError(null);
    try {
      await setBadgeVisibility(badge.id, visibility);
      setDetail((d) => (d && d.id === badge.id ? { ...d, visibility } : d));
      await qc.invalidateQueries({ queryKey: ["badges"] });
      setToast(visibility === "public" ? "Shown on portfolio." : "Portfolio showcase updated.");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (badges.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading badges…
      </p>
    );
  }

  if (badges.isError) {
    return <p className={ui.error}>Badges could not be loaded. Try again later.</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl text-stone-900">Badges</h2>
          <p className="mt-1 max-w-xl text-sm text-stone-600">
            Milestones earned through your experience and project work.
          </p>
        </div>
        {editable && (
          <OwnerMenu
            busy={refresh.isPending}
            onRecalculate={() => refresh.mutate()}
          />
        )}
      </div>

      {actionError && !detail && (
        <p role="alert" className={ui.error}>{actionError}</p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
          <BadgeArtwork
            badge={{
              id: "empty",
              stable_key: "empty",
              family: "experience",
              track: "professional",
              name: "Badge",
              description: "",
              icon_key: "medallion",
              criteria: "",
              criteria_version: 1,
              visibility: "private",
              evidence_refs: [],
              limitations: "",
            }}
            size={72}
            className="mx-auto opacity-70"
          />
          <p className="mt-4 font-serif text-xl text-stone-900">No badges yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
            Confirm career experience and ship projects with attributable work to earn milestones.
          </p>
          {editable && (
            <Link to="/career/import" className={`${ui.btn} ${ui.primary} mt-5 inline-flex px-4 py-2`}>
              Import resume
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {familiesPresent.map((family) => {
            const familyGroups = groups.filter((g) => g.family === family);
            return (
              <div key={family}>
                <h3 className="font-serif text-xl text-stone-900">{familyLabel(family)}</h3>
                <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {familyGroups.map((group) => (
                    <li key={group.key} className="min-w-0">
                      <LadderCard
                        group={group}
                        editable={editable}
                        busyId={busyId}
                        onDetails={setDetail}
                        onShowcase={(b, on) => void applyVisibility(b, on ? "public" : "private")}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {editable && (
        <div className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-900">Ready for your next achievement?</p>
            <p className="text-xs text-stone-500">Explore a challenge and demonstrate your skills.</p>
          </div>
          <Link to="/assessments" className={`${ui.btn} ${ui.primary} shrink-0 px-4 py-2`}>
            Explore assessments
          </Link>
        </div>
      )}

      {detail && (
        <BadgeDetailDialog
          badge={detail}
          editable={editable}
          busy={busyId === detail.id}
          error={actionError}
          onClose={() => {
            setDetail(null);
            setActionError(null);
          }}
          onShowcase={(on) => void applyVisibility(detail, on ? "public" : "private")}
          onVisibility={(v) => void applyVisibility(detail, v)}
        />
      )}

      {toast && <div className={ui.toast} role="status">{toast}</div>}
    </section>
  );
}
