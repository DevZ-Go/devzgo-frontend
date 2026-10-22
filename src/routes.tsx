import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProjectFormPage } from "./pages/ProjectFormPage";
import { LandingPage } from "./pages/LandingPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage, ResetPasswordPage } from "./pages/PasswordResetPages";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { GitHubOnboardingPage } from "./pages/GitHubOnboardingPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ExplorePage } from "./pages/ExplorePage";
import { ThemeSelectPage } from "./pages/ThemeSelectPage";
import { CardsWorldPage } from "./pages/CardsWorldPage";
import { StudioWallPage } from "./pages/StudioWallPage";
import { CatalogPage } from "./pages/CatalogPage";
import { DevelopersPage } from "./pages/DevelopersPage";
import { WrapPage } from "./pages/WrapPage";
import { NetworkPage } from "./pages/NetworkPage";
import { ConnectionsPage } from "./pages/ConnectionsPage";
import { PostPage } from "./pages/PostPage";
import { MessagesPage } from "./pages/MessagesPage";
import { GitHubImportPage } from "./pages/GitHubImportPage";

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
