import { Router } from 'express';
import * as controller from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  adminQuerySchema,
  advertisementStatusSchema,
  analyticsQuerySchema,
  categorySchema,
  healthTipSchema,
  medicineStatusSchema,
  objectIdSchema,
  roleUpdateSchema,
  sellerStatusSchema,
  updateCategorySchema,
  updateHealthTipSchema,
  userStatusSchema,
} from '../validators/admin.validators.js';

const router = Router();
const guard = [authenticate, requireAdmin];
const idParam = validate(objectIdSchema, 'params');
const listQuery = validate(adminQuerySchema, 'query');

router.get('/admin/dashboard', ...guard, controller.dashboard);
router.get('/admin/analytics', ...guard, validate(analyticsQuerySchema, 'query'), controller.analytics);

router.get('/admin/users', ...guard, listQuery, controller.listUsers);
router.patch('/admin/users/:id/role', ...guard, idParam, validate(roleUpdateSchema), controller.updateUserRole);
router.patch('/admin/users/:id/status', ...guard, idParam, validate(userStatusSchema), controller.updateUserStatus);
router.delete('/admin/users/:id', ...guard, idParam, controller.deleteUser);

router.get('/admin/sellers', ...guard, listQuery, controller.listSellers);
router.patch('/admin/sellers/:id/status', ...guard, idParam, validate(sellerStatusSchema), controller.updateSellerStatus);

router.get('/admin/categories', ...guard, listQuery, controller.listCategories);
router.post('/admin/categories', ...guard, validate(categorySchema), controller.createCategory);
router.patch('/admin/categories/:id', ...guard, idParam, validate(updateCategorySchema), controller.updateCategory);
router.delete('/admin/categories/:id', ...guard, idParam, controller.deleteCategory);

router.get('/admin/medicines', ...guard, listQuery, controller.listMedicines);
router.patch('/admin/medicines/:id/status', ...guard, idParam, validate(medicineStatusSchema), controller.updateMedicineStatus);

router.get('/admin/orders', ...guard, listQuery, controller.listOrders);
router.get('/admin/payments', ...guard, listQuery, controller.listPayments);
router.get('/admin/reports/sales', ...guard, listQuery, controller.salesReport);

router.get('/admin/advertisements', ...guard, controller.listAdvertisements);
router.patch('/admin/advertisements/:id/status', ...guard, idParam, validate(advertisementStatusSchema), controller.updateAdvertisementStatus);

router.get('/admin/health-tips', ...guard, listQuery, controller.listHealthTips);
router.post('/admin/health-tips', ...guard, validate(healthTipSchema), controller.createHealthTip);
router.patch('/admin/health-tips/:id', ...guard, idParam, validate(updateHealthTipSchema), controller.updateHealthTip);
router.delete('/admin/health-tips/:id', ...guard, idParam, controller.deleteHealthTip);

router.get('/admin/audit-logs', ...guard, listQuery, controller.auditLogs);

export default router;
