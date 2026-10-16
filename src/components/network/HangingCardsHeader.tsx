
import {
  CuteSmileyCloud,
  CuteLightBulb,
  CuteGoldfish,
  CuteFlower,
} from "./DoodleDecorations";
import type { ConnectionUserSummary } from "../../types/network";

interface HangingCardsHeaderProps {
  creators: ConnectionUserSummary[];
  onSelectCreator?: (username: string) => void;
}

export function HangingCardsHeader({ creators, onSelectCreator }: HangingCardsHeaderProps) {
  // If creators is empty, use lovely curated student defaults
  const displayCreators =
    creators.length >= 3
      ? creators.slice(0, 4)
      : [
          {
            id: "usr-janasi",
            username: "janasi",
            fullName: "Janasi R.",
            headline: "Backend & Systems",
            avatarUrl:
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
          },
          {
            id: "usr-chan",
            username: "chan",
            fullName: "Chan S.",
            headline: "Fullstack & Auth",
            avatarUrl:
              "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&h=256&fit=crop&crop=faces",
          },
          {
            id: "usr-khushbu",
            username: "khushbu",
            fullName: "Khushbu P.",
            headline: "UI/UX & Talent",
            avatarUrl:
              "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces",
          },
          {
            id: "usr-manasi",
            username: "manasi",
            fullName: "Manasi S.",
            headline: "Analytics & ML",
            avatarUrl:
              "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&h=256&fit=crop&crop=faces",
          },
        ];

  const doodles = [
    {
      icon: <CuteSmileyCloud className="w-7 h-7 text-sky-500" />,
      tag: "cloud nine",
      border: "border-sky-300",
      tape: "washi-tape-mint",
      stringHeight: "h-9",
    },
    {
      icon: <CuteLightBulb className="w-7 h-7 text-amber-500" />,
      tag: "big ideas",
      border: "border-amber-300",
      tape: "washi-tape-peach",
      stringHeight: "h-14",
    },
    {
      icon: <CuteGoldfish className="w-7 h-7 text-orange-400" />,
      tag: "in the flow",
      border: "border-orange-300",
      tape: "washi-tape-coral",
      stringHeight: "h-8",
    },
    {
      icon: <CuteFlower className="w-6 h-6 text-purple-400" />,
      tag: "spring blooms",
      border: "border-purple-300",
      tape: "washi-tape-lavender",
      stringHeight: "h-12",
    },
  ];

  return (
    <div className="relative mb-10 pt-4 pb-6 px-4 rounded-3xl bg-gradient-to-b from-amber-50/60 via-cream-100/40 to-transparent border border-amber-200/50 overflow-hidden shadow-soft">
      {/* Whimsical Header Title & Poetry note */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4 px-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-hand text-2xl text-purple-700 font-semibold tracking-wide flex items-center gap-1.5">
              <span>✦</span> Developer Constellation Branch
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-100/80 text-purple-700 border border-purple-200/60">
              featured sparks
            </span>
          </div>
          <p className="font-hand text-base text-gray-500 italic mt-0.5">
            "where little dreams, late-night commits, and warm friendships hang under the sky"
          </p>
        </div>
        <div className="text-right hidden md:block">
          <span className="font-hand text-sm text-gray-400">tap any snapshot to say hello ~</span>
        </div>
      </div>

      {/* Hanging Strings and Polaroid Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-2">
        {displayCreators.map((dev, idx) => {
          const doodle = doodles[idx % doodles.length];
          return (
            <div
              key={dev.id || dev.username}
              className="flex flex-col items-center group relative cursor-pointer"
              onClick={() => onSelectCreator?.(dev.username)}
            >
              {/* Little Branch Attachment Pin & White Hanging String */}
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80 border border-white shadow-xs" />
                <div
                  className={`w-[1.5px] bg-gradient-to-b from-amber-400/80 to-gray-300/80 ${doodle.stringHeight}`}
                />
              </div>

              {/* Polaroid Frame */}
              <div
                className={`relative w-full max-w-[190px] bg-white rounded-2xl p-2.5 pt-3 border-2 ${doodle.border} shadow-soft hover:shadow-soft-lg transition-all duration-300 group-hover:-translate-y-1.5 animate-gentle-sway`}
                style={{
                  animationDelay: `${idx * 0.7}s`,
                }}
              >
                {/* Washi Tape Accent */}
                <div
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 rounded-xs ${doodle.tape} rotate-[-2deg]`}
                />

                {/* Top Pin Hole */}
                <div className="w-2 h-2 mx-auto mb-2 rounded-full bg-gray-200 border border-gray-300" />

                {/* Photo Area */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100 mb-2.5 border border-gray-100">
                  {dev.avatarUrl ? (
                    <img
                      src={dev.avatarUrl}
                      alt={dev.fullName || dev.username}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-200 to-amber-100 text-purple-700 font-bold text-lg">
                      {dev.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Little Floating Doodle Sticker in corner */}
                  <div className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-white/85 backdrop-blur-xs shadow-xs">
                    {doodle.icon}
                  </div>
                </div>

                {/* Caption / Handwritten Name */}
                <div className="text-center px-1">
                  <div className="font-hand text-lg font-bold text-gray-800 leading-tight truncate">
                    {dev.fullName || dev.username}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate font-sans">
                    {dev.headline || `@${dev.username}`}
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-hand text-xs font-semibold">
                    <span>✧</span> {doodle.tag}
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
