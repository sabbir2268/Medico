import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function isImageUploadConfigured() {
  return isCloudinaryConfigured;
}

/** Streams a validated buffer to Cloudinary; never writes to local disk. */
export function uploadMedicineImage(file, sellerId) {
  if (!file?.buffer) {
    throw new ApiError(400, 'An image file is required.', {
      code: ERROR_CODES.VALIDATION_ERROR,
      errors: { image: 'Choose an image to upload.' },
    });
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new ApiError(400, 'Only JPEG, PNG and WebP images are allowed.', {
      code: ERROR_CODES.INVALID_FILE_TYPE,
    });
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(400, 'Images must be smaller than 5 MB.', {
      code: ERROR_CODES.FILE_TOO_LARGE,
    });
  }
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, 'Cloudinary is not configured on the server.', {
      code: ERROR_CODES.UPLOAD_NOT_CONFIGURED,
    });
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `medico/medicines/${sellerId}`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(
            new ApiError(502, 'Image upload failed. Please try again.', {
              code: ERROR_CODES.INTERNAL_ERROR,
            }),
          );
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.on('error', () =>
      reject(new ApiError(502, 'Image upload failed.', { code: ERROR_CODES.INTERNAL_ERROR })),
    );
    stream.end(file.buffer);
  });
}
