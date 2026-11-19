import { Link } from "react-router-dom";
import type { ConnectionUserSummary } from "../../types/network";
import { StickerBadge } from "../StickerBadge";

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
      borderColor: "border-[#7D94B5]/40",
      bgTint: "bg-[#DAEBF2]",
      tapeColor: "bg-[#26415E] text-[#CBE4EE]",
      avatarBg: "bg-[#CBE4EE] text-[#26415E] border-[#7D94B5]/40",
    },
    {
      borderColor: "border-[#284E45]/35",
      bgTint: "bg-[#E3F0D3]",
      tapeColor: "bg-[#284E45] text-[#E2F0CB]",
      avatarBg: "bg-[#E2F0CB] text-[#284E45] border-[#284E45]/30",
    },
    {
      borderColor: "border-[#3E2217]/30",
      bgTint: "bg-[#FAF6EC]",
      tapeColor: "bg-[#3E2217] text-[#FFF8CA]",
      avatarBg: "bg-[#FFF8CA] text-[#3E2217] border-[#3E2217]/25",
    },
    {
      borderColor: "border-[#3E2217]/30",
      bgTint: "bg-[#FFF8CA]",
      tapeColor: "bg-[#7D94B5] text-white",
      avatarBg: "bg-[#DAEBF2] text-[#26415E] border-[#7D94B5]/40",
    },
  ];

  return (
    <div className="relative mb-6 pt-6 pb-8 px-5 sm:px-8 rounded-3xl bg-[#FAF6EC] border-2 border-[#3E2217]/20 shadow-lg overflow-hidden">
      {/* Spiral notebook / scallop top trim */}
      <div className="flex items-center justify-around px-2 pb-4 border-b border-dashed border-[#3E2217]/20 mb-5">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="w-3.5 h-3.5 rounded-full bg-[#DAEBF2] border border-[#7D94B5] shadow-inner"
          />
        ))}
      </div>

      {/* Header: Numbered Title + download(46) Network People Sticker */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 px-1">
        <div className="flex items-center gap-3.5">
          <StickerBadge
            name="offlineDino"
            size="sm"
            variant="diecut"
            className="-rotate-6 hover:rotate-0 transition-transform shrink-0 !w-14 !h-14"
          />
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#284E45] block mb-1">
              DIRECTORY · NETWORK PEOPLE
            </span>
            <h2 className="font-gift text-3xl sm:text-4xl text-[#3E2217] font-bold tracking-wide leading-none">
              01. People you can reach
            </h2>
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <span className="font-sans text-xs font-semibold text-[#284E45] bg-[#E2F0CB] px-3.5 py-1.5 rounded-full border border-[#284E45]/25 inline-block">
            tap a card to filter feed
          </span>
        </div>
      </div>

      {/* Polaroid Cards */}
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
                className={`relative w-full max-w-[200px] ${theme.bgTint} rounded-2xl p-3.5 pt-4 border ${theme.borderColor} shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1`}
              >
                {/* Washi Tape Strip */}
                <div
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full ${theme.tapeColor} text-[9px] font-bold font-sans tracking-widest uppercase border border-white/40 shadow-2xs`}
                >
                  0{idx + 1} · DEV
                </div>

                {/* Photo Area */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white mb-3 border border-[#2D120D]/15">
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

                {/* Caption */}
                <div className="text-center px-1">
                  <div className="font-gift text-xl text-[#2D120D] font-bold leading-tight break-words">
                    {dev.fullName || dev.username}
                  </div>
                  <div className="font-sans text-[11px] text-[#6B0B0C] font-semibold break-all mt-0.5">
                    @{dev.username}
                  </div>
                  {dev.headline && (
                    <div className="font-sans text-[11px] text-[#2D120D]/70 line-clamp-1 mt-0.5">
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
