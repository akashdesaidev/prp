'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Heart,
  Meh,
  Frown,
  Smile,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  MessageSquare,
  Activity
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function SentimentVisualization({
  userId = null,
  teamId = null,
  timeRange = '30d'
}) {
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' }
  ];

  useEffect(() => {
    fetchSentimentData();
  }, [selectedTimeRange]);

  const fetchSentimentData = async () => {
    try {
      setLoading(true);
      const params = {
        timeRange: selectedTimeRange,
        userId,
        teamId
      };

      const response = await api.get('/feedback/analytics/sentiment', { params });
      setSentimentData(response.data.data);
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      toast.error('Failed to load sentiment analytics');
      // Set empty state instead of mock data
      setSentimentData(null);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return Smile;
      case 'negative':
        return Frown;
      default:
        return Meh;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading sentiment analysis...</p>
        </div>
      </div>
    );
  }

  if (!sentimentData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Sentiment Data</h3>
        <p className="text-gray-500">Unable to load sentiment analysis data</p>
        <Button onClick={fetchSentimentData} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sentiment Analysis</h2>
          <p className="text-gray-600">AI-powered sentiment insights from feedback</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <Button onClick={fetchSentimentData} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Feedback</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sentimentData?.overview?.totalFeedback || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-purple-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Sentiment Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(() => {
                  const breakdown = sentimentData?.overview?.breakdown;
                  const totalFeedback = sentimentData?.overview?.totalFeedback || 0;
                  const positiveCount = breakdown?.positive?.count || 0;

                  if (totalFeedback === 0) return '0';
                  return ((positiveCount / totalFeedback) * 100).toFixed(0);
                })()}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-red-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Rating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(() => {
                  const breakdown = sentimentData?.overview?.breakdown;
                  const totalFeedback = sentimentData?.overview?.totalFeedback || 0;

                  if (totalFeedback === 0) return '0.0';

                  const totalRating =
                    (breakdown?.positive?.averageRating || 0) * (breakdown?.positive?.count || 0) +
                    (breakdown?.neutral?.averageRating || 0) * (breakdown?.neutral?.count || 0) +
                    (breakdown?.negative?.averageRating || 0) * (breakdown?.negative?.count || 0);

                  return (totalRating / totalFeedback).toFixed(1);
                })()}
                /10
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Positive Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(() => {
                  const breakdown = sentimentData?.overview?.breakdown;
                  const totalFeedback = sentimentData?.overview?.totalFeedback || 0;
                  const positiveCount = breakdown?.positive?.count || 0;

                  if (totalFeedback === 0) return '0';
                  return ((positiveCount / totalFeedback) * 100).toFixed(0);
                })()}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sentiment Distribution</h3>
        <div className="space-y-4">
          {['positive', 'neutral', 'negative'].map((sentiment) => {
            const breakdown = sentimentData?.overview?.breakdown;
            const data = breakdown?.[sentiment] || {
              count: 0,
              percentage: 0,
              averageRating: 0
            };
            const Icon = getSentimentIcon(sentiment);
            const totalFeedback = sentimentData?.overview?.totalFeedback || 0;
            const percentage = totalFeedback > 0 ? (data.count / totalFeedback) * 100 : 0;

            return (
              <div key={sentiment} className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${getSentimentColor(sentiment)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {sentiment} ({data.count})
                    </span>
                    <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        sentiment === 'positive'
                          ? 'bg-green-500'
                          : sentiment === 'negative'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['positive', 'neutral', 'negative'].map((sentiment) => {
          const breakdown = sentimentData?.overview?.breakdown;
          const data = breakdown?.[sentiment] || {
            count: 0,
            percentage: 0,
            averageRating: 0
          };
          const Icon = getSentimentIcon(sentiment);

          return (
            <div key={sentiment} className="bg-white p-6 rounded-lg border">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-full ${getSentimentColor(sentiment)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 capitalize">{sentiment}</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{data.count}</p>
                  <p className="text-sm text-gray-500">{data.percentage.toFixed(1)}% of total</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback Count</h4>
                  <div className="text-sm text-gray-600">
                    {data.count} feedback entries in this category
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Rating:</span>
                    <span className="font-medium">{(data.averageRating || 0).toFixed(1)}/10</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
