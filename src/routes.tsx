import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProjectFormPage } from "./pages/ProjectFormPage";
import { LandingPage } from "./pages/LandingPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage, ResetPasswordPage } from "./pages/PasswordResetPages";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ExplorePage } from "./pages/ExplorePage";
import { ThemeSelectPage } from "./pages/ThemeSelectPage";
import { CardsWorldPage } from "./pages/CardsWorldPage";
import { DevelopersPage } from "./pages/DevelopersPage";
import { WrapPage } from "./pages/WrapPage";
import { NetworkPage } from "./pages/NetworkPage";
import { MessagesPage } from "./pages/MessagesPage";

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
      {
        path: "/network",
        element: (
          <ProtectedRoute>
            <NetworkPage />
          </ProtectedRoute>
        ),
      },
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
