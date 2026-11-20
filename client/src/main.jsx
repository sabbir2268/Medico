import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { AppProviders } from "@/app/providers/AppProviders";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import "@/config/env";
import "@/styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);
