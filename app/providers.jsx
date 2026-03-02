"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/hooks/useAuth";

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:          1000 * 60 * 2,  // 2 min
            retry:              1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f1d2e",
              color:      "#f1f5f9",
              border:     "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              fontSize:   "14px",
            },
            success: { iconTheme: { primary: "#2dd4bf", secondary: "#0f1d2e" } },
            error:   { iconTheme: { primary: "#f87171", secondary: "#0f1d2e" } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
