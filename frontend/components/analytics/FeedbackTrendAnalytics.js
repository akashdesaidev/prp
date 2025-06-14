'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { TrendingUp, TrendingDown, MessageCircle, Calendar, BarChart3 } from 'lucide-react';

export default function FeedbackTrendAnalytics({ dateRange, userRole, canViewAllTeams }) {
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    fetchFeedbackData();
  }, [dateRange, timeframe]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        timeframe
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/analytics/feedback?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback trends');
      }

      const data = await response.json();
      // Extract the trends array from the API response
      setFeedbackData(data.data.trends || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change).toFixed(1)
    };
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500';
      case 'neutral':
        return 'bg-yellow-500';
      case 'negative':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-40"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Feedback Trends</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchFeedbackData}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  // Calculate overall stats
  const totalFeedback = feedbackData.reduce((sum, month) => sum + month.count, 0);
  const avgRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, month) => sum + month.avgRating, 0) / feedbackData.length
      : 0;

  // For now, use mock sentiment data since API response format is different
  const totalSentiment = feedbackData.reduce(
    (acc, month) => {
      // Monthly trends don't include sentiment breakdown yet
      acc.positive += 0;
      acc.neutral += month.count || 0;
      acc.negative += 0;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Feedback Trends Analysis</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
          </select>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{totalFeedback}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}/10</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Positive Sentiment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalFeedback > 0
                    ? ((totalSentiment.positive / totalFeedback) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Volume Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {feedbackData.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Trend Data</h3>
              <p className="mt-1 text-sm text-gray-500">
                No feedback trend data available for the selected period.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackData.map((period, index) => {
                const prevPeriod = index > 0 ? feedbackData[index - 1] : null;
                const trend = calculateTrend(period.count, prevPeriod?.count);
                const ratingTrend = calculateTrend(period.avgRating, prevPeriod?.avgRating);

                return (
                  <div
                    key={period.month}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-gray-900">{period.month}</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{period.count} feedback</span>
                        {trend && (
                          <span
                            className={`flex items-center text-xs px-2 py-1 rounded-full ${
                              trend.direction === 'up'
                                ? 'text-green-700 bg-green-100'
                                : trend.direction === 'down'
                                  ? 'text-red-700 bg-red-100'
                                  : 'text-gray-700 bg-gray-100'
                            }`}
                          >
                            {trend.direction === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {trend.direction === 'down' && (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {trend.percentage}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Avg: {period.avgRating.toFixed(1)}/10
                        </div>
                        {ratingTrend && (
                          <div
                            className={`text-xs ${
                              ratingTrend.direction === 'up'
                                ? 'text-green-600'
                                : ratingTrend.direction === 'down'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }`}
                          >
                            {ratingTrend.direction === 'up'
                              ? '↑'
                              : ratingTrend.direction === 'down'
                                ? '↓'
                                : '→'}{' '}
                            {ratingTrend.percentage}%
                          </div>
                        )}
                      </div>

                      {/* Sentiment Bars */}
                      <div className="flex space-x-1">
                        <div
                          className="w-4 bg-green-500 rounded"
                          style={{
                            height: `${Math.max(4, (period.sentimentBreakdown.positive / period.count) * 32)}px`
                          }}
                          title={`Positive: ${period.sentimentBreakdown.positive}`}
                        ></div>
                        <div
                          className="w-4 bg-yellow-500 rounded"
                          style={{
                            height: `${Math.max(4, (period.sentimentBreakdown.neutral / period.count) * 32)}px`
                          }}
                          title={`Neutral: ${period.sentimentBreakdown.neutral}`}
                        ></div>
                        <div
                          className="w-4 bg-red-500 rounded"
                          style={{
                            height: `${Math.max(4, (period.sentimentBreakdown.negative / period.count) * 32)}px`
                          }}
                          title={`Negative: ${period.sentimentBreakdown.negative}`}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sentiment Distribution Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Distribution Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedbackData.map((period) => (
              <div key={period.period} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{period.period}</span>
                  <span className="text-gray-500">{period.count} total</span>
                </div>
                <div className="flex space-x-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 transition-all"
                    style={{
                      width: `${period.count > 0 ? (period.sentimentBreakdown.positive / period.count) * 100 : 0}%`
                    }}
                  ></div>
                  <div
                    className="bg-yellow-500 transition-all"
                    style={{
                      width: `${period.count > 0 ? (period.sentimentBreakdown.neutral / period.count) * 100 : 0}%`
                    }}
                  ></div>
                  <div
                    className="bg-red-500 transition-all"
                    style={{
                      width: `${period.count > 0 ? (period.sentimentBreakdown.negative / period.count) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Positive: {period.sentimentBreakdown.positive}</span>
                  <span>Neutral: {period.sentimentBreakdown.neutral}</span>
                  <span>Negative: {period.sentimentBreakdown.negative}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
