import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, PackageCheck, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatePanel } from "@/components/shared/StatePanel";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { downloadInvoice } from "@/features/checkout/services/checkoutServices";
import { formatPrice } from "@/lib/format";
import { PATHS } from "@/utils/paths";
import { useCancelOrder, useOrder } from "../hooks/useDashboard";

const STEPS = ["pending", "processing", "shipped", "delivered"];

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const { data: order, isPending, isError, error } = useOrder(id);
  const cancelMutation = useCancelOrder();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isPending) {
    return <div className="h-72 animate-pulse rounded-card bg-surface" aria-busy="true" />;
  }

  if (isError || !order) {
    return (
      <StatePanel
        variant="error"
        title="Order not found"
        description={error?.message ?? "This order does not exist or belongs to another account."}
        actionLabel="Back to orders"
        onAction={() => window.location.assign(PATHS.ORDERS)}
      />
    );
  }

  const currentStep = STEPS.indexOf(order.status);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">Order details</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="font-heading text-lg font-semibold">Purchased medicines</h2>
            <div className="mt-4 divide-y divide-line">
              {order.items.map((item) => (
                <div key={item.medicineId} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="h-14 w-14 rounded-control border border-line object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-control bg-secondary text-primary">
                      <PackageCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.manufacturer || "—"} · {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-heading font-semibold">{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="font-heading text-lg font-semibold">Delivery</h2>
            <div className="mt-3 text-sm leading-relaxed text-muted">
              <p className="font-medium text-foreground">{order.delivery.fullName}</p>
              <p>{order.delivery.addressLine1}</p>
              {order.delivery.addressLine2 && <p>{order.delivery.addressLine2}</p>}
              <p>
                {order.delivery.city}, {order.delivery.postalCode}, {order.delivery.country}
              </p>
              <p>Phone: {order.delivery.phone}</p>
              {order.delivery.instructions && (
                <p className="mt-2 italic">Note: {order.delivery.instructions}</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="font-heading text-lg font-semibold">Status</h2>
            <ol className="mt-5 space-y-4">
              {STEPS.map((step, index) => (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      currentStep >= index ? "bg-primary text-primary-foreground" : "bg-hover text-muted"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`text-sm capitalize ${
                      currentStep >= index ? "font-semibold text-foreground" : "text-muted"
                    }`}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
            {order.status === "cancelled" && (
              <p className="mt-4 flex items-center gap-2 rounded-control bg-destructive/10 p-3 text-xs text-destructive">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                This order was cancelled on{" "}
                {order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : "—"}.
              </p>
            )}
          </section>

          <section className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="font-heading text-lg font-semibold">Payment summary</h2>
            <div className="mt-3">
              <Row label="Subtotal" value={formatPrice(order.pricing.subtotal)} />
              <Row label="Discounts" value={`- ${formatPrice(order.pricing.discount)}`} />
              <Row label="Delivery" value={formatPrice(order.pricing.deliveryCharge)} />
              <div className="flex items-center justify-between pt-3">
                <span className="font-heading font-semibold">Total</span>
                <span className="font-heading text-xl font-bold text-primary">
                  {formatPrice(order.pricing.total)}
                </span>
              </div>
            </div>

            {order.prescription?.required && (
              <p className="mt-4 rounded-control bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                Prescription verification: {order.prescription.status}. A pharmacist will review
                before dispatch.
              </p>
            )}

            <Button variant="outline" className="mt-5 w-full" onClick={() => downloadInvoice(order.id)}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download invoice
            </Button>

            {["pending", "processing"].includes(order.status) && order.paymentStatus !== "paid" && (
              <Button
                variant="danger"
                className="mt-3 w-full"
                onClick={() => setConfirmOpen(true)}
              >
                Cancel order
              </Button>
            )}

            <Link
              to={PATHS.ORDERS}
              className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
            >
              Back to all orders
            </Link>
          </section>

          {order.paymentStatus === "paid" && (
            <p className="flex items-center justify-center gap-2 text-xs text-muted">
              <Truck className="h-4 w-4" aria-hidden="true" />
              Your order is being prepared by verified vendors.
            </p>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this order?"
        description="Reserved stock will be restored. This cannot be undone."
        confirmLabel="Yes, cancel order"
        loading={cancelMutation.isPending}
        onConfirm={async () => {
          await cancelMutation.mutateAsync(order.id);
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
