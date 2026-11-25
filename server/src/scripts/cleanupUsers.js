/**
 * Dev utility: inspect and remove users from MongoDB (the actual signup registry).
 *
 * Usage (from /server):
 *   npm run cleanup:users -- --list           list all users
 *   npm run cleanup:users -- someone@x.com    delete one email
 *   npm run cleanup:users -- --all            delete everyone except ADMIN_EMAIL
 *   npm run cleanup:users -- --reset-admin    delete the ADMIN_EMAIL record so it
 *                                             can self-register, and demote any
 *                                             other DB admin to a normal user
 *
 * Deleting from the Firebase console does NOT remove these records: with
 * VITE_AUTH_MODE=backend the signup duplicate check E11000 comes from the
 * MongoDB users collection, not from Firebase Auth.
 */
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { ROLES } from '../constants/roles.js';
import { User } from '../models/User.js';

const args = process.argv.slice(2);
const adminEmail = (env.adminEmail || '').toLowerCase();

async function main() {
  await connectDatabase();

  if (args.length === 0 || args.includes('--help')) {
    logger.info('Usage: npm run cleanup:users -- --list | <email> | --all | --reset-admin');
    return;
  }

  if (args.includes('--list')) {
    const users = await User.find({}, { email: 1, username: 1, role: 1, provider: 1, firebaseUid: 1 }).sort({ email: 1 });
    logger.info(`Users in MongoDB (${users.length}):`);
    for (const user of users) {
      logger.info(`  ${user.email} | role=${user.role} | provider=${user.provider}${user.firebaseUid ? ' | firebase' : ''}`);
    }
    return;
  }

  // Allow the configured admin email to register itself as a normal user.
  if (args.includes('--reset-admin')) {
    if (!adminEmail) {
      logger.warn('ADMIN_EMAIL is not configured in server/.env; nothing to reset.');
      return;
    }

    const removed = await User.deleteOne({ email: adminEmail });
    logger.info(
      removed.deletedCount
        ? `Removed the seeded ${adminEmail} record. It can now register normally.`
        : `No ${adminEmail} record existed; it can register normally.`,
    );

    const demoted = await User.updateMany(
      { role: ROLES.ADMIN, email: { $ne: adminEmail } },
      { $set: { role: ROLES.USER } },
    );
    logger.info(`Demoted ${demoted.modifiedCount} other database admin account(s).`);
    return;
  }

  if (args.includes('--all')) {
    const result = await User.deleteMany({ email: { $ne: adminEmail } });
    logger.info(`Deleted ${result.deletedCount} user(s) from MongoDB (ADMIN_EMAIL kept).`);
    return;
  }

  const email = args[0].trim().toLowerCase();
  if (email === adminEmail) {
    logger.warn(
      `Refusing to delete the configured admin account (${email}). Use --reset-admin instead.`,
    );
    return;
  }

  const result = await User.deleteOne({ email });
  if (result.deletedCount === 0) {
    logger.warn(`No MongoDB user found with email ${email}. Nothing was deleted.`);
  } else {
    logger.info(`Deleted MongoDB user ${email}. Registration should now work for that email.`);
  }
}

main()
  .catch((error) => {
    logger.error(`Cleanup failed: ${error.stack || error.message}`);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
