import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProjectFormPage } from "./pages/ProjectFormPage";
import { LandingPage } from "./pages/LandingPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ExplorePage } from "./pages/ExplorePage";

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
      {
        path: "/explore",
        element: (
          <ProtectedRoute>
            <ExplorePage />
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
        path: "/project/:id",
        element: (
          <ProtectedRoute>
            <ProjectDetailPage />
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
