import { Schema, model } from 'mongoose';

const healthTipSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    excerpt: { type: String, trim: true, default: '' },
    content: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'General' },
    visual: { type: String, default: 'heart' },
    tone: {
      type: String,
      enum: ['teal', 'emerald', 'amber', 'blue', 'rose', 'violet', 'cyan'],
      default: 'emerald',
    },
    readMinutes: { type: Number, default: 3, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: Date.now },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const HealthTip = model('HealthTip', healthTipSchema);
