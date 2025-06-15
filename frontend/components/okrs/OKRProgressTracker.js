'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, MessageSquare, Save, History, Target } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';

import toast from 'react-hot-toast';

export default function OKRProgressTracker({ okr, onUpdate }) {
  const [keyResults, setKeyResults] = useState(okr.keyResults || []);
  const [progressHistory, setProgressHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');

  useEffect(() => {
    setKeyResults(okr.keyResults || []);
    fetchProgressHistory();
  }, [okr]);

  const fetchProgressHistory = async () => {
    try {
      console.log('📈 Fetching progress history for OKR:', okr._id);
      const response = await api.get(`/okrs/${okr._id}/progress-history`);
      console.log('📊 Progress history response:', response.data);

      // Handle both direct array response and nested response
      const historyData = response.data?.progressHistory || response.data || [];
      const historyArray = Array.isArray(historyData) ? historyData : [];

      console.log('📋 Setting progress history:', historyArray);
      setProgressHistory(historyArray);
    } catch (error) {
      console.error('❌ Error fetching progress history:', error);
      // Set empty array on error to prevent map() errors
      setProgressHistory([]);
    }
  };

  const handleKeyResultUpdate = (index, field, value) => {
    const updatedKeyResults = [...keyResults];
    updatedKeyResults[index] = {
      ...updatedKeyResults[index],
      [field]: value,
      updatedAt: new Date().toISOString()
    };
    setKeyResults(updatedKeyResults);
  };

  const calculateProgress = (keyResult) => {
    if (!keyResult.targetValue || keyResult.targetValue === 0) {
      return (keyResult.score || 1) * 10; // Convert 1-10 score to percentage
    }
    return Math.min(((keyResult.currentValue || 0) / keyResult.targetValue) * 100, 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleSaveProgress = async () => {
    try {
      setLoading(true);

      const payload = {
        keyResults: keyResults.map((kr, index) => ({
          id: kr._id || kr.id || index, // Handle different ID formats
          currentValue: Number(kr.currentValue) || 0,
          score: Number(kr.score) || 1
        })),
        notes: updateNotes
      };

      console.log('🔄 Sending progress update payload:', payload);

      await api.put(`/okrs/${okr._id}/progress`, payload);

      toast.success('Progress updated successfully!');
      setUpdateNotes('');
      onUpdate && onUpdate();
      fetchProgressHistory();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Progress Tracking</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
          <Button
            onClick={handleSaveProgress}
            disabled={loading}
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Progress'}
          </Button>
        </div>
      </div>

      {/* Key Results Progress */}
      <div className="space-y-6">
        {keyResults.map((keyResult, index) => {
          const progress = calculateProgress(keyResult);
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{keyResult.title}</h4>
                  {keyResult.description && (
                    <p className="text-sm text-gray-600">{keyResult.description}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-gray-900">{progress.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Progress Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Current Value
                  </label>
                  <input
                    type="number"
                    value={keyResult.currentValue || ''}
                    onChange={(e) => handleKeyResultUpdate(index, 'currentValue', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={keyResult.targetValue || ''}
                    onChange={(e) => handleKeyResultUpdate(index, 'targetValue', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Score (1-10)
                  </label>
                  <select
                    value={keyResult.score || 1}
                    onChange={(e) => handleKeyResultUpdate(index, 'score', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {keyResult.unit && (
                <div className="mt-2 text-xs text-gray-500">Unit: {keyResult.unit}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Notes */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Progress Notes (Optional)
        </label>
        <textarea
          value={updateNotes}
          onChange={(e) => setUpdateNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Add notes about this progress update..."
        />
      </div>

      {/* Progress History */}
      {showHistory && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <History className="h-4 w-4" />
            Progress History
          </h4>

          {((Array.isArray(progressHistory) && progressHistory?.length) || 0) === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No progress history available</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Array.isArray(progressHistory) &&
                progressHistory.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">Progress Update</p>
                        <p className="text-xs text-gray-500">{formatDate(entry.recordedAt)}</p>
                      </div>
                      {entry.notes && <p className="text-sm text-gray-600 mb-2">{entry.notes}</p>}
                      <div className="text-xs text-gray-500">
                        Score: {entry.score}/10 • Type: {entry.snapshotType}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
