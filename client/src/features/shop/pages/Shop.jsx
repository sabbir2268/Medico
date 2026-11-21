import { CatalogPanel } from "../components/CatalogPanel";

export default function Shop() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Pharmacy catalog</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Shop medicines</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Search the full catalog by medicine, generic name, or manufacturer. Filter by
          category, compare prices, and open any product for complete details.
        </p>
      </div>

      <CatalogPanel />
    </div>
  );
}
