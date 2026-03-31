import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AddProjectPage } from "./pages/AddProjectPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/home" replace />,
  },
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Explore page – coming soon</p>
      </div>
    ),
  },
  {
    path: "/add-project",
    element: (
      <ProtectedRoute>
        <AddProjectPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/project/:id",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Project detail page – coming soon</p>
      </div>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/home" replace />,
  },
]);
