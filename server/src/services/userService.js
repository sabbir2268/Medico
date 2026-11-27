import { User } from '../models/User.js';
import { ROLES, ASSIGNABLE_ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

function usernameFromFirebase(decoded, email) {
  const candidate = typeof decoded?.name === 'string' && decoded.name.trim();
  return String(candidate || email.split('@')[0]).slice(0, 30);
}

/**
 * Creates or updates the server-side profile from a *verified* Firebase token.
 * Identity fields come from the token; roles come from existing DB state or a
 * trusted Admin SDK custom claim. Request bodies are never used here.
 */
export async function findOrCreateUserFromFirebase(decoded) {
  const firebaseUid = decoded?.uid;
  const email = typeof decoded?.email === 'string' ? decoded.email.toLowerCase().trim() : '';

  if (!firebaseUid || !email) {
    throw new ApiError(400, 'The authentication token is missing identity information.', {
      code: ERROR_CODES.INVALID_TOKEN,
    });
  }

  const identity = {
    email,
    displayName: typeof decoded.name === 'string' ? decoded.name : '',
    photoURL: typeof decoded.picture === 'string' ? decoded.picture : '',
    lastLoginAt: new Date(),
  };

  let user = await User.findOne({ firebaseUid });

  if (!user) {
    const existingByEmail = await User.findOne({ email });
    const claimRole = decoded.role;
    // A Firebase custom claim can never create an admin: the allowlisted
    // ADMIN_EMAIL is the single source of truth for admin access.
    const role = ASSIGNABLE_ROLES.includes(claimRole) ? claimRole : ROLES.USER;

    if (existingByEmail) {
      existingByEmail.firebaseUid = firebaseUid;
      existingByEmail.provider = 'firebase';
      if (!existingByEmail.username) existingByEmail.username = usernameFromFirebase(decoded, email);
      Object.assign(existingByEmail, identity);
      await existingByEmail.save();
      return existingByEmail;
    }

    return User.create({
      firebaseUid,
      username: usernameFromFirebase(decoded, email),
      provider: 'firebase',
      ...identity,
      role,
    });
  }

  Object.assign(user, identity);
  await user.save();
  return user;
}
