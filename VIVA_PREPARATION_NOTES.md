# DevZ-Go Frontend — Complete Viva Preparation Notes

**Purpose:** Full understanding of languages, logic, architecture, and concepts for your viva/oral exam.

---

# PART 1: LANGUAGES & TECHNOLOGIES USED

## 1.1 Primary Languages

### **TypeScript**
- **What:** Superset of JavaScript that adds static typing
- **Why used:** Catches errors at compile time, better IDE support, self-documenting code
- **Examples in project:**
  - `interface AuthContextValue { token: string | null; ... }` — defines shape of data
  - `useState<Project[]>([])` — generic type for state
  - `Promise<LoginResponse>` — return type of async functions

### **TSX (TypeScript + JSX)**
- **What:** TypeScript files with JSX (HTML-like syntax inside JavaScript)
- **Extension:** `.tsx`
- **Why:** React components need JSX to describe UI; TypeScript adds type safety

### **CSS**
- **Tailwind CSS:** Utility-first CSS framework (classes like `flex`, `p-4`, `rounded-xl`)
- **index.css:** Custom CSS variables (`:root { --accent: #aa3bff; }`), Tailwind directives

### **HTML**
- **index.html:** Single HTML file; React renders everything inside `<div id="root">`

---

## 1.2 Libraries & Frameworks

| Library | Version | Purpose |
|---------|---------|---------|
| **React** | 19.x | UI library — components, state, rendering |
| **React DOM** | 19.x | Renders React to the browser DOM |
| **React Router DOM** | 7.x | Client-side routing (URL → component) |
| **Vite** | 5.x | Build tool — dev server, bundling, HMR |
| **Tailwind CSS** | 3.x | Utility CSS classes |
| **Axios** | 1.x | HTTP client for API calls |
| **Motion** | 12.x | Animations (framer-motion successor) |
| **Lucide React** | 0.5.x | Icon components (Heart, ArrowRight, etc.) |

---

## 1.3 Build & Tooling

- **Vite:** Fast dev server, ES modules, hot module replacement (HMR)
- **TypeScript Compiler (tsc):** Type-checks code
- **PostCSS:** Processes CSS (Tailwind, autoprefixer)
- **ESLint:** Code quality and style

---

# PART 2: REACT CONCEPTS (DETAILED)

## 2.1 Components

**Definition:** Reusable pieces of UI that return JSX.

**Types used in project:**
- **Functional components:** `function LoginPage() { return <div>...</div>; }`
- **No class components** — project uses only functional components

**Example:**
```tsx
export function ProjectCard({ project, variant }: ProjectCardProps) {
  return <Link to={`/project/${project.id}`}>...</Link>;
}
```

---

## 2.2 Props (Properties)

**What:** Data passed from parent to child component.

**Example:**
```tsx
<ProjectCard project={heroProject} variant="hero" />
// project and variant are props
```

**Interface for props:**
```tsx
interface ProjectCardProps {
  project: Project;
  variant?: "hero" | "featured" | "compact";  // ? = optional
}
```

---

## 2.3 State (useState)

**What:** Data that can change over time; when it changes, the component re-renders.

**Syntax:** `const [value, setValue] = useState(initialValue);`

**Examples from project:**

| Component | State | Purpose |
|-----------|-------|---------|
| LoginPage | `email`, `password` | Form input values |
| LoginPage | `error` | Error message to display |
| LoginPage | `loading` | Show "Signing in..." during API call |
| LandingPage | `projects` | List of projects from API |
| LandingPage | `loading` | Show spinner while fetching |
| LandingPage | `error` | Show error banner if fetch fails |
| ImageWithFallback | `didError` | Track if image failed to load |

**Important:** Never mutate state directly. Always use the setter: `setProjects([...])` not `projects.push()`.

---

## 2.4 Side Effects (useEffect)

**What:** Run code when component mounts, updates, or unmounts.

**Syntax:**
```tsx
useEffect(() => {
  // code to run
  return () => { /* cleanup */ };
}, [dependencies]);
```

**LandingPage example — fetching projects:**
```tsx
useEffect(() => {
  let cancelled = false;

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      if (!cancelled) {
        setProjects(data.map((api, i) => transformApiProject(api, i)));
      }
    } catch (err) {
      if (!cancelled) setError(...);
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  loadProjects();
  return () => { cancelled = true; };  // cleanup: prevent state update if unmounted
}, []);  // [] = run only on mount
```

**Why `cancelled`?** If user navigates away before API responds, we avoid `setState` on unmounted component (React warning).

**Dependency array `[]`:** Empty = run once on mount. If we had `[userId]`, it would run when `userId` changes.

---

## 2.5 Context API (createContext, useContext, Provider)

**What:** Share data across many components without passing props through every level.

