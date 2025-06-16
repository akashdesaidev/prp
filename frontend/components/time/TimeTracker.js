'use client';
import { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Target } from 'lucide-react';
import { Button } from '../ui/button';
import { useTimeTracker } from '../../context/TimeTrackerContext';
import api from '../../lib/api';

export default function TimeTracker({ onTimeLogged }) {
  const {
    isTracking,
    elapsedTime,
    selectedOkr: globalSelectedOkr,
    selectedKeyResult: globalSelectedKeyResult,
    description: globalDescription,
    category: globalCategory,
    startTracking,
    pauseTracking,
    stopTracking,
    formatTime,
    getTimerColor
  } = useTimeTracker();

  const [selectedOkr, setSelectedOkr] = useState(globalSelectedOkr);
  const [selectedKeyResult, setSelectedKeyResult] = useState(globalSelectedKeyResult);
  const [description, setDescription] = useState(globalDescription || '');
  const [category, setCategory] = useState(globalCategory || 'direct_work');
  const [okrs, setOkrs] = useState([]);

  useEffect(() => {
    fetchOKRs();
  }, []);

  // Sync local state with global state when tracking starts
  useEffect(() => {
    if (isTracking && globalSelectedOkr) {
      setSelectedOkr(globalSelectedOkr);
      setSelectedKeyResult(globalSelectedKeyResult);
      setDescription(globalDescription || '');
      setCategory(globalCategory || 'direct_work');
    }
  }, [isTracking, globalSelectedOkr, globalSelectedKeyResult, globalDescription, globalCategory]);

  const fetchOKRs = async () => {
    try {
      const response = await api.get('/okrs');
      setOkrs(response.data || []);
    } catch (error) {
      console.error('Error fetching OKRs:', error);
    }
  };

  const handleStartTracking = () => {
    const success = startTracking(selectedOkr, selectedKeyResult, description, category);
    if (success && onTimeLogged) {
      onTimeLogged();
    }
  };

  const handlePauseTracking = () => {
    pauseTracking();
    if (onTimeLogged) {
      onTimeLogged();
    }
  };

  const handleStopTracking = () => {
    const success = stopTracking();
    if (success && onTimeLogged) {
      onTimeLogged();
    }
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
            onClick={handleStartTracking}
            disabled={!selectedOkr}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4" />
            Start Tracking
          </Button>
        ) : (
          <>
            <Button
              onClick={handlePauseTracking}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            <Button
              onClick={handleStopTracking}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Square className="h-4 w-4" />
              Stop & Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
