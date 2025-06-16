'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Star,
  Heart,
  AlertTriangle,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Clock,
  Building,
  UsersIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export default function AdminFeedbackAnalytics() {
  const [analytics, setAnalytics] = useState({
    summary: {
      totalFeedback: 0,
      averageRating: 0,
      responseRate: 0,
      sentimentScore: 0,
      growthRate: 0,
      activeUsers: 0,
      departments: 0
    },
    sentiment: {
      positive: 0,
      neutral: 0,
      negative: 0,
      distribution: []
    },
    departmentBreakdown: [],
    topSkills: [],
    mostActiveUsers: [],
    trends: []
  });

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [departments, setDepartments] = useState([]);

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '6m', label: 'Last 6 months' },
    { value: '1y', label: 'Last year' }
  ];

  useEffect(() => {
    fetchDepartments();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedDepartment]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(
        () => {
          fetchAnalytics(false);
        },
        5 * 60 * 1000
      );
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, timeRange, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/departments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const params = new URLSearchParams({
        timeRange,
        ...(selectedDepartment !== 'all' && { departmentId: selectedDepartment }),
        category: 'all'
      });

      const response = await fetch(`${apiUrl}/api/feedback/analytics?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error fetching feedback analytics:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const exportData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const params = new URLSearchParams({
        timeRange,
        ...(selectedDepartment !== 'all' && { departmentId: selectedDepartment }),
        format: 'csv'
      });

      const response = await fetch(`${apiUrl}/api/analytics/export?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
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

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organization Feedback Analytics</h2>
            <p className="text-gray-600">
              Complete overview of all feedback across the organization
            </p>
            {lastRefresh && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-gray-500" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => fetchAnalytics()} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.summary.growthRate > 0 ? '+' : ''}
              {analytics.summary.growthRate}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.averageRating}/10</div>
            <p className="text-xs text-muted-foreground">Across all feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Participated in feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analytics.summary.sentimentScore * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">AI sentiment analysis</p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {analytics.sentiment.distribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.value} ({Math.round((item.value / analytics.summary.totalFeedback) * 100)}
                    %)
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {analytics.sentiment.positive}
              </div>
              <div className="text-gray-500">Positive Feedback</div>
              <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded"></div>
                  <span>{analytics.sentiment.neutral} Neutral</span>
                </div>
                <div className="flex items-center space-x-1 text-red-600">
                  <div className="w-2 h-2 bg-red-400 rounded"></div>
                  <span>{analytics.sentiment.negative} Negative</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      {analytics.departmentBreakdown && analytics.departmentBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.departmentBreakdown.map((dept) => (
                <div
                  key={dept._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{dept.name}</h4>
                    <p className="text-sm text-gray-500">{dept.feedbackCount} feedback items</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{dept.avgRating}/10</div>
                    <div className="text-sm text-gray-500">
                      {Math.round(dept.positivePercentage)}% positive
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Most Mentioned Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.topSkills.map((skill, index) => (
              <div
                key={skill.name}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{skill.name}</div>
                    <div className="text-sm text-gray-500">{skill.count} mentions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{skill.avgRating}/10</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    {skill.trend > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    {skill.trend > 0 ? '+' : ''}
                    {skill.trend}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Active Users */}
      <Card>
        <CardHeader>
          <CardTitle>Most Active Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.mostActiveUsers.map((user, index) => (
              <div key={user.name} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">
                      {user.given} given • {user.received} received
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{user.rating}/10</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
