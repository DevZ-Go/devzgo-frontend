import { useEffect, useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ConnectButton } from "../../components/ConnectButton";
import { useAuth } from "../../auth/AuthContext";
import { fetchUserProfile } from "../../api/profiles";
import { connectUserId, focusChips, identityOf, linksFor, type CharacterMotif, type TeamDeveloper } from "./team";

const connectLink =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-maroon-800 bg-white px-4 text-sm font-semibold text-maroon-800 hover:bg-[#f8f6f0]";

function Medallion({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#eadfce] bg-[#f8f6f0]" aria-hidden>
      {children}
    </div>
  );
}

function Motif({ motif }: { motif: CharacterMotif }) {
  if (motif === "moon") {
    return (
      <Medallion>
        <svg viewBox="0 0 24 24" className="h-9 w-9">
          <path
            fill="#fced96"
            stroke="#6B0B0C"
            strokeWidth="0.7"
            strokeLinejoin="round"
            d="M9.53 1.72a.75.75 0 0 1 .16.82A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.46-.69.75.75 0 0 1 .98.98 10.5 10.5 0 0 1-9.69 6.46c-5.8 0-10.5-4.7-10.5-10.5 0-4.37 2.67-8.11 6.46-9.69a.75.75 0 0 1 .82.16z"
          />
        </svg>
      </Medallion>
    );
  }
  if (motif === "twins") {
    return (
      <Medallion>
        <svg viewBox="0 0 48 48" className="h-10 w-10">
          <g fill="none" stroke="#6B0B0C" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="16" cy="16" r="4.2" fill="#fced96" />
            <path d="M8.5 34c.7-6 3.5-9 7.5-9s6.8 3 7.5 9" />
            <circle cx="32" cy="16" r="4.2" fill="#fced96" />
            <path d="M24.5 34c.7-6 3.5-9 7.5-9s6.8 3 7.5 9" />
            <path d="M20.2 22.5h7.6" />
          </g>
        </svg>
      </Medallion>
    );
  }
  return (
    <Medallion>
      <svg viewBox="0 0 48 48" className="h-10 w-10">
        <g fill="#fced96" stroke="#6B0B0C" strokeWidth="1.15">
          <circle cx="24" cy="13" r="5" />
          <circle cx="33.6" cy="19.8" r="5" />
          <circle cx="30" cy="31.6" r="5" />
          <circle cx="18" cy="31.6" r="5" />
          <circle cx="14.4" cy="19.8" r="5" />
        </g>
        <circle cx="24" cy="23.4" r="2.7" fill="#6B0B0C" />
      </svg>
    </Medallion>
  );
}

function ConnectAction({ dev }: { dev: TeamDeveloper }) {
  const { isAuthenticated, user } = useAuth();
  const knownId = connectUserId(dev);
  const trimmed = dev.profileId.trim();
  const lookup = useQuery({
    queryKey: ["about-account", trimmed],
    queryFn: () => fetchUserProfile(trimmed),
    enabled: Boolean(trimmed) && !knownId && isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const accountId = knownId || lookup.data?.userId || "";
  if (accountId && user?.id === accountId) return null;
  if (!isAuthenticated) {
    return (
      <Link to="/login" className={connectLink}>
        Connect
      </Link>
    );
  }
  if (!accountId && lookup.isLoading) {
    return <span className={`${connectLink} opacity-60`}>Connect</span>;
  }
  if (!accountId) {
    return (
      <Link to={trimmed ? `/profile/${encodeURIComponent(trimmed)}` : "/explore/developers"} className={connectLink}>
        Connect
      </Link>
    );
  }
  return <ConnectButton userId={accountId} />;
}

export function ProfilePanel({ dev, onClose }: { dev: TeamDeveloper | null; onClose: () => void }) {
  const titleId = useId();

  useEffect(() => {
    if (!dev) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dev, onClose]);

  if (!dev) {
    return <p className="mt-4 text-center text-sm text-stone-500">Select a builder to read their profile.</p>;
  }

  const identity = identityOf(dev);
  const chips = focusChips(dev.focus);
  const links = linksFor(dev);
  const profileTo = dev.profileId ? `/profile/${dev.profileId}` : "/explore/developers";

  return (
    <div className="mx-auto mt-5 max-w-3xl">
      <p className="sr-only" aria-live="polite">
        {`${dev.name}. ${identity?.label ?? dev.role}.`}
      </p>
      <article
        id="builder-profile"
        aria-labelledby={titleId}
        key={dev.id}
        className="overflow-hidden rounded-3xl border border-[#e4d7c6] bg-white motion-safe:animate-[profile-in_220ms_ease-out]"
      >
        <div className="flex items-start gap-4 px-5 pt-5 sm:px-7">
          {identity && <Motif motif={identity.motif} />}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-maroon-800">
                {identity?.label ?? dev.craft ?? "Builder"}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-stone-500 hover:text-maroon-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-maroon-800"
              >
                Close
              </button>
            </div>
            <h2 id={titleId} className="mt-1 font-serif text-[2rem] font-normal leading-none tracking-tight text-stone-900">
              {dev.name}
            </h2>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{dev.role}</p>
          </div>
        </div>

        {identity && (
          <p className="mx-5 mt-4 border-l-2 border-[#fced96] pl-3 font-serif text-lg leading-snug text-stone-800 sm:mx-7">
            {identity.line}
          </p>
        )}
        {dev.tagline && <p className="mx-5 mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:mx-7">{dev.tagline}</p>}

        <div className={`mt-5 grid gap-4 px-5 sm:px-7 ${links.length > 0 ? "sm:grid-cols-2" : ""}`}>
          {links.length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">Contributions</h3>
              <ul className="mt-1.5 space-y-1">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm font-semibold text-maroon-800 underline-offset-2 hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">Technologies</h3>
            {chips.length > 0 ? (
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <li key={chip} className="rounded-lg border border-[#eadfce] bg-[#f8f6f0] px-2.5 py-1 text-xs text-stone-800">
                    {chip}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-stone-500">None listed yet.</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#efe6da] px-5 py-4 sm:px-7">
          <Link
            to={profileTo}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust px-4 text-sm font-semibold text-white"
          >
            View profile
          </Link>
          <ConnectAction dev={dev} />
        </div>
      </article>
    </div>
  );
}
