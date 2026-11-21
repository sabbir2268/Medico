import { ShoppingBag } from "lucide-react";

export default function SellerHome() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Seller</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Seller workspace</h1>
        <p className="mt-2 max-w-2xl text-muted">
          This area is reserved for seller-only tools. Product, inventory, and order
          management will be added in a later phase.
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-soft text-primary">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Role access is working</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Only accounts with the seller role can reach this route. Customers are
          redirected to their dashboard.
        </p>
      </div>
    </section>
  );
}
