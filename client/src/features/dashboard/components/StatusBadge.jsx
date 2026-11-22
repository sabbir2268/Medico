import { cn } from "@/lib/cn";

const TONES = {
  pending: "bg-warning/10 text-warning",
  processing: "bg-info/10 text-info",
  shipped: "bg-primary-soft text-primary",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  paid: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
  expired: "bg-muted/20 text-muted",
  refunded: "bg-warning/10 text-warning",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        TONES[status] ?? "bg-hover text-muted",
      )}
    >
      {status ?? "unknown"}
    </span>
  );
}
