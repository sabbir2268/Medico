import { Medicine } from '../models/Medicine.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Advertisement } from '../models/Advertisement.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { buildPagination } from '../utils/pagination.js';
import { serializeMedicine } from './catalog.service.js';

const OWNED_ITEM = (sellerId) => ({ 'items.seller': sellerId });
const NEXT_STATUS = { processing: 'shipped', shipped: 'delivered', delivered: null };

function sellerItems(order, sellerId) {
  return order.items.filter((item) => String(item.seller) === String(sellerId));
}

function dateRange(from, to) {
  const start = from ? new Date(from) : new Date(0);
  const end = to ? new Date(to) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, 'Invalid date range.', { code: ERROR_CODES.VALIDATION_ERROR });
  }
  return { $gte: start, $lte: end };
}

function revenueOf(orders, sellerId) {
  return orders.reduce(
    (sum, order) =>
      sum + sellerItems(order, sellerId).reduce((lineSum, item) => lineSum + Number(item.lineTotal || 0), 0),
    0,
  );
}

/** GET /api/seller/dashboard */
export async function getDashboard(sellerId) {
  const [medicineCount, lowStock, orders, paidOrders, ads] = await Promise.all([
    Medicine.countDocuments({ seller: sellerId, status: 'active' }),
    Medicine.countDocuments({ seller: sellerId, status: 'active', stock: { $lt: 5 } }),
    Order.find(OWNED_ITEM(sellerId)).select('items paymentStatus status'),
    Advertisement.countDocuments({ seller: sellerId }),
  ]);

  const revenue = revenueOf(paidOrders.filter((order) => order.paymentStatus === 'paid'), sellerId);
  const pendingFulfilment = paidOrders.reduce(
    (count, order) =>
      count +
      sellerItems(order, sellerId).filter((item) => item.fulfillmentStatus !== 'delivered').length,
    0,
  );

  return {
    medicines: { total: medicineCount, lowStock },
    orders: {
      total: orders.length,
      paid: paidOrders.filter((order) => order.paymentStatus === 'paid').length,
      pendingFulfilment,
    },
    revenue: Math.round(revenue * 100) / 100,
    advertisements: { total: ads },
  };
}

/** GET /api/seller/analytics — grouped by day from real paid orders. */
export async function getAnalytics(sellerId, { from, to } = {}) {
  const range = dateRange(from, to);
  const orders = await Order.find({
    ...OWNED_ITEM(sellerId),
    paymentStatus: 'paid',
    createdAt: range,
  }).sort({ createdAt: 1 });

  const byDay = new Map();
  const productTotals = new Map();

  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { date: day, orders: 0, revenue: 0 };
    entry.orders += 1;

    for (const item of sellerItems(order, sellerId)) {
      const value = Number(item.lineTotal || 0);
      entry.revenue += value;
      productTotals.set(item.name, (productTotals.get(item.name) ?? 0) + value);
    }
    byDay.set(day, entry);
  }

  const series = [...byDay.values()].map((entry) => ({
    ...entry,
    revenue: Math.round(entry.revenue * 100) / 100,
  }));
  const revenue = series.reduce((sum, entry) => sum + entry.revenue, 0);

  return {
    range: { from: from ?? null, to: to ?? null },
    summary: {
      orders: orders.length,
      revenue: Math.round(revenue * 100) / 100,
      averageOrderValue: orders.length ? Math.round((revenue / orders.length) * 100) / 100 : 0,
    },
    series,
    topMedicines: [...productTotals.entries()]
      .map(([name, value]) => ({ name, revenue: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
  };
}

function ownedMedicineQuery(sellerId, id) {
  return Medicine.findOne({ _id: id, seller: sellerId });
}

export async function listMedicines(sellerId, { page, limit, search = '', status } = {}) {
  const filter = { seller: sellerId, ...(status ? { status } : {}) };
  if (search) {
    const expression = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: expression }, { genericName: expression }, { sku: expression }];
  }

  const [total, docs] = await Promise.all([
    Medicine.countDocuments(filter),
    Medicine.find(filter)
      .populate({ path: 'category', match: { isActive: true } })
      .populate('seller', 'username displayName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return {
    items: docs.map(serializeMedicine),
    pagination: buildPagination({ page, limit, total }),
  };
}

export async function createMedicine(sellerId, values) {
  const medicine = await Medicine.create({ ...values, seller: sellerId });
  const doc = await Medicine.findById(medicine._id)
    .populate({ path: 'category', match: { isActive: true } })
    .populate('seller', 'username displayName');
  return serializeMedicine(doc);
}

/** Ownership is part of the query, so another seller's id can never match. */
export async function updateMedicine(sellerId, id, values) {
  const medicine = await ownedMedicineQuery(sellerId, id);
  if (!medicine) {
    throw new ApiError(404, 'Medicine not found.', { code: ERROR_CODES.NOT_FOUND });
  }
  Object.assign(medicine, values);
  await medicine.save();

  const doc = await Medicine.findById(id)
    .populate({ path: 'category', match: { isActive: true } })
    .populate('seller', 'username displayName');
  return serializeMedicine(doc);
}

/** Soft delete keeps historical order/payment snapshots intact. */
export async function deleteMedicine(sellerId, id) {
  const medicine = await ownedMedicineQuery(sellerId, id);
  if (!medicine) {
    throw new ApiError(404, 'Medicine not found.', { code: ERROR_CODES.NOT_FOUND });
  }
  medicine.status = 'inactive';
  await medicine.save({ validateBeforeSave: false });
  return { id: String(medicine._id), status: medicine.status };
}

function ownedOrder(sellerId, id) {
  return Order.findOne({ _id: id, ...OWNED_ITEM(sellerId) });
}

export async function listOrders(sellerId, { page, limit, status } = {}) {
  const filter = {
    ...OWNED_ITEM(sellerId),
    ...(status ? { status } : {}),
  };
  const [total, docs] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return {
    items: docs.map((order) => ({
      id: String(order._id),
      orderNumber: `MD-${String(order._id).slice(-8).toUpperCase()}`,
      customer: order.delivery.fullName,
      items: sellerItems(order, sellerId).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        fulfillmentStatus: item.fulfillmentStatus ?? 'processing',
      })),
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: sellerItems(order, sellerId).reduce((sum, item) => sum + item.lineTotal, 0),
      createdAt: order.createdAt,
    })),
    pagination: buildPagination({ page, limit, total }),
  };
}

