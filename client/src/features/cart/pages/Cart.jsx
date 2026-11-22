import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShieldCheck, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatePanel } from "@/components/shared/StatePanel";
import { Visual } from "@/components/shared/Visual";
import { formatPrice } from "@/lib/format";
import { PATHS } from "@/utils/paths";
import { useCart } from "../hooks/useCart";

function CartSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-28 rounded-card border border-line bg-surface" />
      ))}
    </div>
  );
}

function QuantityControl({ value, max, onChange, disabled }) {
  return (
    <div className="inline-flex items-center rounded-control border border-line">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-r-none"
        aria-label="Decrease quantity"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <span className="w-9 text-center text-sm font-semibold" aria-live="polite">
        {value}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-l-none"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}

function SummaryRow({ label, value, muted, strong }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={muted ? "text-muted" : "text-foreground"}>{label}</span>
      <span className={strong ? "font-heading text-lg font-bold text-foreground" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { cart, isPending, isError, query, update, remove, clear, isMutating, isGuest } = useCart();

  if (isPending) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Your cart</h1>
        <CartSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <StatePanel
        variant="error"
        title="We couldn't load your cart"
        description="Please check your connection and try again."
        actionLabel="Try again"
        onAction={query.refetch}
      />
    );
  }

  if (!cart.items.length) {
    return (
      <StatePanel
        title="Your cart is empty"
        description="Browse verified medicines from trusted pharmacy vendors and add them here."
        actionLabel="Browse medicines"
        onAction={() => navigate(PATHS.SHOP)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">Checkout preview</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Your cart</h1>
          <p className="mt-2 text-sm text-muted" aria-live="polite">
            {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"} from verified vendors
            {isGuest ? " · stored on this device until you sign in" : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" disabled={isMutating} onClick={clear}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Clear cart
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Cart items" className="space-y-3">
          {cart.items.map((item) => {
            const medicine = item.medicine ?? {};
            const max = item.availableStock ?? 99;

            return (
              <article
                key={item.medicineId}
                className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center"
              >
                <div className="w-full shrink-0 sm:w-28">
                  {medicine.image ? (
                    <img
                      src={medicine.image}
                      alt={medicine.name}
                      className="h-24 w-full rounded-control border border-line object-cover sm:h-20"
                    />
                  ) : (
                    <Visual
                      name={medicine.visual ?? "capsule"}
                      tone={medicine.tone ?? "teal"}
                      className="h-24 w-full sm:h-20"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                    {medicine.manufacturer ?? medicine.vendor}
                  </p>
                  <h2 className="mt-1 truncate font-heading text-sm font-semibold sm:text-base">
                    {medicine.name}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {formatPrice(item.unitPrice)} per unit
                    {item.originalUnitPrice > item.unitPrice && (
                      <span className="ml-2 line-through">
                        {formatPrice(item.originalUnitPrice)}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs font-medium text-success">
                    {max} in stock
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <QuantityControl
                    value={item.quantity}
                    max={max}
                    disabled={isMutating}
                    onChange={(quantity) => update(item.medicineId, quantity)}
                  />
                  <span className="font-heading text-base font-bold">
                    {formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${medicine.name} from cart`}
                    disabled={isMutating}
                    onClick={() => remove(item.medicineId)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </Button>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="h-fit rounded-card border border-line bg-surface p-6 shadow-card lg:sticky lg:top-24">
          <h2 className="font-heading text-lg font-semibold">Order summary</h2>
          <div className="mt-5 space-y-3">
            <SummaryRow label="Subtotal" value={formatPrice(cart.subtotal)} />
            <SummaryRow
              label="Discounts"
              value={`- ${formatPrice(cart.discount ?? 0)}`}
              muted
            />
            <SummaryRow
              label="Delivery"
              value={cart.deliveryCharge ? formatPrice(cart.deliveryCharge) : "Free"}
              muted
            />
            <div className="border-t border-line pt-3">
              <SummaryRow label="Total" value={formatPrice(cart.total)} strong />
            </div>
          </div>

          {cart.deliveryCharge > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-control bg-secondary p-3 text-xs text-secondary-foreground">
              <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Add {formatPrice((cart.freeDeliveryThreshold ?? 1000) - (cart.subtotal - (cart.discount ?? 0)))} more for free delivery.
            </p>
          )}

          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={isMutating}
            onClick={() => navigate(PATHS.CHECKOUT)}
          >
            Proceed to checkout
          </Button>
          <Link
            to={PATHS.SHOP}
            className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
          >
            Continue shopping
          </Link>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Prices and stock are verified by the server
          </p>
        </aside>
      </div>
    </div>
  );
}
