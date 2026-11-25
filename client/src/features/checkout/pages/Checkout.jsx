import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatePanel } from "@/components/shared/StatePanel";
import { Visual } from "@/components/shared/Visual";
import { FormField } from "@/features/auth/components/FormFields";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { hasBackendSession } from "@/features/auth/utils/tokenStore";
import { useCart } from "@/features/cart/hooks/useCart";
import { formatPrice } from "@/lib/format";
import { notify } from "@/lib/notify";
import { PATHS } from "@/utils/paths";
import { defaultCheckoutValues, checkoutSchema } from "../schemas/checkoutSchema";
import { createCheckoutSession, createOrder, needsPrescription } from "../services/checkoutServices";

function SummaryRow({ label, value, strong, muted }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={muted ? "text-muted" : "text-foreground"}>{label}</span>
      <span className={strong ? "font-heading text-lg font-bold text-foreground" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const { cart, isPending } = useCart();
  const [paymentError, setPaymentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: defaultCheckoutValues,
  });

  useEffect(() => {
    if (!user) return;
    reset({
      ...defaultCheckoutValues,
      fullName: user.name ?? user.username ?? "",
      phone: user.phone ?? "",
      addressLine1: user.address?.addressLine1 ?? "",
      addressLine2: user.address?.addressLine2 ?? "",
      city: user.address?.city ?? "",
      postalCode: user.address?.postalCode ?? "",
      country: user.address?.country ?? "Bangladesh",
    });
  }, [user, reset]);

  const onSubmit = async (values) => {
    submittedRef.current = true;
    setSubmitting(true);
    setPaymentError("");

    try {
      const order = await createOrder(values, cart);
      const payment = await createCheckoutSession(order.id);

      if (!payment?.checkoutUrl) throw new Error("Stripe did not return a checkout URL.");
      window.location.assign(payment.checkoutUrl);
    } catch (error) {
      const message = error?.response?.data?.message ?? error?.message ?? "Checkout failed.";
      setPaymentError(message);
      notify.error(message);
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (event) => {
    if (submittedRef.current) return;
    handleSubmit(onSubmit)(event);
  };

  if (isPending) {
    return <div className="h-64 animate-pulse rounded-card bg-surface" aria-busy="true" />;
  }

  if (!cart.items.length) {
    return (
      <StatePanel
        title="Nothing to check out"
        description="Add medicines to your cart before starting checkout."
        actionLabel="Browse medicines"
        onAction={() => window.location.assign(PATHS.SHOP)}
      />
    );
  }

  if (!hasBackendSession()) {
    return (
      <StatePanel
        variant="error"
        title="Sign in to continue"
        description="Checkout requires a backend-secured session. Sign in again to create your order."
        actionLabel="Go to login"
        onAction={() => window.location.assign(PATHS.LOGIN)}
      />
    );
  }

  const prescriptionNeeded = needsPrescription(cart);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Secure checkout</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Delivery & payment</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Prices are recalculated and stock is reserved on the server before payment.
        </p>
      </div>

      {paymentError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-card border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {paymentError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form
          onSubmit={handleFormSubmit}
          className="space-y-6"
          noValidate
          aria-busy={submitting}
        >
          <section className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="font-heading text-lg font-semibold">Delivery details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full name"
                name="fullName"
                autoComplete="name"
                error={errors.fullName}
                {...register("fullName")}
              />
              <FormField
                label="Phone number"
                name="phone"
                type="tel"
                autoComplete="tel"
                error={errors.phone}
                {...register("phone")}
              />
              <div className="sm:col-span-2">
                <FormField
                  label="Address line 1"
                  name="addressLine1"
                  autoComplete="address-line1"
                  error={errors.addressLine1}
                  {...register("addressLine1")}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Address line 2 (optional)"
                  name="addressLine2"
                  autoComplete="address-line2"
                  error={errors.addressLine2}
                  {...register("addressLine2")}
                />
              </div>
              <FormField
                label="City"
                name="city"
                autoComplete="address-level2"
                error={errors.city}
                {...register("city")}
              />
              <FormField
                label="Postal code"
                name="postalCode"
                autoComplete="postal-code"
                error={errors.postalCode}
                {...register("postalCode")}
              />
              <FormField
                label="Country"
                name="country"
                autoComplete="country-name"
                error={errors.country}
                {...register("country")}
              />
              <div className="sm:col-span-2">
                <label htmlFor="instructions" className="mb-1.5 block text-sm font-medium">
                  Delivery instructions (optional)
                </label>
                <textarea
                  id="instructions"
                  rows={3}
                  className="w-full rounded-control border border-line bg-background px-3 py-2 text-sm"
                  placeholder="Gate code, landmark, preferred time…"
                  {...register("instructions")}
                />
              </div>
            </div>
          </section>

          {prescriptionNeeded && (
            <section className="rounded-card border border-amber-300/60 bg-amber-50/60 p-6 shadow-card dark:border-amber-800 dark:bg-amber-950/20">
              <h2 className="font-heading text-lg font-semibold">Prescription verification</h2>
              <p className="mt-1 text-sm text-muted">
                Your cart contains prescription medicines. Provide prescriber details; the order
                stays pending manual verification.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Prescriber name"
                  name="prescriberName"
                  required
                  error={errors.prescriberName}
                  {...register("prescriberName")}
                />
                <FormField
                  label="Prescription number"
                  name="prescriptionNumber"
                  required
                  error={errors.prescriptionNumber}
                  {...register("prescriptionNumber")}
                />
                <div className="sm:col-span-2">
                  <FormField
                    label="Document URL (optional)"
                    name="documentUrl"
                    type="url"
                    error={errors.documentUrl}
                    {...register("documentUrl")}
                  />
                </div>
              </div>
            </section>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            {submitting ? "Creating secure checkout…" : "Proceed to Payment"}
          </Button>
          <p className="flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            You will be redirected to Stripe. We never see your card details.
          </p>
        </form>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <section className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="font-heading text-lg font-semibold">Your items</h2>
            <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.medicineId} className="flex items-center gap-3">
                  {item.medicine?.image ? (
                    <img
                      src={item.medicine.image}
                      alt=""
                      className="h-12 w-12 rounded-control border border-line object-cover"
                    />
                  ) : (
                    <Visual
                      name={item.medicine?.visual ?? "capsule"}
                      tone={item.medicine?.tone ?? "teal"}
                      className="h-12 w-12"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.medicine?.name}</p>
                    <p className="text-xs text-muted">×{item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="font-heading text-lg font-semibold">Order summary</h2>
            <div className="mt-5 space-y-3">
              <SummaryRow label="Subtotal" value={formatPrice(cart.subtotal)} />
              <SummaryRow label="Discounts" value={`- ${formatPrice(cart.discount ?? 0)}`} muted />
              <SummaryRow
                label="Delivery"
                value={cart.deliveryCharge ? formatPrice(cart.deliveryCharge) : "Free"}
                muted
              />
              <div className="border-t border-line pt-3">
                <SummaryRow label="Total" value={formatPrice(cart.total)} strong />
              </div>
            </div>
            <Link
              to={PATHS.CART}
              className="mt-5 block text-center text-sm font-medium text-primary hover:underline"
            >
              Back to cart
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