**Flow:**
1. `createContext(null)` — create a context
2. `Provider` — wrap part of the tree and provide a value
3. `useContext` — consume the value in any child

**AuthContext example:**
```tsx
const AuthContext = createContext<AuthContextValue | null>(null);

// Provider wraps the app
<AuthContext.Provider value={value}>
  {children}
</AuthContext.Provider>

// Any child can use:
const { token, login, logout } = useAuth();
```

**Why Context?** Login state is needed in Navbar, ProtectedRoute, LoginPage — without Context we'd pass props through many layers.

---

## 2.6 Custom Hooks

**What:** Reusable logic that uses other hooks.

**useAuth:**
```tsx
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
```

**Rules of Hooks:** Only call hooks at the top level of a component (not inside loops/conditions).

---

## 2.7 useCallback & useMemo

**useCallback:** Memoize a function so it doesn't change on every render (avoids unnecessary re-renders of children).

```tsx
const login = useCallback((newToken: string) => {
  setToken(newToken);
  setTokenState(newToken);
}, []);  // [] = function never changes
```

**useMemo:** Memoize a computed value.

```tsx
const value = useMemo(() => ({
  token,
  isAuthenticated: Boolean(token),
  login,
  logout,
}), [token, login, logout]);
```

---

## 2.8 Conditional Rendering

**Examples:**
```tsx
{loading && <Loader2 className="animate-spin" />}
{!loading && heroProject && <ProjectCard project={heroProject} />}
{error && <div role="alert">{error}</div>}
{loading ? <Spinner /> : <FeedSection projects={feedProjects} />}
```

---

## 2.9 List Rendering (map)

```tsx
{projects.map((project, index) => (
  <ProjectCard key={project.id} project={project} variant="compact" />
))}
```

**Important:** `key` must be unique and stable (usually `id`). Helps React track which items changed.

---

## 2.10 Event Handling

```tsx
// Form submit — prevent default (stop page reload)
function handleSubmit(e: FormEvent) {
  e.preventDefault();
  // ...
}

// Input change — controlled component
onChange={(e) => setEmail(e.target.value)}
value={email}

// Button click
onClick={handleDemoLogin}
```

**Controlled vs Uncontrolled:** We use controlled inputs — React state is the "source of truth" for the input value.

---

# PART 3: TYPESCRIPT CONCEPTS

## 3.1 Interfaces

**What:** Define the shape of an object.

```tsx
interface Project {
  id: string;
  title: string;
  shortDescription: string;
  imageUrl: string;
  techStack: string[];
  likes: number;
  views: number;
  comments: number;
  featured: boolean;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
}
```

## 3.2 Type Annotations

```tsx
const [projects, setProjects] = useState<Project[]>([]);
async function login(credentials: LoginCredentials): Promise<LoginResponse>
```

## 3.3 Optional Properties

```tsx
owner?: ApiProjectOwner;  // ? means optional
```

## 3.4 Union Types

```tsx
id: string | number;  // can be either
```

## 3.5 Type Assertion (when needed)

```tsx
(err as { response?: { data?: { detail?: string } } }).response?.data?.detail
```

---

# PART 4: AUTHENTICATION LOGIC (FULL FLOW)

## 4.1 JWT (JSON Web Token)

**What:** A string that proves the user is logged in. Backend creates it after successful login.

**Format:** `eyJhbGciOiJIUzI1NiIs...` (header.payload.signature)

**Storage:** `localStorage` under key `"token"` — persists across page refresh.

## 4.2 Authentication Flow Diagram

```
User visits /home
       ↓
ProtectedRoute checks isAuthenticated
       ↓
  ┌────┴────┐
  │         │
  No        Yes
  ↓         ↓
Redirect   Show
to /login  LandingPage


User on Login page, enters email + password
       ↓
Clicks "Sign in"
       ↓
handleSubmit runs
       ↓
POST http://localhost:8000/login { email, password }
       ↓
  ┌────┴────┐
  │         │
Success     Failure
  ↓         ↓
{ access_token }   setError(message)
  ↓
authLogin(access_token)
  ↓
setToken() → localStorage
setTokenState() → React state
  ↓
navigate("/home")
  ↓
ProtectedRoute sees isAuthenticated = true
  ↓
Shows LandingPage
```

## 4.3 How Token is Sent to Backend

**Axios interceptor** in `api/axios.ts`:
```tsx
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Every request** (e.g. `GET /projects`) automatically includes:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 4.4 Logout Flow

```
User clicks "Log out"
       ↓
handleLogout() in Navbar
       ↓
logout() from useAuth
       ↓
removeToken() → localStorage.removeItem("token")
setTokenState(null)
       ↓
