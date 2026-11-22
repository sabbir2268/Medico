import { Schema, model } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    visual: { type: String, default: 'capsule' },
    tone: {
      type: String,
      enum: ['teal', 'emerald', 'amber', 'blue', 'rose', 'violet', 'cyan'],
      default: 'teal',
    },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Category = model('Category', categorySchema);
