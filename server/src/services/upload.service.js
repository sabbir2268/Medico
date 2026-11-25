import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { IMGBB_UPLOAD_URL, isImgbbConfigured } from '../config/imgbb.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { logger } from '../utils/logger.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function isImageUploadConfigured() {
  return isImgbbConfigured || isCloudinaryConfigured;
}

function validateFile(file) {
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
}

async function uploadToImgbb(file) {
  const form = new URLSearchParams();
  form.set('key', env.imgbb.apiKey);
  form.set('image', file.buffer.toString('base64'));
  form.set('name', String(file.originalname ?? 'medico-image').replace(/\.[^.]+$/, '').slice(0, 120));

  let response;
  try {
    response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError(502, 'Image upload failed. Please try again.', {
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* handled below */
  }

  if (!response.ok || !payload?.success || !payload?.data?.url) {
    const detail = payload?.error?.message ? ` ${payload.error.message}` : '';
    throw new ApiError(502, `Image upload failed.${detail}`, {
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }

  return {
    url: payload.data.url,
    displayUrl: payload.data.display_url ?? payload.data.url,
    deleteUrl: payload.data.delete_url ?? '',
    provider: 'imgbb',
  };
}

function uploadToCloudinary(file, sellerId) {
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
        resolve({
          url: result.secure_url,
          displayUrl: result.secure_url,
          deleteUrl: '',
          publicId: result.public_id,
          provider: 'cloudinary',
        });
      },
    );

    stream.on('error', () =>
      reject(new ApiError(502, 'Image upload failed.', { code: ERROR_CODES.INTERNAL_ERROR })),
    );
    stream.end(file.buffer);
  });
}

/** Uploads a validated image; imgbb first, Cloudinary as a real fallback. */
export async function uploadImage(file, sellerId = 'shared') {
  validateFile(file);

  if (isImgbbConfigured && isCloudinaryConfigured) {
    try {
      return await uploadToImgbb(file);
    } catch (error) {
      logger.warn(`imgbb upload failed (${error.message}); trying Cloudinary.`);
      return uploadToCloudinary(file, sellerId);
    }
  }
  if (isImgbbConfigured) return uploadToImgbb(file);
  if (isCloudinaryConfigured) return uploadToCloudinary(file, sellerId);

  throw new ApiError(503, 'Image upload is not configured on the server.', {
    code: ERROR_CODES.UPLOAD_NOT_CONFIGURED,
  });
}

