import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Medicine } from '../models/Medicine.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Advertisement } from '../models/Advertisement.js';
import { HealthTip } from '../models/HealthTip.js';
import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { buildPagination } from '../utils/pagination.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import { serializeMedicine } from './catalog.service.js';
import { recordAudit } from './audit.service.js';

function dateRange(from, to) {
  const start = from ? new Date(from) : new Date(0);
  const end = to ? new Date(to) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, 'Invalid date range.', { code: ERROR_CODES.VALIDATION_ERROR });
  }
  return { $gte: start, $lte: end };
}

async function assertNotSelf(adminId, targetId) {
  if (String(adminId) === String(targetId)) {
    throw new ApiError(400, 'You cannot modify your own admin account here.', {
      code: ERROR_CODES.CANNOT_MODIFY_SELF,
    });
  }
}

async function assertLastAdmin(target) {
  if (target.role !== ROLES.ADMIN || !target.isActive) return;

  const activeAdmins = await User.countDocuments({ role: ROLES.ADMIN, isActive: true, deletedAt: null });
  if (activeAdmins <= 1) {
    throw new ApiError(409, 'The last active admin cannot be changed.', {
      code: ERROR_CODES.LAST_ADMIN,
    });
  }
}

function withPagination(items, total, page, limit) {
  return { items, pagination: buildPagination({ page, limit, total }) };
}

export async function getDashboard() {
  const [users, sellers, medicines, orders, revenueResult, pendingAds, pendingSellers] =
    await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ role: ROLES.SELLER, deletedAt: null }),
      Medicine.countDocuments({}),
      Order.countDocuments({}),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Advertisement.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: ROLES.SELLER, sellerStatus: 'pending' }),
    ]);

  return {
    users,
    sellers,
    medicines,
    orders,
    revenue: Math.round((revenueResult[0]?.total ?? 0) * 100) / 100,
    pendingApprovals: { advertisements: pendingAds, sellers: pendingSellers },
  };
}

export async function getAnalytics({ from, to } = {}) {
  const range = dateRange(from, to);
  const [orders, payments] = await Promise.all([
    Order.find({ createdAt: range }).select('createdAt status paymentStatus'),
    Payment.find({ status: 'paid', createdAt: range }).select('amount createdAt'),
  ]);

  const byDay = new Map();
  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { date: day, orders: 0, revenue: 0 };
    entry.orders += 1;
    byDay.set(day, entry);
  }
  for (const payment of payments) {
    const day = payment.createdAt.toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { date: day, orders: 0, revenue: 0 };
    entry.revenue += Number(payment.amount || 0);
    byDay.set(day, entry);
  }

  const series = [...byDay.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({ ...entry, revenue: Math.round(entry.revenue * 100) / 100 }));
  const revenue = series.reduce((sum, entry) => sum + entry.revenue, 0);

  return {
    range: { from: from ?? null, to: to ?? null },
    summary: {
      orders: orders.length,
      revenue: Math.round(revenue * 100) / 100,
      averageOrderValue: orders.length ? Math.round((revenue / orders.length) * 100) / 100 : 0,
    },
    series,
  };
}

/* --------------------------------- users --------------------------------- */

function userFilter({ search = '', role, status }) {
  const filter = { deletedAt: null };
  if (role) filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'blocked') filter.isActive = false;
  if (search) {
    const expression = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ username: expression }, { email: expression }];
  }
  return filter;
}

export async function listUsers({ page, limit, search, role, status }) {
  const filter = userFilter({ search, role, status });
  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);
  return withPagination(docs.map(sanitizeUser), total, page, limit);
}

export async function updateUserRole(adminId, id, role, req) {
  await assertNotSelf(adminId, id);
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) throw new ApiError(404, 'User not found.', { code: ERROR_CODES.NOT_FOUND });
  await assertLastAdmin(user);

  const previous = user.role;
  user.role = role;
  if (role !== ROLES.SELLER) user.sellerStatus = 'approved';
  await user.save({ validateBeforeSave: false });

  await recordAudit({
    adminId,
    action: 'USER_ROLE_CHANGED',
    targetType: 'User',
    targetId: id,
    details: { from: previous, to: role },
    req,
  });
  return sanitizeUser(user);
}

