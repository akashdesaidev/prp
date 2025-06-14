import analyticsService from '../services/analyticsService.js';
import cacheService from '../config/cache.js';
import { z } from 'zod';

// Validation schemas
const teamAnalyticsSchema = z.object({
  teamId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const feedbackAnalyticsSchema = z.object({
  departmentId: z.string().optional(),
  teamId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const exportAnalyticsSchema = z.object({
  type: z.enum(['team', 'feedback']),
  format: z.enum(['csv', 'json']).optional(),
  teamId: z.string().optional(),
  departmentId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

/**
 * Get team performance analytics
 * @route GET /api/v1/analytics/team
 */
const getTeamPerformanceAnalytics = async (req, res) => {
  try {
    const validation = teamAnalyticsSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.issues
      });
    }

    const { teamId, startDate, endDate } = validation.data;
    const dateRange = {};

    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    // Check cache first
    const cacheKeys = cacheService.constructor.getKeys();
    const cacheKey = cacheKeys.analyticsData(
      'team',
      req.user.id,
      `${startDate || 'all'}-${endDate || 'all'}-${teamId || 'all'}`
    );

    let analytics = await cacheService.get(cacheKey);
    if (!analytics) {
      analytics = await analyticsService.getTeamPerformanceAnalytics(teamId, dateRange, req.user);

      // Cache for 10 minutes
      await cacheService.set(cacheKey, analytics, 600);
    }

    res.json({
      success: true,
      data: analytics,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Team analytics error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate team analytics'
    });
  }
};

/**
 * Get feedback trend analytics
 * @route GET /api/v1/analytics/feedback
 */
const getFeedbackTrendAnalytics = async (req, res) => {
  try {
    const validation = feedbackAnalyticsSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.issues
      });
    }

    const { departmentId, teamId, userId, startDate, endDate } = validation.data;
    const filters = {};

    if (departmentId) filters.departmentId = departmentId;
    if (teamId) filters.teamId = teamId;
    if (userId) filters.userId = userId;
    if (startDate || endDate) {
      filters.dateRange = {};
      if (startDate) filters.dateRange.startDate = startDate;
      if (endDate) filters.dateRange.endDate = endDate;
    }

    const analytics = await analyticsService.getFeedbackTrendAnalytics(filters, req.user);

    res.json({
      success: true,
      data: analytics,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Feedback analytics error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate feedback analytics'
    });
  }
};

/**
 * Export analytics data
 * @route POST /api/v1/analytics/export
 */
const exportAnalytics = async (req, res) => {
  try {
    const validation = exportAnalyticsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid export parameters',
        details: validation.error.issues
      });
    }

    const {
      type,
      format = 'csv',
      teamId,
      departmentId,
      userId,
      startDate,
      endDate
    } = validation.data;

    const filters = {};
    if (teamId) filters.teamId = teamId;
    if (departmentId) filters.departmentId = departmentId;
    if (userId) filters.userId = userId;
    if (startDate || endDate) {
      filters.dateRange = {};
      if (startDate) filters.dateRange.startDate = startDate;
      if (endDate) filters.dateRange.endDate = endDate;
    }

    const exportData = await analyticsService.exportAnalytics(type, filters, req.user, format);

    // Set appropriate headers based on format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${type}-analytics-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send(exportData.data);
    } else {
      res.json({
        success: true,
        ...exportData
      });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      error: error.message || 'Failed to export analytics'
    });
  }
};

/**
 * Get analytics summary dashboard
 * @route GET /api/v1/analytics/summary
 */
const getAnalyticsSummary = async (req, res) => {
  try {
    // Get summary data for dashboard
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dateRange = {
      startDate: thirtyDaysAgo.toISOString(),
      endDate: currentDate.toISOString()
    };

    // Get team analytics
    const teamAnalytics = await analyticsService.getTeamPerformanceAnalytics(
      null, // All teams
      dateRange,
      req.user
    );

    // Get feedback analytics
    const feedbackAnalytics = await analyticsService.getFeedbackTrendAnalytics(
      { dateRange },
      req.user
    );

    // Calculate summary metrics
    const summary = {
      teams: {
        total: teamAnalytics.length,
        avgOkrScore:
          teamAnalytics.length > 0
            ? Math.round(
                (teamAnalytics.reduce((sum, team) => sum + team.metrics.avgOkrScore, 0) /
                  teamAnalytics.length) *
                  100
              ) / 100
            : 0,
        avgFeedbackRating:
          teamAnalytics.length > 0
            ? Math.round(
                (teamAnalytics.reduce((sum, team) => sum + team.metrics.avgFeedbackRating, 0) /
                  teamAnalytics.length) *
                  100
              ) / 100
            : 0,
        totalMembers: teamAnalytics.reduce((sum, team) => sum + team.memberCount, 0)
      },
      feedback: {
        total: feedbackAnalytics.summary.totalFeedback,
        avgRating: feedbackAnalytics.summary.avgRating,
        sentiment: feedbackAnalytics.summary.sentimentBreakdown
      },
      period: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        days: 30
      }
    };

    res.json({
      success: true,
      data: {
        summary,
        teamAnalytics: teamAnalytics.slice(0, 10), // Top 10 teams
        feedbackTrends: feedbackAnalytics.trends.slice(-7) // Last 7 months
      },
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate analytics summary'
    });
  }
};

export {
  getTeamPerformanceAnalytics,
  getFeedbackTrendAnalytics,
  exportAnalytics,
  getAnalyticsSummary
};
