'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  Clock,
  Calendar,
  BarChart3,
  Target,
  Play,
  Brain,
  TrendingUp,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  User,
  FileText,
  PieChart
} from 'lucide-react';
import { Button } from '../ui/button';
import TimeEntryForm from './TimeEntryForm';
import WeeklyTimesheet from './WeeklyTimesheet';
import TimeTracker from './TimeTracker';
import TimesheetCalendar from './TimesheetCalendar';
import TimeInsightsDashboard from './TimeInsightsDashboard';
import TimeAllocationPlanner from './TimeAllocationPlanner';
import TimeAnalyticsDashboard from './TimeAnalyticsDashboard';
import SmartTimeOptimizer from './SmartTimeOptimizer';

export default function ManagerTimeTracker() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeEntries, setTimeEntries] = useState([]);
  const [teamTimeEntries, setTeamTimeEntries] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [teamOkrs, setTeamOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Manager-focused tabs - team oversight + personal tracking
  const tabs = [
    { id: 'overview', label: 'Team Overview', icon: Users },
    { id: 'my-time', label: 'My Time', icon: Clock },
    { id: 'tracker', label: 'Live Tracker', icon: Play },
    { id: 'team-timesheet', label: 'Team Timesheet', icon: Calendar },
    { id: 'allocation', label: 'Resource Planning', icon: Settings },
    { id: 'analytics', label: 'Team Analytics', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'optimizer', label: 'Smart Optimizer', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
    }
  }, [activeTab]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      // Fetch personal and team data
      const [
        entriesResponse,
        teamEntriesResponse,
        teamMembersResponse,
        okrsResponse,
        teamOkrsResponse
      ] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries?limit=10&populate=okrId`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries/team?populate=okrId`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/my-team`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/okrs?assignedTo=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/okrs/team`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json();
        setTimeEntries(entriesData);
      }

      if (teamEntriesResponse.ok) {
        const teamEntriesData = await teamEntriesResponse.json();
        setTeamTimeEntries(teamEntriesData);
      }

      if (teamMembersResponse.ok) {
        const teamMembersData = await teamMembersResponse.json();
        setTeamMembers(teamMembersData);
      }

      if (okrsResponse.ok) {
        const okrsData = await okrsResponse.json();
        setOkrs(okrsData);
      }

      if (teamOkrsResponse.ok) {
        const teamOkrsData = await teamOkrsResponse.json();
        setTeamOkrs(teamOkrsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntrySuccess = () => {
    if (activeTab === 'overview' || activeTab === 'my-time') {
      fetchOverviewData();
    }
    setShowEntryForm(false);
    setSelectedEntry(null);
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setShowEntryForm(true);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'direct_work':
        return 'bg-blue-100 text-blue-800';
      case 'planning':
        return 'bg-purple-100 text-purple-800';
      case 'collaboration':
        return 'bg-green-100 text-green-800';
      case 'review':
        return 'bg-orange-100 text-orange-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Personal time calculations
  const getMyTotalHours = () => {
    return timeEntries.reduce((sum, entry) => sum + entry.hoursSpent, 0);
  };

  const getMyWeeklyHours = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return timeEntries
      .filter((entry) => new Date(entry.date) >= oneWeekAgo)
      .reduce((sum, entry) => sum + entry.hoursSpent, 0);
  };

  const getMyTodayHours = () => {
    const today = new Date().toISOString().split('T')[0];
    return timeEntries
      .filter((entry) => entry.date.split('T')[0] === today)
      .reduce((sum, entry) => sum + entry.hoursSpent, 0);
  };

  // Team time calculations
  const getTeamWeeklyHours = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return teamTimeEntries
      .filter((entry) => new Date(entry.date) >= oneWeekAgo)
      .reduce((sum, entry) => sum + entry.hoursSpent, 0);
  };

  const getTeamTodayHours = () => {
    const today = new Date().toISOString().split('T')[0];
    return teamTimeEntries
      .filter((entry) => entry.date.split('T')[0] === today)
      .reduce((sum, entry) => sum + entry.hoursSpent, 0);
  };

  const getTeamUtilization = () => {
    const weeklyHours = getTeamWeeklyHours();
    const expectedHours = teamMembers.length * 40; // 40 hours per team member
    return expectedHours > 0 ? Math.round((weeklyHours / expectedHours) * 100) : 0;
  };

  const getUnderperformingMembers = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return teamMembers.filter((member) => {
      const memberHours = teamTimeEntries
        .filter((entry) => entry.userId === member._id && new Date(entry.date) >= oneWeekAgo)
        .reduce((sum, entry) => sum + entry.hoursSpent, 0);

      return memberHours < 32; // Less than 32 hours per week
    });
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      );
    }

    const teamUtilization = getTeamUtilization();
    const underperformingMembers = getUnderperformingMembers();

    return (
      <div className="space-y-6">
        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Team Size</p>
                <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Team Hours Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getTeamTodayHours().toFixed(1)}h
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Team Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{teamUtilization}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  underperformingMembers.length === 0 ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <AlertTriangle
                  className={`h-5 w-5 ${
                    underperformingMembers.length === 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">At Risk</p>
                <p className="text-2xl font-bold text-gray-900">{underperformingMembers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Performance Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance This Week</h3>

          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members</h3>
              <p className="text-gray-600">You don't have any team members assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const memberWeeklyHours = teamTimeEntries
                  .filter((entry) => {
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    return entry.userId === member._id && new Date(entry.date) >= oneWeekAgo;
                  })
                  .reduce((sum, entry) => sum + entry.hoursSpent, 0);

                const utilizationPercent = Math.round((memberWeeklyHours / 40) * 100);

                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {memberWeeklyHours.toFixed(1)}h
                        </p>
                        <p className="text-xs text-gray-500">this week</p>
                      </div>

                      <div className="w-24">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              utilizationPercent >= 80
                                ? 'bg-green-500'
                                : utilizationPercent >= 60
                                  ? 'bg-blue-500'
                                  : utilizationPercent >= 40
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{utilizationPercent}%</p>
                      </div>

                      <div className="flex items-center">
                        {utilizationPercent >= 80 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : utilizationPercent >= 60 ? (
                          <Clock className="h-5 w-5 text-blue-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team OKRs Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Team OKRs Progress</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('allocation')}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Manage Resources
            </Button>
          </div>

          {teamOkrs.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Team OKRs</h3>
              <p className="text-gray-600">Create team OKRs to track collective progress.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamOkrs.slice(0, 3).map((okr) => (
                <div key={okr._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{okr.title}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        okr.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : okr.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {okr.status}
                    </span>
                  </div>
                  {okr.keyResults && okr.keyResults.length > 0 && (
                    <div className="space-y-2">
                      {okr.keyResults.slice(0, 2).map((kr, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{kr.title}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(kr.score / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">{kr.score}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts & Notifications */}
        {underperformingMembers.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Team Members Need Attention</h3>
            </div>
            <div className="space-y-2">
              {underperformingMembers.map((member) => (
                <div key={member._id} className="flex items-center justify-between">
                  <span className="text-red-800">
                    {member.firstName} {member.lastName} - Low time tracking this week
                  </span>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-300">
                    Follow Up
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMyTime = () => {
    const myWeeklyHours = getMyWeeklyHours();
    const myTodayHours = getMyTodayHours();
    const target = 40;

    return (
      <div className="space-y-6">
        {/* Personal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">My Hours Today</p>
                <p className="text-2xl font-bold text-gray-900">{myTodayHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">My Week</p>
                <p className="text-2xl font-bold text-gray-900">{myWeeklyHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-500">of {parseFloat(target).toFixed(1)}h target</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">My Utilization</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((myWeeklyHours / target) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Recent Time Entries */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">My Recent Time Entries</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEntryForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Log Time
              </Button>
            </div>
          </div>

          {timeEntries.length === 0 ? (
            <div className="p-6 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries yet</h3>
              <p className="text-gray-600 mb-4">
                Start tracking your time to set a good example for your team.
              </p>
              <Button onClick={() => setShowEntryForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Log Your First Entry
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {timeEntries.slice(0, 5).map((entry) => (
                <div key={entry._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {entry.okrId?.title || entry.okrTitle || 'General Time Entry'}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(entry.category)}`}
                        >
                          {entry.category.replace('_', ' ')}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                        <span className="font-medium">
                          {parseFloat(entry.hoursSpent).toFixed(1)}h
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditEntry(entry)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'my-time':
        return renderMyTime();
      case 'tracker':
        return <TimeTracker onTimeLogged={handleEntrySuccess} />;
      case 'team-timesheet':
        return <WeeklyTimesheet showTeamView={true} />;
      case 'allocation':
        return <TimeAllocationPlanner />;
      case 'analytics':
        return <TimeAnalyticsDashboard showTeamView={true} />;
      case 'insights':
        return <TimeInsightsDashboard showTeamView={true} showAIInsights={true} />;
      case 'optimizer':
        return <SmartTimeOptimizer showTeamView={true} />;
      case 'reports':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Reports</h3>
            <p className="text-gray-600">Advanced reporting features coming soon...</p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Time Management</h1>
          <p className="text-gray-600">
            Monitor team performance, allocate resources, and track progress
          </p>
        </div>
        {(activeTab === 'overview' || activeTab === 'my-time') && (
          <Button onClick={() => setShowEntryForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Log My Time
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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

      {/* Time Entry Form Modal */}
      <TimeEntryForm
        isOpen={showEntryForm}
        onClose={() => {
          setShowEntryForm(false);
          setSelectedEntry(null);
        }}
        onSuccess={handleEntrySuccess}
        initialData={selectedEntry}
      />
    </div>
  );
}
