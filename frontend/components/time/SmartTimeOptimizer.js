'use client';
import { useState, useEffect } from 'react';
import {
  Brain,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Calendar,
  Users,
  Settings,
  Lightbulb
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function SmartTimeOptimizer() {
  const [optimizations, setOptimizations] = useState({
    workloadBalance: {
      score: 0,
      status: 'balanced',
      recommendations: []
    },
    productivityPatterns: {
      peakHours: [],
      optimalSessionLength: 0,
      breakRecommendations: []
    },
    goalAlignment: {
      score: 0,
      misalignedOKRs: [],
      suggestions: []
    },
    teamCollaboration: {
      overlapHours: [],
      meetingOptimization: [],
      focusTimeProtection: []
    },
    burnoutPrevention: {
      riskLevel: 'low',
      earlyWarnings: [],
      preventionActions: []
    }
  });

  const [selectedOptimization, setSelectedOptimization] = useState('workload');
  const [loading, setLoading] = useState(true);
  const [applyingOptimization, setApplyingOptimization] = useState(false);
  const [preferences, setPreferences] = useState({
    workingHours: { start: '09:00', end: '17:00' },
    maxDailyHours: 8,
    preferredBreakInterval: 90,
    focusTimeBlocks: 2,
    collaborationPreference: 'moderate'
  });

  const optimizationTabs = [
    { id: 'workload', label: 'Workload Balance', icon: BarChart3 },
    { id: 'productivity', label: 'Productivity', icon: TrendingUp },
    { id: 'goals', label: 'Goal Alignment', icon: Target },
    { id: 'collaboration', label: 'Team Sync', icon: Users },
    { id: 'wellbeing', label: 'Wellbeing', icon: CheckCircle }
  ];

  useEffect(() => {
    fetchOptimizations();
  }, []);

  const fetchOptimizations = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setOptimizations({
        workloadBalance: {
          score: 72,
          status: 'moderate_overload',
          recommendations: [
            {
              type: 'redistribute',
              title: 'Redistribute OKR Time Allocation',
              description:
                'Move 3 hours from "Product Development" to "Strategic Planning" this week',
              impact: 'high',
              effort: 'low',
              timesSaved: 2.5
            }
          ]
        },
        productivityPatterns: {
          peakHours: ['09:00-11:00', '14:00-16:00'],
          optimalSessionLength: 90,
          breakRecommendations: [
            {
              type: 'micro_break',
              frequency: 'every 25 minutes',
              duration: 5,
              activity: 'eye rest or light stretching'
            }
          ]
        },
        goalAlignment: {
          score: 85,
          misalignedOKRs: [],
          suggestions: [
            {
              title: 'Increase Strategic Work',
              description: 'Allocate 20% more time to high-impact strategic objectives',
              benefit: 'Better goal achievement and career growth'
            }
          ]
        },
        teamCollaboration: {
          overlapHours: ['10:00-12:00', '14:00-16:00'],
          meetingOptimization: [
            {
              suggestion: 'Batch meetings on Tuesdays and Thursdays',
              benefit: 'Create longer focus blocks on other days',
              timesSaved: 3
            }
          ],
          focusTimeProtection: [
            {
              recommendation: 'Block 9-11 AM daily for deep work',
              reason: 'Your peak productivity hours based on tracking data'
            }
          ]
        },
        burnoutPrevention: {
          riskLevel: 'moderate',
          earlyWarnings: ['Working 15% above recommended hours this month'],
          preventionActions: [
            {
              action: 'Implement mandatory lunch breaks',
              benefit: 'Improve afternoon productivity by 20%'
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching optimizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyOptimization = async (optimization) => {
    try {
      setApplyingOptimization(true);

      // Apply the optimization (create calendar blocks, update OKR allocations, etc.)
      await api.post('/time-entries/apply-optimization', {
        optimization,
        preferences
      });

      toast.success('Optimization applied successfully!');
      fetchOptimizations(); // Refresh data
    } catch (error) {
      console.error('Error applying optimization:', error);
      toast.error('Failed to apply optimization');
    } finally {
      setApplyingOptimization(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderWorkloadOptimization = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Workload Balance Score</h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(optimizations.workloadBalance.score)}`}
          >
            {optimizations.workloadBalance.score}/100
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
            style={{ width: `${optimizations.workloadBalance.score}%` }}
          ></div>
        </div>

        <p className="text-gray-600 mb-4">
          {optimizations.workloadBalance.status === 'balanced'
            ? 'Your workload is well balanced across objectives.'
            : 'Your workload could be better distributed for optimal productivity.'}
        </p>
      </div>

      <div className="space-y-4">
        {optimizations.workloadBalance.recommendations.map((rec, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {rec.impact} impact
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{rec.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>⏱️ Saves {rec.timesSaved}h/week</span>
                  <span>🎯 {rec.effort} effort</span>
                </div>
              </div>
              <Button
                onClick={() => applyOptimization(rec)}
                disabled={applyingOptimization}
                className="ml-4"
              >
                {applyingOptimization ? 'Applying...' : 'Apply'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProductivityOptimization = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Performance Hours</h3>
          <div className="space-y-3">
            {optimizations.productivityPatterns.peakHours.map((hour, index) => (
              <div key={index} className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-gray-900">{hour}</span>
                <span className="text-sm text-gray-500">High productivity window</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimal Session Length</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {optimizations.productivityPatterns.optimalSessionLength} min
            </div>
            <p className="text-gray-600">Based on your productivity patterns</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Break Recommendations</h3>
        <div className="space-y-4">
          {optimizations.productivityPatterns.breakRecommendations.map((breakRec, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 className="font-medium text-gray-900 capitalize">
                  {breakRec.type.replace('_', ' ')}
                </h4>
                <p className="text-sm text-gray-600">
                  {breakRec.frequency} • {breakRec.duration} minutes • {breakRec.activity}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Set Reminder
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGoalAlignment = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Goal Alignment Score</h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(optimizations.goalAlignment.score)}`}
          >
            {optimizations.goalAlignment.score}/100
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
            style={{ width: `${optimizations.goalAlignment.score}%` }}
          ></div>
        </div>
      </div>

      {optimizations.goalAlignment.misalignedOKRs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Misaligned OKRs</h3>
          <div className="space-y-4">
            {optimizations.goalAlignment.misalignedOKRs.map((okr, index) => (
              <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{okr.okr}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current: {okr.currentAllocation}%</span>
                  <span className="text-gray-600">Recommended: {okr.recommendedAllocation}%</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">{okr.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {optimizations.goalAlignment.suggestions.map((suggestion, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-primary-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{suggestion.title}</h4>
                <p className="text-gray-600 mb-2">{suggestion.description}</p>
                <p className="text-sm text-green-600">💡 {suggestion.benefit}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCollaborationOptimization = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Overlap Hours</h3>
        <div className="flex flex-wrap gap-2">
          {optimizations.teamCollaboration.overlapHours.map((hour, index) => (
            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {hour}
            </span>
          ))}
        </div>
        <p className="text-gray-600 mt-3">Best times for team collaboration and meetings</p>
      </div>

      <div className="space-y-4">
        {optimizations.teamCollaboration.meetingOptimization.map((opt, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{opt.suggestion}</h4>
                <p className="text-gray-600 mb-2">{opt.benefit}</p>
                <span className="text-sm text-green-600">⏱️ Saves {opt.timesSaved}h/week</span>
              </div>
              <Button variant="outline">Apply</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Focus Time Protection</h3>
        <div className="space-y-3">
          {optimizations.teamCollaboration.focusTimeProtection.map((protection, index) => (
            <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-1">{protection.recommendation}</h4>
              <p className="text-sm text-green-700">{protection.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWellbeingOptimization = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Burnout Risk Level</h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(optimizations.burnoutPrevention.riskLevel)}`}
          >
            {optimizations.burnoutPrevention.riskLevel.toUpperCase()}
          </div>
        </div>

        {optimizations.burnoutPrevention.earlyWarnings.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Early Warning Signs</h4>
            <div className="space-y-2">
              {optimizations.burnoutPrevention.earlyWarnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-yellow-700">
                  <AlertTriangle className="h-4 w-4" />
                  {warning}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {optimizations.burnoutPrevention.preventionActions.map((action, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{action.action}</h4>
                <p className="text-green-600 text-sm">✨ {action.benefit}</p>
              </div>
              <Button variant="outline">Implement</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (selectedOptimization) {
      case 'workload':
        return renderWorkloadOptimization();
      case 'productivity':
        return renderProductivityOptimization();
      case 'goals':
        return renderGoalAlignment();
      case 'collaboration':
        return renderCollaborationOptimization();
      case 'wellbeing':
        return renderWellbeingOptimization();
      default:
        return renderWorkloadOptimization();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="flex space-x-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary-600" />
            Smart Time Optimizer
          </h2>
          <p className="text-gray-600">
            AI-powered recommendations to optimize your time allocation
          </p>
        </div>
        <Button onClick={fetchOptimizations} variant="outline" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Refresh Insights
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {optimizationTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedOptimization(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedOptimization === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">{renderTabContent()}</div>
    </div>
  );
}
