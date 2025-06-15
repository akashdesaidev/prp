'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import GiveFeedbackModal from '../../components/feedback/GiveFeedbackModal';
import FeedbackModerationPanel from '../../components/feedback/FeedbackModerationPanel';
import FeedbackAnalyticsDashboard from '../../components/feedback/FeedbackAnalyticsDashboard';
import AnonymousFeedbackHandler from '../../components/feedback/AnonymousFeedbackHandler';
import SentimentVisualization from '../../components/feedback/SentimentVisualization';
import { Button } from '../../components/ui/button';
import {
  Plus,
  MessageSquare,
  Star,
  Filter,
  Shield,
  BarChart3,
  EyeOff,
  Activity
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function FeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [showGiveFeedbackModal, setShowGiveFeedbackModal] = useState(false);

  // Check if user can moderate (admin or hr)
  const canModerate = ['admin', 'hr'].includes(user?.role);

  useEffect(() => {
    fetchFeedback();
  }, [activeTab]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'received' ? '/feedback/received' : '/feedback/given';
      const response = await api.get(endpoint);
      setFeedback(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch feedback');
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const tabs = [
    { id: 'received', label: 'Received', icon: MessageSquare },
    { id: 'given', label: 'Given', icon: Star },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'sentiment', label: 'Sentiment', icon: Activity },
    { id: 'anonymous', label: 'Anonymous', icon: EyeOff },
    ...(canModerate ? [{ id: 'moderate', label: 'Moderate', icon: Shield }] : [])
  ];

  if (loading && activeTab !== 'moderate') {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading feedback...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
            <p className="text-gray-600">Give and receive continuous feedback</p>
          </div>

          {activeTab !== 'moderate' && (
            <Button onClick={() => setShowGiveFeedbackModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Give Feedback
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'moderate' ? (
          <FeedbackModerationPanel userRole={user?.role} />
        ) : activeTab === 'analytics' ? (
          <FeedbackAnalyticsDashboard />
        ) : activeTab === 'sentiment' ? (
          <SentimentVisualization />
        ) : activeTab === 'anonymous' ? (
          <AnonymousFeedbackHandler mode={canModerate ? 'admin' : 'viewer'} />
        ) : (
          <div className="space-y-4">
            {/* Feedback List */}
            <div className="bg-white rounded-lg border">
              {feedback.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No feedback {activeTab}
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === 'received'
                      ? "You haven't received any feedback yet"
                      : "You haven't given any feedback yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {feedback.map((item) => (
                    <div key={item._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Feedback Header */}
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {activeTab === 'received'
                                  ? item.isAnonymous
                                    ? 'Anonymous'
                                    : `${item.fromUserId?.firstName} ${item.fromUserId?.lastName}`
                                  : `To: ${item.toUserId?.firstName} ${item.toUserId?.lastName}`}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.type === 'private'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {item.type}
                              </span>

                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                {item.category}
                              </span>
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
                            <p className="text-gray-900">{item.content}</p>
                            {item.rating && (
                              <div className="mt-2 flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Rating:</span>
                                <div className="flex items-center">
                                  {[...Array(10)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < item.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-2 text-sm font-medium">{item.rating}/10</span>
                                </div>
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

                          {/* Date */}
                          <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Give Feedback Modal */}
        <GiveFeedbackModal
          isOpen={showGiveFeedbackModal}
          onClose={() => setShowGiveFeedbackModal(false)}
          onSubmit={() => {
            if (activeTab === 'given') {
              fetchFeedback();
            }
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
