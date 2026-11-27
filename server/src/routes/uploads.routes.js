import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate.js';
import { requireSeller } from '../middleware/authorize.js';
import { uploadImageController } from '../controllers/upload.controller.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new ApiError(400, 'Only JPEG, PNG and WebP images are allowed.', {
        code: ERROR_CODES.INVALID_FILE_TYPE,
      }),
    );
  },
});

// Multipart field name: "image". Returns an imgbb URL usable in Medicine.images.
router.post('/uploads/image', authenticate, requireSeller, upload.single('image'), uploadImageController);

export default router;
