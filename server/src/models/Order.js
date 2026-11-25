import { Schema, model } from 'mongoose';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

/**
 * Order items are immutable snapshots. Invoices always use these values, never
 * the current Medicine prices, so historical orders stay accurate.
 */
const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Immutable, human-readable id generated once per order on the server.
    orderNumber: { type: String, default: null },
    items: [
      {
        medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
        medicineId: { type: String, required: true },
        name: { type: String, required: true },
        genericName: { type: String, default: '' },
        manufacturer: { type: String, default: '' },
        image: { type: String, default: '' },
        categoryName: { type: String, default: '' },
        seller: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        sellerName: { type: String, default: '' },
        unitPrice: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, required: true, min: 0 },
        discountPercent: { type: Number, default: 0, min: 0, max: 100 },
        quantity: { type: Number, required: true, min: 1 },
        lineTotal: { type: Number, required: true, min: 0 },
        lineSavings: { type: Number, default: 0, min: 0 },
        prescriptionRequired: { type: Boolean, default: false },
        // Per-vendor fulfilment: a single customer order may span sellers.
        fulfillmentStatus: {
          type: String,
          enum: ['processing', 'shipped', 'delivered'],
          default: 'processing',
        },
        _id: false,
      },
    ],
    delivery: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      addressLine1: { type: String, required: true, trim: true },
      addressLine2: { type: String, trim: true, default: '' },
      city: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true, default: 'Bangladesh' },
      instructions: { type: String, trim: true, default: '' },
    },
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      discount: { type: Number, required: true, min: 0 },
      deliveryCharge: { type: Number, required: true, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    prescription: {
      required: { type: Boolean, default: false },
      prescriberName: { type: String, trim: true, default: '' },
      prescriptionNumber: { type: String, trim: true, default: '' },
      documentUrl: { type: String, trim: true, default: '' },
      status: {
        type: String,
        enum: ['not_required', 'pending', 'verified', 'rejected'],
        default: 'not_required',
      },
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
    stripeSessionId: { type: String, default: null, index: true },
    stockRestored: { type: Boolean, default: false },
    idempotencyKey: { type: String, default: null },
    cancellationReason: { type: String, default: '' },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });

export const Order = model('Order', orderSchema);
