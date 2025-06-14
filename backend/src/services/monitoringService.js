import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import cacheService from '../config/cache.js';

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      memoryUsage: [],
      dbConnections: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    this.startTime = Date.now();
    this.healthChecks = new Map();

    // Start periodic health checks
    this.startPeriodicChecks();
  }

  // Middleware to track request metrics
  requestTracker() {
    return (req, res, next) => {
      const startTime = Date.now();
      this.metrics.requests++;

      // Track response time
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.metrics.responseTime.push(responseTime);

        // Keep only last 1000 response times
        if (this.metrics.responseTime.length > 1000) {
          this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
        }

        // Track errors
        if (res.statusCode >= 400) {
          this.metrics.errors++;
        }
      });

      next();
    };
  }

  // Get system health status
  async getHealthStatus() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {}
    };

    try {
      // Database health
      health.checks.database = await this.checkDatabase();

      // Cache health
      health.checks.cache = await this.checkCache();

      // Memory health
      health.checks.memory = this.checkMemory();

      // Disk space (if available)
      health.checks.disk = this.checkDisk();

      // Overall status
      const failedChecks = Object.values(health.checks).filter(
        (check) => check.status !== 'healthy'
      );
      if (failedChecks.length > 0) {
        health.status = failedChecks.some((check) => check.status === 'critical')
          ? 'critical'
          : 'degraded';
      }
    } catch (error) {
      logger.error('Health check error:', error);
      health.status = 'critical';
      health.error = error.message;
    }

    return health;
  }

  // Check database connectivity
  async checkDatabase() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      if (state === 1) {
        // Test with a simple query
        await mongoose.connection.db.admin().ping();
        return {
          status: 'healthy',
          state: states[state],
          connections: mongoose.connections.length
        };
      } else {
        return {
          status: 'critical',
          state: states[state],
          connections: mongoose.connections.length
        };
      }
    } catch (error) {
      return {
        status: 'critical',
        error: error.message
      };
    }
  }

  // Check cache connectivity
  async checkCache() {
    try {
      const testKey = 'health-check-' + Date.now();
      const testValue = 'ok';

      await cacheService.set(testKey, testValue, 10);
      const retrieved = await cacheService.get(testKey);
      await cacheService.del(testKey);

      if (retrieved === testValue) {
        return {
          status: 'healthy',
          type: cacheService.redis ? 'redis' : 'memory'
        };
      } else {
        return {
          status: 'degraded',
          error: 'Cache test failed'
        };
      }
    } catch (error) {
      return {
        status: 'degraded',
        error: error.message
      };
    }
  }

  // Check memory usage
  checkMemory() {
    const usage = process.memoryUsage();
    const totalMB = Math.round(usage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);

    // Consider critical if using more than 1GB
    const status = totalMB > 1024 ? 'critical' : totalMB > 512 ? 'degraded' : 'healthy';

    return {
      status,
      rss: `${totalMB}MB`,
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    };
  }

  // Check disk space (basic implementation)
  checkDisk() {
    // This is a basic implementation - in production you might want to use a library
    return {
      status: 'healthy',
      note: 'Disk check not implemented'
    };
  }

  // Get performance metrics
  getMetrics() {
    const responseTime = this.metrics.responseTime;
    const avgResponseTime =
      responseTime.length > 0 ? responseTime.reduce((a, b) => a + b, 0) / responseTime.length : 0;

    return {
      requests: {
        total: this.metrics.requests,
        errors: this.metrics.errors,
        errorRate:
          this.metrics.requests > 0
            ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) + '%'
            : '0%'
      },
      performance: {
        averageResponseTime: Math.round(avgResponseTime) + 'ms',
        uptime: Date.now() - this.startTime,
        uptimeFormatted: this.formatUptime(Date.now() - this.startTime)
      },
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate:
          this.metrics.cacheHits + this.metrics.cacheMisses > 0
            ? (
                (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) *
                100
              ).toFixed(2) + '%'
            : '0%'
      },
      memory: this.checkMemory()
    };
  }

  // Format uptime in human readable format
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Start periodic health checks
  startPeriodicChecks() {
    // Check every 5 minutes
    setInterval(
      async () => {
        try {
          const health = await this.getHealthStatus();

          // Log critical issues
          if (health.status === 'critical') {
            logger.error('System health critical:', health);
          } else if (health.status === 'degraded') {
            logger.warn('System health degraded:', health);
          }

          // Store memory usage for trending
          this.metrics.memoryUsage.push({
            timestamp: Date.now(),
            ...this.checkMemory()
          });

          // Keep only last 24 hours of memory data (288 data points at 5min intervals)
          if (this.metrics.memoryUsage.length > 288) {
            this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-288);
          }
        } catch (error) {
          logger.error('Periodic health check failed:', error);
        }
      },
      5 * 60 * 1000
    ); // 5 minutes
  }

  // Track cache hits/misses
  trackCacheHit() {
    this.metrics.cacheHits++;
  }

  trackCacheMiss() {
    this.metrics.cacheMisses++;
  }

  // Get detailed system info
  getSystemInfo() {
    return {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      },
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      loadAverage: process.loadavg ? process.loadavg() : null,
      cpuUsage: process.cpuUsage()
    };
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

export default monitoringService;
