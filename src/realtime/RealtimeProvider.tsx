import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL, USE_MOCK } from "../api/config";
import { keysForEvent, queryClient, queryKeys, refreshForEvent } from "../api/queryKeys";

export type RealtimeEvent = { type: string; [key: string]: unknown };

const POLL_MS = 15_000;
const PING_MS = 25_000;

/** Refresh the cached queries the event touches, and fan it out as window events for screens not on the query cache yet. */
function emit(event: RealtimeEvent) {
  refreshForEvent(queryClient, event);
  window.dispatchEvent(new CustomEvent<RealtimeEvent>("devzgo:realtime", { detail: event }));
  const everything = event.type === "poll" || event.type === "resync";
  if (everything || event.type.startsWith("message.")) window.dispatchEvent(new CustomEvent("devzgo:messages-updated"));
  if (everything || event.type === "notification.new") window.dispatchEvent(new CustomEvent("devzgo:notifications-updated"));
  const keys = keysForEvent(event);
  if (keys === "all" || keys.includes(queryKeys.connections)) window.dispatchEvent(new CustomEvent("devzgo:connections-updated"));
}

/** Keeps one WebSocket open while logged in; reconnects with backoff and polls every 15s while disconnected. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) queryClient.clear(); // never show one account's cached data to the next
  }, [token]);

  useEffect(() => {
    if (!token || USE_MOCK) return;
    let ws: WebSocket | null = null;
    let stopped = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(`${API_BASE_URL.replace(/\/$/, "").replace(/^http/, "ws")}/ws`);
      ws.onopen = () => ws?.send(JSON.stringify({ token }));
      ws.onmessage = (e) => {
        if (e.data === "pong") return;
        const event = JSON.parse(e.data) as RealtimeEvent;
        if (event.type === "ready") {
          attempt = 0;
          setConnected(true);
          emit({ type: "resync" }); // catch up on anything missed while offline
        } else {
          emit(event);
        }
      };
      ws.onclose = (e) => {
        setConnected(false);
        if (stopped || e.code === 4401) return; // 4401: token rejected, polling still covers updates
        retryTimer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempt++));
      };
    };

    connect();
    const ping = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), PING_MS);
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      clearInterval(ping);
      ws?.close();
    };
  }, [token]);

  useEffect(() => {
    if (!token || connected) return;
    const poll = setInterval(() => emit({ type: "poll" }), POLL_MS);
    return () => clearInterval(poll);
  }, [token, connected]);

  return <>{children}</>;
}

/** Subscribe to realtime events (and synthetic "poll"/"resync" ticks) for the lifetime of a component. */
export function useRealtimeEvent(handler: (event: RealtimeEvent) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const listener = (e: Event) => ref.current((e as CustomEvent<RealtimeEvent>).detail);
    window.addEventListener("devzgo:realtime", listener);
    return () => window.removeEventListener("devzgo:realtime", listener);
  }, []);
}
