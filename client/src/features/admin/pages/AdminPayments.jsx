import { useState } from "react";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import {
  AdminContent,
  AdminPageHeader,
  PaginationControls,
} from "../components/AdminUI";
import { useAdminPayments } from "../hooks/useAdmin";
import { formatPrice } from "@/lib/format";

export default function AdminPayments() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const query = useAdminPayments({ page, limit: 10, status });

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Payment management"
        description="Stripe transactions. Statuses change only through verified webhooks."
      />

      <select
        value={status}
        onChange={(event) => { setStatus(event.target.value); setPage(1); }}
        className="rounded-control border border-line bg-background px-3 py-2 text-sm"
        aria-label="Filter payments"
      >
        <option value="">All statuses</option>
        {["pending", "paid", "failed", "expired", "refunded"].map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>

      <AdminContent query={query} emptyTitle="No payments" emptyDescription="Transactions will appear here.">
        <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                {["Order", "Amount", "Status", "Provider", "Date"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {query.data.items.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 font-medium">{payment.orderNumber}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(payment.amount)} {payment.currency?.toUpperCase()}</td>
                  <td className="px-4 py-3"><StatusBadge status={payment.status} /></td>
                  <td className="px-4 py-3 capitalize text-muted">{payment.provider}</td>
                  <td className="px-4 py-3 text-muted">{new Date(payment.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminContent>

      <PaginationControls pagination={query.data?.pagination} page={page} setPage={setPage} />
    </section>
  );
}
