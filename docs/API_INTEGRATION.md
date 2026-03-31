# FastAPI integration — file guide

## Base URL

- Default: `http://127.0.0.1:8000` (see `src/api/config.ts`)
- Override: create `.env` with `VITE_API_BASE_URL=http://127.0.0.1:8000` (see `.env.example`)

Restart Vite after changing `.env`.

## CORS

Your FastAPI app must allow the frontend origin (e.g. `http://localhost:5173`). Example:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Files created / updated

| File | Role |
|------|------|
| `src/api/config.ts` | Single `API_BASE_URL` from env or default. |
| `src/api/client.ts` | Axios instance with `baseURL`; request interceptor adds `Authorization: Bearer <token>` from `localStorage`. |
| `src/api/auth.ts` | **Public:** `loginWithPassword` → `POST /auth/login` (OAuth2 form: `username` = email, `password`). `registerUser` → `POST /auth/register` (JSON). **Protected:** `fetchCurrentUser` → `GET /auth/me` (uses `client`). |
| `src/api/projects.ts` | `fetchProjects`, `fetchMyProjects`, `fetchTechStacks`, `createProject` — all use `client` (Bearer). |
| `src/api/index.ts` | Barrel re-exports (optional convenience). |
| `src/utils/apiError.ts` | Parses FastAPI `detail` (string or validation array) into one message. |
| `src/types/auth.ts` | `AuthUser` shape for `/auth/me`. |
| `src/auth/token.ts` | Unchanged: JWT string in `localStorage` key `token`. |
| `src/auth/AuthContext.tsx` | Adds `user`, `refreshUser()`; `logout` clears user. |
| `src/components/AuthBootstrap.tsx` | On app load, if token exists, calls `refreshUser()`; on **401**, logs out. |
| `src/App.tsx` | Wraps router with `AuthBootstrap` inside `AuthProvider`. |
| `src/pages/LoginPage.tsx` | Login → save token → `refreshUser()` (verifies `/auth/me`) → navigate home. |
| `src/pages/RegisterPage.tsx` | `POST /auth/register` with `{ username, email, password }`. |
| `src/pages/LandingPage.tsx` | Parallel `fetchProjects` + `fetchTechStacks`; shows tech stack chips from API. |
| `src/pages/AddProjectPage.tsx` | Form → `POST /projects` with `title`, `short_description`, `full_description`, `category`, `visibility`, `tech_stacks` (names). |
| `src/routes.tsx` | `/add-project` is protected and renders `AddProjectPage`. |

**Removed:** `src/api/axios.ts` (replaced by `client.ts`).

---

## Backend contract tweaks

If your `POST /projects` body differs, edit **`CreateProjectPayload`** in `src/api/projects.ts` and the form in **`AddProjectPage.tsx`** only.

If `GET /projects/techstacks` returns a different wrapper, extend **`fetchTechStacks`** in `src/api/projects.ts`.

If `POST /auth/register` expects different field names, change **`RegisterPayload`** and **`RegisterPage`** form.

---

## Branches (your workflow)

Suggested mapping:

- `feature/auth-ui` — login/register UI polish (optional).
- `feature/api-integration` — this integration (config, client, auth, errors).
- `feature/projects-ui` — landing feed + tech stacks display.
- `feature/file-upload-ui` — add image upload to add-project when backend is ready.

Commit on `feature/api-integration` or merge into your working branch as needed.

---

## Console messages (what to ignore vs fix)

| Message | Meaning |
|---------|--------|
| **LaunchDarkly** | Browser extension (feature flags). Not from this app. |
| **chrome-extension://invalid** | Broken extension. Ignore or disable extensions. |
| **AbortError: play() interrupted by pause()** | Often a browser tab/video extension. Ignore. |
| **401 on `/auth/login`** | Wrong email/password, or backend expects different form fields. OAuth2 uses `username` = email + `password`. |
| **422 on `/projects`** | Validation error: missing/wrong body fields. Ensure `POST /projects` matches your Pydantic schema (`full_description`, `tech_stacks`, etc.). |
