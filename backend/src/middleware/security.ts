import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { Express } from 'express';

/**
 * Setup security middleware for the Express app
 */
export const setupSecurity = (app: Express) => {
  // Helmet for security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Compression for response body
  app.use(compression());

  // Rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  // General API rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Payment endpoint rate limiting (stricter)
  const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 payment attempts per hour
    message: 'Too many payment attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Image upload rate limiting
  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: 'Too many upload attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  return {
    authLimiter,
    apiLimiter,
    paymentLimiter,
    uploadLimiter,
  };
};
