import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthProvider";
import { QueryProvider } from "./QueryProvider";

export function AppProviders({ children }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 4000 }}
        />
      </AuthProvider>
    </QueryProvider>
  );
}
