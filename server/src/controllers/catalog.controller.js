import {
  getCategoryById,
  getCategoryMedicines,
  getMedicineById,
  listAdvertisements,
  listCategories,
  listHealthTips,
  listMedicines,
  serializeCategory,
  serializeMedicine,
} from '../services/catalog.service.js';
import { Medicine } from '../models/Medicine.js';
import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPaginated, sendSuccess } from '../utils/apiResponse.js';

const query = (req) => req.validated.query;

export const getCategories = asyncHandler(async (req, res) => {
  const { active, limit } = query(req);
  const items = await listCategories({ active, limit });
  return sendSuccess(res, { message: 'Categories retrieved.', data: { items } });
});

export const getCategory = asyncHandler(async (req, res) => {
  const item = await getCategoryById(req.params.id);
  if (!item) throw new ApiError(404, 'Category not found.', { code: ERROR_CODES.NOT_FOUND });
  return sendSuccess(res, { message: 'Category retrieved.', data: { category: item } });
});

export const getCategoryMedicinesController = asyncHandler(async (req, res) => {
  const result = await getCategoryMedicines(req.params.id, query(req));
  if (!result) throw new ApiError(404, 'Category not found.', { code: ERROR_CODES.NOT_FOUND });
  return sendPaginated(res, { items: result.items, pagination: result.pagination });
});

export const getMedicines = asyncHandler(async (req, res) => {
  const result = await listMedicines(query(req));
  return sendPaginated(res, { items: result.items, pagination: result.pagination });
});

export const getMedicine = asyncHandler(async (req, res) => {
  const item = await getMedicineById(req.params.id);
  if (!item) throw new ApiError(404, 'Medicine not found or unavailable.', { code: ERROR_CODES.NOT_FOUND });
  return sendSuccess(res, { message: 'Medicine retrieved.', data: { medicine: item } });
});

export const getAdvertisedMedicines = asyncHandler(async (req, res) => {
  const { limit } = query(req);
  const result = await listMedicines({ advertised: true, limit: limit ?? 4 });
  return sendSuccess(res, { message: 'Advertised medicines retrieved.', data: { items: result.items } });
});

export const getFeatured = asyncHandler(async (req, res) => {
  const { limit } = query(req);
  const result = await listMedicines({ featured: true, limit: limit ?? 8 });
  return sendSuccess(res, { message: 'Featured medicines retrieved.', data: { items: result.items } });
});

export const getDiscounted = asyncHandler(async (req, res) => {
  const { limit } = query(req);
  const result = await listMedicines({ discounted: true, limit: limit ?? 8 });
  return sendSuccess(res, { message: 'Discounted medicines retrieved.', data: { items: result.items } });
});

export const getAdvertised = asyncHandler(async (req, res) => {
  const { limit } = query(req);
  const items = await listAdvertisements(limit ?? 6);
  return sendSuccess(res, { message: 'Active advertisements retrieved.', data: { items } });
});

export const getHealthTips = asyncHandler(async (req, res) => {
  const { limit } = query(req);
  const items = await listHealthTips(limit ?? 4);
  return sendSuccess(res, { message: 'Health tips retrieved.', data: { items } });
});

/** POST /api/medicines — authenticated seller creates a listing. */
export const createMedicine = asyncHandler(async (req, res) => {
  const values = req.validated.body;
  const medicine = await Medicine.create({
    ...values,
    // Seller identity always comes from the verified token.
    seller: req.user._id,
    isFeatured: req.auth?.role === ROLES.ADMIN ? values.isFeatured : false,
  });
  const doc = await Medicine.findById(medicine._id)
    .populate({ path: 'category', match: { isActive: true } })
    .populate('seller', 'username displayName');

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Medicine listed successfully.',
    data: { medicine: serializeMedicine(doc) },
  });
});

/** PATCH /api/medicines/:id — ownership enforced by middleware. */
export const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = req.medicine;
  Object.assign(medicine, req.validated.body);
  if (req.auth?.role !== ROLES.ADMIN) medicine.isFeatured = false;
  await medicine.save();

  const doc = await Medicine.findById(medicine._id)
    .populate({ path: 'category', match: { isActive: true } })
    .populate('seller', 'username displayName');

  return sendSuccess(res, {
    message: 'Medicine updated successfully.',
    data: { medicine: serializeMedicine(doc) },
  });
});

/** DELETE /api/medicines/:id — soft delete keeps historical order references valid. */
export const deleteMedicine = asyncHandler(async (req, res) => {
  req.medicine.status = 'inactive';
  await req.medicine.save({ validateBeforeSave: false });
  return sendSuccess(res, { message: 'Medicine removed from the catalog.', data: null });
});
