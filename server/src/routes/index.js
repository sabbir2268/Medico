import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import homeRoutes from './home.routes.js';
import advertisementRoutes from './advertisements.routes.js';
import categoryRoutes from './categories.routes.js';
import medicineRoutes from './medicines.routes.js';
import healthTipRoutes from './healthTips.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './orders.routes.js';
import paymentRoutes from './payments.routes.js';
import adminRoutes from './admin.routes.js';
import uploadsRoutes from './uploads.routes.js';

const router = Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(userRoutes);
router.use(homeRoutes);
router.use(advertisementRoutes);
router.use(categoryRoutes);
router.use(medicineRoutes);
router.use(healthTipRoutes);
router.use(cartRoutes);
router.use(orderRoutes);
router.use(paymentRoutes);
router.use(uploadsRoutes);
router.use(adminRoutes);

export default router;
