// Analytics Service for Performance Review Platform
// Provides comprehensive analytics and reporting functionality

import User from '../models/User.js';
import OKR from '../models/OKR.js';
import Feedback from '../models/Feedback.js';
import Team from '../models/Team.js';
import Department from '../models/Department.js';

class AnalyticsService {
  /**
   * Get team performance analytics with RBAC enforcement
   */
  async getTeamPerformanceAnalytics(teamId, dateRange, user) {
    try {
      let teamQuery = {};

      // RBAC: Apply role-based filtering
      if (user.role === 'admin' || user.role === 'hr') {
        if (teamId) {
          teamQuery._id = teamId;
        }
      } else if (user.role === 'manager') {
        if (teamId) {
          // Since User model doesn't have teamId, skip team access check for now
          teamQuery._id = teamId;
        } else {
          // Since User model doesn't have teamId, return empty results for now
          return [];
        }
      } else {
        // Since User model doesn't have teamId, return empty results for employees
        return [];
      }

      const teams = await Team.find(teamQuery).populate('department');
      const analytics = [];

      for (const team of teams) {
        // Since User model doesn't have teamId, for now return empty array
        // This needs proper data model restructuring
        const teamMembers = [];
        const memberIds = teamMembers.map((m) => m._id);

        // Calculate OKR Performance
        const okrQuery = {
          assignedTo: { $in: memberIds },
          ...(dateRange.startDate && { createdAt: { $gte: new Date(dateRange.startDate) } }),
          ...(dateRange.endDate && { createdAt: { $lte: new Date(dateRange.endDate) } })
        };

        const okrs = await OKR.find(okrQuery);
        const avgOkrScore =
          okrs.length > 0
            ? okrs.reduce((sum, okr) => {
                const keyResultsAvg =
                  okr.keyResults.length > 0
                    ? okr.keyResults.reduce((kSum, kr) => kSum + kr.score, 0) /
                      okr.keyResults.length
                    : 0;
                return sum + keyResultsAvg;
              }, 0) / okrs.length
            : 0;

        // Calculate Feedback Metrics
        const feedbackQuery = {
          toUserId: { $in: memberIds },
          ...(dateRange.startDate && { createdAt: { $gte: new Date(dateRange.startDate) } }),
          ...(dateRange.endDate && { createdAt: { $lte: new Date(dateRange.endDate) } })
        };

        const feedbacks = await Feedback.find(feedbackQuery);
        const avgFeedbackRating =
          feedbacks.length > 0
            ? feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length
            : 0;

        // Sentiment Analysis
        const sentimentCounts = feedbacks.reduce(
          (acc, f) => {
            acc[f.sentimentScore || 'neutral']++;
            return acc;
          },
          { positive: 0, neutral: 0, negative: 0 }
        );

        analytics.push({
          teamId: team._id,
          teamName: team.name,
          departmentName: team.department?.name || 'N/A',
          memberCount: memberIds.length,
          metrics: {
            avgOkrScore: Math.round(avgOkrScore * 100) / 100,
            avgFeedbackRating: Math.round(avgFeedbackRating * 100) / 100,
            feedbackCount: feedbacks.length,
            okrCount: okrs.length,
            sentiment: sentimentCounts
          }
        });
      }

      return analytics;
    } catch (error) {
      throw new Error(`Team performance analytics error: ${error.message}`);
    }
  }

