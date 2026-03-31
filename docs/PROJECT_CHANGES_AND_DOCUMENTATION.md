# DevZ-Go Frontend — Project Changes & Full Documentation

**Last updated:** 2026  
**Purpose:** Single reference for what was built, what changed, how it works, and how to run it.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Folder Structure (`src/`)](#3-folder-structure-src)
4. [All Routes](#4-all-routes)
5. [Backend API Mapping](#5-backend-api-mapping)
6. [Authentication Flow](#6-authentication-flow)
7. [Environment Variables](#7-environment-variables)
8. [Files Added, Removed, and Modified](#8-files-added-removed-and-modified)
9. [How to Run Frontend + Backend](#9-how-to-run-frontend--backend)
10. [CORS & Troubleshooting](#10-cors--troubleshooting)
11. [Additional Documentation Files](#11-additional-documentation-files)

---

## 1. Overview

This repository is a **React + TypeScript + Vite** single-page application for **DevZ-Go**, a developer portfolio platform. It integrates with a **FastAPI** backend running at **`http://127.0.0.1:8000`** (configurable).

**Features implemented:**

- JWT-based login and registration (OAuth2-style login form for FastAPI)
- Protected routes (`/home`, `/add-project`)
- API calls with automatic Bearer token (`Authorization` header)
- Home page: projects feed + tech stacks from API
- Add project form connected to `POST /projects`
- Session bootstrap: on page load, if a token exists, `GET /auth/me` runs; invalid token (401) logs the user out

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (`.ts`, `.tsx`) |
| UI | React 19 |
| Routing | React Router DOM 7 |
| HTTP | Axios |
| Styling | Tailwind CSS 3 |
| Animation | Motion (Framer Motion successor) |
| Icons | Lucide React |
| Build / dev server | Vite 5 |
| Package manager | npm |

---

## 3. Folder Structure (`src/`)

| Path | Purpose |
|------|---------|
| `src/main.tsx` | Entry: mounts React into `#root`, imports global CSS |
| `src/App.tsx` | Wraps app with `AuthProvider` → `AuthBootstrap` → `RouterProvider` |
| `src/routes.tsx` | **All URL routes** (see [§4](#4-all-routes)) |
| `src/index.css` | Global styles + Tailwind directives |
| `src/api/` | API layer: `config`, `client`, `auth`, `projects`, `index` |
| `src/auth/` | `AuthContext`, `token` (localStorage), barrel `index.ts` |
| `src/components/` | Reusable UI: Navbar, ProtectedRoute, AuthLayout, AuthBootstrap, ProjectCard, FeedSection, ImageWithFallback |
| `src/pages/` | Full pages: Landing, Login, Register, AddProject |
| `src/types/` | TypeScript types: `project.ts`, `auth.ts` |
| `src/utils/` | `projectTransform.ts`, `apiError.ts` |
| `src/data/` | `mockData.ts` (e.g. tech stack badge colors) |

---

## 4. All Routes

**Defined in:** `src/routes.tsx`  
**Mounted in:** `src/App.tsx` via `<RouterProvider router={router} />`

| Path | Component / behavior | Auth required? |
|------|----------------------|----------------|
| `/` | Redirect to `/home` | — |
| `/home` | `LandingPage` | Yes (`ProtectedRoute`) |
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/explore` | Placeholder (“coming soon”) | No |
| `/add-project` | `AddProjectPage` | Yes (`ProtectedRoute`) |
| `/project/:id` | Placeholder (“coming soon”) | No |
| `*` (unknown) | Redirect to `/home` | — |

**`ProtectedRoute`** (`src/components/ProtectedRoute.tsx`): if `useAuth().isAuthenticated` is false, redirects to `/login`.

---

## 5. Backend API Mapping

Base URL: **`API_BASE_URL`** from `src/api/config.ts` (default `http://127.0.0.1:8000`).

| Frontend function | HTTP | Path | Auth header | Notes |
|-------------------|------|------|---------------|--------|
| `loginWithPassword` | POST | `/auth/login` | No | Body: `application/x-www-form-urlencoded` with `username` (email) and `password` |
| `registerUser` | POST | `/auth/register` | No | JSON: `{ username, email, password }` |
| `fetchCurrentUser` | GET | `/auth/me` | Bearer | Uses `api` client |
| `fetchProjects` | GET | `/projects` | Bearer | Supports array or `{ projects: [...] }` |
| `fetchMyProjects` | GET | `/projects/me` | Bearer | Same response shape handling |
| `fetchTechStacks` | GET | `/projects/techstacks` | Bearer | Supports array, `{ techstacks: [...] }`, or `{ items: [...] }` |
| `createProject` | POST | `/projects` | Bearer | JSON: `CreateProjectPayload` (see `projects.ts`) |

**Authenticated requests** use the shared **`api`** instance from `src/api/client.ts`, which attaches `Authorization: Bearer <token>` when `localStorage` has a token (key: `token`, managed in `src/auth/token.ts`).

---

## 6. Authentication Flow

1. User submits email + password on **Login**.
2. `loginWithPassword` → `POST /auth/login` → receives `{ access_token, ... }`.
3. `AuthContext.login(access_token)` saves token via `setToken()` (localStorage) and updates React state.
4. `refreshUser()` calls `GET /auth/me` and stores result in `user`.
5. On failure of `/auth/me` after login, token is cleared and an error is shown.
6. **AuthBootstrap** (`src/components/AuthBootstrap.tsx`): on app load, if a token exists, runs `refreshUser()`; if response is **401**, calls `logout()`.
7. **Logout** clears token and `user`, then navigates to `/login` (from Navbar).

---

## 7. Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_BASE_URL` | FastAPI base URL (no trailing slash) | `http://127.0.0.1:8000` |

**Setup:** Copy `.env.example` to `.env` in the project root. **Restart Vite** after changing `.env`.

Vite only exposes variables prefixed with `VITE_` to client code.

---

## 8. Files Added, Removed, and Modified

### 8.1 Added (API integration & features)

| File | Description |
|------|-------------|
| `src/api/config.ts` | Exports `API_BASE_URL` |
| `src/api/client.ts` | Axios instance + Bearer interceptor |
| `src/api/auth.ts` | Login (OAuth2 form), register, `fetchCurrentUser` |
| `src/api/projects.ts` | Projects, my projects, tech stacks, create project |
| `src/api/index.ts` | Barrel exports for API module |
| `src/types/auth.ts` | `AuthUser` type |
| `src/utils/apiError.ts` | Parses FastAPI `detail` into user-friendly strings |
| `src/components/AuthBootstrap.tsx` | Loads `/auth/me` on startup; 401 → logout |
| `src/pages/AddProjectPage.tsx` | Create project form |
| `.env.example` | Documents `VITE_API_BASE_URL` |
| `docs/API_INTEGRATION.md` | Short integration notes |
| `docs/PROJECT_CHANGES_AND_DOCUMENTATION.md` | This file |

### 8.2 Removed

| File | Replacement |
|------|--------------|
| `src/api/axios.ts` | `src/api/client.ts` (same idea, clearer name) |

### 8.3 Modified (high level)

| File | Changes |
|------|---------|
| `src/App.tsx` | Wraps with `AuthBootstrap` |
| `src/auth/AuthContext.tsx` | `user`, `refreshUser()`; logout clears user |
| `src/pages/LoginPage.tsx` | Uses `loginWithPassword`, `refreshUser`, `getApiErrorMessage`; demo login removed |
| `src/pages/RegisterPage.tsx` | Uses `registerUser`, `getApiErrorMessage` |
| `src/pages/LandingPage.tsx` | Fetches projects + tech stacks in parallel; shows tech stack chips |
| `src/components/Navbar.tsx` | Shows logged-in email/username; logout |
| `src/routes.tsx` | `/add-project` → protected `AddProjectPage` |
| `src/types/project.ts` | `tech_stack` can be strings or `{ name }` objects |
| `src/utils/projectTransform.ts` | Normalizes `tech_stack` from API |
| `src/components/index.ts` | Exports `AuthBootstrap` |

### 8.4 Unchanged (conceptually)

- `src/auth/token.ts` — still `localStorage` key `token`
- `src/components/ProtectedRoute.tsx` — still uses `useAuth().isAuthenticated`
- `src/main.tsx`, `vite.config.ts`, `tailwind.config.js` — standard setup

---

## 9. How to Run Frontend + Backend

### Backend (FastAPI)

Run your existing command (example):

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Confirm: `http://127.0.0.1:8000/docs` (Swagger) opens.

### Frontend (Vite)

In a **second** terminal:

```bash
cd path/to/devzgo-frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in the browser.

Two processes are required: **port 8000** (API) and **port 5173** (UI).

---

## 10. CORS & Troubleshooting

- **CORS:** The FastAPI app must allow the frontend origin (e.g. `http://localhost:5173`). See `docs/API_INTEGRATION.md` for a Python snippet.
- **Wrong API URL:** Set `VITE_API_BASE_URL` in `.env` and restart Vite.
- **`POST /projects` errors:** Align `CreateProjectPayload` in `src/api/projects.ts` and the form in `AddProjectPage.tsx` with your FastAPI schema.
- **Tech stacks empty:** Adjust `fetchTechStacks` if your JSON shape differs.

---

## 11. Additional Documentation Files

| File | Content |
|------|---------|
| `CODEBASE_GUIDE.md` | File-by-file codebase walkthrough |
| `VIVA_PREPARATION_NOTES.md` | Concepts, hooks, viva Q&A |
| `docs/API_INTEGRATION.md` | Short FastAPI integration notes + CORS |
| `README.md` | Project readme (update if you add setup steps) |

---

## Changelog (summary)

| Area | Change |
|------|--------|
| API | Centralized `config` + `client` + `auth` + `projects` |
| Auth | OAuth2 form login; `/auth/me`; `user` in context; bootstrap + 401 handling |
| UI | Login/register wired to `/auth/*`; landing loads projects + tech stacks; add-project page |
| Routes | `/add-project` protected, full page |
| Env | `VITE_API_BASE_URL` optional override |
| Docs | This document + `docs/API_INTEGRATION.md` |

---

*For questions about a specific branch (`feature/api-integration`, etc.), compare that branch to `main` in GitHub or run `git log` / `git diff` locally.*
