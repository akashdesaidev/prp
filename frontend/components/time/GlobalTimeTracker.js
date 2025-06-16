'use client';
import { useState } from 'react';
import { Clock, Pause, Square, Save, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useTimeTracker } from '../../context/TimeTrackerContext';

export default function GlobalTimeTracker() {
  const {
    isTracking,
    elapsedTime,
    selectedOkr,
    selectedKeyResult,
    description,
    category,
    showSaveDialog,
    pauseTracking,
    stopTracking,
    saveTimeEntry,
    resetTracker,
    updateDescription,
    setShowSaveDialog,
    formatTime,
    getTimerColor
  } = useTimeTracker();

  const [isMinimized, setIsMinimized] = useState(false);
  const [finalDescription, setFinalDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isTracking && !showSaveDialog) {
    return null;
  }

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

  const handleSave = async () => {
    setLoading(true);
    const success = await saveTimeEntry(finalDescription || description);
    if (success) {
      setFinalDescription('');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setShowSaveDialog(false);
    setFinalDescription('');
  };

  // Save Dialog Modal
  if (showSaveDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Time Entry
          </h3>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Time Tracked:</span>
                <span className="font-semibold text-lg text-green-600">
                  {formatTime(elapsedTime)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">OKR:</span>
                <span className="text-sm font-medium text-right flex-1 ml-2">
                  {selectedOkr?.title}
                </span>
              </div>
              {selectedKeyResult && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Key Result:</span>
                  <span className="text-sm font-medium text-right flex-1 ml-2">
                    {selectedKeyResult.title}
                  </span>
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
                value={finalDescription || description}
                onChange={(e) => setFinalDescription(e.target.value)}
                placeholder="Describe what you accomplished..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Entry'}
            </Button>
            <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Floating Timer Widget
  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Time Tracker</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              >
                {isMinimized ? (
                  <Maximize2 className="h-3 w-3" />
                ) : (
                  <Minimize2 className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4 min-w-[280px]">
            {/* Timer Display */}
            <div className={`text-2xl font-mono font-bold text-center mb-3 ${getTimerColor()}`}>
              {formatTime(elapsedTime)}
            </div>

            {/* Current Task Info */}
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-gray-600">OKR:</span>
                <div className="font-medium text-gray-900 truncate" title={selectedOkr?.title}>
                  {selectedOkr?.title}
                </div>
              </div>

              {selectedKeyResult && (
                <div className="text-sm">
                  <span className="text-gray-600">Key Result:</span>
                  <div
                    className="font-medium text-gray-900 truncate"
                    title={selectedKeyResult.title}
                  >
                    {selectedKeyResult.title}
                  </div>
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

              {description && (
                <div className="text-sm">
                  <span className="text-gray-600">Description:</span>
                  <div className="text-gray-900 text-xs mt-1 truncate" title={description}>
                    {description}
                  </div>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={pauseTracking}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center justify-center gap-1"
              >
                <Pause className="h-3 w-3" />
                Pause
              </Button>
              <Button
                onClick={stopTracking}
                size="sm"
                className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700"
              >
                <Square className="h-3 w-3" />
                Stop
              </Button>
            </div>
          </div>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="px-4 py-2">
            <div className={`text-lg font-mono font-bold ${getTimerColor()}`}>
              {formatTime(elapsedTime)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
