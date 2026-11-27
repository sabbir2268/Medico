import { useState } from "react";
import { CreditCard, ExternalLink, ReceiptText } from "lucide-react";
import { StatePanel } from "@/components/shared/StatePanel";
import { StatusBadge } from "../components/StatusBadge";
import { usePayments } from "../hooks/useDashboard";
import { formatPrice } from "@/lib/format";
import { PATHS } from "@/utils/paths";

function PaymentsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-card border border-line bg-surface" />
      ))}
    </div>
  );
}

export default function Payments() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = usePayments({ page, limit: 10 });
  const payments = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Your account</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Payment history</h1>
        <p className="mt-2 text-sm text-muted">
          Stripe transactions linked to your Medico orders. Statuses are updated by verified webhooks.
        </p>
      </div>

      {isPending ? (
        <PaymentsSkeleton />
      ) : isError ? (
        <StatePanel
          variant="error"
          title="Couldn't load payments"
          description={error?.message}
          actionLabel="Try again"
          onAction={refetch}
        />
      ) : payments.length === 0 ? (
        <StatePanel
          title="No payments yet"
          description="Once you pay for an order, the transaction will appear here."
          actionLabel="Browse medicines"
          onAction={() => window.location.assign(PATHS.SHOP)}
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                {["Order", "Status", "Amount", "Provider", "Date", ""].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 font-medium">{payment.orderNumber}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatPrice(payment.amount)} {payment.currency?.toUpperCase()}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">{payment.provider}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={PATHS.ORDER_DETAILS(payment.orderId)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Order
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={!pagination.hasPrev}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-control border border-line px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNext}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-control border border-line px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <p className="flex items-center justify-center gap-2 text-xs text-muted">
        <CreditCard className="h-4 w-4" aria-hidden="true" />
        <ReceiptText className="h-4 w-4" aria-hidden="true" />
        Card details are handled by Stripe and never stored by Medico.
      </p>
    </section>
  );
}
