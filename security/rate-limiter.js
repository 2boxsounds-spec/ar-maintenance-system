/**
 * Rate Limiter Configuration
 * Prevents brute force and DoS attacks
 */

const rateLimit = require('express-rate-limit');

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

const rateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP',
    code: 429,
    retryAfter: Math.ceil(WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP',
      code: 429,
      message: 'Please try again later',
      retryAfter: Math.ceil(WINDOW_MS / 1000)
    });
  }
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts',
    code: 429,
    message: 'Account temporarily locked. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = rateLimiter;
module.exports.authLimiter = authLimiter;
