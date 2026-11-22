import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { SetupNeeded } from "@/components/layout/setup-needed";
import { isSupabaseConfigured } from "@/lib/supabase";
import { router } from "./router";

import "@fontsource-variable/fraunces";
import "@fontsource-variable/caveat";
import "@fontsource-variable/work-sans";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    ) : (
      <SetupNeeded />
    )}
  </StrictMode>,
);
