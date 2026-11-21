import { CircleAlert, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function StatePanel({
  variant = "empty",
  title,
  description,
  actionLabel,
  onAction,
  className,
}) {
  const isError = variant === "error";
  const Icon = isError ? CircleAlert : Inbox;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface px-6 py-14 text-center",
        isError && "border-destructive/30 bg-destructive/5",
        className,
      )}
      role={isError ? "alert" : "status"}
    >
      <span
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground",
          isError && "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="font-heading text-base font-semibold text-foreground sm:text-lg">
        {title ?? (isError ? "We couldn't load this section" : "Nothing here yet")}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        {description ??
          (isError
            ? "There was a problem reaching the pharmacy catalog. Please try again in a moment."
            : "Check back soon — our pharmacy partners are adding new items every day.")}
      </p>
      {actionLabel && onAction && (
        <Button
          variant={isError ? "primary" : "outline"}
          size="sm"
          className="mt-5"
          onClick={onAction}
        >
          {isError && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
