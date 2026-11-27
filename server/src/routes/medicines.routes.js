import { Router } from 'express';
import {
  createMedicine,
  deleteMedicine,
  getAdvertisedMedicines,
  getDiscounted,
  getFeatured,
  getMedicine,
  getMedicines,
  updateMedicine,
} from '../controllers/catalog.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireSeller } from '../middleware/authorize.js';
import { requireMedicineOwnership } from '../middleware/requireMedicineOwnership.js';
import { validate } from '../middleware/validate.js';
import { limitedQuerySchema, medicineQuerySchema, objectIdSchema } from '../validators/catalog.validators.js';
import { createMedicineSchema, updateMedicineSchema } from '../validators/medicine.validators.js';

const router = Router();

// Static paths first so they are never captured by /medicines/:id.
router.get('/medicines/advertised', validate(limitedQuerySchema, 'query'), getAdvertisedMedicines);
router.get('/medicines/featured', validate(limitedQuerySchema, 'query'), getFeatured);
router.get('/medicines/discounted', validate(limitedQuerySchema, 'query'), getDiscounted);
router.get('/medicines', validate(medicineQuerySchema, 'query'), getMedicines);

// Seller/admin management (protected; ownership enforced in middleware).
router.post('/medicines', authenticate, requireSeller, validate(createMedicineSchema), createMedicine);
router.patch('/medicines/:id', authenticate, requireSeller, validate(objectIdSchema, 'params'), validate(updateMedicineSchema), requireMedicineOwnership, updateMedicine);
router.delete('/medicines/:id', authenticate, requireSeller, validate(objectIdSchema, 'params'), requireMedicineOwnership, deleteMedicine);

router.get('/medicines/:id', validate(objectIdSchema, 'params'), getMedicine);

export default router;
