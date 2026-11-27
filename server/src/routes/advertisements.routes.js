import { Router } from 'express';
import { getAdvertised } from '../controllers/catalog.controller.js';
import { validate } from '../middleware/validate.js';
import { limitedQuerySchema } from '../validators/catalog.validators.js';

const router = Router();
router.get('/advertisements/active', validate(limitedQuerySchema, 'query'), getAdvertised);

export default router;