export async function updateUserStatus(adminId, id, isActive, req) {
  await assertNotSelf(adminId, id);
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) throw new ApiError(404, 'User not found.', { code: ERROR_CODES.NOT_FOUND });
  if (isActive === false) await assertLastAdmin(user);

  const previous = user.isActive;
  user.isActive = isActive;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save({ validateBeforeSave: false });

  await recordAudit({
    adminId,
    action: isActive ? 'USER_UNBLOCKED' : 'USER_BLOCKED',
    targetType: 'User',
    targetId: id,
    details: { from: previous, to: isActive },
    req,
  });
  return sanitizeUser(user);
}

/** Soft delete: historical orders and payments are never removed. */
export async function deleteUser(adminId, id, req) {
  await assertNotSelf(adminId, id);
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) throw new ApiError(404, 'User not found.', { code: ERROR_CODES.NOT_FOUND });
  await assertLastAdmin(user);

  user.isActive = false;
  user.deletedAt = new Date();
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save({ validateBeforeSave: false });

  await recordAudit({
    adminId,
    action: 'USER_DELETED',
    targetType: 'User',
    targetId: id,
    details: { email: user.email },
    req,
  });
  return { id, deleted: true };
}

/* -------------------------------- sellers -------------------------------- */

export async function listSellers({ page, limit, search, status }) {
  const filter = { role: ROLES.SELLER, deletedAt: null };
  if (status) filter.sellerStatus = status;
  if (search) {
    const expression = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ username: expression }, { email: expression }];
  }
  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);
  return withPagination(docs.map(sanitizeUser), total, page, limit);
}

export async function updateSellerStatus(adminId, id, sellerStatus, reason, req) {
  const seller = await User.findOne({ _id: id, role: ROLES.SELLER, deletedAt: null });
  if (!seller) throw new ApiError(404, 'Seller not found.', { code: ERROR_CODES.NOT_FOUND });
  const previous = seller.sellerStatus;
  seller.sellerStatus = sellerStatus;
  await seller.save({ validateBeforeSave: false });

  await recordAudit({
    adminId,
    action: 'SELLER_STATUS_CHANGED',
    targetType: 'User',
    targetId: id,
    details: { from: previous, to: sellerStatus, reason },
    req,
  });
  return sanitizeUser(seller);
}

/* ------------------------------- categories ------------------------------ */

function serializeCategory(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? '',
    image: doc.image ?? '',
    visual: doc.visual ?? 'capsule',
    tone: doc.tone ?? 'teal',
    isActive: doc.isActive !== false,
    sortOrder: doc.sortOrder ?? 0,
  };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function listCategories({ search = '', page = 1, limit = 50 } = {}) {
  const filter = search
    ? { name: new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    : {};
  const [total, docs] = await Promise.all([
    Category.countDocuments(filter),
    Category.find(filter).sort({ sortOrder: 1, name: 1 }).skip((page - 1) * limit).limit(limit),
  ]);
  return withPagination(docs.map(serializeCategory), total, page, limit);
}

export async function createCategory(adminId, values, req) {
  const category = await Category.create({ ...values, slug: values.slug || slugify(values.name) });
  await recordAudit({
    adminId,
    action: 'CATEGORY_CREATED',
    targetType: 'Category',
    targetId: category._id,
    details: { name: category.name },
    req,
  });
  return serializeCategory(category);
}

export async function updateCategory(adminId, id, values, req) {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found.', { code: ERROR_CODES.NOT_FOUND });
  Object.assign(category, values);
  if (values.name && !values.slug) category.slug = slugify(values.name);
  await category.save();

  await recordAudit({
    adminId,
    action: 'CATEGORY_UPDATED',
    targetType: 'Category',
    targetId: id,
    details: { name: category.name, isActive: category.isActive },
    req,
  });
  return serializeCategory(category);
}

export async function deleteCategory(adminId, id, req) {
  const inUse = await Medicine.countDocuments({ category: id });
  if (inUse > 0) {
    throw new ApiError(409, 'This category still has medicines.', {
      code: ERROR_CODES.CATEGORY_IN_USE,
    });
  }
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new ApiError(404, 'Category not found.', { code: ERROR_CODES.NOT_FOUND });

  await recordAudit({
    adminId,
    action: 'CATEGORY_DELETED',
    targetType: 'Category',
    targetId: id,
    details: { name: category.name },
    req,
  });
  return { id, deleted: true };
}

/* -------------------------------- medicines ------------------------------ */

export async function listMedicines({ page, limit, search = '', status } = {}) {
  const filter = {};
  if (search) {
    const expression = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: expression }, { genericName: expression }, { manufacturer: expression }];
  }
  if (status === 'hidden') filter.isHidden = true;
  if (status === 'pending') filter.isApproved = false;
  if (status === 'inactive') filter.status = 'inactive';
  if (status === 'active') {
    filter.status = 'active';
    filter.isHidden = { $ne: true };
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
  return withPagination(docs.map(serializeMedicine), total, page, limit);
}

