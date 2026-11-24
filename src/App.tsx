import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { AuthBootstrap } from "./components/AuthBootstrap";
import { AppNoticeProvider } from "./components/AppNotice";
import { ThemeProvider } from "./context/ThemeContext";
import { router } from "./routes";
import { RealtimeProvider } from "./realtime/RealtimeProvider";
import { queryClient } from "./api/queryKeys";

export default function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthBootstrap>
          <AppNoticeProvider>
            <RealtimeProvider>
              <RouterProvider router={router} />
            </RealtimeProvider>
          </AppNoticeProvider>
        </AuthBootstrap>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}
