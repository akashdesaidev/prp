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
  CheckCircle,
  AlertCircle,
  Settings,
  Bell,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import TimeEntryForm from './TimeEntryForm';
import WeeklyTimesheet from './WeeklyTimesheet';
import TimeTracker from './TimeTracker';
import TimesheetCalendar from './TimesheetCalendar';
import TimeInsightsDashboard from './TimeInsightsDashboard';
import TimeAnalyticsDashboard from './TimeAnalyticsDashboard';
import SmartTimeOptimizer from './SmartTimeOptimizer';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatDateLocal } from '../../lib/utils';

export default function EmployeeTimeTracker() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeEntries, setTimeEntries] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Employee-focused tabs - comprehensive interface
  const tabs = [
    { id: 'overview', label: 'My Time', icon: Clock },
    { id: 'tracker', label: 'Live Tracker', icon: Play },
    { id: 'timesheet', label: 'Weekly View', icon: Calendar },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'optimizer', label: 'Smart Optimizer', icon: TrendingUp },
    { id: 'goals', label: 'My OKRs', icon: Target }
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

      // Fetch personal time entries and OKRs
      const [entriesResponse, okrsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries?limit=10&populate=okrId`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/okrs?assignedTo=${user.id}`, {
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

  const getWeeklyTarget = () => 40; // Standard 40-hour work week

  const getProductivityScore = () => {
    const weeklyHours = getWeeklyHours();
    const target = getWeeklyTarget();
    return Math.min(Math.round((weeklyHours / target) * 100), 100);
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      );
    }

    const productivityScore = getProductivityScore();
    const weeklyHours = getWeeklyHours();
    const target = getWeeklyTarget();

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
                <p className="text-sm text-gray-600">Today's Hours</p>
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
                <p className="text-2xl font-bold text-gray-900">{weeklyHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-500">of {parseFloat(target).toFixed(1)}h target</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  productivityScore >= 80
                    ? 'bg-green-100'
                    : productivityScore >= 60
                      ? 'bg-yellow-100'
                      : 'bg-red-100'
                }`}
              >
                <TrendingUp
                  className={`h-5 w-5 ${
                    productivityScore >= 80
                      ? 'text-green-600'
                      : productivityScore >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Productivity</p>
                <p className="text-2xl font-bold text-gray-900">{productivityScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Weekly Target: {target} hours</span>
              <span className="text-sm font-medium text-gray-900">
                {weeklyHours.toFixed(1)}h / {parseFloat(target).toFixed(1)}h
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  weeklyHours >= target
                    ? 'bg-green-500'
                    : weeklyHours >= target * 0.75
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min((weeklyHours / target) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0h</span>
              <span>{parseFloat(target / 2).toFixed(1)}h</span>
              <span>{parseFloat(target).toFixed(1)}h</span>
            </div>
          </div>
        </div>

        {/* My OKRs Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My OKRs Progress</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('goals')}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              View All
            </Button>
          </div>

          {okrs.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No OKRs assigned</h3>
              <p className="text-gray-600">Contact your manager to get OKRs assigned.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {okrs.slice(0, 3).map((okr) => (
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
                <Calendar className="h-4 w-4" />
                View All
              </Button>
            </div>
          </div>

          {timeEntries.length === 0 ? (
            <div className="p-6 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries yet</h3>
              <p className="text-gray-600 mb-4">
                Start tracking your time to see your productivity insights.
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
                        {entry.keyResultId && (
                          <span className="text-blue-600">Specific Key Result</span>
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
      </div>
    );
  };

  const renderGoalsTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Assigned OKRs</h3>

          {okrs.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No OKRs Assigned</h3>
              <p className="text-gray-600 mb-6">
                You don't have any OKRs assigned yet. Contact your manager to get started with goal
                setting.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {okrs.map((okr) => (
                <div key={okr._id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{okr.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{okr.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                  </div>

                  {okr.keyResults && okr.keyResults.length > 0 && (
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-900">Key Results</h5>
                      {okr.keyResults.map((kr, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-gray-900">{kr.title}</h6>
                            <span className="text-sm font-medium text-gray-600">{kr.score}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                kr.score >= 8
                                  ? 'bg-green-500'
                                  : kr.score >= 6
                                    ? 'bg-blue-500'
                                    : kr.score >= 4
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                              }`}
                              style={{ width: `${(kr.score / 10) * 100}%` }}
                            ></div>
                          </div>
                          {kr.description && (
                            <p className="text-sm text-gray-600">{kr.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Due: {new Date(okr.endDate).toLocaleDateString()}</span>
                      <span>Type: {okr.type}</span>
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
      case 'tracker':
        return <TimeTracker onTimeLogged={handleEntrySuccess} />;
      case 'timesheet':
        return <WeeklyTimesheet />;
      case 'calendar':
        return (
          <TimesheetCalendar
            onDateSelect={(date) => {
              // Format the date to avoid timezone issues - use local date values
              const formattedDate = formatDateLocal(date);
              setSelectedDate(formattedDate);
              setShowEntryForm(true);
            }}
          />
        );
      case 'analytics':
        return <TimeAnalyticsDashboard />;
      case 'insights':
        return <TimeInsightsDashboard />;
      case 'optimizer':
        return <SmartTimeOptimizer />;
      case 'goals':
        return renderGoalsTab();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Time Tracking</h1>
          <p className="text-gray-600">Track your time, monitor progress, and achieve your goals</p>
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
          setSelectedDate(null);
        }}
        onSuccess={handleEntrySuccess}
        initialData={selectedEntry}
        selectedDate={selectedDate}
      />
    </div>
  );
}