export async function updateMedicineStatus(adminId, id, status, reason, req) {
  const medicine = await Medicine.findById(id);
  if (!medicine) throw new ApiError(404, 'Medicine not found.', { code: ERROR_CODES.NOT_FOUND });

  if (status === 'approved') {
    medicine.isApproved = true;
    medicine.isHidden = false;
  } else if (status === 'rejected') {
    medicine.isApproved = false;
    medicine.isHidden = true;
  } else if (status === 'hidden') {
    medicine.isHidden = true;
  } else if (status === 'active') {
    medicine.status = 'active';
  } else if (status === 'inactive') {
    medicine.status = 'inactive';
  }
  await medicine.save({ validateBeforeSave: false });

  await recordAudit({
    adminId,
    action: 'MEDICINE_STATUS_CHANGED',
    targetType: 'Medicine',
    targetId: id,
    details: { status, reason },
    req,
  });
  return serializeMedicine(
    await Medicine.findById(id)
      .populate({ path: 'category', match: { isActive: true } })
      .populate('seller', 'username displayName'),
  );
}

/* --------------------------- orders & payments --------------------------- */

function serializeAdminOrder(order) {
  return {
    id: String(order._id),
    orderNumber: `MD-${String(order._id).slice(-8).toUpperCase()}`,
    customer: order.delivery.fullName,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      fulfillmentStatus: item.fulfillmentStatus ?? 'processing',
      sellerName: item.sellerName,
    })),
    total: order.pricing.total,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
  };
}

export async function listOrders({ page, limit, search, status, from, to } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (from || to) filter.createdAt = dateRange(from, to);
  if (search) {
    const expression = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { 'delivery.fullName': expression },
      { orderNumber: expression },
      { 'items.name': expression },
    ];
  }
  const [total, docs] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);
  return withPagination(docs.map(serializeAdminOrder), total, page, limit);
}

export async function listPayments({ page, limit, status, from, to } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (from || to) filter.createdAt = dateRange(from, to);
  const [total, docs] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);
  return withPagination(
    docs.map((payment) => ({
      id: String(payment._id),
      orderId: String(payment.order),
      orderNumber: `MD-${String(payment.order).slice(-8).toUpperCase()}`,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      createdAt: payment.createdAt,
    })),
    total,
    page,
    limit,
  );
}

/* -------------------------------- reports -------------------------------- */

export async function getSalesReport({ from, to } = {}) {
  const range = dateRange(from, to);
  const [payments, orders] = await Promise.all([
    Payment.find({ createdAt: range }).sort({ createdAt: 1 }),
    Order.find({ createdAt: range }).select('status paymentStatus'),
  ]);

  const revenue = payments
    .filter((payment) => payment.status === 'paid')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return {
    range: { from: from ?? null, to: to ?? null },
    summary: {
      revenue: Math.round(revenue * 100) / 100,
      orders: orders.length,
      paidPayments: payments.filter((payment) => payment.status === 'paid').length,
      failedPayments: payments.filter((payment) => payment.status === 'failed').length,
    },
    rows: payments.map((payment) => ({
      date: payment.createdAt.toISOString().slice(0, 10),
      orderNumber: `MD-${String(payment.order).slice(-8).toUpperCase()}`,
      amount: payment.amount,
      status: payment.status,
      provider: payment.provider,
    })),
  };
}

