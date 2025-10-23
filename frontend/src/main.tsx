import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppContextProvider } from "./contexts/AppContext.tsx";
import { SearchContextProvider } from "./contexts/SearchContext.tsx";
import { fetchCsrfToken } from "./utils/csrf.ts";

// Migration: Move old auth_token to new Zustand store
if (typeof window !== 'undefined') {
  const oldToken = localStorage.getItem('auth_token');
  if (oldToken && !localStorage.getItem('auth-storage')) {
    // User will need to re-login to get refresh token
    localStorage.removeItem('auth_token');
  }
  
  // Fetch CSRF token on app initialization
  fetchCsrfToken().catch(err => {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to initialize CSRF token:', errorMsg);
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppContextProvider>
        <SearchContextProvider>
          <App />
        </SearchContextProvider>
      </AppContextProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
