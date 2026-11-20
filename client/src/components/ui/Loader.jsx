import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function Loader({ className, label = "Loading" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center justify-center py-8", className)}
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
