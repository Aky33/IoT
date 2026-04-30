import rateLimit from 'express-rate-limit';

/**
 * Rate limit factories for specific endpoint families.
 *
 * TEMPLATE — demonstrates the intended pattern; not yet wired into app.js.
 * Apply per-route (NOT globally) when implementing endpoints that accept
 * traffic without auth — e.g. POST /notifications/create.
 *
 * Usage:
 *   import { notificationsRateLimit } from './middleware/rateLimit.js';
 *   app.use('/notifications/create', notificationsRateLimit);
 */

// Public notification endpoint — 10 requests per minute per IP.
// Adjust windowMs/max per expected load. Without auth, this is the
// primary DoS defense.
export const notificationsRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'rateLimitExceeded',
      message: 'Too many notifications in a short window. Try again later.',
      details: {},
    },
  },
});

// Generic write endpoints (create/edit/delete) — more permissive.
export const writeRateLimit = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints — brute-force protection for login/register.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'rateLimitExceeded',
      message: 'Too many auth attempts. Try again later.',
      details: {},
    },
  },
});
