# DevZ-Go Frontend — Complete Codebase Guide

A simple, line-by-line explanation of the entire project.

---

## Table of Contents

1. [Project Structure & Folders](#1-project-structure--folders)
2. [How the App Starts](#2-how-the-app-starts)
3. [File-by-File Explanation](#3-file-by-file-explanation)
4. [What's Not Working Yet](#4-whats-not-working-yet)
5. [How It Will Work in the Future](#5-how-it-will-work-in-the-future)

---

## 1. Project Structure & Folders

```
devzgo-frontend/
├── index.html              # The single HTML file - entry point for the browser
├── package.json            # Lists all dependencies (libraries) the project needs
├── vite.config.ts          # Vite build tool configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── src/
│   ├── main.tsx            # JavaScript entry point - mounts React to the page
│   ├── App.tsx             # Root component - wraps everything with Auth + Router
│   ├── index.css           # Global styles (Tailwind + custom CSS variables)
│   ├── routes.tsx          # Defines all URLs and which page shows for each
│   │
│   ├── auth/               # 🔐 AUTHENTICATION - everything about login/logout
│   │   ├── AuthContext.tsx  # React Context - stores token, provides login/logout
│   │   ├── token.ts        # Reads/writes JWT token in localStorage
│   │   └── index.ts        # Re-exports auth stuff for easy imports
│   │
│   ├── api/                # 🌐 API CALLS - talks to the backend server
│   │   ├── axios.ts        # Configured axios - adds JWT to every request
│   │   ├── auth.ts         # login() and register() API calls
│   │   └── projects.ts     # fetchProjects() - gets list of projects
│   │
│   ├── components/         # 🧩 REUSABLE UI PIECES
│   │   ├── AuthLayout.tsx  # Shared layout for Login/Register (navbar + background)
│   │   ├── Navbar.tsx      # Top navigation bar (when logged in)
│   │   ├── ProtectedRoute.tsx  # Redirects to login if not authenticated
│   │   ├── ProjectCard.tsx # Card showing one project (3 variants)
│   │   ├── FeedSection.tsx # Grid of project cards
│   │   ├── ImageWithFallback.tsx  # Image that shows placeholder if load fails
│   │   └── index.ts        # Exports all components
│   │
│   ├── pages/              # 📄 FULL PAGES (screens)
│   │   ├── LandingPage.tsx # Home page - hero, projects feed, CTA
│   │   ├── LoginPage.tsx   # Sign in form
│   │   └── RegisterPage.tsx# Sign up form
│   │
│   ├── types/              # 📝 TYPESCRIPT TYPES
│   │   └── project.ts      # Shapes of Project data (API vs UI)
│   │
│   ├── data/               # 📊 STATIC DATA
│   │   └── mockData.ts     # Tech stack colors for badges
│   │
│   └── utils/              # 🔧 HELPER FUNCTIONS
│       └── projectTransform.ts  # Converts API project → UI project
│
└── ui/                     # (Optional) shadcn/ui components - not used in main flow
```

---

## 2. How the App Starts

**Step-by-step flow when you open http://localhost:5173:**

1. **index.html** loads → finds `<div id="root">` and runs `/src/main.tsx`
2. **main.tsx** → creates React app, renders `<App />` inside that div
3. **App.tsx** → wraps everything in `AuthProvider` (for login state) and `RouterProvider` (for URLs)
4. **Router** → looks at the URL:
   - `/` → redirects to `/home`
   - `/home` → **ProtectedRoute** checks: logged in? → show LandingPage. Not? → redirect to `/login`
   - `/login` → show LoginPage
   - `/register` → show RegisterPage
   - etc.

---

## 3. File-by-File Explanation

### Root Files

#### **index.html**
```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```
- **What it does:** The only HTML file. The `<div id="root">` is where React will inject the entire app.
- **Why:** Single-page app (SPA) — React builds the UI in JavaScript; this is the anchor.

---

#### **package.json**
- **What it does:** Lists dependencies (React, Vite, Tailwind, axios, etc.) and scripts.
- **Important scripts:**
  - `npm run dev` → starts Vite dev server (localhost:5173)
  - `npm run build` → compiles for production

---

#### **vite.config.ts**
```typescript
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
})
```
- **What it does:** Tells Vite to use the React plugin so `.tsx` files work.
- **Why:** Vite is the build tool; this config enables React.

---

#### **tailwind.config.js**
```javascript
content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./ui/**/*.{js,ts,jsx,tsx}"]
```
- **What it does:** Tells Tailwind which files to scan for class names.
- **Why:** Tailwind only includes CSS for classes it finds here (smaller bundle).

---

### src/main.tsx

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

| Line | What it does |
|------|--------------|
| `createRoot(...)` | Finds the `#root` div and prepares it for React |
| `render(<App />)` | Renders the App component into that div |
| `StrictMode` | React development mode that helps find bugs |

---

### src/App.tsx

```typescript
return (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);
```

- **AuthProvider:** Wraps the app so any component can use `useAuth()` (login, logout, token).
- **RouterProvider:** Handles URL routing and shows the right page.

---

### src/routes.tsx

Defines URL → component mapping:

| Path | What happens |
|------|--------------|
| `/` | Redirects to `/home` |
| `/home` | Protected. Shows LandingPage if logged in, else redirects to `/login` |
| `/login` | LoginPage |
| `/register` | RegisterPage |
| `/explore` | Placeholder "coming soon" |
| `/add-project` | Placeholder "coming soon" |
| `/project/:id` | Placeholder "coming soon" |
| `*` (any other) | Redirects to `/home` |

---

### src/auth/token.ts

```typescript
const TOKEN_KEY = "token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
```

- **What it does:** Reads/writes the JWT in `localStorage` under the key `"token"`.
- **Why:** Token must persist across page reloads. `localStorage` survives refresh.
- **Important:** This is the low-level storage layer. AuthContext uses these functions.

---

### src/auth/AuthContext.tsx

```typescript
const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredToken(): string | null {
  if (typeof window === "undefined") return null;  // SSR safety
  return getToken();
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setTokenState] = useState<string | null>(loadStoredToken);

  const login = useCallback((newToken: string) => {
    setToken(newToken);      // Save to localStorage
    setTokenState(newToken); // Update React state (triggers re-render)
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
  }, []);

  const value = useMemo(() => ({
    token,
    isAuthenticated: Boolean(token),
    login,
    logout,
  }), [token, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
```

- **AuthProvider:** Holds `token` in state, loads it from localStorage on start.
- **login(token):** Saves token to localStorage and state.
- **logout():** Clears token from localStorage and state.
- **useAuth():** Hook so any component can access `token`, `isAuthenticated`, `login`, `logout`.
- **loadStoredToken:** Runs once on mount to restore token from localStorage.

---

### src/api/axios.ts

```typescript
export const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

- **What it does:** Creates an axios instance with base URL `http://localhost:8000`.
- **Interceptor:** Before every request, adds `Authorization: Bearer <token>` if a token exists.
- **Why:** Backend expects JWT in the header for protected routes.

---

### src/api/auth.ts

```typescript
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(
    `${API_BASE}/login`,
    credentials,  // { email, password }
    { headers: { "Content-Type": "application/json" } }
  );
  return data;  // { access_token: "..." }
}

export async function register(credentials: RegisterCredentials): Promise<RegisterResponse> {
  const { data } = await axios.post<RegisterResponse>(
    `${API_BASE}/register`,
    credentials,  // { username, email, password }
    ...
  );
  return data;
}
```

- **login():** POST to `/login` with email/password, returns `{ access_token }`.
- **register():** POST to `/register` with username/email/password.
- **Note:** Uses plain `axios`, not `api`, because login/register don’t need a token yet.

---

### src/api/projects.ts

```typescript
export async function fetchProjects(): Promise<ApiProject[]> {
  const { data } = await api.get<...>("/projects");
  return Array.isArray(data) ? data : data.projects ?? [];
}
```

- **What it does:** GET `/projects` using the `api` instance (so JWT is sent).
- **Return handling:** Supports both `[...]` and `{ projects: [...] }` from the backend.

---

### src/types/project.ts

- **ApiProject:** Shape of data from the API (snake_case: `short_description`, `image_url`, etc.).
- **Project:** Shape used in the UI (camelCase: `shortDescription`, `imageUrl`, etc.).
- **Why both:** API and UI use different naming; we convert in `projectTransform.ts`.

---

### src/utils/projectTransform.ts

```typescript
export function transformApiProject(api: ApiProject, index: number): Project {
  return {
    id: String(api.id ?? index),
    title: api.title ?? "Untitled Project",
    shortDescription: api.short_description ?? "",
    imageUrl: api.image_url ?? PLACEHOLDER_IMAGE,
    techStack: api.tech_stack?.length ? api.tech_stack : api.category ? [api.category] : [],
    likes: api.likes ?? 0,
    views: api.views ?? 0,
    comments: api.comments ?? 0,
    featured: index < 4,
    author: {
      name: api.owner?.name ?? username,
      username: api.owner?.username ?? "anonymous",
      avatar: api.owner?.avatar ?? getAvatarUrl(username),
    },
  };
}
```

- **What it does:** Converts API project format to UI project format.
- **Why:** Handles missing fields and different naming with safe defaults.

---

### src/data/mockData.ts

```typescript
export const techStackColors = {
  React: { bg: "bg-cyan-500/20", text: "text-cyan-300" },
  TypeScript: { bg: "bg-blue-500/20", text: "text-blue-300" },
  // ...
};
```

- **What it does:** Maps tech names to Tailwind classes for badges.
- **Why:** Keeps badge styling consistent across project cards.

---

### src/components/ProtectedRoute.tsx

```typescript
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
```

- **What it does:** If not logged in, redirects to `/login`; otherwise renders `children`.
- **Why:** Protects routes like `/home` from unauthenticated users.

---

### src/components/AuthLayout.tsx

- **What it does:** Shared layout for Login and Register: navbar, animated background, title, subtitle.
- **Why:** Keeps auth pages consistent and avoids duplicated layout code.

---

### src/components/Navbar.tsx

- **What it does:** Top bar with logo, Explore, Add Project, Log out.
- **logout():** Clears token and navigates to `/login`.

---

### src/components/ProjectCard.tsx

- **What it does:** Renders one project as a card.
- **Variants:**
  - `hero` — large card with description and stats
  - `featured` — big card with author overlay
  - `compact` — smaller card for the grid

---

### src/components/FeedSection.tsx

- **What it does:** "Trending Now" section with one large featured card and two smaller cards.
- **Uses:** `ProjectCard` with `variant="featured"` and `variant="compact"`.

---

### src/components/ImageWithFallback.tsx

- **What it does:** Renders an image; if it fails to load, shows a placeholder.
- **Why:** Avoids broken images when URLs are invalid or blocked.

---

### src/pages/LoginPage.tsx

**Flow:**
1. User submits email + password.
2. Calls `login()` API → gets `access_token`.
3. Calls `authLogin(access_token)` → saves token via AuthContext.
4. Navigates to `/home`.

**Demo mode:** "Try demo (no backend)" stores a fake token and goes to `/home` so you can see the app without a backend.

---

### src/pages/RegisterPage.tsx

**Flow:**
1. User submits username, email, password.
2. Calls `register()` API.
3. On success, navigates to `/login` so they can sign in.

---

### src/pages/LandingPage.tsx

**Flow:**
1. `useEffect` runs on mount → calls `fetchProjects()`.
2. Converts API data with `transformApiProject()`.
3. Renders:
   - Hero section with first project
   - FeedSection with remaining projects
   - CTA section
   - Footer

**States:** `loading`, `error`, `projects`.

---

## 4. What's Not Working Yet

| Feature | Status | Reason |
|--------|--------|--------|
| **Login** | Needs backend | `POST /login` must exist and return `{ access_token }` |
| **Register** | Needs backend | `POST /register` must exist |
| **Projects list** | Needs backend | `GET /projects` must exist and return project list |
| **Explore page** | Placeholder | No real implementation |
| **Add project page** | Placeholder | No form or API |
| **Project detail page** | Placeholder | No `/project/:id` implementation |

**Demo mode:** "Try demo (no backend)" works without a backend so you can see the home page.

---

## 5. How It Will Work in the Future

### When the backend is ready

1. **Backend** runs at `http://localhost:8000` with:
   - `POST /login` → `{ access_token }`
   - `POST /register` → user object
   - `GET /projects` → list of projects (with JWT in header)

2. **Login:** User enters credentials → API returns token → stored in localStorage → user sees home.

3. **Projects:** Home page calls `GET /projects` with JWT → backend returns projects → displayed in cards.

4. **Explore:** Will call something like `GET /projects?page=1` and show a paginated list.

5. **Add project:** Form will call `POST /projects` with project data.

6. **Project detail:** Will call `GET /projects/:id` and show full project info.

### Suggested next steps

1. Implement Explore page (list + filters).
2. Implement Add Project form and API.
3. Implement Project detail page.
4. Add error handling for 401 (e.g. redirect to login when token expires).
5. Add loading skeletons for better UX.

---

## Quick Reference: Important Concepts

| Concept | Where | Purpose |
|---------|-------|---------|
| **JWT Token** | localStorage, AuthContext | Proves user is logged in |
| **AuthContext** | Wraps entire app | Central place for auth state |
| **ProtectedRoute** | Wraps /home | Blocks unauthenticated access |
| **api (axios)** | api/axios.ts | Sends JWT on every request |
| **transformApiProject** | utils/ | Converts API → UI format |

---

*This guide covers the current state of the DevZ-Go frontend. Update it as you add new features.*