export async function getOrder(sellerId, id) {
  const order = await ownedOrder(sellerId, id);
  if (!order) {
    throw new ApiError(404, 'Order not found.', { code: ERROR_CODES.NOT_FOUND });
  }
  const items = sellerItems(order, sellerId);

  return {
    id: String(order._id),
    orderNumber: `MD-${String(order._id).slice(-8).toUpperCase()}`,
    customer: {
      name: order.delivery.fullName,
      phone: order.delivery.phone,
      address: `${order.delivery.addressLine1}, ${order.delivery.city}, ${order.delivery.postalCode}`,
    },
    items,
    status: order.status,
    paymentStatus: order.paymentStatus,
    earnings: items.reduce((sum, item) => sum + item.lineTotal, 0),
    createdAt: order.createdAt,
  };
}

/** Sellers may only advance their own line items, never payment/ownership. */
export async function updateOrderStatus(sellerId, id, status) {
  const order = await ownedOrder(sellerId, id);
  if (!order) {
    throw new ApiError(404, 'Order not found.', { code: ERROR_CODES.NOT_FOUND });
  }
  if (order.status === 'cancelled') {
    throw new ApiError(409, 'Cancelled orders cannot be updated.', {
      code: ERROR_CODES.ORDER_NOT_CANCELLABLE,
    });
  }
  if (order.paymentStatus !== 'paid') {
    throw new ApiError(400, 'Payment must be confirmed before fulfilment.', {
      code: ERROR_CODES.PAYMENT_NOT_COMPLETED,
    });
  }

  const owned = sellerItems(order, sellerId);
  if (owned.some((item) => NEXT_STATUS[item.fulfillmentStatus ?? 'processing'] !== status)) {
    throw new ApiError(409, 'Invalid fulfilment status transition.', {
      code: ERROR_CODES.INVALID_STATUS_TRANSITION,
    });
  }

  await Order.updateOne(
    { _id: id, ...OWNED_ITEM(sellerId) },
    { $set: { 'items.$[item].fulfillmentStatus': status } },
    { arrayFilters: [{ 'item.seller': sellerId }] },
  );

  return getOrder(sellerId, id);
}

export async function listPayments(sellerId, { page, limit } = {}) {
  const orders = await Order.find(OWNED_ITEM(sellerId)).select('items');
  const orderIds = orders.map((order) => order._id);
  const [total, docs] = await Promise.all([
    Payment.countDocuments({ order: { $in: orderIds } }),
    Payment.find({ order: { $in: orderIds } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  const byId = new Map(orders.map((order) => [String(order._id), order]));

  return {
    items: docs.map((payment) => {
      const order = byId.get(String(payment.order));
      const earnings = order
        ? sellerItems(order, sellerId).reduce((sum, item) => sum + item.lineTotal, 0)
        : 0;
      return {
        id: String(payment._id),
        orderId: String(payment.order),
        orderNumber: `MD-${String(payment.order).slice(-8).toUpperCase()}`,
        status: payment.status,
        amount: Math.round(earnings * 100) / 100,
        currency: payment.currency,
        createdAt: payment.createdAt,
      };
    }),
    pagination: buildPagination({ page, limit, total }),
  };
}

export async function createAdvertisement(sellerId, values) {
  if (values.medicine) {
    const medicine = await ownedMedicineQuery(sellerId, values.medicine);
    if (!medicine) {
      throw new ApiError(404, 'Medicine not found.', { code: ERROR_CODES.NOT_FOUND });
    }
  }

  const ad = await Advertisement.create({
    ...values,
    seller: sellerId,
    status: 'pending',
    isActive: false,
    reviewedBy: null,
    reviewedAt: null,
  });
  return serializeAdvertisementForSeller(ad);
}

function serializeAdvertisementForSeller(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    subtitle: doc.subtitle ?? '',
    image: doc.image ?? '',
    medicine: doc.medicine ? String(doc.medicine) : null,
    ctaText: doc.ctaText,
    ctaLink: doc.ctaLink,
    status: doc.status,
    rejectionReason: doc.rejectionReason ?? '',
    isActive: Boolean(doc.isActive),
    createdAt: doc.createdAt,
  };
}

export async function listAdvertisements(sellerId) {
  const docs = await Advertisement.find({ seller: sellerId }).sort({ createdAt: -1 });
  return docs.map(serializeAdvertisementForSeller);
}
