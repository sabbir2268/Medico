import { AlertTriangle } from "lucide-react";
import { isFirebaseConfigured } from "@/config/env";

export function FirebaseNotice() {
  if (isFirebaseConfigured) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex gap-3 rounded-card border border-warning/30 bg-warning/10 p-4 text-sm"
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-warning"
        aria-hidden="true"
      />
      <div>
        <p className="font-medium text-foreground">Firebase is not configured</p>
        <p className="mt-1 text-muted">
          Add your Firebase web keys to the client environment file to enable sign-in and
          registration.
        </p>
      </div>
    </div>
  );
}