/* ----------------------------- advertisements ---------------------------- */

export async function listAdvertisements() {
  const docs = await Advertisement.find({}).sort({ createdAt: -1 });
  return docs.map((doc) => ({
    id: String(doc._id),
    title: doc.title,
    subtitle: doc.subtitle ?? '',
    seller: doc.seller ? String(doc.seller) : null,
    medicine: doc.medicine ? String(doc.medicine) : null,
    status: doc.status,
    isActive: Boolean(doc.isActive),
    rejectionReason: doc.rejectionReason ?? '',
    reviewedAt: doc.reviewedAt ?? null,
    createdAt: doc.createdAt,
  }));
}

export async function updateAdvertisementStatus(adminId, id, status, reason, req) {
  const ad = await Advertisement.findById(id);
  if (!ad) throw new ApiError(404, 'Advertisement not found.', { code: ERROR_CODES.NOT_FOUND });
  ad.status = status;
  ad.isActive = status === 'approved';
  ad.reviewedBy = adminId;
  ad.reviewedAt = new Date();
  ad.rejectionReason = status === 'rejected' ? reason : '';
  await ad.save({ validateBeforeSave: false });

  await recordAudit({
    adminId,
    action: 'ADVERTISEMENT_REVIEWED',
    targetType: 'Advertisement',
    targetId: id,
    details: { status, reason },
    req,
  });
  return {
    id,
    status: ad.status,
    isActive: ad.isActive,
    rejectionReason: ad.rejectionReason,
  };
}

/* ------------------------------- health tips ----------------------------- */

function serializeHealthTip(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug ?? '',
    excerpt: doc.excerpt ?? '',
    content: doc.content ?? '',
    image: doc.image ?? '',
    category: doc.category ?? 'General',
    visual: doc.visual ?? 'heart',
    tone: doc.tone ?? 'emerald',
    readMinutes: doc.readMinutes ?? 3,
    isActive: doc.isActive !== false,
    publishedAt: doc.publishedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listHealthTips({ page = 1, limit = 50, search = '' } = {}) {
  const filter = search
    ? { title: new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    : {};
  const [total, docs] = await Promise.all([
    HealthTip.countDocuments(filter),
    HealthTip.find(filter).sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);
  return withPagination(docs.map(serializeHealthTip), total, page, limit);
}

export async function createHealthTip(adminId, values, req) {
  const tip = await HealthTip.create({
    ...values,
    slug: values.slug || slugify(values.title),
    publishedAt: values.publishedAt ? new Date(values.publishedAt) : new Date(),
  });
  await recordAudit({
    adminId,
    action: 'HEALTH_TIP_CREATED',
    targetType: 'HealthTip',
    targetId: tip._id,
    details: { title: tip.title },
    req,
  });
  return serializeHealthTip(tip);
}

export async function updateHealthTip(adminId, id, values, req) {
  const tip = await HealthTip.findById(id);
  if (!tip) throw new ApiError(404, 'Health tip not found.', { code: ERROR_CODES.NOT_FOUND });
  Object.assign(tip, values);
  if (values.title && !values.slug) tip.slug = slugify(values.title);
  if (values.publishedAt) tip.publishedAt = new Date(values.publishedAt);
  await tip.save();

  await recordAudit({
    adminId,
    action: 'HEALTH_TIP_UPDATED',
    targetType: 'HealthTip',
    targetId: id,
    details: { title: tip.title, isActive: tip.isActive },
    req,
  });
  return serializeHealthTip(tip);
}

export async function deleteHealthTip(adminId, id, req) {
  const tip = await HealthTip.findByIdAndDelete(id);
  if (!tip) throw new ApiError(404, 'Health tip not found.', { code: ERROR_CODES.NOT_FOUND });
  await recordAudit({
    adminId,
    action: 'HEALTH_TIP_DELETED',
    targetType: 'HealthTip',
    targetId: id,
    details: { title: tip.title },
    req,
  });
  return { id, deleted: true };
}
