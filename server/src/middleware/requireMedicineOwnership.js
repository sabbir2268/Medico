import { Medicine } from '../models/Medicine.js';
import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/** Sellers may only modify their own listings; admins may modify any. */
export function requireMedicineOwnership(req, res, next) {
  return Medicine.findById(req.params.id)
    .then((medicine) => {
      if (!medicine) {
        throw new ApiError(404, 'Medicine not found.', { code: ERROR_CODES.NOT_FOUND });
      }

      const isOwner = String(medicine.seller) === String(req.user._id);
      const role = req.auth?.role ?? req.user.role;
      if (role !== ROLES.ADMIN && !isOwner) {
        throw new ApiError(403, 'You can only manage medicines you listed.', {
          code: ERROR_CODES.FORBIDDEN,
        });
      }

      req.medicine = medicine;
      return next();
    })
    .catch(next);
}
