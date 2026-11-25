import { Cart } from '../models/Cart.js';
import { Medicine } from '../models/Medicine.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { buildPagination } from '../utils/pagination.js';
import { serializeMedicine } from './catalog.service.js';

const FREE_DELIVERY_THRESHOLD = 1000;
const DELIVERY_CHARGE = 60;

function round(value) {
  return Math.round(value * 100) / 100;
}

/** Unique, human-readable id created once per order (never reused). */
function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MD-${stamp}-${random}`;
}

export function serializeOrder(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    userId: String(doc.user),
    orderNumber: doc.orderNumber ?? `MD-${String(doc._id).slice(-8).toUpperCase()}`,
    items: doc.items.map((item) => ({ ...(item.toObject?.() ?? item), id: String(item.medicine) })),
    delivery: doc.delivery,
    pricing: doc.pricing,
    prescription: doc.prescription,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    paymentId: doc.payment ? String(doc.payment) : null,
    stripeSessionId: doc.stripeSessionId ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    cancelledAt: doc.cancelledAt ?? null,
  };
}

function snapshotItem(medicine, quantity) {
  const details = serializeMedicine(medicine);

  return {
    medicine: medicine._id,
    medicineId: details.id,
    name: details.name,
    genericName: details.genericName,
    manufacturer: details.manufacturer,
    image: details.image,
    categoryName: details.categoryName,
    seller: details.seller?.id ?? null,
    sellerName: details.vendor,
    unitPrice: details.price,
    originalPrice: details.originalPrice,
    discountPercent: details.discountPercent,
    quantity,
    lineTotal: round(details.price * quantity),
    lineSavings: round((details.originalPrice - details.price) * quantity),
    prescriptionRequired: Boolean(medicine.prescriptionRequired),
  };
}

/**
 * Builds an order from the authenticated user's cart. Every price and stock
 * value is re-read from MongoDB; nothing from the client is trusted.
 */
export async function createOrderFromCart(userId, payload, idempotencyKey = null) {
  if (idempotencyKey) {
    const existing = await Order.findOne({ user: userId, idempotencyKey }).lean();

    if (existing) {
      const isTerminal =
        existing.status === 'cancelled' ||
        existing.status === 'delivered' ||
        ['paid', 'failed', 'refunded'].includes(existing.paymentStatus);

      if (!isTerminal) return serializeOrder(existing);

      // The previous order using this key can no longer be paid. Release the
      // key so this checkout creates a brand-new order with its own id.
      // Otherwise every retry returns the cancelled order and payment fails.
      await Order.updateOne(
        { _id: existing._id, idempotencyKey },
        { $unset: { idempotencyKey: 1 } },
      );
    }
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty.', { code: ERROR_CODES.ORDER_EMPTY });
  }

  const medicines = await Medicine.find({
    _id: { $in: cart.items.map((item) => item.medicine) },
  })
    .populate({ path: 'category', match: { isActive: true } })
    .populate('seller', 'username displayName');

  const byId = new Map(medicines.map((medicine) => [String(medicine._id), medicine]));
  const items = [];

  for (const cartItem of cart.items) {
    const medicine = byId.get(String(cartItem.medicine));

    if (!medicine || medicine.status !== 'active' || !medicine.category) {
      throw new ApiError(400, 'One or more medicines are no longer available.', {
        code: ERROR_CODES.NOT_FOUND,
      });
    }
    if (medicine.stock < cartItem.quantity) {
      throw new ApiError(400, `Only ${medicine.stock} units of ${medicine.name} are available.`, {
        code: ERROR_CODES.INSUFFICIENT_STOCK,
      });
    }
    items.push(snapshotItem(medicine, cartItem.quantity));
  }

  const requiresPrescription = items.some((item) => item.prescriptionRequired);
  if (requiresPrescription && !payload.prescription) {
    throw new ApiError(400, 'This order contains prescription medicines. Provide prescriber details.', {
      code: ERROR_CODES.PRESCRIPTION_REQUIRED,
      errors: { prescription: 'Prescriber name and prescription number are required.' },
    });
  }

  const subtotal = round(items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0));
  const discount = round(items.reduce((sum, item) => sum + item.lineSavings, 0));
  const payable = round(subtotal - discount);
  const deliveryCharge = payable >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = round(payable + deliveryCharge);

  // Atomically decrement stock. Roll back already-decremented items on failure.
  const decremented = [];
  try {
    for (const item of items) {
      const result = await Medicine.updateOne(
        {
          _id: item.medicine,
          status: 'active',
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
      );

      if (result.matchedCount !== 1) {
        throw new ApiError(400, `${item.name} just went out of stock.`, {
          code: ERROR_CODES.INSUFFICIENT_STOCK,
        });
      }
      decremented.push({ id: item.medicine, quantity: item.quantity });
    }
  } catch (error) {
    for (const item of decremented) {
      await Medicine.updateOne({ _id: item.id }, { $inc: { stock: item.quantity } });
    }
    throw error;
  }

  try {
    const order = await Order.create({
      user: userId,
      orderNumber: generateOrderNumber(),
      items,
      delivery: payload.delivery,
      pricing: { subtotal, discount, deliveryCharge, total },
      prescription: {
        required: requiresPrescription,
        prescriberName: payload.prescription?.prescriberName ?? '',
        prescriptionNumber: payload.prescription?.prescriptionNumber ?? '',
        documentUrl: payload.prescription?.documentUrl ?? '',
        status: requiresPrescription ? 'pending' : 'not_required',
      },
      idempotencyKey,
    });

    // Clear the cart only after the order was persisted successfully.
    cart.items = [];
    await cart.save();

    return serializeOrder(order);
  } catch (error) {
    for (const item of decremented) {
      await Medicine.updateOne({ _id: item.id }, { $inc: { stock: item.quantity } });
    }
    throw error;
  }
}

export async function getOrderForUser(userId, id) {
  const order = await Order.findOne({ _id: id, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found.', { code: ERROR_CODES.NOT_FOUND });
  }
  return serializeOrder(order);
}

export async function listOrdersForUser(userId, { page, limit, status } = {}) {
  const filter = { user: userId, ...(status ? { status } : {}) };
  const [total, docs] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return {
    items: docs.map(serializeOrder),
    pagination: buildPagination({ page, limit, total }),
  };
}

/** Cancels an unpaid order and restores its stock exactly once. */
export async function cancelOrder(userId, id) {
  const order = await Order.findOne({ _id: id, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found.', { code: ERROR_CODES.NOT_FOUND });
  }

  const cancellable =
    ['pending', 'processing'].includes(order.status) &&
    order.paymentStatus !== 'paid' &&
    !order.stockRestored;

  if (!cancellable) {
    throw new ApiError(409, 'This order can no longer be cancelled.', {
      code: ERROR_CODES.ORDER_NOT_CANCELLABLE,
    });
  }

  const result = await Order.updateOne(
    {
      _id: id,
      user: userId,
      stockRestored: false,
      paymentStatus: { $ne: 'paid' },
      status: { $in: ['pending', 'processing'] },
    },
    {
      $set: {
        status: 'cancelled',
        stockRestored: true,
        cancelledAt: new Date(),
      },
    },
  );

  if (result.modifiedCount !== 1) {
    throw new ApiError(409, 'This order can no longer be cancelled.', {
      code: ERROR_CODES.ORDER_NOT_CANCELLABLE,
    });
  }

  for (const item of order.items) {
    await Medicine.updateOne({ _id: item.medicine }, { $inc: { stock: item.quantity } });
  }

  return getOrderForUser(userId, id);
}
