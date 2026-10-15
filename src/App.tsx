import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { AuthBootstrap } from "./components/AuthBootstrap";
import { router } from "./routes";
import { RealtimeProvider } from "./realtime/RealtimeProvider";

export default function App() {
  return (
    <AuthProvider>
      <AuthBootstrap>
        <RealtimeProvider>
          <RouterProvider router={router} />
        </RealtimeProvider>
      </AuthBootstrap>
    </AuthProvider>
  );
}
