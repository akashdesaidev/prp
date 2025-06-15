'use client';
import { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Calendar,
  Target,
  BarChart3,
  Share2,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Settings,
  Filter
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function TeamTimeCollaboration() {
  const [teamData, setTeamData] = useState({
    members: [],
    sharedOKRs: [],
    workloadDistribution: {},
    collaborationMetrics: {},
    timeConflicts: [],
    suggestions: []
  });

  const [selectedView, setSelectedView] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWorkloadBalancer, setShowWorkloadBalancer] = useState(false);

  const viewTabs = [
    { id: 'overview', label: 'Team Overview', icon: Users },
    { id: 'workload', label: 'Workload Balance', icon: BarChart3 },
    { id: 'collaboration', label: 'Collaboration', icon: Share2 },
    { id: 'conflicts', label: 'Time Conflicts', icon: AlertCircle },
    { id: 'planning', label: 'Team Planning', icon: Calendar }
  ];

  useEffect(() => {
    fetchTeamData();
  }, [selectedTimeframe]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setTeamData({
        members: [
          {
            id: '1',
            name: 'Alice Johnson',
            role: 'Senior Developer',
            weeklyHours: 38,
            utilization: 95,
            focusTime: 28,
            collaborationTime: 10,
            status: 'available'
          },
          {
            id: '2',
            name: 'Bob Smith',
            role: 'Product Manager',
            weeklyHours: 42,
            utilization: 105,
            focusTime: 25,
            collaborationTime: 17,
            status: 'overloaded'
          }
        ],
        sharedOKRs: [
          {
            id: '1',
            title: 'Launch Mobile App v2.0',
            totalHours: 120,
            completedHours: 78,
            teamMembers: ['1', '2'],
            deadline: '2024-02-15',
            status: 'on_track'
          }
        ],
        workloadDistribution: { balanced: 1, overloaded: 1, underutilized: 0 },
        collaborationMetrics: {
          averageOverlapHours: 6,
          meetingEfficiency: 78,
          communicationScore: 85
        },
        timeConflicts: [],
        suggestions: []
      });
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (utilization) => {
    if (utilization > 100) return 'text-red-600 bg-red-100';
    if (utilization > 90) return 'text-yellow-600 bg-yellow-100';
    if (utilization > 70) return 'text-green-600 bg-green-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'overloaded':
        return 'text-red-600 bg-red-100';
      case 'underutilized':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
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

  const handleWorkloadRebalance = async (suggestion) => {
    try {
      await api.post('/time-entries/rebalance-workload', {
        suggestion,
        timeframe: selectedTimeframe
      });

      toast.success('Workload rebalanced successfully!');
      fetchTeamData();
    } catch (error) {
      console.error('Error rebalancing workload:', error);
      toast.error('Failed to rebalance workload');
    }
  };

  const renderTeamOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">{teamData.members.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Overlap Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamData.collaborationMetrics.averageOverlapHours}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Shared OKRs</p>
              <p className="text-2xl font-bold text-gray-900">{teamData.sharedOKRs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Communication Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamData.collaborationMetrics.communicationScore}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {teamData.members.map((member) => (
            <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-600">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Weekly Hours</p>
                    <p className="font-semibold text-gray-900">{member.weeklyHours}h</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">Utilization</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getUtilizationColor(member.utilization)}`}
                    >
                      {member.utilization}%
                    </span>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}
                    >
                      {member.status}
                    </span>
                  </div>

                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWorkloadBalance = () => (
    <div className="space-y-6">
      {/* Workload Distribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Balanced</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {teamData.workloadDistribution.balanced}
          </p>
          <p className="text-sm text-gray-600">team members</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-gray-900">Overloaded</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {teamData.workloadDistribution.overloaded}
          </p>
          <p className="text-sm text-gray-600">team members</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Available</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {teamData.workloadDistribution.underutilized}
          </p>
          <p className="text-sm text-gray-600">team members</p>
        </div>
      </div>

      {/* Workload Rebalancing Suggestions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Rebalancing Suggestions</h3>
            <Button
              onClick={() => setShowWorkloadBalancer(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Auto-Balance
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {teamData.suggestions
            .filter((s) => s.type === 'workload_rebalance')
            .map((suggestion, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{suggestion.title}</h4>
                    <p className="text-gray-600 mb-3">{suggestion.description}</p>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(suggestion.impact)}`}
                      >
                        {suggestion.impact} impact
                      </span>
                      <span className="text-sm text-gray-500">{suggestion.effort} effort</span>
                    </div>
                  </div>
                  <Button onClick={() => handleWorkloadRebalance(suggestion)} className="ml-4">
                    Apply
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Individual Workload Details */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Individual Workload Analysis</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {teamData.members.map((member) => (
              <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-600">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getUtilizationColor(member.utilization)}`}
                  >
                    {member.utilization}% utilized
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Focus Time</p>
                    <p className="font-semibold text-gray-900">{member.focusTime}h/week</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Collaboration Time</p>
                    <p className="font-semibold text-gray-900">{member.collaborationTime}h/week</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Workload Distribution</span>
                    <span>{member.weeklyHours}h total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500"
                        style={{ width: `${(member.focusTime / member.weeklyHours) * 100}%` }}
                      ></div>
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${(member.collaborationTime / member.weeklyHours) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Focus</span>
                    <span>Collaboration</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCollaboration = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaboration Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Meeting Efficiency</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-blue-500"
                  style={{ width: `${teamData.collaborationMetrics.meetingEfficiency}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {teamData.collaborationMetrics.meetingEfficiency}%
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Communication Score</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-green-500"
                  style={{ width: `${teamData.collaborationMetrics.communicationScore}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {teamData.collaborationMetrics.communicationScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Optimization Suggestions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Meeting Optimization</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {teamData.suggestions
            .filter((s) => s.type === 'meeting_optimization')
            .map((suggestion, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{suggestion.title}</h4>
                    <p className="text-gray-600 mb-3">{suggestion.description}</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(suggestion.impact)}`}
                    >
                      {suggestion.impact} impact
                    </span>
                  </div>
                  <Button variant="outline">Apply</Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderTimeConflicts = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Time Conflicts</h3>
        </div>

        {teamData.timeConflicts.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Time Conflicts</h3>
            <p className="text-gray-600">Your team's schedule is well coordinated!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {teamData.timeConflicts.map((conflict, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      conflict.impact === 'high'
                        ? 'bg-red-100'
                        : conflict.impact === 'medium'
                          ? 'bg-yellow-100'
                          : 'bg-blue-100'
                    }`}
                  >
                    <AlertCircle
                      className={`h-5 w-5 ${
                        conflict.impact === 'high'
                          ? 'text-red-600'
                          : conflict.impact === 'medium'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {conflict.type.replace('_', ' ')}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(conflict.impact)}`}
                      >
                        {conflict.impact} impact
                      </span>
                    </div>

                    {conflict.type === 'meeting_overlap' ? (
                      <div>
                        <p className="text-gray-600 mb-2">
                          Meeting conflict between {conflict.members.join(' and ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(conflict.time).toLocaleString()} • {conflict.duration} minutes
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-2">
                          {conflict.issue} - {conflict.okr}
                        </p>
                        <p className="text-sm text-gray-500">
                          Affects: {conflict.members.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" size="sm">
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTeamPlanning = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Planning Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button className="flex items-center gap-2 h-12">
            <Calendar className="h-4 w-4" />
            Schedule Team Planning Session
          </Button>
          <Button variant="outline" className="flex items-center gap-2 h-12">
            <Share2 className="h-4 w-4" />
            Share Availability
          </Button>
          <Button variant="outline" className="flex items-center gap-2 h-12">
            <Target className="h-4 w-4" />
            Plan OKR Allocation
          </Button>
          <Button variant="outline" className="flex items-center gap-2 h-12">
            <BarChart3 className="h-4 w-4" />
            Generate Team Report
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
        <div className="space-y-4">
          {teamData.sharedOKRs.map((okr) => (
            <div
              key={okr.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <h4 className="font-medium text-gray-900">{okr.title}</h4>
                <p className="text-sm text-gray-600">
                  {Math.ceil((new Date(okr.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days
                  remaining
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {Math.round((okr.completedHours / okr.totalHours) * 100)}% complete
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    okr.status === 'on_track'
                      ? 'bg-green-100 text-green-800'
                      : okr.status === 'at_risk'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {okr.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (selectedView) {
      case 'overview':
        return renderTeamOverview();
      case 'workload':
        return renderWorkloadBalance();
      case 'collaboration':
        return renderCollaboration();
      case 'conflicts':
        return renderTimeConflicts();
      case 'planning':
        return renderTeamPlanning();
      default:
        return renderTeamOverview();
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
            <Users className="h-6 w-6 text-primary-600" />
            Team Time Collaboration
          </h2>
          <p className="text-gray-600">Coordinate time tracking and workload across your team</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <Button onClick={fetchTeamData} variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {viewTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedView === tab.id
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
      <div className="min-h-[600px]">{renderTabContent()}</div>
    </div>
  );
}
