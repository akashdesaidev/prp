'use client';
import { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  Square,
  Target,
  BarChart3,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Timer
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function TimeTrackingDashboard() {
  const [activeTimer, setActiveTimer] = useState(null);
  const [todayStats, setTodayStats] = useState({
    totalHours: 0,
    entriesCount: 0,
    topOKR: null,
    productivity: 0
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [quickOKRs, setQuickOKRs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    checkActiveTimer();

    const interval = setInterval(() => {
      if (activeTimer) {
        setActiveTimer((prev) => ({
          ...prev,
          elapsed: Date.now() - prev.startTime
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.startTime]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const [entriesResponse, okrsResponse] = await Promise.all([
        api.get(`/time-entries?date=${today}&limit=5`),
        api.get('/okrs?limit=4')
      ]);

      if (entriesResponse.data) {
        setRecentEntries(entriesResponse.data);
        calculateTodayStats(entriesResponse.data);
      }

      if (okrsResponse.data) {
        setQuickOKRs(okrsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayStats = (entries) => {
    const totalHours = entries.reduce((sum, entry) => sum + entry.hoursSpent, 0);
    const okrCounts = {};

    entries.forEach((entry) => {
      const okrTitle = entry.okrId?.title || 'Unknown';
      okrCounts[okrTitle] = (okrCounts[okrTitle] || 0) + entry.hoursSpent;
    });

    const topOKR =
      Object.keys(okrCounts).length > 0
        ? Object.entries(okrCounts).sort(([, a], [, b]) => b - a)[0]
        : null;

    const productivity = Math.min(100, Math.round((totalHours / 8) * 100));

    setTodayStats({
      totalHours,
      entriesCount: entries.length,
      topOKR: topOKR ? { title: topOKR[0], hours: topOKR[1] } : null,
      productivity
    });
  };

  const checkActiveTimer = () => {
    const savedTimer = localStorage.getItem('activeTimeTracker');
    if (savedTimer) {
      const timer = JSON.parse(savedTimer);
      setActiveTimer({
        ...timer,
        startTime: new Date(timer.startTime).getTime(),
        elapsed: Date.now() - new Date(timer.startTime).getTime()
      });
    }
  };

  const startTimer = (okr) => {
    const timer = {
      okr,
      startTime: Date.now(),
      elapsed: 0,
      category: 'direct_work'
    };

    setActiveTimer(timer);
    localStorage.setItem(
      'activeTimeTracker',
      JSON.stringify({
        ...timer,
        startTime: new Date(timer.startTime).toISOString()
      })
    );

    toast.success(`Started tracking time for ${okr.title}`);
  };

  const pauseTimer = () => {
    if (activeTimer) {
      localStorage.removeItem('activeTimeTracker');
      toast('Timer paused', {
        icon: 'ℹ️',
        style: {
          background: '#3b82f6',
          color: '#ffffff'
        }
      });
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    const hours = activeTimer.elapsed / (1000 * 60 * 60);

    if (hours < 0.02) {
      toast.error('Minimum tracking time is 1 minute');
      return;
    }

    try {
      await api.post('/time-entries', {
        okrId: activeTimer.okr._id,
        date: new Date().toISOString().split('T')[0],
        hoursSpent: Math.round(hours * 100) / 100,
        description: `Tracked session: ${activeTimer.category.replace('_', ' ')}`,
        category: activeTimer.category
      });

      toast.success(`Logged ${Math.round(hours * 100) / 100}h to ${activeTimer.okr.title}`);

      setActiveTimer(null);
      localStorage.removeItem('activeTimeTracker');
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast.error('Failed to save time entry');
    }
  };

  const quickLog = async (okr, hours) => {
    try {
      await api.post('/time-entries', {
        okrId: okr._id,
        date: new Date().toISOString().split('T')[0],
        hoursSpent: hours,
        description: `Quick log: ${hours}h on ${okr.title}`,
        category: 'direct_work'
      });

      toast.success(`Logged ${hours}h to ${okr.title}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error logging time:', error);
      toast.error('Failed to log time');
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProductivityColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
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
      {/* Active Timer */}
      {activeTimer && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="font-semibold text-gray-900">Tracking: {activeTimer.okr.title}</h3>
                <p className="text-sm text-gray-600">
                  Started at {new Date(activeTimer.startTime).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {formatTime(activeTimer.elapsed)}
                </p>
                <p className="text-sm text-gray-600">Elapsed</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={pauseTimer} variant="outline" size="sm">
                  <Pause className="h-4 w-4" />
                </Button>
                <Button onClick={stopTimer} className="bg-green-600 hover:bg-green-700">
                  <Square className="h-4 w-4 mr-2" />
                  Stop & Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayStats.totalHours.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Entries</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.entriesCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Top OKR</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {todayStats.topOKR?.title || 'None'}
              </p>
              {todayStats.topOKR && (
                <p className="text-xs text-gray-500">{todayStats.topOKR.hours.toFixed(1)}h</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Productivity</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">{todayStats.productivity}%</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getProductivityColor(todayStats.productivity)}`}
                >
                  {todayStats.productivity >= 80
                    ? 'High'
                    : todayStats.productivity >= 60
                      ? 'Good'
                      : todayStats.productivity >= 40
                        ? 'Fair'
                        : 'Low'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

        {quickOKRs.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No OKRs available</p>
            <p className="text-sm text-gray-500">Create an OKR to start tracking time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickOKRs.map((okr) => (
              <div
                key={okr._id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{okr.title}</h4>
                    <p className="text-sm text-gray-600">
                      {okr.type} • Progress: {okr.progress || 0}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => quickLog(okr, 0.5)}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    0.5h
                  </Button>
                  <Button
                    onClick={() => quickLog(okr, 1)}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    1h
                  </Button>
                  <Button
                    onClick={() => startTimer(okr)}
                    disabled={activeTimer}
                    size="sm"
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Track
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Entries */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Today's Entries</h3>
        </div>

        {recentEntries.length === 0 ? (
          <div className="p-6 text-center">
            <Timer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No entries today</h3>
            <p className="text-gray-600">Start tracking time to see your progress</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentEntries.map((entry) => (
              <div key={entry._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {entry.okrId?.title || 'Unknown OKR'}
                      </h4>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {entry.category.replace('_', ' ')}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(entry.createdAt).toLocaleTimeString()}</span>
                      <span className="font-medium text-primary-600">
                        {parseFloat(entry.hoursSpent).toFixed(1)}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
