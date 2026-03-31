# Changelog

All notable changes to the DevZ-Go frontend are documented here. For full detail, see **[docs/PROJECT_CHANGES_AND_DOCUMENTATION.md](docs/PROJECT_CHANGES_AND_DOCUMENTATION.md)**.

---

## [Unreleased] — API integration (FastAPI)

### Added

- **`src/api/config.ts`** — `API_BASE_URL` from `VITE_API_BASE_URL` or `http://127.0.0.1:8000`
- **`src/api/client.ts`** — Axios instance with `Authorization: Bearer <token>` interceptor
- **`src/api/auth.ts`** — `loginWithPassword` (OAuth2 form → `POST /auth/login`), `registerUser` (`POST /auth/register`), `fetchCurrentUser` (`GET /auth/me`)
- **`src/api/projects.ts`** — `fetchProjects`, `fetchMyProjects`, `fetchTechStacks`, `createProject`
- **`src/api/index.ts`** — Barrel exports
- **`src/types/auth.ts`** — `AuthUser`
- **`src/utils/apiError.ts`** — FastAPI error message parsing
- **`src/components/AuthBootstrap.tsx`** — Load `/auth/me` on startup; logout on 401
- **`src/pages/AddProjectPage.tsx`** — Create project form (`POST /projects`)
- **`.env.example`** — Example environment variables
- **`docs/API_INTEGRATION.md`** — Integration notes
- **`docs/PROJECT_CHANGES_AND_DOCUMENTATION.md`** — Full project documentation

### Changed

- **`src/App.tsx`** — Wraps with `AuthBootstrap`
- **`src/auth/AuthContext.tsx`** — `user`, `refreshUser()`
- **`src/pages/LoginPage.tsx`** — Real backend login + `/auth/me` verification
- **`src/pages/RegisterPage.tsx`** — `POST /auth/register`
- **`src/pages/LandingPage.tsx`** — Parallel fetch: projects + tech stacks; UI chips for tech stacks
- **`src/components/Navbar.tsx`** — Display user email/username
- **`src/routes.tsx`** — `/add-project` → protected `AddProjectPage`
- **`src/types/project.ts`** & **`src/utils/projectTransform.ts`** — Flexible `tech_stack` from API

### Removed

- **`src/api/axios.ts`** — Renamed/replaced by **`src/api/client.ts`**
- Login page **“Try demo (no backend)”** button (removed in favor of real auth)

### Notes

- Backend expected at **`127.0.0.1:8000`** unless `VITE_API_BASE_URL` is set.
- See **PROJECT_CHANGES_AND_DOCUMENTATION.md** for routes table and run instructions.
