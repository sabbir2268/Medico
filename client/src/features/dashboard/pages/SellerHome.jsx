import { Store } from "lucide-react";

export default function SellerHome() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Seller area</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Vendor tools</h1>
        <p className="mt-2 max-w-2xl text-muted">
          This page is visible only to accounts with the seller role.
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-soft text-primary">
          <Store className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Seller workspace</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Product listing and order management tools can be added here.
        </p>
      </div>
    </section>
  );
}
