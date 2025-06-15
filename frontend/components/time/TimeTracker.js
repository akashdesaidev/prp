'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, Target, Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function TimeTracker({ onTimeLogged }) {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedOkr, setSelectedOkr] = useState(null);
  const [selectedKeyResult, setSelectedKeyResult] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('direct_work');
  const [okrs, setOkrs] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const intervalRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    fetchOKRs();

    // Check for existing tracking session in localStorage
    const savedSession = localStorage.getItem('timeTrackingSession');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setIsTracking(true);
      setStartTime(new Date(session.startTime));
      setSelectedOkr(session.selectedOkr);
      setSelectedKeyResult(session.selectedKeyResult);
      setDescription(session.description);
      setCategory(session.category);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isTracking && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime());
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, startTime]);

  const fetchOKRs = async () => {
    try {
      const response = await api.get('/okrs');
      setOkrs(response.data || []);
    } catch (error) {
      console.error('Error fetching OKRs:', error);
    }
  };

  const startTracking = () => {
    if (!selectedOkr) {
      toast.error('Please select an OKR to track time against');
      return;
    }

    const now = new Date();
    setStartTime(now);
    setIsTracking(true);
    setElapsedTime(0);

    // Save session to localStorage
    const session = {
      startTime: now.toISOString(),
      selectedOkr,
      selectedKeyResult,
      description,
      category
    };
    localStorage.setItem('timeTrackingSession', JSON.stringify(session));

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    toast.success('Time tracking started!');
  };

  const pauseTracking = () => {
    setIsTracking(false);
    localStorage.removeItem('timeTrackingSession');

    if (notificationRef.current) {
      clearTimeout(notificationRef.current);
    }
  };

  const stopTracking = () => {
    if (elapsedTime < 60000) {
      // Less than 1 minute
      toast.error('Minimum tracking time is 1 minute');
      return;
    }

    setIsTracking(false);
    setShowSaveDialog(true);
    localStorage.removeItem('timeTrackingSession');
  };

  const saveTimeEntry = async () => {
    try {
      setLoading(true);

      const hours = elapsedTime / (1000 * 60 * 60); // Convert to hours

      const payload = {
        okrId: selectedOkr._id,
        keyResultId: selectedKeyResult?._id,
        date: new Date().toISOString().split('T')[0],
        hoursSpent: Math.round(hours * 100) / 100, // Round to 2 decimal places
        description: description || `${category.replace('_', ' ')} work on ${selectedOkr.title}`,
        category
      };

      await api.post('/time-entries', payload);

      toast.success(`Time entry saved: ${formatTime(elapsedTime)}`);

      // Reset tracker
      resetTracker();

      // Notify parent component
      if (onTimeLogged) {
        onTimeLogged();
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast.error('Failed to save time entry');
    } finally {
      setLoading(false);
      setShowSaveDialog(false);
    }
  };

  const resetTracker = () => {
    setStartTime(null);
    setElapsedTime(0);
    setSelectedOkr(null);
    setSelectedKeyResult(null);
    setDescription('');
    setCategory('direct_work');
    setShowSaveDialog(false);
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

  const getTimerColor = () => {
    if (!isTracking) return 'text-gray-600';
    if (elapsedTime > 4 * 60 * 60 * 1000) return 'text-red-600'; // Over 4 hours
    if (elapsedTime > 2 * 60 * 60 * 1000) return 'text-orange-600'; // Over 2 hours
    return 'text-green-600';
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'direct_work':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'collaboration':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'other':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracker
        </h3>

        {/* Timer Display */}
        <div className={`text-3xl font-mono font-bold ${getTimerColor()}`}>
          {formatTime(elapsedTime)}
        </div>
      </div>

      {/* OKR Selection */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select OKR *</label>
          <select
            value={selectedOkr?._id || ''}
            onChange={(e) => {
              const okr = okrs.find((o) => o._id === e.target.value);
              setSelectedOkr(okr);
              setSelectedKeyResult(null);
            }}
            disabled={isTracking}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Choose an OKR...</option>
            {okrs.map((okr) => (
              <option key={okr._id} value={okr._id}>
                {okr.title}
              </option>
            ))}
          </select>
        </div>

        {/* Key Result Selection */}
        {selectedOkr?.keyResults?.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Result (Optional)
            </label>
            <select
              value={selectedKeyResult?._id || ''}
              onChange={(e) => {
                const kr = selectedOkr.keyResults.find((kr) => kr._id === e.target.value);
                setSelectedKeyResult(kr);
              }}
              disabled={isTracking}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Choose a key result...</option>
              {selectedOkr.keyResults.map((kr) => (
                <option key={kr._id} value={kr._id}>
                  {kr.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {['direct_work', 'planning', 'collaboration', 'review', 'other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                disabled={isTracking}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  category === cat
                    ? getCategoryColor(cat)
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isTracking}
            placeholder="What are you working on?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {!isTracking ? (
          <Button
            onClick={startTracking}
            disabled={!selectedOkr}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4" />
            Start Tracking
          </Button>
        ) : (
          <>
            <Button onClick={pauseTracking} variant="outline" className="flex items-center gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            <Button
              onClick={stopTracking}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Square className="h-4 w-4" />
              Stop & Save
            </Button>
          </>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Time Entry</h3>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Time Tracked:</span>
                  <span className="font-semibold text-lg">{formatTime(elapsedTime)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">OKR:</span>
                  <span className="text-sm font-medium">{selectedOkr?.title}</span>
                </div>
                {selectedKeyResult && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Key Result:</span>
                    <span className="text-sm font-medium">{selectedKeyResult.title}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}
                  >
                    {category.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you accomplished..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={saveTimeEntry}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Entry'}
              </Button>
              <Button
                onClick={() => setShowSaveDialog(false)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
