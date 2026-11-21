import { AlertTriangle, Loader2, PackageOpen, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { cn } from "@/lib/cn";

export function SectionError({
  title = "We couldn't load this section",
  message = "The live catalog is temporarily unavailable. Please try again.",
  onRetry,
  isRetrying = false,
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-4 rounded-card border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function SectionEmpty({
  title = "Nothing here yet",
  message = "New items will appear here as soon as they are available.",
  actionLabel,
  actionTo,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <PackageOpen className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{message}</p>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-5")}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 rounded-card border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
      <div className="space-y-4">
        <div className="h-6 w-32 rounded-full bg-line/60" />
        <div className="h-10 w-full max-w-lg rounded-control bg-line/60" />
        <div className="h-10 w-4/5 max-w-md rounded-control bg-line/60" />
        <div className="h-5 w-full max-w-xl rounded-control bg-line/50" />
        <div className="h-5 w-3/4 max-w-lg rounded-control bg-line/50" />
        <div className="flex gap-3 pt-3">
          <div className="h-11 w-40 rounded-control bg-line/60" />
          <div className="h-11 w-40 rounded-control bg-line/50" />
        </div>
      </div>
      <div className="h-64 rounded-card bg-line/50 sm:h-80 lg:h-[26rem]" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="aspect-[4/3] animate-pulse bg-line/50" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-line/60" />
        <div className="h-5 w-full animate-pulse rounded bg-line/60" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-line/50" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-line/50" />
        <div className="flex justify-between gap-3 pt-3">
          <div className="h-7 w-20 animate-pulse rounded bg-line/60" />
          <div className="h-9 w-16 animate-pulse rounded-control bg-line/50" />
        </div>
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="h-11 w-11 animate-pulse rounded-control bg-line/60" />
      <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-line/60" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-line/50" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-line/50" />
    </div>
  );
}

export function TipCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="aspect-[16/10] animate-pulse bg-line/50" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-line/60" />
        <div className="h-6 w-full animate-pulse rounded bg-line/60" />
        <div className="h-4 w-full animate-pulse rounded bg-line/50" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-line/50" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 8 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <CategoryCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function TipGridSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <TipCardSkeleton key={index} />
      ))}
    </div>
  );
}
