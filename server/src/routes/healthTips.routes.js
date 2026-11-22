import { Router } from 'express';
import { getHealthTips } from '../controllers/catalog.controller.js';
import { validate } from '../middleware/validate.js';
import { limitedQuerySchema } from '../validators/catalog.validators.js';

const router = Router();
router.get('/health-tips', validate(limitedQuerySchema, 'query'), getHealthTips);

export default router;
