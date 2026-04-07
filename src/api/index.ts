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
