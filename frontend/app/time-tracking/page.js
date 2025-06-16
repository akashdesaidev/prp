'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  Clock,
  Calendar,
  BarChart3,
  Target,
  Settings,
  TrendingUp,
  Play,
  Brain,
  Users,
  FileText,
  Zap
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Button } from '../../components/ui/button';
import TimeEntryForm from '../../components/time/TimeEntryForm';
import WeeklyTimesheet from '../../components/time/WeeklyTimesheet';
import TimeAnalyticsDashboard from '../../components/time/TimeAnalyticsDashboard';
import TimeAllocationPlanner from '../../components/time/TimeAllocationPlanner';
import TimeTracker from '../../components/time/TimeTracker';
import TimesheetCalendar from '../../components/time/TimesheetCalendar';
import TimeInsightsDashboard from '../../components/time/TimeInsightsDashboard';
import SmartTimeOptimizer from '../../components/time/SmartTimeOptimizer';
import TeamTimeCollaboration from '../../components/time/TeamTimeCollaboration';
import AdvancedTimeReporting from '../../components/time/AdvancedTimeReporting';
import EmployeeTimeTracker from '../../components/time/EmployeeTimeTracker';
import ManagerTimeTracker from '../../components/time/ManagerTimeTracker';

export default function TimeTrackingPage() {
  const { user } = useAuth();

  // Determine which time tracker to show based on user role
  const renderRoleBasedTimeTracker = () => {
    if (!user) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Admin and HR users get the full admin interface (existing functionality)
    if (user.role === 'admin' || user.role === 'hr') {
      return <AdminTimeTracker />;
    }

    // Managers get the manager interface with team oversight
    if (user.role === 'manager') {
      return <ManagerTimeTracker />;
    }

    // Employees get the simplified employee interface
    return <EmployeeTimeTracker />;
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">{renderRoleBasedTimeTracker()}</div>
    </ProtectedRoute>
  );
}

// Admin Time Tracker Component (existing functionality)
function AdminTimeTracker() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeEntries, setTimeEntries] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Clock },
    { id: 'tracker', label: 'Live Tracker', icon: Play },
    { id: 'timesheet', label: 'Weekly Timesheet', icon: Calendar },
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'planning', label: 'Time Planning', icon: Target },
    { id: 'optimizer', label: 'Smart Optimizer', icon: Zap },
    { id: 'collaboration', label: 'Team Collaboration', icon: Users },
    { id: 'reports', label: 'Advanced Reports', icon: FileText }
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

      // Fetch recent time entries and OKRs
      const [entriesResponse, okrsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries?limit=10&populate=okrId`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/okrs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json();
        setTimeEntries(entriesData);
      }

      if (okrsResponse.ok) {
        const okrsData = await okrsResponse.json();
        setOkrs(okrsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntrySuccess = () => {
    if (activeTab === 'overview') {
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

  const getTotalHours = () => {
    return timeEntries.reduce((sum, entry) => sum + entry.hoursSpent, 0);
  };

  const getWeeklyHours = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return timeEntries
      .filter((entry) => new Date(entry.date) >= oneWeekAgo)
      .reduce((sum, entry) => sum + entry.hoursSpent, 0);
  };

  const getTodayHours = () => {
    const today = new Date().toISOString().split('T')[0];
    return timeEntries
      .filter((entry) => entry.date.split('T')[0] === today)
      .reduce((sum, entry) => sum + entry.hoursSpent, 0);
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

    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">{getTodayHours().toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{getWeeklyHours().toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{timeEntries.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active OKRs</p>
                <p className="text-2xl font-bold text-gray-900">{okrs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Button
              onClick={() => setActiveTab('tracker')}
              className="flex items-center gap-2 justify-center h-12 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4" />
              Start Tracking
            </Button>
            <Button
              onClick={() => setShowEntryForm(true)}
              variant="outline"
              className="flex items-center gap-2 justify-center h-12"
            >
              <Plus className="h-4 w-4" />
              Log Time Entry
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('calendar')}
              className="flex items-center gap-2 justify-center h-12"
            >
              <Calendar className="h-4 w-4" />
              Calendar View
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('insights')}
              className="flex items-center gap-2 justify-center h-12"
            >
              <Brain className="h-4 w-4" />
              AI Insights
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('analytics')}
              className="flex items-center gap-2 justify-center h-12"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Recent Time Entries */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Time Entries</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('timesheet')}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                View All
              </Button>
            </div>
          </div>

          {timeEntries.length === 0 ? (
            <div className="p-6 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries yet</h3>
              <p className="text-gray-600 mb-4">
                Start tracking your time to see insights and progress.
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
                        <span className="font-medium">{entry.hoursSpent}h</span>
                        {entry.keyResultId && (
                          <span className="text-primary-600">Specific Key Result</span>
                        )}
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

        {/* Weekly Progress Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Weekly Target: 40 hours</span>
              <span className="text-sm font-medium text-gray-900">
                {getWeeklyHours().toFixed(1)}h / 40h
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  getWeeklyHours() >= 40
                    ? 'bg-green-500'
                    : getWeeklyHours() >= 30
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min((getWeeklyHours() / 40) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0h</span>
              <span>20h</span>
              <span>40h</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'tracker':
        return <TimeTracker onTimeLogged={handleEntrySuccess} />;
      case 'timesheet':
        return <WeeklyTimesheet />;
      case 'calendar':
        return (
          <TimesheetCalendar
            onDateSelect={(date) => {
              setShowEntryForm(true);
              // Could pre-fill date in form
            }}
          />
        );
      case 'analytics':
        return <TimeAnalyticsDashboard />;
      case 'insights':
        return <TimeInsightsDashboard />;
      case 'planning':
        return <TimeAllocationPlanner />;
      case 'optimizer':
        return <SmartTimeOptimizer />;
      case 'collaboration':
        return <TeamTimeCollaboration />;
      case 'reports':
        return <AdvancedTimeReporting />;
      default:
        return renderOverview();
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
            <p className="text-gray-600">
              Track, analyze, and optimize your time allocation across objectives
            </p>
          </div>
          {activeTab === 'overview' && (
            <Button onClick={() => setShowEntryForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Log Time
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
    </ProtectedRoute>
  );
}
