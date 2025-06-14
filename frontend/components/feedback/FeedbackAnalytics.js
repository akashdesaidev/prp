'use client';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MessageSquare, Star, Target } from 'lucide-react';
import api from '../../lib/api';

export default function FeedbackAnalytics({ userRole, userId = null }) {
  const [analytics, setAnalytics] = useState({
    sentimentTrends: [],
    feedbackStats: {
      total: 0,
      thisMonth: 0,
      averageRating: 0,
      responseRate: 0
    },
    topSkills: [],
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('3months');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, userId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = { timeRange };
      if (userId) params.userId = userId;

      const response = await api.get('/feedback/analytics', { params });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching feedback analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      case 'neutral':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Feedback Analytics</h2>
          <p className="text-gray-500">Insights and trends from feedback data</p>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.feedbackStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.feedbackStats.thisMonth}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.feedbackStats.averageRating?.toFixed(1) || 0}/10
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.feedbackStats.responseRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Trends */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Sentiment Trends</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {analytics.sentimentTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(trend.sentiment)}`}
                  >
                    {trend.sentiment}
                  </span>
                  <span className="text-sm text-gray-600">{trend.period}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        trend.sentiment === 'positive'
                          ? 'bg-green-500'
                          : trend.sentiment === 'negative'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                      }`}
                      style={{ width: `${trend.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{trend.count}</span>
                </div>
              </div>
            ))}

            {analytics.sentimentTrends.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No sentiment data available for this period
              </p>
            )}
          </div>
        </div>

        {/* Top Skills */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Skills Mentioned</h3>
            <Target className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {analytics.topSkills.map((skill, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{
                        width: `${(skill.count / analytics.topSkills[0]?.count) * 100 || 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{skill.count}</span>
                </div>
              </div>
            ))}

            {analytics.topSkills.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No skill data available for this period
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Feedback Categories</h3>
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics.categoryBreakdown.map((category, index) => (
            <div key={index} className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-2">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - category.percentage / 100)}`}
                    className="text-blue-500"
                  />
                </svg>
                <span className="absolute text-xs font-medium text-gray-900">
                  {category.percentage}%
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 capitalize">{category.category}</p>
              <p className="text-xs text-gray-500">{category.count} feedback</p>
            </div>
          ))}

          {analytics.categoryBreakdown.length === 0 && (
            <div className="col-span-3 text-center py-8">
              <p className="text-sm text-gray-500">No category data available for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
