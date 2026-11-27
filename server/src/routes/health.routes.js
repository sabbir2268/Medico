import { Router } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { getDatabaseStatus } from '../config/database.js';
import { isFirebaseAdminConfigured } from '../config/firebaseAdmin.js';
import { isStripeConfigured } from '../config/stripe.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { isImgbbConfigured } from '../config/imgbb.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const database = getDatabaseStatus();
    let isDatabaseHealthy = database.status === 'connected';

    if (isDatabaseHealthy) {
      try {
        await mongoose.connection.db.admin().ping();
      } catch (error) {
        isDatabaseHealthy = false;
        database.status = 'unavailable';
      }
    }

    const data = {
      status: isDatabaseHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      server: {
        status: 'ok',
        environment: env.nodeEnv,
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
      },
      // Keep infrastructure details (Atlas host / database name) private.
      database: {
        status: database.status,
        readyState: database.readyState,
      },
      features: {
        auth: { firebaseAdmin: isFirebaseAdminConfigured },
        payments: { stripe: isStripeConfigured },
        storage: { imgbb: isImgbbConfigured, cloudinary: isCloudinaryConfigured },
      },
    };

    if (!isDatabaseHealthy) {
      return sendError(res, {
        statusCode: 503,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Service is running but the database is unavailable.',
        data,
      });
    }

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Service is healthy.',
      data,
    });
  }),
);

export default router;
