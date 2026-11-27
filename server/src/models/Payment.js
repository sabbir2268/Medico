import { Schema, model } from 'mongoose';

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'expired', 'refunded'];

const paymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    // No `default: null`: a null value would still be indexed by a sparse
    // unique index, so the second pending payment would collide on null.
    stripeSessionId: { type: String, sparse: true, unique: true, index: true },
    stripePaymentIntentId: { type: String, sparse: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    provider: { type: String, default: 'stripe' },
    checkoutUrl: { type: String, default: '' },
    lastEventId: { type: String, default: null },
    failureReason: { type: String, default: '' },
  },
  { timestamps: true },
);

paymentSchema.index({ user: 1, createdAt: -1 });

export const Payment = model('Payment', paymentSchema);
