import { loadStripe } from "@stripe/stripe-js";
import { env, isStripeConfigured } from "./env";

export { isStripeConfigured };

let stripePromise = null;

/**
 * Lazily loads Stripe.js so apps without payment keys never download it.
 * Always create PaymentIntents on the backend; this key is publishable only.
 */
export function getStripe() {
  if (!isStripeConfigured) return null;
  if (!stripePromise) stripePromise = loadStripe(env.VITE_STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}
