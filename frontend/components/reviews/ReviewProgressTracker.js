'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Target,
  Calendar,
  Activity,
  FileText,
  Award
} from 'lucide-react';
import { Progress } from '../ui/progress';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ReviewProgressTracker({
  reviewCycleId,
  userId,
  showTeamProgress = false,
  compact = false
}) {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('current'); // current, historical

  useEffect(() => {
    if (reviewCycleId) {
      fetchProgressData();
    }
  }, [reviewCycleId, timeframe]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const endpoint = showTeamProgress
        ? `/review-cycles/${reviewCycleId}/team-progress`
        : `/review-cycles/${reviewCycleId}/progress`;

      const params = userId ? { userId } : {};
      const response = await api.get(endpoint, { params });
      setProgressData(response.data);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded w-5/6"></div>
            <div className="h-2 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-6 text-center ${compact ? 'p-4' : 'p-6'}`}
      >
        <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No progress data available</p>
      </div>
    );
  }

  const { cycle, overall, byType, timeline, participants, milestones } = progressData;

  const daysRemaining = calculateDaysRemaining(cycle?.endDate);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
            Review Progress
          </h3>
          {cycle && (
            <p className="text-sm text-gray-600 mt-1">
              {cycle.name} • {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setTimeframe('current')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              timeframe === 'current'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setTimeframe('historical')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              timeframe === 'historical'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Historical
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Completion</span>
          <span className="text-sm font-semibold text-gray-900">
            {overall?.completionRate || 0}%
          </span>
        </div>
        <Progress value={overall?.completionRate || 0} className="h-3" />
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{overall?.completed || 0} completed</span>
          <span>{overall?.total || 0} total</span>
        </div>
      </div>

      {/* Progress by Review Type */}
      {byType && !compact && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Progress by Type</h4>
          <div className="space-y-3">
            {Object.entries(byType).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm capitalize text-gray-600">{type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20">
                    <Progress value={data.percentage} className="h-2" />
                  </div>
                  <span className="text-xs text-gray-500 w-8">{data.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-xs text-gray-600">Participants</span>
          </div>
          <div className="font-semibold text-gray-900">{participants?.active || 0}</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-xs text-gray-600">Avg Time</span>
          </div>
          <div className="font-semibold text-gray-900">{overall?.averageTime || '0h'}</div>
        </div>
      </div>

      {/* Status Summary */}
      {overall?.statusBreakdown && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Status Summary</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(overall.statusBreakdown).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
                >
                  {status}
                </span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline && !compact && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Timeline</h4>
          <div className="space-y-2">
            {timeline.slice(0, 3).map((event, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <span className="text-gray-600">{event.description}</span>
                  <span className="text-gray-400 ml-2">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {milestones && !compact && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Milestones</h4>
          <div className="space-y-2">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  {milestone.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700">{milestone.title}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(milestone.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