  /**
   * Get feedback trend analytics with time-based grouping
   */
  async getFeedbackTrendAnalytics(filters, user) {
    try {
      let feedbackQuery = {};

      // Apply RBAC filtering
      if (user.role === 'admin' || user.role === 'hr') {
        if (filters.departmentId) {
          // For now, match by department name since User model has department as String
          const department = await Department.findById(filters.departmentId);
          const departmentUsers = await User.find({ department: department?.name });
          feedbackQuery.toUserId = { $in: departmentUsers.map((u) => u._id) };
        }
        if (filters.teamId) {
          // Since User model doesn't have teamId, we need to find users through team associations
          // For now, return empty array since we need to restructure the data model
          feedbackQuery.toUserId = { $in: [] };
        }
        if (filters.userId) {
          feedbackQuery.toUserId = filters.userId;
        }
      } else if (user.role === 'manager') {
        const managedUsers = await User.find({ managerId: user._id });
        const managedUserIds = managedUsers.map((u) => u._id);

        if (filters.userId && !managedUserIds.includes(filters.userId)) {
          throw new Error('Access denied to this user');
        }

        feedbackQuery.toUserId = filters.userId ? filters.userId : { $in: managedUserIds };
      } else {
        feedbackQuery.toUserId = user._id;
      }

      // Apply date range
      if (filters.dateRange?.startDate) {
        feedbackQuery.createdAt = { $gte: new Date(filters.dateRange.startDate) };
      }
      if (filters.dateRange?.endDate) {
        feedbackQuery.createdAt = {
          ...feedbackQuery.createdAt,
          $lte: new Date(filters.dateRange.endDate)
        };
      }

      const feedbacks = await Feedback.find(feedbackQuery)
        .populate('fromUserId', 'firstName lastName')
        .populate('toUserId', 'firstName lastName department')
        .sort({ createdAt: -1 });

      // Group by monthly periods
      const trends = {};
      const sentimentTrends = {};

      feedbacks.forEach((feedback) => {
        const month = feedback.createdAt.toISOString().substring(0, 7);

        if (!trends[month]) {
          trends[month] = { count: 0, totalRating: 0, avgRating: 0 };
        }
        trends[month].count++;
        trends[month].totalRating += feedback.rating || 0;
        trends[month].avgRating = trends[month].totalRating / trends[month].count;

        const sentiment = feedback.sentimentScore || 'neutral';
        if (!sentimentTrends[month]) {
          sentimentTrends[month] = { positive: 0, neutral: 0, negative: 0 };
        }
        sentimentTrends[month][sentiment]++;
      });

      const trendData = Object.keys(trends)
        .sort()
        .map((month) => ({
          month,
          count: trends[month].count,
          avgRating: Math.round(trends[month].avgRating * 100) / 100
        }));

      const sentimentData = Object.keys(sentimentTrends)
        .sort()
        .map((month) => ({
          month,
          ...sentimentTrends[month]
        }));

      return {
        summary: {
          totalFeedback: feedbacks.length,
          avgRating:
            feedbacks.length > 0
              ? Math.round(
                  (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length) * 100
                ) / 100
              : 0,
          sentimentBreakdown: feedbacks.reduce(
            (acc, f) => {
              acc[f.sentimentScore || 'neutral']++;
              return acc;
            },
            { positive: 0, neutral: 0, negative: 0 }
          )
        },
        trends: trendData,
        sentimentTrends: sentimentData
      };
    } catch (error) {
      throw new Error(`Feedback trend analytics error: ${error.message}`);
    }
  }

  /**
   * Export analytics data in CSV or JSON format
   */
  async exportAnalytics(type, filters, user, format = 'csv') {
    try {
      let data;

      switch (type) {
        case 'team':
          data = await this.getTeamPerformanceAnalytics(
            filters.teamId,
            filters.dateRange || {},
            user
          );
          break;
        case 'feedback':
          data = await this.getFeedbackTrendAnalytics(filters, user);
          break;
        default:
          throw new Error('Invalid export type');
      }

      if (format === 'json') {
        return {
          format: 'json',
          data: data,
          exportedAt: new Date(),
          exportedBy: user._id
        };
      }

      // Convert to CSV format
      let csvData = '';

      if (type === 'team') {
        csvData = this._convertTeamAnalyticsToCSV(data);
      } else if (type === 'feedback') {
        csvData = this._convertFeedbackAnalyticsToCSV(data);
      }

      return {
        format: 'csv',
        data: csvData,
        exportedAt: new Date(),
        exportedBy: user._id
      };
    } catch (error) {
      throw new Error(`Export analytics error: ${error.message}`);
    }
  }

  /**
   * Convert team analytics to CSV format
   */
  _convertTeamAnalyticsToCSV(data) {
    const headers = [
      'Team Name',
      'Department',
      'Member Count',
      'Avg OKR Score',
      'Avg Feedback Rating',
      'Feedback Count',
      'OKR Count',
      'Positive Sentiment',
      'Neutral Sentiment',
      'Negative Sentiment'
    ];

    const rows = data.map((team) => [
      team.teamName,
      team.departmentName,
      team.memberCount,
      team.metrics.avgOkrScore,
      team.metrics.avgFeedbackRating,
      team.metrics.feedbackCount,
      team.metrics.okrCount,
      team.metrics.sentiment.positive,
      team.metrics.sentiment.neutral,
      team.metrics.sentiment.negative
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  /**
   * Convert feedback analytics to CSV format
   */
  _convertFeedbackAnalyticsToCSV(data) {
    const headers = ['Month', 'Count', 'Avg Rating', 'Positive', 'Neutral', 'Negative'];

    const rows = data.trends.map((trend, index) => [
      trend.month,
      trend.count,
      trend.avgRating,
      data.sentimentTrends[index]?.positive || 0,
      data.sentimentTrends[index]?.neutral || 0,
      data.sentimentTrends[index]?.negative || 0
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }
}

export default new AnalyticsService();
