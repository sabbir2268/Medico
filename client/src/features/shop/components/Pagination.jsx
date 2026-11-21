import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function pageNumbers(page, totalPages) {
  const span = 2;
  const start = Math.max(1, page - span);
  const end = Math.min(totalPages, start + span * 2);
  const first = Math.max(1, end - span * 2);

  return Array.from({ length: end - first + 1 }, (_, index) => first + index);
}

export function Pagination({ pagination, onPageChange, isFetching = false }) {
  const { page, limit, total, totalPages, hasPrev, hasNext } = pagination;

  if (!total) return null;

  const firstItem = (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        Showing <span className="font-semibold text-foreground">{firstItem}</span>–
        <span className="font-semibold text-foreground">{lastItem}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> medicines
      </p>

      <nav
        aria-label="Catalog pagination"
        className="flex flex-wrap items-center gap-1.5"
      >
        <Button
          size="sm"
          variant="outline"
          disabled={!hasPrev || isFetching}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>

        {pageNumbers(page, totalPages).map((number) => (
          <Button
            key={number}
            size="sm"
            variant={number === page ? "primary" : "outline"}
            disabled={isFetching}
            onClick={() => onPageChange(number)}
            aria-current={number === page ? "page" : undefined}
            aria-label={`Page ${number}`}
            className={cn("min-w-9 px-2")}
          >
            {number}
          </Button>
        ))}

        <Button
          size="sm"
          variant="outline"
          disabled={!hasNext || isFetching}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}
