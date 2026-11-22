import { getHomeData } from '../services/catalog.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** GET /api/home — single aggregated payload for the storefront homepage. */
export const getHome = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Homepage data retrieved.',
    data: await getHomeData(),
  }),
);
