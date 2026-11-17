import { useCallback, useEffect, useState } from "react";

export type ChatPrefs = {
  pinned: string[];
  archived: string[];
  favourite: string[];
  unread: string[];
  hiddenAt: Record<string, string>;
  clearedAt: Record<string, string>;
  stars: string[];
  played: string[];
  deleted: string[];
  reported: string[];
  disappear: Record<string, number>;
  exited: { id: string; title: string }[];
  muteUntil: Record<string, number>;
};

const EMPTY: ChatPrefs = {
  pinned: [], archived: [], favourite: [], unread: [], hiddenAt: {}, clearedAt: {}, stars: [], played: [], deleted: [], reported: [], disappear: {}, exited: [], muteUntil: {},
};

function keyFor(userId?: string) {
  return `devzgo-chat-prefs:${userId || "guest"}`;
}

export function loadChatPrefs(userId?: string): ChatPrefs {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

export function chatKey(kind: "dm" | "room", id: string) {
  return `${kind}:${id}`;
}

export function useChatPrefs(userId?: string) {
  const [prefs, setPrefs] = useState<ChatPrefs>(() => loadChatPrefs(userId));

  useEffect(() => {
    setPrefs(loadChatPrefs(userId));
  }, [userId]);

  const update = useCallback((fn: (current: ChatPrefs) => ChatPrefs) => {
    setPrefs((current) => {
      const next = fn(current);
      try {
        localStorage.setItem(keyFor(userId), JSON.stringify(next));
      } catch {
        /* this browser may be blocking storage */
      }
      return next;
    });
  }, [userId]);

  const toggle = useCallback((bucket: "pinned" | "archived" | "favourite" | "unread" | "stars" | "played", id: string) => {
    update((current) => {
      const list = current[bucket];
      const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
      return { ...current, [bucket]: next };
    });
  }, [update]);

  return { prefs, update, toggle };
}
