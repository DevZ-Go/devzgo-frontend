const useMock = import.meta.env.VITE_MOCK_API === "true";

/* ── Config & Client (always real) ── */
export { API_BASE_URL, resolveApiAssetUrl } from "./config";
export { api } from "./client";

/* ── Types (always from real modules) ── */
export type { LoginTokenResponse, RegisterPayload } from "./auth";
export type {
  TechStackItem,
  CreateProjectPayload,
  CreateProjectResponse,
  UpdateProjectPayload,
  ProjectFileEntry,
  ProjectFileContentResponse,
  ProjectVisibility,
  WorkspaceUploadResponse,
} from "./projects";

/* ── Runtime re-exports: real or mock ── */

// Auth
export const loginWithPassword: typeof import("./auth").loginWithPassword =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.loginWithPassword(...args))
      : import("./auth").then((m) => m.loginWithPassword(...args)));

export const registerUser: typeof import("./auth").registerUser =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.registerUser(...args))
      : import("./auth").then((m) => m.registerUser(...args)));

export const fetchCurrentUser: typeof import("./auth").fetchCurrentUser =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.fetchCurrentUser(...args))
      : import("./auth").then((m) => m.fetchCurrentUser(...args)));

// Projects
export const fetchProjects: typeof import("./projects").fetchProjects =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.fetchProjects(...args))
      : import("./projects").then((m) => m.fetchProjects(...args)));

export const fetchMyProjects: typeof import("./projects").fetchMyProjects =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.fetchMyProjects(...args))
      : import("./projects").then((m) => m.fetchMyProjects(...args)));

export const fetchTechStacks: typeof import("./projects").fetchTechStacks =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.fetchTechStacks(...args))
      : import("./projects").then((m) => m.fetchTechStacks(...args)));

export const fetchProject: typeof import("./projects").fetchProject =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.fetchProject(...args))
      : import("./projects").then((m) => m.fetchProject(...args)));

export const fetchProjectFiles: typeof import("./projects").fetchProjectFiles =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.fetchProjectFiles(...args))
      : import("./projects").then((m) => m.fetchProjectFiles(...args)));

export const fetchProjectFileContent: typeof import("./projects").fetchProjectFileContent =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.fetchProjectFileContent(...args))
      : import("./projects").then((m) => m.fetchProjectFileContent(...args)));

export const createProject: typeof import("./projects").createProject =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.createProject(...args))
      : import("./projects").then((m) => m.createProject(...args)));

export const updateProject: typeof import("./projects").updateProject =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.updateProject(...args))
      : import("./projects").then((m) => m.updateProject(...args)));

export const deleteProject: typeof import("./projects").deleteProject =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.deleteProject(...args))
      : import("./projects").then((m) => m.deleteProject(...args)));

export const uploadProjectMedia: typeof import("./projects").uploadProjectMedia =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.uploadProjectMedia(...args))
      : import("./projects").then((m) => m.uploadProjectMedia(...args)));

export const uploadProjectWorkspace: typeof import("./projects").uploadProjectWorkspace =
  (...args) =>
    (useMock
      ? import("./mock").then((m) => m.uploadProjectWorkspace(...args))
      : import("./projects").then((m) => m.uploadProjectWorkspace(...args)));
