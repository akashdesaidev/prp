'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Users, Target, TrendingUp, Award, Filter } from 'lucide-react';

export default function TeamPerformanceAnalytics({ dateRange, userRole, canViewAllTeams }) {
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('avgOkrScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchTeamData();
  }, [dateRange, sortBy, sortOrder, filterDepartment]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        sortBy,
        sortOrder,
        ...(filterDepartment !== 'all' && { department: filterDepartment })
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/analytics/team?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team analytics');
      }

      const data = await response.json();
      setTeamData(data.data);

      // Extract unique departments for filter
      const uniqueDepts = [...new Set(data.data.map((team) => team.departmentName))];
      setDepartments(uniqueDepts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getPerformanceLevel = (score) => {
    if (score >= 8) return { level: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (score >= 6) return { level: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (score >= 4) return { level: 'Average', color: 'text-yellow-600 bg-yellow-100' };
    return { level: 'Needs Improvement', color: 'text-red-600 bg-red-100' };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="flex space-x-4">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
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
          <Users className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Team Data</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchTeamData}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Team Performance Analysis</h2>
        <div className="flex items-center space-x-4">
          {/* Department Filter */}
          {canViewAllTeams && departments.length > 1 && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="avgOkrScore">OKR Score</option>
              <option value="avgFeedbackRating">Feedback Rating</option>
              <option value="memberCount">Team Size</option>
              <option value="teamName">Team Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Team Performance Cards */}
      <div className="space-y-4">
        {teamData.length === 0 ? (
          <Card className="p-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Team Data</h3>
              <p className="mt-1 text-sm text-gray-500">
                No team performance data available for the selected period and filters.
              </p>
            </div>
          </Card>
        ) : (
          teamData.map((team, index) => {
            const okrPerformance = getPerformanceLevel(team.metrics.avgOkrScore);
            const feedbackPerformance = getPerformanceLevel(team.metrics.avgFeedbackRating);

            return (
              <Card key={team.teamId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">#{index + 1}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{team.teamName}</h3>
                        <p className="text-sm text-gray-500">
                          {team.departmentName} • {team.memberCount} members
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* OKR Score */}
                      <div className="text-center">
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-500">OKR Score</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-2xl font-bold text-gray-900">
                            {team.metrics.avgOkrScore.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">/10</span>
                        </div>
                        <div
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${okrPerformance.color}`}
                        >
                          {okrPerformance.level}
                        </div>
                      </div>

                      {/* Feedback Rating */}
                      <div className="text-center">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-500">Feedback</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-2xl font-bold text-gray-900">
                            {team.metrics.avgFeedbackRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">/10</span>
                        </div>
                        <div
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${feedbackPerformance.color}`}
                        >
                          {feedbackPerformance.level}
                        </div>
                      </div>

                      {/* Total Feedback Count */}
                      <div className="text-center">
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-500">Total</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-2xl font-bold text-gray-900">
                            {team.metrics.totalFeedback}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">feedback</div>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Breakdown */}
                  {team.sentimentBreakdown && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">Sentiment Distribution</span>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Positive: {team.sentimentBreakdown.positive}
                          </span>
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            Neutral: {team.sentimentBreakdown.neutral}
                          </span>
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                            Negative: {team.sentimentBreakdown.negative}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary Statistics */}
      {teamData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(
                    teamData.reduce((sum, team) => sum + team.metrics.avgOkrScore, 0) /
                    teamData.length
                  ).toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Average OKR Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(
                    teamData.reduce((sum, team) => sum + team.metrics.avgFeedbackRating, 0) /
                    teamData.length
                  ).toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Average Feedback Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {teamData.reduce((sum, team) => sum + team.metrics.totalFeedback, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Feedback</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
