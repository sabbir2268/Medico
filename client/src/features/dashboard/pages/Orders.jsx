import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, Eye, Package, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatePanel } from "@/components/shared/StatePanel";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { formatPrice } from "@/lib/format";
import { PATHS } from "@/utils/paths";
import { downloadInvoice } from "@/features/checkout/services/checkoutServices";
import { useCancelOrder, useOrders } from "../hooks/useDashboard";

function OrdersSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-card border border-line bg-surface" />
      ))}
    </div>
  );
}

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const { data, isPending, isError, error, refetch } = useOrders({ page, limit: 10 });
  const cancelMutation = useCancelOrder();
  const [pendingCancel, setPendingCancel] = useState(null);

  const orders = data?.items ?? [];
  const pagination = data?.pagination;

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    await cancelMutation.mutateAsync(pendingCancel.id);
    setPendingCancel(null);
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Your account</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Order history</h1>
        <p className="mt-2 text-sm text-muted">Review past purchases and track current orders.</p>
      </div>

      {isPending ? (
        <OrdersSkeleton />
      ) : isError ? (
        <StatePanel
          variant="error"
          title="Couldn't load your orders"
          description={error?.message}
          actionLabel="Try again"
          onAction={refetch}
        />
      ) : orders.length === 0 ? (
        <StatePanel
          title="No orders yet"
          description="Your orders will appear here once you complete a checkout."
          actionLabel="Browse medicines"
          onAction={() => window.location.assign(PATHS.SHOP)}
        />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading font-semibold">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted" aria-hidden="true" />
                    <span className="text-sm text-muted">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </span>
                    <span className="font-heading font-semibold">
                      {formatPrice(order.pricing.total)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={PATHS.ORDER_DETAILS(order.id)}
                      className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs font-semibold hover:bg-hover"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Details
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadInvoice(order.id)}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      Invoice
                    </Button>
                    {["pending", "processing"].includes(order.status) &&
                      order.paymentStatus !== "paid" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPendingCancel(order)}
                        >
                          <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                          Cancel
                        </Button>
                      )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => setSearchParams({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => setSearchParams({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel this order?"
        description="This restores the reserved stock. Paid orders cannot be cancelled here."
        confirmLabel="Yes, cancel order"
        loading={cancelMutation.isPending}
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </section>
  );
}
