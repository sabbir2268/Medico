import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

const CONNECTION_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export function registerDatabaseEventHandlers() {
  mongoose.connection.on('error', (error) => {
    logger.error(`MongoDB connection error: ${error.message}`);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
  });

  logger.info('MongoDB connected successfully');
  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  logger.info('MongoDB disconnected cleanly');
}

export function getDatabaseStatus() {
  const readyState = mongoose.connection.readyState;
  return {
    status: CONNECTION_STATES[readyState] || 'unknown',
    readyState,
    name: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
  };
}
