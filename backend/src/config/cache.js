import Redis from 'ioredis';
import logger from '../utils/logger.js';

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      // Use Redis if available, otherwise use in-memory cache
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });

        this.redis.on('connect', () => {
          this.isConnected = true;
          logger.info('Redis cache connected');
        });

        this.redis.on('error', (err) => {
          this.isConnected = false;
          logger.warn('Redis cache error:', err.message);
        });

        await this.redis.connect();
      } else {
        // Fallback to in-memory cache
        this.memoryCache = new Map();
        this.isConnected = true;
        logger.info('Using in-memory cache (Redis not configured)');
      }
    } catch (error) {
      logger.warn('Cache initialization failed, using in-memory fallback:', error.message);
      this.memoryCache = new Map();
      this.isConnected = true;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) return null;

      if (this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.value;
        } else if (cached) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      logger.warn('Cache get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      if (!this.isConnected) return false;

      if (this.redis) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        this.memoryCache.set(key, {
          value,
          expiry: Date.now() + ttlSeconds * 1000
        });

        // Clean up expired entries periodically
        if (this.memoryCache.size > 1000) {
          this.cleanupMemoryCache();
        }
      }
      return true;
    } catch (error) {
      logger.warn('Cache set error:', error.message);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false;

      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      logger.warn('Cache delete error:', error.message);
      return false;
    }
  }

  async flush() {
    try {
      if (!this.isConnected) return false;

      if (this.redis) {
        await this.redis.flushall();
      } else {
        this.memoryCache.clear();
      }
      return true;
    } catch (error) {
      logger.warn('Cache flush error:', error.message);
      return false;
    }
  }

  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expiry <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Cache key generators
  static getKeys() {
    return {
      user: (id) => `user:${id}`,
      userTeam: (userId) => `user:${userId}:team`,
      teamMembers: (teamId) => `team:${teamId}:members`,
      okrProgress: (okrId) => `okr:${okrId}:progress`,
      reviewCycleStats: (cycleId) => `review:${cycleId}:stats`,
      analyticsData: (type, userId, dateRange) => `analytics:${type}:${userId}:${dateRange}`,
      feedbackStats: (userId) => `feedback:${userId}:stats`
    };
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Cache middleware for Express routes
export const cacheMiddleware = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `route:${req.originalUrl}:${req.user?.id || 'anonymous'}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function (data) {
        if (res.statusCode === 200) {
          cacheService.set(cacheKey, data, ttlSeconds);
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.warn('Cache middleware error:', error.message);
      next();
    }
  };
};

export default cacheService;
