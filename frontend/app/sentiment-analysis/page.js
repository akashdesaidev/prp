'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import SentimentVisualization from '../../components/feedback/SentimentVisualization';
import NegativeSentimentDashboard from '../../components/feedback/NegativeSentimentDashboard';
import { AlertTriangle, BarChart3, TrendingDown, Users } from 'lucide-react';

export default function SentimentAnalysisPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-600 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sentiment Analysis</h1>
              <p className="text-gray-600 mt-1">AI-powered insights from feedback data</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>

            <select
              value={selectedDepartment || ''}
              onChange={(e) => setSelectedDepartment(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="marketing">Marketing</option>
              <option value="sales">Sales</option>
              <option value="hr">Human Resources</option>
            </select>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="negative" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Negative Sentiment</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <SentimentVisualization
                  timeRange={selectedTimeRange}
                  departmentId={selectedDepartment}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="negative" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <NegativeSentimentDashboard
                  timeRange={selectedTimeRange}
                  departmentId={selectedDepartment}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="text-center py-12">
                  <TrendingDown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Trend Analysis</h3>
                  <p className="text-gray-600 mb-6">
                    Advanced trend analysis coming soon - track sentiment changes over time
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">How to Use Sentiment Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">🔍 Understanding Sentiment Scores</h4>
              <ul className="space-y-1 text-blue-700">
                <li>
                  • <strong>Positive:</strong> Feedback expressing satisfaction, praise, or good
                  performance
                </li>
                <li>
                  • <strong>Neutral:</strong> Factual, balanced, or mixed feedback
                </li>
                <li>
                  • <strong>Negative:</strong> Feedback indicating concerns, issues, or areas for
                  improvement
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">⚡ Taking Action on Negative Sentiment</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Review individual feedback for context</li>
                <li>• Schedule 1:1 meetings with affected employees</li>
                <li>• Identify patterns or systemic issues</li>
                <li>• Create development or support plans</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
