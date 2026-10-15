import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { AuthBootstrap } from "./components/AuthBootstrap";
import { router } from "./routes";
import { RealtimeProvider } from "./realtime/RealtimeProvider";
import { queryClient } from "./api/queryKeys";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthBootstrap>
          <RealtimeProvider>
            <RouterProvider router={router} />
          </RealtimeProvider>
        </AuthBootstrap>
      </AuthProvider>
    </QueryClientProvider>
  );
}