navigate("/login", { replace: true })
```

---

# PART 5: API INTEGRATION

## 5.1 API Base URL

All API calls go to: `http://localhost:8000`

## 5.2 Endpoints Used

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | /login | Login | No |
| POST | /register | Create account | No |
| GET | /projects | List projects | Yes (JWT) |

## 5.3 Login API Call

```tsx
const { data } = await axios.post<LoginResponse>(
  "http://localhost:8000/login",
  { email, password },
  { headers: { "Content-Type": "application/json" } }
);
// data = { access_token: "..." }
```

## 5.4 Projects API Call

```tsx
const { data } = await api.get("/projects");
// Uses api instance → JWT automatically added
// Handles both [...array] and { projects: [...] }
```

## 5.5 Error Handling Pattern

```tsx
try {
  const data = await login({ email, password });
  authLogin(data.access_token);
  navigate("/home");
} catch (err) {
  const message = err?.response?.data?.detail ?? "Invalid email or password";
  setError(message);
} finally {
  setLoading(false);
}
```

---

# PART 6: ROUTING LOGIC

## 6.1 React Router Concepts

- **createBrowserRouter:** Defines routes (path → component)
- **RouterProvider:** Renders the component for current URL
- **Link:** Navigate without full page reload (client-side)
- **Navigate:** Programmatic redirect
- **useNavigate:** Hook to navigate in code
- **useLocation:** Get current URL/path

## 6.2 Route Table

| Path | Component | Protected? |
|------|-----------|------------|
| / | Navigate to /home | - |
| /home | LandingPage | Yes |
| /login | LoginPage | No |
| /register | RegisterPage | No |
| /explore | Placeholder | No |
| /add-project | Placeholder | No |
| /project/:id | Placeholder | No |
| * | Navigate to /home | - |

## 6.3 Protected Route Logic

```tsx
if (!isAuthenticated) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}
return <>{children}</>;
```

