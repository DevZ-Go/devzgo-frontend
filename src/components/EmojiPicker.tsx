import { useEffect, useRef } from "react";

/** Short glyphs that fit a reaction column. Used for composing and reacting. */
export const CHAT_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
  "🙂", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘",
  "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑",
  "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑",
  "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔",
  "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🥵",
  "🥶", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐",
  "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺",
  "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱",
  "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤",
  "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩",
  "🤡", "👻", "👽", "🤖", "😺", "😸", "😹", "😻",
  "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏",
  "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆",
  "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜",
  "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "👀",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
  "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘",
  "🔥", "✨", "⭐", "🌟", "💫", "⚡", "💥", "💯",
  "🎉", "🎊", "🎁", "🏆", "🥇", "🎯", "🚀", "✅",
  "❌", "⚠️", "💬", "💭", "📌", "📎", "📷", "🎥",
  "🎵", "🎶", "☕", "🍕", "🍔", "🍰", "🍺", "💻",
];

export function EmojiPicker({
  onPick,
  onClose,
  align = "left",
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
  align?: "left" | "right";
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-emoji-toggle]")) return;
      if (!panel.current?.contains(event.target as Node)) onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={panel}
      className={`absolute bottom-full z-30 mb-2 w-[19rem] rounded-2xl border border-[#eadfce] bg-white p-2 shadow-lg ${align === "right" ? "right-0" : "left-0"}`}
    >
      <p className="px-1 pb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-maroon-800">Emoji</p>
      <div className="grid max-h-56 grid-cols-8 gap-0.5 overflow-y-auto">
        {CHAT_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`Insert ${emoji}`}
            className="rounded-lg p-1 text-[1.25rem] leading-none hover:bg-[#f6efe2]"
            onClick={() => onPick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
