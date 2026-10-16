import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { AuthBootstrap } from "./components/AuthBootstrap";
import { ThemeProvider } from "./context/ThemeContext";
import { router } from "./routes";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthBootstrap>
          <RouterProvider router={router} />
        </AuthBootstrap>
      </AuthProvider>
    </ThemeProvider>
  );
}
