'use client';
import { useState, useEffect } from 'react';
import { Play, Clock, Target, Coffee, Users, BookOpen, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function TimeEntryQuickActions({ onTimeLogged }) {
  const [recentOKRs, setRecentOKRs] = useState([]);
  const [quickTemplates, setQuickTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTracking, setActiveTracking] = useState(null);

  useEffect(() => {
    fetchRecentOKRs();
    loadQuickTemplates();
  }, []);

  const fetchRecentOKRs = async () => {
    try {
      const response = await api.get('/okrs');
      setRecentOKRs(response.data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching recent OKRs:', error);
    }
  };

  const loadQuickTemplates = () => {
    const templates = [
      {
        id: 'standup',
        name: 'Daily Standup',
        icon: Users,
        category: 'collaboration',
        defaultHours: 0.5,
        color: 'bg-green-100 text-green-800 border-green-200'
      },
      {
        id: 'planning',
        name: 'Sprint Planning',
        icon: Target,
        category: 'planning',
        defaultHours: 2,
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      {
        id: 'learning',
        name: 'Learning & Development',
        icon: BookOpen,
        category: 'other',
        defaultHours: 1,
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      {
        id: 'break',
        name: 'Break/Coffee',
        icon: Coffee,
        category: 'other',
        defaultHours: 0.25,
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      }
    ];
    setQuickTemplates(templates);
  };

  const quickLogTime = async (okr, hours = 1, category = 'direct_work', description = '') => {
    try {
      setLoading(true);

      const payload = {
        okrId: okr._id,
        date: new Date().toISOString().split('T')[0],
        hoursSpent: hours,
        description: description || `Quick log: ${category.replace('_', ' ')} on ${okr.title}`,
        category
      };

      await api.post('/time-entries', payload);
      toast.success(`Logged ${hours}h to ${okr.title}`);

      if (onTimeLogged) {
        onTimeLogged();
      }
    } catch (error) {
      console.error('Error logging time:', error);
      toast.error('Failed to log time');
    } finally {
      setLoading(false);
    }
  };

  const quickLogTemplate = async (template) => {
    try {
      setLoading(true);

      const targetOKR = recentOKRs[0];
      if (!targetOKR) {
        toast.error('No recent OKRs found. Please create an OKR first.');
        return;
      }

      const payload = {
        okrId: targetOKR._id,
        date: new Date().toISOString().split('T')[0],
        hoursSpent: template.defaultHours,
        description: `${template.name} - Quick log`,
        category: template.category
      };

      await api.post('/time-entries', payload);
      toast.success(`Logged ${template.defaultHours}h for ${template.name}`);

      if (onTimeLogged) {
        onTimeLogged();
      }
    } catch (error) {
      console.error('Error logging template time:', error);
      toast.error('Failed to log time');
    } finally {
      setLoading(false);
    }
  };

  const startQuickTracking = (okr) => {
    setActiveTracking({
      okr,
      startTime: new Date(),
      category: 'direct_work'
    });
    toast.success(`Started tracking time for ${okr.title}`);
  };

  const stopQuickTracking = async () => {
    if (!activeTracking) return;

    const elapsedHours = (new Date() - activeTracking.startTime) / (1000 * 60 * 60);

    if (elapsedHours < 0.02) {
      toast.error('Minimum tracking time is 1 minute');
      return;
    }

    await quickLogTime(
      activeTracking.okr,
      Math.round(elapsedHours * 100) / 100,
      activeTracking.category,
      'Quick tracked session'
    );

    setActiveTracking(null);
  };

  return (
    <div className="space-y-6">
      {activeTracking && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-green-900">Tracking: {activeTracking.okr.title}</p>
                <p className="text-sm text-green-700">
                  Started at {activeTracking.startTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              onClick={stopQuickTracking}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Stop & Save
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Recent OKRs
        </h3>

        {recentOKRs.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent OKRs found</p>
            <p className="text-sm text-gray-500">Create an OKR to start tracking time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentOKRs.map((okr) => (
              <div
                key={okr._id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{okr.title}</h4>
                    <p className="text-sm text-gray-600">
                      {okr.type} • {okr.keyResults?.length || 0} key results
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => quickLogTime(okr, 1)}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Log 1h
                  </Button>
                  <Button
                    onClick={() => startQuickTracking(okr)}
                    disabled={loading || activeTracking}
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

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Templates
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => quickLogTemplate(template)}
                disabled={loading || recentOKRs.length === 0}
                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${template.color}`}
              >
                <Icon className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs opacity-75">
                  {parseFloat(template.defaultHours).toFixed(1)}h
                </p>
              </button>
            );
          })}
        </div>

        {recentOKRs.length === 0 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Templates will log time to your most recent OKR
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Quick Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">0.0h</p>
            <p className="text-sm text-gray-600">Logged Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{recentOKRs.length}</p>
            <p className="text-sm text-gray-600">Active OKRs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{activeTracking ? '1' : '0'}</p>
            <p className="text-sm text-gray-600">Tracking Now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
