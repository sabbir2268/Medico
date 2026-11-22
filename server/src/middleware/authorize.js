import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/** Factory that restricts a route to the given server-side roles. */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ApiError(401, 'Authentication is required.', { code: ERROR_CODES.UNAUTHORIZED }),
      );
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action.', {
          code: ERROR_CODES.FORBIDDEN,
        }),
      );
    }

    return next();
  };
}

export const requireAdmin = authorize(ROLES.ADMIN);
export const requireSeller = authorize(ROLES.SELLER, ROLES.ADMIN);
/** Strict seller-only guard used by the seller dashboard APIs. */
export const requireSellerOnly = authorize(ROLES.SELLER);
export const requirePharmacist = authorize(ROLES.PHARMACIST, ROLES.ADMIN);
