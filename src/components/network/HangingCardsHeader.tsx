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
      borderColor: "border-[#C9BEF0]",
      bgTint: "bg-[#F5F2FC]",
      tapeColor: "bg-[#E2DAF8] text-[#42356B]",
      avatarBg: "bg-[#E8E2FA] text-[#42356B] border-[#C9BEF0]",
    },
    {
      borderColor: "border-[#EBCAD3]",
      bgTint: "bg-[#FDF6F8]",
      tapeColor: "bg-[#F7DDE4] text-[#721C2A]",
      avatarBg: "bg-[#FAE5EB] text-[#721C2A] border-[#EBCAD3]",
    },
    {
      borderColor: "border-[#C9BEF0]",
      bgTint: "bg-[#F5F2FC]",
      tapeColor: "bg-[#E2DAF8] text-[#42356B]",
      avatarBg: "bg-[#E8E2FA] text-[#42356B] border-[#C9BEF0]",
    },
    {
      borderColor: "border-[#EBCAD3]",
      bgTint: "bg-[#FDF6F8]",
      tapeColor: "bg-[#F7DDE4] text-[#721C2A]",
      avatarBg: "bg-[#FAE5EB] text-[#721C2A] border-[#EBCAD3]",
    },
  ];

  return (
    <div className="relative mb-10 pt-6 pb-8 px-5 sm:px-8 rounded-3xl bg-white/95 border border-[#E2DAF5] shadow-sm overflow-hidden">
      {/* Nectar-style spiral notebook / scallop top trim */}
      <div className="flex items-center justify-around px-2 pb-4 border-b border-dashed border-[#E6DFEE] mb-5">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="w-3.5 h-3.5 rounded-full bg-[#F2EEFA] border border-[#D5CBEB] shadow-inner"
          />
        ))}
      </div>

      {/* Header: Gift Guide Numbered Title */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 px-1">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#6B5B95] block mb-1">
            DIRECTORY · SPOTLIGHT
          </span>
          <h2 className="font-gift text-3xl sm:text-4xl text-[#721C2A] tracking-wide leading-none">
            01. People you can reach
          </h2>
        </div>

        <div className="hidden sm:block text-right">
          <span className="font-sans text-xs font-medium text-[#4A3E70] bg-[#EFEBF9] px-3.5 py-1.5 rounded-full border border-[#D8CFE8] inline-block">
            tap a card to filter feed
          </span>
        </div>
      </div>

      {/* Clean Pastel Polaroid Cards */}
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
              <div
                className={`relative w-full max-w-[200px] ${theme.bgTint} rounded-2xl p-3.5 pt-4 border ${theme.borderColor} shadow-2xs hover:shadow-md transition-all duration-300 group-hover:-translate-y-1`}
              >
                {/* Pastel Washi Tape Strip */}
                <div
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full ${theme.tapeColor} text-[9px] font-bold font-sans tracking-widest uppercase border border-white/60 shadow-2xs`}
                >
                  0{idx + 1} · DEV
                </div>

                {/* Photo Area */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white mb-3 border border-stone-200/70">
                  {dev.avatarUrl ? (
                    <img
                      src={dev.avatarUrl}
                      alt={dev.fullName || dev.username}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${theme.avatarBg} font-gift text-3xl`}>
                      {dev.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Caption in Gift Guide Font */}
                <div className="text-center px-1">
                  <div className="font-gift text-2xl text-[#721C2A] leading-tight break-words">
                    {dev.fullName || dev.username}
                  </div>
                  <div className="font-sans text-[11px] text-[#6B5B95] font-medium break-all mt-0.5">
                    @{dev.username}
                  </div>
                  {dev.headline && (
                    <div className="font-sans text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {dev.headline}
                    </div>
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
