import { api } from "./client";
import type { DashboardAnalytics } from "../types/network";

export async function fetchDashboardSummary(): Promise<DashboardAnalytics> {
  try {
    const res = await api.get("/analytics/dashboard-summary");
    if (res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn("Backend unavailable, returning demo dashboard summary:", err);
  }

  return {
    totalPosts: 4,
    likesReceived: 38,
    commentsReceived: 6,
    totalConnections: 28,
    pendingConnections: 3,
    collaborationRequestsSent: 2,
    collaborationRequestsReceived: 4,
    acceptedCollaborations: 4,
    messagesSent: 45,
    messagesReceived: 52,
    projectsShared: 3,
    activityTimeline: [
      { date: "Mon", count: 8 },
      { date: "Tue", count: 14 },
      { date: "Wed", count: 11 },
      { date: "Thu", count: 19 },
      { date: "Fri", count: 24 },
      { date: "Sat", count: 16 },
      { date: "Sun", count: 22 },
    ],
  };
}
