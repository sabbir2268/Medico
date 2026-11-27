import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatePanel } from "@/components/shared/StatePanel";

export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-control bg-hover" />
      ))}
    </div>
  );
}

export function AdminContent({ query, emptyTitle, emptyDescription, children }) {
  if (query.isPending) return <AdminTableSkeleton />;

  if (query.isError) {
    return (
      <StatePanel
        variant="error"
        title="Couldn't load this section"
        description={query.error?.message}
        actionLabel="Try again"
        onAction={query.refetch}
      />
    );
  }

  const items = query.data?.items ?? [];
  if (!items.length) {
    return <StatePanel title={emptyTitle} description={emptyDescription} />;
  }

  return children;
}

export function PaginationControls({ pagination, page, setPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <Button
        size="sm"
        variant="outline"
        disabled={!pagination.hasPrev}
        onClick={() => setPage(Math.max(1, page - 1))}
      >
        Previous
      </Button>
      <span className="text-sm text-muted">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={!pagination.hasNext}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <label className="relative block w-full sm:w-64">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-control border border-line bg-background py-2 pr-3 pl-9 text-sm"
      />
    </label>
  );
}

