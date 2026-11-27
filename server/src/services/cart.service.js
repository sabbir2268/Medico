import { Cart } from '../models/Cart.js';
import { Medicine } from '../models/Medicine.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { serializeMedicine } from './catalog.service.js';

const FREE_DELIVERY_THRESHOLD = 1000;
const DELIVERY_CHARGE = 60;

function round(value) {
  return Math.round(value * 100) / 100;
}

async function loadAvailableMedicine(medicineId) {
  const medicine = await Medicine.findOne({
    _id: medicineId,
    status: 'active',
    stock: { $gt: 0 },
    isApproved: true,
    isHidden: { $ne: true },
  })
    .populate({ path: 'category', match: { isActive: true } })
    .populate('seller', 'username displayName');

  if (!medicine || !medicine.category) {
    throw new ApiError(404, 'This medicine is no longer available.', {
      code: ERROR_CODES.NOT_FOUND,
    });
  }
  return medicine;
}

function assertStock(medicine, quantity) {
  if (quantity > medicine.stock) {
    throw new ApiError(400, `Only ${medicine.stock} units are available.`, {
      code: ERROR_CODES.OUT_OF_STOCK,
      errors: { quantity: `Only ${medicine.stock} units are available.` },
    });
  }
}

/** Always resolves prices from the database; no price is ever stored in a cart. */
export async function serializeCart(cart) {
  const docs = cart?.items?.length
    ? await Medicine.find({ _id: { $in: cart.items.map((item) => item.medicine) } })
        .populate({ path: 'category', match: { isActive: true } })
        .populate('seller', 'username displayName')
    : [];

  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
  const lines = [];

  for (const item of cart?.items ?? []) {
    const medicine = byId.get(String(item.medicine));
    if (!medicine || medicine.status !== 'active' || medicine.stock < item.quantity) continue;

    const details = serializeMedicine(medicine);
    lines.push({
      medicine: details,
      medicineId: details.id,
      quantity: item.quantity,
      unitPrice: details.price,
      originalUnitPrice: details.originalPrice,
      lineTotal: round(details.price * item.quantity),
      lineSavings: round((details.originalPrice - details.price) * item.quantity),
      availableStock: medicine.stock,
    });
  }

  const subtotal = round(lines.reduce((sum, line) => sum + line.originalUnitPrice * line.quantity, 0));
  const discount = round(lines.reduce((sum, line) => sum + line.lineSavings, 0));
  const payable = round(subtotal - discount);
  const deliveryCharge = payable === 0 || payable >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = round(payable + deliveryCharge);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    id: cart ? String(cart._id) : null,
    items: lines,
    itemCount,
    subtotal,
    discount,
    deliveryCharge,
    total,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  };
}

async function findOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

export async function getCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  return serializeCart(cart);
}

export async function addCartItem(userId, medicineId, quantity) {
  const medicine = await loadAvailableMedicine(medicineId);
  const cart = await findOrCreateCart(userId);
  const existing = cart.items.find((item) => String(item.medicine) === String(medicine._id));
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  assertStock(medicine, nextQuantity);

  if (existing) existing.quantity = nextQuantity;
  else cart.items.push({ medicine: medicine._id, quantity });

  await cart.save();
  return serializeCart(cart);
}

export async function updateCartItem(userId, medicineId, quantity) {
  const medicine = await loadAvailableMedicine(medicineId);
  assertStock(medicine, quantity);

  const cart = await findOrCreateCart(userId);
  const item = cart.items.find((entry) => String(entry.medicine) === String(medicine._id));
  if (!item) {
    throw new ApiError(404, 'This medicine is not in your cart.', {
      code: ERROR_CODES.NOT_FOUND,
    });
  }

  item.quantity = quantity;
  await cart.save();
  return serializeCart(cart);
}

export async function removeCartItem(userId, medicineId) {
  const cart = await findOrCreateCart(userId);
  cart.items = cart.items.filter((item) => String(item.medicine) !== String(medicineId));
  await cart.save();
  return serializeCart(cart);
}

export async function clearCart(userId) {
  const cart = await findOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return serializeCart(cart);
}

/** Merges a guest cart after login, clamping quantities to available stock. */
export async function mergeGuestCart(userId, items) {
  const cart = await findOrCreateCart(userId);

  for (const entry of items) {
    let medicine;
    try {
      medicine = await loadAvailableMedicine(entry.medicineId);
    } catch {
      // Drop unavailable guest items instead of failing the entire merge.
      continue;
    }
    const existing = cart.items.find((item) => String(item.medicine) === String(medicine._id));
    const desired = (existing?.quantity ?? 0) + entry.quantity;
    const quantity = Math.min(desired, medicine.stock);

    if (quantity < 1) continue;
    if (existing) existing.quantity = quantity;
    else cart.items.push({ medicine: medicine._id, quantity });
  }

  await cart.save();
  return serializeCart(cart);
}
