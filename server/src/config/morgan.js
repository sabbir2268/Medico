import morgan from 'morgan';
import { env, isTest } from './env.js';
import { logger } from '../utils/logger.js';

export const httpLogger = morgan(env.morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
  skip: () => isTest,
});
