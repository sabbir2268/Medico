import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SORT_OPTIONS } from "../constants/endpoints";

const controlClass =
  "h-10 w-full rounded-control border border-line bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/25";

function Select({ id, label, value, onChange, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-muted uppercase"
      >
        {label}
      </label>
      <select id={id} value={value} onChange={onChange} className={controlClass}>
        {children}
      </select>
    </div>
  );
}

export function MedicineFilters({
  params,
  categories = [],
  showCategory = true,
  categoryName,
}) {
  const { update } = params;
  const { register, control, setValue, handleSubmit } = useForm({
    defaultValues: { search: params.search },
  });
  const searchValue = useWatch({ control, name: "search" });

  // Keep the field in sync when the URL changes (back / forward, clear filters).
  useEffect(() => {
    setValue("search", params.search);
  }, [params.search, setValue]);

  // Debounce typing so the URL (and the query) is not rewritten on every key.
  useEffect(() => {
    if ((searchValue ?? "").trim() === params.search) return;

    const timer = setTimeout(() => update({ q: (searchValue ?? "").trim() }), 350);

    return () => clearTimeout(timer);
  }, [searchValue, params.search, update]);

  return (
    <form
      onSubmit={handleSubmit((values) => update({ q: (values.search ?? "").trim() }))}
      className="rounded-card border border-line bg-surface p-4 shadow-card"
      noValidate
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div>
          <label
            htmlFor="catalog-search"
            className="mb-1.5 block text-xs font-semibold text-muted uppercase"
          >
            Search medicines
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              type="search"
              placeholder="Search by name, generic name, or company"
              className={`${controlClass} pl-10`}
              autoComplete="off"
              {...register("search")}
            />
          </div>
        </div>

        {showCategory ? (
          <Select
            id="catalog-category"
            label="Category"
            value={params.category}
            onChange={(event) => params.update({ category: event.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        ) : (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted uppercase">Category</p>
            <p className="truncate rounded-control bg-secondary px-3 py-2.5 text-sm font-medium text-secondary-foreground">
              {categoryName || "Medicines"}
            </p>
          </div>
        )}

        <Select
          id="catalog-sort"
          label="Sort by"
          value={params.sort}
          onChange={(event) => params.update({ sort: event.target.value })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={params.clear}
          disabled={!params.hasFilters}
          className="h-10"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Clear
        </Button>
      </div>
    </form>
  );
}
