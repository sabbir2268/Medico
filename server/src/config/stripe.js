import Stripe from 'stripe';
import { env } from './env.js';

export const isStripeConfigured = Boolean(env.stripe.secretKey);

let stripeClient = null;

/** Lazily creates the Stripe client; payment routes must check configuration. */
export function getStripe() {
  if (!isStripeConfigured) return null;
  if (!stripeClient) stripeClient = new Stripe(env.stripe.secretKey);
  return stripeClient;
}
