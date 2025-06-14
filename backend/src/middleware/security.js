import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import logger from '../utils/logger.js';

// Enhanced rate limiting configurations
export const createRateLimiter = (
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests'
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, User: ${req.user?.id || 'anonymous'}`);
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
export const rateLimiters = {
  // General API rate limit
  general: createRateLimiter(15 * 60 * 1000, 100, 'Too many requests from this IP'),

  // Strict rate limit for auth endpoints
  auth: createRateLimiter(15 * 60 * 1000, 10, 'Too many authentication attempts'),

  // Moderate rate limit for data modification
  modify: createRateLimiter(15 * 60 * 1000, 50, 'Too many modification requests'),

  // Lenient rate limit for read operations
  read: createRateLimiter(15 * 60 * 1000, 200, 'Too many read requests'),

  // Very strict for password reset
  passwordReset: createRateLimiter(60 * 60 * 1000, 3, 'Too many password reset attempts')
};

// Enhanced helmet configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Security audit middleware
export const securityAudit = (req, res, next) => {
  const startTime = Date.now();

  // Log security-relevant requests
  const securityEvents = ['login', 'logout', 'password', 'admin', 'delete', 'create', 'update'];

  const isSecurityRelevant = securityEvents.some(
    (event) => req.url.toLowerCase().includes(event) || req.method !== 'GET'
  );

  if (isSecurityRelevant) {
    logger.info('Security audit', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString()
    });
  }

  // Track response for security events
  res.on('finish', () => {
    if (isSecurityRelevant) {
      const responseTime = Date.now() - startTime;

      // Log failed authentication attempts
      if (req.url.includes('login') && res.statusCode >= 400) {
        logger.warn('Failed login attempt', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          statusCode: res.statusCode,
          responseTime
        });
      }

      // Log privilege escalation attempts
      if (res.statusCode === 403) {
        logger.warn('Access denied', {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userId: req.user?.id,
          userRole: req.user?.role,
          statusCode: res.statusCode
        });
      }

      // Log successful admin actions
      if (req.user?.role === 'admin' && res.statusCode < 400) {
        logger.info('Admin action', {
          method: req.method,
          url: req.url,
          userId: req.user.id,
          statusCode: res.statusCode,
          responseTime
        });
      }
    }
  });

  next();
};

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  // Basic XSS protection for string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;

    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Request size limiter
export const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = parseSize(maxSize);

    if (contentLength > maxBytes) {
      logger.warn('Request too large', {
        ip: req.ip,
        contentLength,
        maxSize,
        url: req.url
      });

      return res.status(413).json({
        error: 'Request entity too large',
        maxSize
      });
    }

    next();
  };
};

// Helper function to parse size strings
const parseSize = (size) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };

  const match = size
    .toString()
    .toLowerCase()
    .match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(value * units[unit]);
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Add CORS headers for API
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001' // Development fallback
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  next();
};

export default {
  rateLimiters,
  helmetConfig,
  securityAudit,
  sanitizeInput,
  requestSizeLimiter,
  securityHeaders
};
