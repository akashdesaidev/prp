'use client';
import { useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  PieChart,
  Activity
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';

export default function TimeAnalyticsDashboard() {
  const [timeData, setTimeData] = useState({
    totalHours: 0,
    weeklyHours: 0,
    monthlyHours: 0,
    utilizationRate: 0,
    categoryBreakdown: {},
    okrBreakdown: {},
    dailyTrends: [],
    weeklyTrends: [],
    topOKRs: [],
    insights: []
  });

  const [dateRange, setDateRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('hours');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const endDate = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/time-entries/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const analytics = await response.json();
        setTimeData(analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'direct_work':
        return 'bg-blue-500';
      case 'planning':
        return 'bg-purple-500';
      case 'collaboration':
        return 'bg-green-500';
      case 'review':
        return 'bg-orange-500';
      case 'other':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'direct_work':
        return '🎯';
      case 'planning':
        return '📋';
      case 'collaboration':
        return '🤝';
      case 'review':
        return '👀';
      case 'other':
        return '📝';
      default:
        return '⏰';
    }
  };

  const getUtilizationColor = (rate) => {
    if (rate >= 90) return 'text-green-600 bg-green-100';
    if (rate >= 70) return 'text-blue-600 bg-blue-100';
    if (rate >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const generateInsights = () => {
    const insights = [];

    // Utilization insights
    if (timeData.utilizationRate > 90) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'High Utilization',
        message: "You're working at high capacity. Consider balancing your workload.",
        action: 'Review time allocation'
      });
    } else if (timeData.utilizationRate < 60) {
      insights.push({
        type: 'info',
        icon: '💡',
        title: 'Low Utilization',
        message: 'You have capacity for additional work or focus areas.',
        action: 'Explore new objectives'
      });
    }

    // Category balance insights
    const categories = Object.entries(timeData.categoryBreakdown || {});
    const directWorkPercent =
      ((categories.find(([cat]) => cat === 'direct_work')?.[1] || 0) / timeData.totalHours) * 100;

    if (directWorkPercent < 60) {
      insights.push({
        type: 'suggestion',
        icon: '🎯',
        title: 'Focus Time',
        message: 'Consider increasing direct work time on your key objectives.',
        action: 'Block focus time'
      });
    }

    // Trend insights
    if (timeData.weeklyTrends && timeData.weeklyTrends.length >= 2) {
      const currentWeek = timeData.weeklyTrends[timeData.weeklyTrends.length - 1];
      const previousWeek = timeData.weeklyTrends[timeData.weeklyTrends.length - 2];

      if (currentWeek.hours > previousWeek.hours * 1.2) {
        insights.push({
          type: 'warning',
          icon: '📈',
          title: 'Increasing Hours',
          message: 'Your weekly hours have increased significantly.',
          action: 'Monitor workload'
        });
      }
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const insights = generateInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Time Analytics</h2>
            <p className="text-gray-600">Insights into your time utilization and productivity</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['week', 'month', 'quarter'].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
              className="capitalize"
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {timeData.totalHours?.toFixed(1) || '0.0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Utilization</p>
              <p
                className={`text-2xl font-bold ${getUtilizationColor(timeData.utilizationRate || 0).split(' ')[0]}`}
              >
                {(timeData.utilizationRate || 0).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active OKRs</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(timeData.okrBreakdown || {}).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Daily</p>
              <p className="text-2xl font-bold text-gray-900">
                {((timeData.totalHours || 0) / 7).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Time by Category</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(timeData.categoryBreakdown || {}).map(([category, hours]) => {
              const percentage = (hours / timeData.totalHours) * 100 || 0;
              return (
                <div key={category} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{getCategoryIcon(category)}</span>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getCategoryColor(category)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {hours.toFixed(1)}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* OKR Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Time by OKR</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(timeData.okrBreakdown || {})
              .sort(([, a], [, b]) => b.hours - a.hours)
              .slice(0, 5)
              .map(([okrId, data]) => {
                const percentage = (data.hours / timeData.totalHours) * 100 || 0;
                return (
                  <div key={okrId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {data.title || 'Unknown OKR'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {data.hours.toFixed(1)}h ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-primary-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Trends and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Daily Trends</h3>
          </div>

          <div className="space-y-2">
            {(timeData.dailyTrends || []).slice(-7).map((day, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-primary-500 rounded-full"
                      style={{ width: `${Math.min((day.hours / 8) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {day.hours.toFixed(1)}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Insights & Recommendations</h3>
          </div>

          <div className="space-y-3">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    insight.type === 'warning'
                      ? 'bg-red-50 border-red-400'
                      : insight.type === 'suggestion'
                        ? 'bg-blue-50 border-blue-400'
                        : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{insight.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                      <button className="text-xs text-primary-600 hover:text-primary-700 mt-2 font-medium">
                        {insight.action} →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No insights available yet.</p>
                <p className="text-sm text-gray-500">
                  Log more time entries to see personalized recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Allocation Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recommended Time Allocation</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { category: 'direct_work', recommended: 60, label: 'Direct Work' },
            { category: 'planning', recommended: 15, label: 'Planning' },
            { category: 'collaboration', recommended: 15, label: 'Collaboration' },
            { category: 'review', recommended: 7, label: 'Review' },
            { category: 'other', recommended: 3, label: 'Other' }
          ].map(({ category, recommended, label }) => {
            const actual =
              ((timeData.categoryBreakdown?.[category] || 0) / timeData.totalHours) * 100 || 0;
            const isOnTrack = Math.abs(actual - recommended) <= 5;

            return (
              <div key={category} className="text-center">
                <div className="mb-2">
                  <span className="text-lg">{getCategoryIcon(category)}</span>
                  <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Recommended: {recommended}%</div>
                  <div
                    className={`text-sm font-medium ${
                      isOnTrack ? 'text-green-600' : 'text-orange-600'
                    }`}
                  >
                    Actual: {actual.toFixed(0)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isOnTrack ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.min(actual, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
