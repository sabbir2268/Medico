import { Schema, model } from 'mongoose';

const MEDICINE_STATUSES = ['active', 'inactive', 'out_of_stock'];

const medicineSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    genericName: { type: String, trim: true, default: '' },
    manufacturer: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    strength: { type: String, trim: true, default: '' },
    form: { type: String, trim: true, default: 'Tablet' },
    sku: { type: String, trim: true, uppercase: true, default: '' },

    images: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Base price and discount are trusted database values. Never read from a client.
    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, required: true, default: 0, min: 0 },

    status: { type: String, enum: MEDICINE_STATUSES, default: 'active', index: true },
    isApproved: { type: Boolean, default: true, index: true },
    isHidden: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isAdvertised: { type: Boolean, default: false },
    prescriptionRequired: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });
medicineSchema.index({ category: 1, status: 1 });
medicineSchema.index({ price: 1 });
medicineSchema.index({ discountPercent: -1 });
medicineSchema.index({ seller: 1, status: 1 });

export const Medicine = model('Medicine', medicineSchema);
