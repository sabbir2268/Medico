import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatePanel } from "@/components/shared/StatePanel";
import { formatPrice } from "@/lib/format";
import { PATHS } from "@/utils/paths";
import { clearCheckoutIdempotencyKey, downloadInvoice, fetchOrder, fetchPayment } from "../services/checkoutServices";

const COPY = {
  success: {
    icon: CheckCircle2,
    tone: "text-success",
    eyebrow: "Payment confirmed",
    title: "Thank you for your order",
    description: "Your payment has been verified by Stripe and your medicines are being prepared.",
  },
  failure: {
    icon: XCircle,
    tone: "text-destructive",
    eyebrow: "Payment failed",
    title: "We couldn't complete your payment",
    description: "No charge was completed. Your items are still saved in your cart.",
  },
  cancel: {
    icon: AlertTriangle,
    tone: "text-warning",
    eyebrow: "Payment cancelled",
    title: "You cancelled the payment",
    description: "Nothing has been charged. You can return to your cart and try again.",
  },
};

export default function PaymentResult({ variant = "success" }) {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  const paymentKey = sessionId ?? orderId;
  const copy = COPY[variant];
  const Icon = copy.icon;

  // Never trust the redirect query: always ask the backend for the real status.
  const paymentQuery = useQuery({
    queryKey: ["payment-result", paymentKey],
    queryFn: () => fetchPayment(paymentKey),
    enabled: Boolean(paymentKey),
    retry: 1,
    refetchInterval: (query) => (query.state.data?.status === "paid" ? false : 4000),
  });

  const orderQuery = useQuery({
    queryKey: ["payment-result-order", orderId ?? paymentQuery.data?.orderId],
    queryFn: () => fetchOrder(orderId ?? paymentQuery.data.orderId),
    enabled: Boolean(orderId || paymentQuery.data?.orderId),
    retry: 1,
  });

  useEffect(() => {
    // A paid, failed or cancelled checkout is terminal: the next purchase must
    // start with a fresh key so it creates a new order and payment.
    if (variant !== "success" || paymentQuery.data?.status === "paid") {
      clearCheckoutIdempotencyKey();
    }
  }, [paymentQuery.data?.status, variant]);

  const payment = paymentQuery.data;
  const order = orderQuery.data;
  const isVerifying = payment?.status === "pending";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-card border border-line bg-surface p-8 text-center shadow-card">
        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary ${copy.tone}`}>
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-5 text-sm font-semibold tracking-wide text-primary uppercase">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{copy.description}</p>

        {isVerifying && (
          <p className="mt-5 flex items-center justify-center gap-2 rounded-control bg-secondary p-3 text-sm text-secondary-foreground">
            <Clock3 className="h-4 w-4 animate-pulse" aria-hidden="true" />
            Verifying your payment with Stripe…
          </p>
        )}

        {paymentQuery.isError && (
          <p className="mt-5 rounded-control border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {paymentQuery.error?.message ?? "We couldn't verify this payment."}
          </p>
        )}
      </div>

      {(payment || order) && (
        <section className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <ReceiptText className="h-5 w-5 text-primary" aria-hidden="true" />
            Order confirmation
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Order ID</dt>
              <dd className="font-semibold">{order?.orderNumber ?? payment?.orderNumber ?? orderId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Payment status</dt>
              <dd className="font-semibold capitalize">{payment?.status ?? "checking…"}</dd>
            </div>
            <div>
              <dt className="text-muted">Amount</dt>
              <dd className="font-semibold">
                {payment ? formatPrice(payment.amount) : order ? formatPrice(order.pricing.total) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Order status</dt>
              <dd className="font-semibold capitalize">{order?.status ?? "pending"}</dd>
            </div>
          </dl>

          {orderId && (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => downloadInvoice(orderId)}
              disabled={!order}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download invoice (PDF)
            </Button>
          )}
        </section>
      )}

      {!paymentKey && (
        <StatePanel
          title="No payment reference"
          description="This page needs a Stripe session reference. Check your order history instead."
          actionLabel="View my orders"
          onAction={() => window.location.assign(PATHS.ORDERS)}
        />
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to={PATHS.ORDERS}
          className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          View my orders
        </Link>
        <Link
          to={PATHS.SHOP}
          className="rounded-control border border-line px-4 py-2 text-sm font-semibold hover:bg-hover"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
