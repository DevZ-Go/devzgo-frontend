export { API_BASE_URL } from "./config";
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
  createProject,
  type TechStackItem,
  type CreateProjectPayload,
  type ProjectVisibility,
} from "./projects";
