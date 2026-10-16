import {
  CuteSmileyCloud,
  CuteLightBulb,
  CuteGoldfish,
  CuteRedApple,
} from "./DoodleDecorations";
import type { ConnectionUserSummary } from "../../types/network";

interface HangingCardsHeaderProps {
  creators: ConnectionUserSummary[];
  onSelectCreator?: (username: string) => void;
}

export function HangingCardsHeader({ creators, onSelectCreator }: HangingCardsHeaderProps) {
  const displayCreators =
    creators.length >= 3
      ? creators.slice(0, 4)
      : [
          {
            id: "usr-janasi",
            username: "janasi",
            fullName: "Janasi Rajput",
            headline: "Backend & Distributed Systems",
            avatarUrl:
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
          },
          {
            id: "usr-chan",
            username: "chan",
            fullName: "Chan S.",
            headline: "Security & Auth Architect",
            avatarUrl:
              "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&h=256&fit=crop&crop=faces",
          },
          {
            id: "usr-khushbu",
            username: "khushbu",
            fullName: "Khushbu Patel",
            headline: "Talent & UI Specialist",
            avatarUrl:
              "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces",
          },
          {
            id: "usr-manasi",
            username: "manasi",
            fullName: "Manasi Sharma",
            headline: "Analytics & ML Engineer",
            avatarUrl:
              "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&h=256&fit=crop&crop=faces",
          },
        ];

  // Rich Red & Green frames inspired directly by Reference Image 1!
  const cardThemes = [
    {
      borderColor: "border-[#16a34a]", // Rich Grass Green
      doodleBorder: "doodle-frame-green",
      tapeColor: "washi-tape-green",
      badgeColor: "bg-forest-100 text-forest-800 border-forest-600",
      stringHeight: "h-10",
      doodle: <CuteSmileyCloud className="w-8 h-8" />,
      tag: "cloud nine ☁️",
    },
    {
      borderColor: "border-[#dc2626]", // Rich Crimson Red
      doodleBorder: "doodle-frame-red",
      tapeColor: "washi-tape-red",
      badgeColor: "bg-crimson-100 text-crimson-800 border-crimson-600",
      stringHeight: "h-16",
      doodle: <CuteRedApple className="w-8 h-8" />,
      tag: "dream big 🍎",
    },
    {
      borderColor: "border-[#15803d]", // Deep Forest Green
      doodleBorder: "doodle-frame-green",
      tapeColor: "washi-tape-green",
      badgeColor: "bg-forest-100 text-forest-800 border-forest-600",
      stringHeight: "h-12",
      doodle: <CuteLightBulb className="w-8 h-8" />,
      tag: "night spark 💡",
    },
    {
      borderColor: "border-[#dc2626]", // Warm Vermilion Red
      doodleBorder: "doodle-frame-red",
      tapeColor: "washi-tape-red",
      badgeColor: "bg-crimson-100 text-crimson-800 border-crimson-600",
      stringHeight: "h-14",
      doodle: <CuteGoldfish className="w-8 h-8" />,
      tag: "in the flow 🐟",
    },
  ];

  return (
    <div className="relative mb-12 pt-6 pb-8 px-5 sm:px-8 rounded-3xl bg-[#FAF7EE] border-3 border-[#166534]/30 shadow-soft overflow-hidden">
      {/* Hand-drawn organic tree branch silhouette across top */}
      <svg
        className="absolute top-0 left-0 right-0 w-full h-12 text-[#2d3a24] opacity-80 pointer-events-none"
        viewBox="0 0 1000 48"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0 8 Q 120 2, 280 12 T 550 6 T 820 14 T 1000 8 L 1000 0 L 0 0 Z" />
        {/* Little branch twigs sticking out */}
        <path d="M120 10 Q 140 24 160 30 L 158 31 Q 138 23 118 10 Z" />
        <path d="M380 9 Q 400 28 425 32 L 423 33 Q 398 27 378 9 Z" />
        <path d="M640 10 Q 660 26 690 30 L 688 31 Q 658 25 638 10 Z" />
        <path d="M860 11 Q 880 25 910 28 L 908 29 Q 878 24 858 11 Z" />
      </svg>

      {/* Header Title with BIG expressive doodle font */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 pt-3 px-1">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-700 text-white font-doodle text-base font-bold tracking-wide shadow-xs mb-2">
            <span>🌿</span> THE MEMORY BRANCH
          </div>
          <h2 className="font-doodle text-3xl sm:text-4xl text-[#14532D] font-extrabold tracking-tight">
            sparks hanging from the branches
          </h2>
          <div className="mt-1 space-y-0.5">
            <p className="font-doodle text-lg sm:text-xl text-[#166534] font-bold">
              “过去与未来都围绕着一个温暖的小岛，小岛的名字叫作此时此刻”
            </p>
            <p className="font-hand text-xl sm:text-2xl text-[#991B1B] font-bold">
              “past & future gather here at our warm little developer island”
            </p>
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <span className="font-doodle text-lg text-forest-700 font-bold bg-white/80 px-3 py-1.5 rounded-2xl border-2 border-forest-600 shadow-2xs">
            tap snapshot to explore ✦
          </span>
        </div>
      </div>

      {/* Hanging Strings and Big Doodle Polaroid Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-7 pt-1">
        {displayCreators.map((dev, idx) => {
          const theme = cardThemes[idx % cardThemes.length];
          return (
            <div
              key={dev.id || dev.username}
              className="flex flex-col items-center group relative cursor-pointer"
              onClick={() => onSelectCreator?.(dev.username)}
            >
              {/* Branch Knot and White Hanging String with Hand-drawn Loop */}
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#1c1917] shadow-xs flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1c1917]" />
                </div>
                <div
                  className={`w-[2.5px] bg-white border-x border-[#1c1917]/40 shadow-xs ${theme.stringHeight}`}
                />
              </div>

              {/* Hand-Drawn Wobbly Polaroid Frame in Rich Red/Green */}
              <div
                className={`relative w-full max-w-[210px] bg-white rounded-2xl p-3 pt-3.5 ${theme.doodleBorder} shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 group-hover:-translate-y-2 animate-gentle-sway`}
                style={{
                  animationDelay: `${idx * 0.6}s`,
                }}
              >
                {/* Washi Tape Strip */}
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 rounded-xs ${theme.tapeColor} rotate-[-2deg] flex items-center justify-center text-[10px] text-white font-bold tracking-widest`}
                >
                  DEVS
                </div>

                {/* Hand-sketched Pin Hole */}
                <div className="w-3 h-3 mx-auto mb-2 rounded-full bg-cream-100 border-2 border-gray-400" />

                {/* Photo Area with Rich Doodle Accent */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100 mb-3 border-2 border-[#1c1917]/20">
                  {dev.avatarUrl ? (
                    <img
                      src={dev.avatarUrl}
                      alt={dev.fullName || dev.username}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-forest-200 to-crimson-100 text-forest-800 font-doodle font-bold text-2xl">
                      {dev.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Corner Doodle Sticker (Apple, Cloud, Goldfish, Bulb) */}
                  <div className="absolute top-2 right-2 p-1 rounded-xl bg-white/90 backdrop-blur-xs shadow-xs border border-gray-200">
                    {theme.doodle}
                  </div>
                </div>

                {/* Bold Doodle Caption */}
                <div className="text-center px-1">
                  <div className="font-doodle text-xl sm:text-2xl font-bold text-[#1c1917] leading-tight truncate">
                    {dev.fullName || dev.username}
                  </div>
                  <div className="font-sans text-xs text-gray-600 truncate mt-0.5">
                    {dev.headline || `@${dev.username}`}
                  </div>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full font-doodle text-sm font-bold border-2 ${theme.badgeColor}`}
                  >
                    {theme.tag}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
