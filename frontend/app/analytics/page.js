'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import TeamPerformanceAnalytics from '../../components/analytics/TeamPerformanceAnalytics';
import FeedbackTrendAnalytics from '../../components/analytics/FeedbackTrendAnalytics';
import ExportInterface from '../../components/analytics/ExportInterface';
import AdminFeedbackAnalytics from '../../components/admin/AdminFeedbackAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { BarChart3, TrendingUp, Users, Download } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Role-based access control
  const canViewAnalytics = ['admin', 'hr', 'manager', 'employee'].includes(user?.role);
  const canExport = ['admin', 'hr', 'manager'].includes(user?.role);
  const canViewAllTeams = ['admin', 'hr'].includes(user?.role);

  if (!canViewAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have permission to view analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="mt-2 text-gray-600">
            {canViewAllTeams
              ? 'Organization-wide performance insights and trends'
              : user?.role === 'manager'
                ? 'Team performance insights and trends'
                : 'Your team performance insights'}
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
              From:
            </label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
              To:
            </label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-5' : 'grid-cols-4'}`}
        >
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Team Performance</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Feedback Trends</span>
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="admin-feedback" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Org Feedback</span>
            </TabsTrigger>
          )}
          {canExport && (
            <TabsTrigger value="export" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AnalyticsDashboard dateRange={dateRange} userRole={user?.role} />
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <TeamPerformanceAnalytics
            dateRange={dateRange}
            userRole={user?.role}
            canViewAllTeams={canViewAllTeams}
          />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <FeedbackTrendAnalytics
            dateRange={dateRange}
            userRole={user?.role}
            canViewAllTeams={canViewAllTeams}
          />
        </TabsContent>

        {user?.role === 'admin' && (
          <TabsContent value="admin-feedback" className="space-y-6">
            <AdminFeedbackAnalytics />
          </TabsContent>
        )}

        {canExport && (
          <TabsContent value="export" className="space-y-6">
            <ExportInterface dateRange={dateRange} userRole={user?.role} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
