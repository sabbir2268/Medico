import { Schema, model } from 'mongoose';

const advertisementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    subtitle: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', default: null },
    ctaText: { type: String, trim: true, default: 'Shop now' },
    ctaLink: { type: String, trim: true, default: '/shop' },
    visual: { type: String, default: 'capsule' },
    tone: {
      type: String,
      enum: ['teal', 'emerald', 'amber', 'blue', 'rose', 'violet', 'cyan'],
      default: 'teal',
    },
    isActive: { type: Boolean, default: true, index: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Advertisement = model('Advertisement', advertisementSchema);
