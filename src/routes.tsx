import { lazy, type ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const RELOADED_KEY = "devzgo.chunkReload";

/** Loads a page's code when it is first opened. After a deploy, old chunk names are gone, so reload once to fetch the new ones. */
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() =>
    load().then(
      (module) => {
        sessionStorage.removeItem(RELOADED_KEY);
        return { default: module[name] };
      },
      (error: unknown) => {
        if (!sessionStorage.getItem(RELOADED_KEY)) {
          sessionStorage.setItem(RELOADED_KEY, "1");
          window.location.reload();
          return new Promise<never>(() => {});
        }
        throw error;
      }
    )
  );
}

const ProjectFormPage = page(() => import("./pages/ProjectFormPage"), "ProjectFormPage");
const LandingPage = page(() => import("./pages/LandingPage"), "LandingPage");
const ProfilePage = page(() => import("./pages/ProfilePage"), "ProfilePage");
const LoginPage = page(() => import("./pages/LoginPage"), "LoginPage");
const RegisterPage = page(() => import("./pages/RegisterPage"), "RegisterPage");
const ForgotPasswordPage = page(() => import("./pages/PasswordResetPages"), "ForgotPasswordPage");
const ResetPasswordPage = page(() => import("./pages/PasswordResetPages"), "ResetPasswordPage");
const AuthCallbackPage = page(() => import("./pages/AuthCallbackPage"), "AuthCallbackPage");
const GitHubOnboardingPage = page(() => import("./pages/GitHubOnboardingPage"), "GitHubOnboardingPage");
const SettingsPage = page(() => import("./pages/SettingsPage"), "SettingsPage");
const ProjectDetailPage = page(() => import("./pages/ProjectDetailPage"), "ProjectDetailPage");
const ExplorePage = page(() => import("./pages/ExplorePage"), "ExplorePage");
const ThemeSelectPage = page(() => import("./pages/ThemeSelectPage"), "ThemeSelectPage");
const CardsWorldPage = page(() => import("./pages/CardsWorldPage"), "CardsWorldPage");
const StudioWallPage = page(() => import("./pages/StudioWallPage"), "StudioWallPage");
const CatalogPage = page(() => import("./pages/CatalogPage"), "CatalogPage");
const DevelopersPage = page(() => import("./pages/DevelopersPage"), "DevelopersPage");
const WrapPage = page(() => import("./pages/WrapPage"), "WrapPage");
const NetworkPage = page(() => import("./pages/NetworkPage"), "NetworkPage");
const ConnectionsPage = page(() => import("./pages/ConnectionsPage"), "ConnectionsPage");
const PostPage = page(() => import("./pages/PostPage"), "PostPage");
const MessagesPage = page(() => import("./pages/MessagesPage"), "MessagesPage");
const GitHubImportPage = page(() => import("./pages/GitHubImportPage"), "GitHubImportPage");

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/home" replace />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/home",
        element: (
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/auth/callback", element: <AuthCallbackPage /> },
      { path: "/auth/github/onboarding", element: <GitHubOnboardingPage /> },
      { path: "/settings", element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
      {
        path: "/network",
        element: (
          <ProtectedRoute>
            <NetworkPage />
          </ProtectedRoute>
        ),
      },
      { path: "/network/connections", element: <ProtectedRoute><ConnectionsPage /></ProtectedRoute> },
      { path: "/network/post/:id", element: <ProtectedRoute><PostPage /></ProtectedRoute> },
      {
        path: "/messages",
        element: (
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore",
        element: (
          <ProtectedRoute>
            <ThemeSelectPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore/tv",
        element: (
          <ProtectedRoute>
            <ExplorePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore/cards",
        element: (
          <ProtectedRoute>
            <CardsWorldPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore/studio",
        element: (
          <ProtectedRoute>
            <StudioWallPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore/folio",
        element: <Navigate to="/explore/catalog" replace />,
      },
      {
        path: "/explore/lanterns",
        element: <Navigate to="/explore/catalog" replace />,
      },
      {
        path: "/explore/catalog",
        element: (
          <ProtectedRoute>
            <CatalogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore/developers",
        element: (
          <ProtectedRoute>
            <DevelopersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/add-project",
        element: (
          <ProtectedRoute>
            <ProjectFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/import/github",
        element: (
          <ProtectedRoute>
            <GitHubImportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/project/:id/edit",
        element: (
          <ProtectedRoute>
            <ProjectFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile/:id",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/project/:id",
        element: (
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/wrap",
        element: (
          <ProtectedRoute>
            <WrapPage />
          </ProtectedRoute>
        ),
      },

    ],
  },
  {
    path: "*",
    element: <Navigate to="/home" replace />,
  },
]);
