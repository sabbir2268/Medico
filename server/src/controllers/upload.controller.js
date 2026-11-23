import { isImageUploadConfigured, uploadImage } from '../services/upload.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadImageController = asyncHandler(async (req, res) => {
  if (!isImageUploadConfigured()) {
    throw new ApiError(503, 'Image upload is not configured on the server.', {
      code: ERROR_CODES.UPLOAD_NOT_CONFIGURED,
    });
  }

  const result = await uploadImage(req.file, String(req.user?._id ?? 'shared'));

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Image uploaded successfully.',
    data: result,
  });
});
