import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { AuthBootstrap } from "./components/AuthBootstrap";
import { router } from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
    </AuthProvider>
  );
}
