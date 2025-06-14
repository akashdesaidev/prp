'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { TrendingUp, TrendingDown, Users, Target, MessageCircle, BarChart3 } from 'lucide-react';

export default function AnalyticsDashboard({ dateRange, userRole }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummaryData();
  }, [dateRange]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/analytics/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics summary');
      }

      const data = await response.json();
      setSummaryData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
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
          <BarChart3 className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchSummaryData}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  if (!summaryData) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Data Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            There's no analytics data available for the selected period.
          </p>
        </div>
      </Card>
    );
  }

  const { summary, teamAnalytics, feedbackTrends } = summaryData;

  const metrics = [
    {
      title: 'Total Teams',
      value: summary.teams.total,
      icon: Users,
      description: `${summary.teams.totalMembers} total members`,
      trend: null
    },
    {
      title: 'Avg OKR Score',
      value: summary.teams.avgOkrScore.toFixed(1),
      icon: Target,
      description: 'Organization average',
      trend:
        summary.teams.avgOkrScore >= 7 ? 'up' : summary.teams.avgOkrScore >= 5 ? 'neutral' : 'down'
    },
    {
      title: 'Avg Feedback Rating',
      value: summary.teams.avgFeedbackRating.toFixed(1),
      icon: MessageCircle,
      description: 'Organization average',
      trend:
        summary.teams.avgFeedbackRating >= 7
          ? 'up'
          : summary.teams.avgFeedbackRating >= 5
            ? 'neutral'
            : 'down'
    },
    {
      title: 'Total Feedback',
      value: summary.feedback.total,
      icon: TrendingUp,
      description: `${summary.period.days} day period`,
      trend: summary.feedback.total > 50 ? 'up' : summary.feedback.total > 20 ? 'neutral' : 'down'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const getTrendIcon = (trend) => {
            if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
            if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
            return null;
          };

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  {getTrendIcon(metric.trend)}
                </div>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sentiment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Sentiment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(summary.feedback.sentiment).map(([sentiment, count]) => {
              const total = Object.values(summary.feedback.sentiment).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;

              const getColor = (sentiment) => {
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

              return (
                <div key={sentiment} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{sentiment}</span>
                      <span className="text-gray-500">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getColor(sentiment)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Teams */}
      {teamAnalytics && teamAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamAnalytics.slice(0, 5).map((team, index) => (
                <div
                  key={team.teamId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">#{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{team.teamName}</h4>
                      <p className="text-sm text-gray-500">
                        {team.departmentName} • {team.memberCount} members
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      OKR: {team.metrics.avgOkrScore}/10
                    </div>
                    <div className="text-sm text-gray-500">
                      Feedback: {team.metrics.avgFeedbackRating}/10
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Feedback Trends */}
      {feedbackTrends && feedbackTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedbackTrends.map((trend, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded"
                >
                  <div>
                    <span className="text-sm font-medium">{trend.month}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{trend.count} feedback</span>
                    <span>Avg: {trend.avgRating}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
