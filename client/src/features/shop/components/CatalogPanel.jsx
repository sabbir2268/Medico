import { useCallback, useMemo, useState } from "react";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { StatePanel } from "@/components/shared/StatePanel";
import { notify } from "@/lib/notify";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { useCategories } from "@/features/home/hooks/useHomeData";
import { useCatalogParams } from "../hooks/useCatalogParams";
import { useMedicines } from "../hooks/useMedicines";
import { MedicineDetailsModal } from "./MedicineDetailsModal";
import { MedicineFilters } from "./MedicineFilters";
import { MedicineTable } from "./MedicineTable";
import { Pagination } from "./Pagination";
import { TableSkeleton } from "./TableSkeleton";

export function CatalogPanel({
  lockedCategoryId,
  categoryName,
  emptyDescription = "Try a different search term or clear your filters to see more medicines.",
}) {
  const params = useCatalogParams({ lockedCategoryId });
  const add = useAddToCart();
  const categoriesQuery = useCategories();
  const medicinesQuery = useMedicines(params);
  const [selected, setSelected] = useState(null);

  const categories = categoriesQuery.items;
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const handleAddToCart = useCallback(
    async (medicine) => {
      const count = await add(medicine);
      if (count === null) return;

      notify.success(
        `${medicine.name} added to your cart. ${count} item${count === 1 ? "" : "s"} total.`,
      );
    },
    [add],
  );

  const handleDetails = useCallback((medicine) => setSelected(medicine), []);
  const handlePageChange = useCallback(
    (page) => params.update({ page }, { resetPage: false }),
    [params],
  );

  const { pagination } = medicinesQuery;
  const showPagination =
    !medicinesQuery.isPending && !medicinesQuery.isError && pagination.total > 0;

  return (
    <div className="space-y-5">
      <MedicineFilters
        params={params}
        categories={categories}
        showCategory={!lockedCategoryId}
        categoryName={categoryName}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {medicinesQuery.isPending
            ? "Loading medicines..."
            : `${pagination.total} medicine${pagination.total === 1 ? "" : "s"} found`}
        </p>
        {medicinesQuery.isFetching && !medicinesQuery.isPending && (
          <span className="text-xs font-medium text-primary">Updating results…</span>
        )}
        {medicinesQuery.isFallback && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
            Demo catalog
          </span>
        )}
      </div>

      <AsyncContent
        query={medicinesQuery}
        skeleton={<TableSkeleton />}
        empty={
          <StatePanel
            title="No medicines found"
            description={emptyDescription}
            actionLabel="Clear filters"
            onAction={params.clear}
          />
        }
      >
        <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <MedicineTable
            medicines={medicinesQuery.items}
            categories={categories}
            onDetails={handleDetails}
            onAddToCart={handleAddToCart}
          />
        </div>
      </AsyncContent>

      {showPagination && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          isFetching={medicinesQuery.isFetching}
        />
      )}

      {selected && (
        <MedicineDetailsModal
          medicine={selected}
          categoryName={
            categoryNames[
              selected.categoryId ?? selected.category?.id ?? selected.category?._id
            ] ??
            categoryName ??
            "Uncategorized"
          }
          onClose={() => setSelected(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
