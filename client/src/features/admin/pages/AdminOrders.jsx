import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import {
  AdminContent,
  AdminPageHeader,
  PaginationControls,
  SearchInput,
} from "../components/AdminUI";
import { useAdminOrders } from "../hooks/useAdmin";
import { formatPrice } from "@/lib/format";

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState(null);
  const query = useAdminOrders({ page, limit: 10, search, status });

  return (
    <section className="space-y-6">
      <AdminPageHeader eyebrow="Administration" title="Order management" description="All customer orders across vendors." />

      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Order or customer" />
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          className="rounded-control border border-line bg-background px-3 py-2 text-sm"
          aria-label="Filter order status"
        >
          <option value="">All statuses</option>
          {["pending", "processing", "shipped", "delivered", "cancelled"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <AdminContent query={query} emptyTitle="No orders" emptyDescription="Orders will appear here after checkout.">
        <div className="space-y-2">
          {(query.data?.items ?? []).map((order) => (
            <div key={order.id} className="rounded-card border border-line bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {order.customer} · {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <StatusBadge status={order.paymentStatus} />
                  <span className="font-semibold">{formatPrice(order.total)}</span>
                  <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                    {expanded === order.id ? "Hide" : "Details"}
                  </Button>
                </div>
              </div>
              {expanded === order.id && (
                <div className="mt-4 border-t border-line pt-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex flex-wrap justify-between gap-2 py-1.5 text-sm">
                      <span>
                        {item.name} · {item.quantity} ×{" "}
                        {formatPrice(item.unitPrice ?? item.lineTotal / item.quantity)}
                      </span>
                      <span className="text-muted">{item.sellerName} · {item.fulfillmentStatus}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </AdminContent>

      <PaginationControls pagination={query.data?.pagination} page={page} setPage={setPage} />
    </section>
  );
}
