'use client';
import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  Zap,
  Brain,
  Award
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';

export default function TimeInsightsDashboard() {
  const [insights, setInsights] = useState({
    productivity: {
      score: 0,
      trend: 'stable',
      weeklyAverage: 0,
      bestDay: null,
      worstDay: null
    },
    patterns: {
      peakHours: [],
      mostProductiveDay: null,
      averageSessionLength: 0,
      focusTimePercentage: 0
    },
    goals: {
      weeklyTarget: 40,
      currentWeek: 0,
      onTrack: false,
      projectedWeekly: 0
    },
    recommendations: [],
    achievements: [],
    timeDistribution: {},
    burnoutRisk: 'low'
  });

  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, [timeframe]);

  const fetchInsights = async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();

      switch (timeframe) {
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

      const response = await api.get('/time-entries/insights', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          timeframe
        }
      });

      if (response.data) {
        setInsights(response.data);
      } else {
        // Generate mock insights if API doesn't exist yet
        generateMockInsights();
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      generateMockInsights();
    } finally {
      setLoading(false);
    }
  };

  const generateMockInsights = () => {
    // This would be replaced with real API data
    setInsights({
      productivity: {
        score: 78,
        trend: 'up',
        weeklyAverage: 35.5,
        bestDay: 'Tuesday',
        worstDay: 'Friday'
      },
      patterns: {
        peakHours: ['9:00 AM', '2:00 PM'],
        mostProductiveDay: 'Tuesday',
        averageSessionLength: 2.3,
        focusTimePercentage: 65
      },
      goals: {
        weeklyTarget: 40,
        currentWeek: 32,
        onTrack: true,
        projectedWeekly: 38
      },
      recommendations: [
        {
          type: 'focus',
          title: 'Increase Focus Time',
          description:
            'You spend only 65% of your time on direct work. Try blocking 2-hour focus sessions.',
          priority: 'high',
          action: 'Block calendar time'
        },
        {
          type: 'balance',
          title: 'Take More Breaks',
          description: 'Your average session length is 2.3 hours. Consider the Pomodoro technique.',
          priority: 'medium',
          action: 'Set break reminders'
        },
        {
          type: 'planning',
          title: 'Plan Your Fridays',
          description: 'Friday is your least productive day. Try planning lighter tasks.',
          priority: 'low',
          action: 'Adjust weekly planning'
        }
      ],
      achievements: [
        {
          title: 'Consistency Champion',
          description: 'Logged time for 5 consecutive days',
          icon: '🏆',
          date: new Date().toISOString()
        },
        {
          title: 'Focus Master',
          description: 'Completed a 4-hour focus session',
          icon: '🎯',
          date: new Date().toISOString()
        }
      ],
      timeDistribution: {
        direct_work: 65,
        planning: 15,
        collaboration: 12,
        review: 5,
        other: 3
      },
      burnoutRisk: 'low'
    });
  };

  const getProductivityColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBurnoutRiskColor = (risk) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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

  const insightsData = generateInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary-600" />
            Time Insights
          </h2>
          <p className="text-gray-600">AI-powered analysis of your time usage patterns</p>
        </div>

        <div className="flex items-center gap-2">
          {['week', 'month', 'quarter'].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
              className="capitalize"
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Productivity Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Productivity Score</h3>
            {getTrendIcon(insights.productivity.trend)}
          </div>
          <div
            className={`text-4xl font-bold mb-2 ${getProductivityColor(insights.productivity.score).split(' ')[0]}`}
          >
            {insights.productivity.score}
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded-full text-sm font-medium ${getProductivityColor(insights.productivity.score)}`}
            >
              {insights.productivity.score >= 80
                ? 'Excellent'
                : insights.productivity.score >= 60
                  ? 'Good'
                  : insights.productivity.score >= 40
                    ? 'Fair'
                    : 'Needs Improvement'}
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Progress</h3>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Week</span>
              <span className="font-semibold">{insights.goals.currentWeek}h</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  insights.goals.onTrack ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{
                  width: `${Math.min((insights.goals.currentWeek / insights.goals.weeklyTarget) * 100, 100)}%`
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Target: {insights.goals.weeklyTarget}h</span>
              <span
                className={`font-medium ${insights.goals.onTrack ? 'text-green-600' : 'text-orange-600'}`}
              >
                {insights.goals.onTrack ? 'On Track' : 'Behind'}
              </span>
            </div>
          </div>
        </div>

        {/* Burnout Risk */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Burnout Risk</h3>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          <div
            className={`text-2xl font-bold mb-2 capitalize ${getBurnoutRiskColor(insights.burnoutRisk).split(' ')[0]}`}
          >
            {insights.burnoutRisk}
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getBurnoutRiskColor(insights.burnoutRisk)}`}
          >
            {insights.burnoutRisk === 'low'
              ? 'Healthy Balance'
              : insights.burnoutRisk === 'medium'
                ? 'Monitor Closely'
                : 'Take Action'}
          </div>
        </div>
      </div>

      {/* Patterns & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Time Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(insights.timeDistribution).map(([category, percentage]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded ${
                      category === 'direct_work'
                        ? 'bg-blue-500'
                        : category === 'planning'
                          ? 'bg-purple-500'
                          : category === 'collaboration'
                            ? 'bg-green-500'
                            : category === 'review'
                              ? 'bg-orange-500'
                              : 'bg-gray-500'
                    }`}
                  ></div>
                  <span className="text-sm font-medium capitalize">
                    {category.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        category === 'direct_work'
                          ? 'bg-blue-500'
                          : category === 'planning'
                            ? 'bg-purple-500'
                            : category === 'collaboration'
                              ? 'bg-green-500'
                              : category === 'review'
                                ? 'bg-orange-500'
                                : 'bg-gray-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold w-8">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Patterns */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Work Patterns
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Most Productive Day</span>
              <span className="font-semibold">{insights.patterns.mostProductiveDay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Peak Hours</span>
              <span className="font-semibold">{insights.patterns.peakHours.join(', ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Session Length</span>
              <span className="font-semibold">{insights.patterns.averageSessionLength}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Focus Time</span>
              <span className="font-semibold">{insights.patterns.focusTimePercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          AI Recommendations
        </h3>
        <div className="space-y-4">
          {insights.recommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-xs">
                {rec.action}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {insights.achievements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recent Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.achievements.map((achievement, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  function generateInsights() {
    const insightsData = [];

    // Utilization insights
    if (insights.productivity.score > 90) {
      insightsData.push({
        type: 'warning',
        icon: '⚠️',
        title: 'High Utilization',
        message: "You're working at high capacity. Consider balancing your workload.",
        action: 'Review time allocation'
      });
    } else if (insights.productivity.score < 60) {
      insightsData.push({
        type: 'info',
        icon: '💡',
        title: 'Low Utilization',
        message: 'You have capacity for additional work or focus areas.',
        action: 'Explore new objectives'
      });
    }

    return insightsData;
  }
}
