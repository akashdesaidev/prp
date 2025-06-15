'use client';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Eye, EyeOff, Trash2, Flag, MessageSquare, User, Calendar } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function FeedbackModerationPanel({ userRole }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, flagged, private, public
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await api.get('/feedback/moderation', {
        params: { filter }
      });
      setFeedback(response.data.data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback for moderation');
    } finally {
      setLoading(false);
    }
  };

  const handleHideFeedback = async (feedbackId, reason) => {
    try {
      await api.post(`/feedback/${feedbackId}/moderate`, {
        action: 'hide',
        reason
      });

      setFeedback(
        feedback.map((f) =>
          f._id === feedbackId ? { ...f, isHidden: true, moderationReason: reason } : f
        )
      );

      toast.success('Feedback hidden successfully');
    } catch (error) {
      console.error('Error hiding feedback:', error);
      toast.error('Failed to hide feedback');
    }
  };

  const handleRestoreFeedback = async (feedbackId) => {
    try {
      await api.post(`/feedback/${feedbackId}/moderate`, {
        action: 'restore'
      });

      setFeedback(
        feedback.map((f) =>
          f._id === feedbackId ? { ...f, isHidden: false, moderationReason: null } : f
        )
      );

      toast.success('Feedback restored successfully');
    } catch (error) {
      console.error('Error restoring feedback:', error);
      toast.error('Failed to restore feedback');
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      case 'neutral':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Feedback Moderation</h2>
          <p className="text-gray-500">Review and moderate feedback across the organization</p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Feedback</option>
            <option value="flagged">Flagged</option>
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Feedback Items ({feedback.length})</h3>
        </div>

        <div className="divide-y">
          {feedback.map((item) => (
            <div
              key={item._id}
              className={`p-6 ${item.isHidden ? 'bg-red-50' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Feedback Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {item.isAnonymous
                          ? 'Anonymous'
                          : `${item.fromUserId?.firstName} ${item.fromUserId?.lastName}`}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-medium">
                        {item.toUserId?.firstName} {item.toUserId?.lastName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.type === 'private' ? (
                        <EyeOff className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-xs text-gray-500">{item.type}</span>
                    </div>

                    {item.sentimentScore && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(item.sentimentScore)}`}
                      >
                        {item.sentimentScore}
                      </span>
                    )}
                  </div>

                  {/* Feedback Content */}
                  <div className="mb-3">
                    <p className="text-gray-900 line-clamp-3">{item.content}</p>
                    {item.rating && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Rating:</span>
                        <span className="font-medium">{item.rating}/10</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                    <span>Category: {item.category}</span>
                    {item.isHidden && (
                      <span className="text-red-600 font-medium">
                        Hidden: {item.moderationReason}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFeedback(item);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {!item.isHidden ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const reason = prompt('Reason for hiding this feedback:');
                        if (reason) {
                          handleHideFeedback(item._id, reason);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreFeedback(item._id)}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {feedback.length === 0 && (
          <div className="px-6 py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
            <p className="text-gray-500">
              {filter === 'all'
                ? 'No feedback has been submitted yet'
                : `No ${filter} feedback found`}
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Feedback Details</h2>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedFeedback(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <p className="text-gray-900">
                    {selectedFeedback.isAnonymous
                      ? 'Anonymous User'
                      : `${selectedFeedback.fromUserId?.firstName} ${selectedFeedback.fromUserId?.lastName} (${selectedFeedback.fromUserId?.email})`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <p className="text-gray-900">
                    {selectedFeedback.toUserId?.firstName} {selectedFeedback.toUserId?.lastName} (
                    {selectedFeedback.toUserId?.email})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedFeedback.content}</p>
                  </div>
                </div>

                {selectedFeedback.rating && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <p className="text-gray-900">{selectedFeedback.rating}/10</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type & Category
                  </label>
                  <p className="text-gray-900">
                    {selectedFeedback.type} • {selectedFeedback.category}
                  </p>
                </div>

                {selectedFeedback.tags && selectedFeedback.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {selectedFeedback.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <p className="text-gray-900">{formatDate(selectedFeedback.createdAt)}</p>
                </div>

                {selectedFeedback.sentimentScore && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AI Sentiment
                    </label>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(selectedFeedback.sentimentScore)}`}
                    >
                      {selectedFeedback.sentimentScore}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
