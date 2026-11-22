import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors.js';
import { httpLogger } from './config/morgan.js';
import { apiRateLimiter } from './config/rateLimiter.js';
import routes from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Correct client IPs for rate limiting when deployed behind a reverse proxy.
app.set('trust proxy', 1);
app.disable('x-powered-by');//security best practice to hide the technology stack used by the server
app.use(helmet());//security best practice to set various HTTP headers to help protect the app from well-known web vulnerabilities
app.use(httpLogger);//logging middleware to log HTTP requests and responses for debugging and monitoring purposes
app.use(cors(corsOptions));
// Stripe needs the exact raw body to verify the HMAC signature.
app.use('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api', apiRateLimiter);
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
