import { cn } from "@/lib/cn";
import { StatePanel } from "./StatePanel";

export function CardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-card border border-line bg-surface p-3"
      aria-hidden="true"
    >
      <div className="aspect-[4/3] rounded-control bg-hover" />
      <div className="mt-4 h-3 w-1/3 rounded-full bg-hover" />
      <div className="mt-3 h-4 w-5/6 rounded-full bg-hover" />
      <div className="mt-2 h-3 w-2/3 rounded-full bg-hover" />
      <div className="mt-5 h-8 w-full rounded-control bg-hover" />
    </div>
  );
}

export function SkeletonGrid({ count = 4, className }) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4", className)}
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Single entry point for the three async states. Each section passes the
 * result of its TanStack Query hook and receives either skeletons, an empty /
 * error panel, or the rendered content.
 */
export function AsyncContent({ query, skeleton, empty, children, className }) {
  if (query.isPending) {
    return <div className={className}>{skeleton ?? <SkeletonGrid />}</div>;
  }

  if (query.isError) {
    return (
      <div className={className}>
        <StatePanel
          variant="error"
          description={query.error?.message}
          actionLabel="Try again"
          onAction={query.refetch}
        />
      </div>
    );
  }

  if (query.isEmpty) {
    return <div className={className}>{empty ?? <StatePanel variant="empty" />}</div>;
  }

  return <div className={className}>{children}</div>;
}
