import express from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import monitoringService from '../services/monitoringService.js';

const router = express.Router();

// @route   GET /api/v1/monitoring/health
// @desc    Get system health status
// @access  Public (for load balancers)
router.get('/health', async (req, res) => {
  try {
    const health = await monitoringService.getHealthStatus();

    // Return appropriate HTTP status based on health
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'critical',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/v1/monitoring/metrics
// @desc    Get performance metrics
// @access  Admin only
router.get('/metrics', auth, rbac(['admin']), async (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/monitoring/system
// @desc    Get detailed system information
// @access  Admin only
router.get('/system', auth, rbac(['admin']), async (req, res) => {
  try {
    const systemInfo = monitoringService.getSystemInfo();
    res.json({
      success: true,
      data: systemInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/v1/monitoring/ready
// @desc    Readiness probe for Kubernetes
// @access  Public
router.get('/ready', async (req, res) => {
  try {
    const health = await monitoringService.getHealthStatus();

    // Ready if not critical
    if (health.status !== 'critical') {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', health });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

// @route   GET /api/v1/monitoring/live
// @desc    Liveness probe for Kubernetes
// @access  Public
router.get('/live', (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
