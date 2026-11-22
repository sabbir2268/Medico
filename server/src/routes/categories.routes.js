import { Router } from 'express';
import {
  getCategories,
  getCategory,
  getCategoryMedicinesController,
} from '../controllers/catalog.controller.js';
import { validate } from '../middleware/validate.js';
import {
  categoryQuerySchema,
  medicineQuerySchema,
  objectIdSchema,
} from '../validators/catalog.validators.js';

const router = Router();

router.get('/categories', validate(categoryQuerySchema, 'query'), getCategories);
router.get('/categories/:id/medicines', validate(objectIdSchema, 'params'), validate(medicineQuerySchema, 'query'), getCategoryMedicinesController);
router.get('/categories/:id', validate(objectIdSchema, 'params'), getCategory);

export default router;
