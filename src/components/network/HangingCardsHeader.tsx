import { Link } from "react-router-dom";
import type { ConnectionUserSummary } from "../../types/network";

interface HangingCardsHeaderProps {
  creators: ConnectionUserSummary[];
  onSelectCreator?: (username: string) => void;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function HangingCardsHeader({ creators, onSelectCreator }: HangingCardsHeaderProps) {
  const displayCreators = creators.filter((c) => c.id && UUID.test(c.id)).slice(0, 4);
  if (displayCreators.length === 0) return null;

  const cardThemes = [
    {
      borderColor: "border-[#16a34a]",
      doodleBorder: "doodle-frame-green",
      tapeColor: "washi-tape-green",
      badgeColor: "bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]",
      stringHeight: "h-9",
    },
    {
      borderColor: "border-[#dc2626]",
      doodleBorder: "doodle-frame-red",
      tapeColor: "washi-tape-red",
      badgeColor: "bg-[#FEE2E2] text-[#991B1B] border border-[#DC2626]",
      stringHeight: "h-14",
    },
    {
      borderColor: "border-[#15803d]",
      doodleBorder: "doodle-frame-green",
      tapeColor: "washi-tape-green",
      badgeColor: "bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]",
      stringHeight: "h-10",
    },
    {
      borderColor: "border-[#dc2626]",
      doodleBorder: "doodle-frame-red",
      tapeColor: "washi-tape-red",
      badgeColor: "bg-[#FEE2E2] text-[#991B1B] border border-[#DC2626]",
      stringHeight: "h-12",
    },
  ];

  return (
    <div className="relative mb-8 pt-5 pb-7 px-5 sm:px-7 rounded-2xl bg-[#FAF7EE] border-2 border-[#166534]/30 shadow-xs overflow-hidden">
      {/* Hand-drawn tree branch silhouette */}
      <svg
        className="absolute top-0 left-0 right-0 w-full h-10 text-[#2d3a24] opacity-80 pointer-events-none"
        viewBox="0 0 1000 48"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0 8 Q 120 2, 280 12 T 550 6 T 820 14 T 1000 8 L 1000 0 L 0 0 Z" />
        <path d="M120 10 Q 140 24 160 30 L 158 31 Q 138 23 118 10 Z" />
        <path d="M380 9 Q 400 28 425 32 L 423 33 Q 398 27 378 9 Z" />
        <path d="M640 10 Q 660 26 690 30 L 688 31 Q 658 25 638 10 Z" />
        <path d="M860 11 Q 880 25 910 28 L 908 29 Q 878 24 858 11 Z" />
      </svg>

      {/* Header: Whimsical Cursive ONLY for Heading, otherwise clean straight */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5 pt-2 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] border border-[#15803D] font-sans text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
            People
          </div>
          <h2 className="font-serif text-3xl text-stone-900">People you can reach</h2>
        </div>

        <div className="hidden sm:block text-right">
          <span className="font-sans text-xs font-semibold text-[#14532D] bg-[#DCFCE7] px-3 py-1.5 rounded-xl border border-[#15803D] shadow-2xs inline-block">
            tap a snapshot to explore
          </span>
        </div>
      </div>

      {/* Hanging Strings and Clean Polaroid Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-1">
        {displayCreators.map((dev, idx) => {
          const theme = cardThemes[idx % cardThemes.length];
          return (
            <Link
              key={dev.id}
              to={`/profile/${dev.id}`}
              className="flex flex-col items-center group relative"
              onClick={() => onSelectCreator?.(dev.username)}
            >
              {/* Branch Knot and Charcoal String */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[#1C1917] border-2 border-[#15803D] shadow-xs" />
                <div
                  className={`w-[2px] bg-[#1C1917] shadow-xs ${theme.stringHeight}`}
                />
              </div>

              {/* Hand-Drawn Polaroid Frame with Clean Proportions */}
              <div
                className={`relative w-full max-w-[190px] bg-white rounded-xl p-3 pt-3.5 ${theme.doodleBorder} shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-1.5 animate-gentle-sway`}
                style={{
                  animationDelay: `${idx * 0.6}s`,
                }}
              >
                {/* Washi Tape Strip */}
                <div
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-3.5 rounded-xs ${theme.tapeColor} rotate-[-2deg] flex items-center justify-center text-[10px] text-[#1C1917] font-bold font-sans tracking-wider border border-[#1C1917]/20`}
                >
                  DEVS
                </div>

                {/* Hand-sketched Pin Hole */}
                <div className="w-2.5 h-2.5 mx-auto mb-2 rounded-full bg-stone-200 border border-stone-400" />

                {/* Photo Area */}
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100 mb-2.5 border border-stone-200">
                  {dev.avatarUrl ? (
                    <img
                      src={dev.avatarUrl}
                      alt={dev.fullName || dev.username}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#DCFCE7] text-[#14532D] font-cursive font-bold text-2xl">
                      {dev.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                </div>

                {/* Caption: Whimsical Cursive ONLY for Name, Straight for Details */}
                <div className="text-center px-1">
                  <div className="font-cursive text-xl font-bold text-[#1C1917] leading-tight break-words">
                    {dev.fullName || dev.username}
                  </div>
                  <div className="font-sans text-[11px] text-stone-600 font-medium break-all mt-0.5">
                    @{dev.username}
                  </div>
                  {dev.headline && (
                    <div className="font-sans text-[11px] text-stone-500 break-words mt-0.5">{dev.headline}</div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
