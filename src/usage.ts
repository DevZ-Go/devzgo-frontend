import { api } from "./api/client";
import { getToken } from "./auth/token";

/** Leave a quiet note. Failures stay silent so a missed count never interrupts the page. */
function send(body: { kind: "visit" | "scroll"; path?: string; mode?: "horizontal" | "vertical" }) {
  if (!getToken()) return;
  void api.post("/usage", body).catch(() => undefined);
}

export function noteVisit(path: string) {
  send({ kind: "visit", path });
}

export function noteGalleryDirection(mode: "horizontal" | "vertical") {
  send({ kind: "scroll", mode });
}
