import { describe, expect, it } from "vitest";
import { keysForEvent, queryKeys } from "./queryKeys";

describe("keysForEvent", () => {
  it("refreshes everything after a reconnect or offline poll", () => {
    expect(keysForEvent({ type: "resync" })).toBe("all");
    expect(keysForEvent({ type: "poll" })).toBe("all");
  });

  it("maps events and notification types to the areas they touch", () => {
    expect(keysForEvent({ type: "message.read" })).toEqual([queryKeys.messages]);
    expect(keysForEvent({ type: "project.interaction" })).toEqual([queryKeys.projects]);
    expect(keysForEvent({ type: "notification.new", notification_type: "project_comment" }))
      .toEqual([queryKeys.projects, queryKeys.notifications]);
    expect(keysForEvent({ type: "notification.new", notification_type: "comment" }))
      .toEqual([queryKeys.feed, queryKeys.notifications]);
    expect(keysForEvent({ type: "notification.new", notification_type: "collaboration_request" }))
      .toEqual([queryKeys.collab, queryKeys.notifications]);
    expect(keysForEvent({ type: "notification.new", notification_type: "challenge_feedback" }))
      .toEqual([queryKeys.challenges, queryKeys.notifications]);
    expect(keysForEvent({ type: "unknown.thing" })).toEqual([]);
  });
});
