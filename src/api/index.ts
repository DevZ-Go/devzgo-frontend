export { API_BASE_URL, resolveApiAssetUrl } from "./config";
export { api } from "./client";
export {
  loginWithPassword,
  registerUser,
  fetchCurrentUser,
  type LoginTokenResponse,
  type RegisterPayload,
} from "./auth";
export {
  fetchProjects,
  fetchMyProjects,
  fetchTechStacks,
  fetchProject,
  fetchProjectFiles,
  fetchProjectFileContent,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectMedia,
  uploadProjectWorkspace,
  type TechStackItem,
  type CreateProjectPayload,
  type CreateProjectResponse,
  type UpdateProjectPayload,
  type ProjectFileEntry,
  type ProjectFileContentResponse,
  type ProjectVisibility,
  type WorkspaceUploadResponse,
} from "./projects";
export {
  fetchFeed,
  createPost,
  toggleActivityLike,
  addActivityComment,
  deleteActivityComment,
} from "./network";
export {
  fetchConnections,
  sendConnectionRequest,
  acceptConnection,
  declineConnection,
  removeConnection,
  fetchConnectionStatus,
  fetchSuggestedDevelopers,
} from "./connections";
export {
  fetchConversations,
  fetchConversationThread,
  sendMessage,
  markConversationRead,
  fetchUnreadMessagesCount,
} from "./messages";
export {
  fetchProjectCollaborators,
  fetchProjectCollaborationRequests,
  requestCollaboration,
  acceptCollaborationRequest,
  declineCollaborationRequest,
} from "./collaborations";
export {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchUnreadNotificationsCount,
} from "./notifications";
export {
  fetchUserProfile,
  updateMyProfile,
  searchDevelopers,
} from "./profiles";
export { fetchDashboardSummary } from "./analytics";