**replace:** Replaces current history entry (back button won't go to protected page).

---

# PART 7: DATA FLOW & TRANSFORMATION

## 7.1 API → UI Data Flow

```
Backend returns (snake_case):
{
  id: 1,
  title: "My Project",
  short_description: "A cool app",
  image_url: "https://...",
  tech_stack: ["React", "TypeScript"],
  owner: { username: "johndoe" }
}

       ↓ transformApiProject()

UI uses (camelCase):
{
  id: "1",
  title: "My Project",
  shortDescription: "A cool app",
  imageUrl: "https://...",
  techStack: ["React", "TypeScript"],
  author: { username: "johndoe", name: "johndoe", avatar: "..." }
}
```

## 7.2 Why Transform?

- API uses snake_case (Python/backend convention)
- Frontend uses camelCase (JavaScript convention)
- Handle missing fields with defaults
- Generate avatar URL if not provided

---

# PART 8: COMPONENT ARCHITECTURE

## 8.1 Component Tree (Simplified)

```
App
├── AuthProvider (Context)
│   └── RouterProvider
│       └── [Current Route Component]
│           ├── /login → LoginPage
│           │   └── AuthLayout
│           │       └── Form
│           ├── /register → RegisterPage
│           │   └── AuthLayout
│           │       └── Form
│           └── /home → ProtectedRoute
│               └── LandingPage
│                   ├── Navbar
│                   ├── Hero Section
│                   ├── FeedSection
│                   │   └── ProjectCard (x3)
│                   ├── CTA Section
│                   └── Footer
```

## 8.2 Reusable Components

| Component | Used In | Purpose |
|-----------|---------|---------|
| AuthLayout | LoginPage, RegisterPage | Shared navbar, background, title |
| Navbar | LandingPage | Top nav when logged in |
| ProjectCard | LandingPage, FeedSection | Display one project |
| FeedSection | LandingPage | Grid of project cards |
| ImageWithFallback | ProjectCard | Image with error fallback |
| ProtectedRoute | routes.tsx | Guard for /home |

---

# PART 9: TAILWIND CSS CONCEPTS

## 9.1 Utility Classes Used

| Class | Meaning |
|-------|---------|
| `flex` | display: flex |
| `flex-col` | flex-direction: column |
| `items-center` | align-items: center |
| `justify-between` | justify-content: space-between |
| `gap-4` | gap: 1rem |
| `p-4` | padding: 1rem |
| `rounded-xl` | border-radius: 0.75rem |
| `bg-white` | background: white |
| `text-gray-600` | color: gray-600 |
| `hover:bg-gray-50` | background on hover |
| `transition-all` | smooth transitions |
| `md:grid-cols-12` | 12 columns on medium screens and up |
| `col-span-8` | span 8 columns |
| `max-w-[1440px]` | max-width: 1440px |
| `mx-auto` | margin: 0 auto (center) |

## 9.2 Responsive Design

- `md:` = 768px and up
- `lg:` = 1024px and up
- `hidden lg:block` = hidden on mobile, visible on large screens

---

# PART 10: ANIMATION (MOTION LIBRARY)

## 10.1 motion.div

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
```

- **initial:** Starting state
- **animate:** End state
- **transition:** How long, easing

## 10.2 Infinite Animation

```tsx
<motion.div
  animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
/>
```

## 10.3 Scroll-triggered (whileInView)

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
/>
```

Animates when element scrolls into view. `once: true` = animate only first time.

---

# PART 11: IMPORTANT PATTERNS & BEST PRACTICES

## 11.1 Separation of Concerns

- **Auth:** auth/ folder
- **API:** api/ folder
- **UI:** components/ and pages/
- **Types:** types/ folder
- **Utils:** utils/ folder

## 11.2 Single Responsibility

Each component does one thing: ProjectCard displays a project; FeedSection lays out cards; AuthLayout provides layout.

## 11.3 Error Boundaries (Concept)

Not implemented, but for production: wrap components to catch errors and show fallback UI.

## 11.4 Loading & Error States

Always handle: loading (spinner), error (message), success (data).

---

# PART 12: POTENTIAL VIVA QUESTIONS & ANSWERS

### Q1: What is React and why use it?
**A:** React is a JavaScript library for building UIs. We use it for component-based architecture, virtual DOM for performance, and a large ecosystem.

### Q2: What is the difference between state and props?
**A:** Props are passed from parent to child (read-only). State is internal to a component and can change; when it changes, the component re-renders.

### Q3: What is useEffect used for?
**A:** For side effects: fetching data, subscriptions, DOM updates. Runs after render. The dependency array controls when it runs.

### Q4: Why do we use Context API?
**A:** To share auth state (token, login, logout) across many components without prop drilling. Any component can call useAuth().

### Q5: What is JWT and where is it stored?
**A:** JSON Web Token — a string that proves the user is authenticated. Stored in localStorage so it persists across page refreshes.

### Q6: How does the app know if the user is logged in?
**A:** AuthContext holds the token in state. On app load, it reads from localStorage. If token exists, isAuthenticated is true. ProtectedRoute checks this before showing /home.

### Q7: Why use axios instead of fetch?
**A:** Axios has interceptors (to add JWT to every request), better error handling, and simpler syntax. We use an interceptor to attach the token automatically.

### Q8: What is TypeScript and why use it?
**A:** TypeScript adds static types to JavaScript. Catches errors before runtime, improves IDE support, and makes code self-documenting.

### Q9: What is Tailwind CSS?
**A:** Utility-first CSS framework. Instead of writing custom CSS, we use pre-defined classes like `flex`, `p-4`, `rounded-xl`. Speeds up development and keeps styles consistent.

### Q10: What is Vite?
**A:** A build tool and dev server. Provides fast HMR (hot module replacement), uses native ES modules, and bundles the app for production.

### Q11: Explain the login flow step by step.
**A:** User enters email/password → form submit → POST /login → backend returns access_token → we call authLogin(token) → token saved to localStorage and React state → navigate to /home → ProtectedRoute allows access.

### Q12: What happens when we call fetchProjects()?
**A:** Uses the api instance (which has the JWT interceptor) → GET /projects with Authorization header → backend returns project list → we transform each with transformApiProject() → setProjects() updates state → UI re-renders with project cards.

### Q13: Why the cancelled flag in useEffect?
**A:** If the user navigates away before the API responds, the component unmounts. Without the flag, we'd call setState on an unmounted component, causing a React warning. The cleanup sets cancelled=true so we skip the setState.

### Q14: What is a controlled component?
**A:** An input whose value is controlled by React state. We use value={email} and onChange to update state. React is the single source of truth.

### Q15: What is the purpose of the key prop in map?
**A:** Helps React identify which items changed when the list updates. Must be unique and stable (usually id). Without it, React may incorrectly reuse DOM elements.

---

# PART 13: QUICK REFERENCE CHEAT SHEET

| Concept | Code/Syntax |
|---------|-------------|
| State | `useState(initial)` |
| Effect | `useEffect(() => {}, [deps])` |
| Context | `createContext`, `Provider`, `useContext` |
| Memoize fn | `useCallback(fn, [deps])` |
| Memoize value | `useMemo(() => value, [deps])` |
| Navigate | `navigate("/path")` |
| Link | `<Link to="/path">` |
| Protected route | `if (!auth) return <Navigate to="/login" />` |
| API with auth | Use `api` instance (has interceptor) |
| API without auth | Use plain `axios` (login, register) |

---

*Use this document to prepare for your viva. Understand each concept, not just memorize. Good luck!*
