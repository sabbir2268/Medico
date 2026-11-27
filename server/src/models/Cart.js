import { Schema, model } from 'mongoose';

/**
 * A cart stores only medicine ids and quantities. Prices are always resolved
 * from the Medicine collection at request time, never trusted from the client.
 */
const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [
      {
        medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
        quantity: { type: Number, required: true, min: 1, max: 100 },
        _id: false,
      },
    ],
  },
  { timestamps: true },
);

export const Cart = model('Cart', cartSchema);
