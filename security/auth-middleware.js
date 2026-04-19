/**
 * Authentication Middleware
 * Validates JWT tokens and enforces access control
 */

const jwt = require('jsonwebtoken');
const { AuditLog } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

function authMiddleware(req, res, next) {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authorization required',
      code: 401
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Log expired token attempt
      AuditLog.create({
        eventType: 'expired_token',
        userId: error.expiredAt ? decoded?.userId : null,
        details: 'JWT token expired',
        ipAddress: req.ip
      }).catch(() => {});

      return res.status(401).json({
        error: 'Token expired',
        code: 401
      });
    }

    if (error.name === 'JsonWebTokenError') {
      // Log invalid token attempt
      AuditLog.create({
        eventType: 'invalid_token',
        details: 'Invalid JWT token',
        ipAddress: req.ip
      }).catch(() => {});

      return res.status(401).json({
        error: 'Invalid token',
        code: 401
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      code: 500
    });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
