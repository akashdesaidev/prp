'use client';

import { useState, useEffect } from 'react';
import {
  EyeOff,
  Shield,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Unlock,
  Users,
  MessageSquare,
  Star,
  Filter,
  MoreHorizontal,
  Flag,
  Settings,
  Info,
  Key,
  Trash2,
  Archive
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AnonymousFeedbackHandler({
  mode = 'viewer', // 'viewer', 'admin', 'settings'
  userId = null,
  onFeedbackUpdate,
  showSettings = false
}) {
  const [anonymousSettings, setAnonymousSettings] = useState({
    enabled: true,
    requireMinimumReviewers: true,
    minimumReviewerCount: 3,
    allowAnonymousToAnonymous: false,
    adminCanViewIdentity: true,
    autoApproval: false,
    notifyRecipient: true
  });

  const [anonymousFeedback, setAnonymousFeedback] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'flagged'
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [identityAccess, setIdentityAccess] = useState({});

  const filters = [
    { value: 'all', label: 'All Feedback', icon: MessageSquare },
    { value: 'pending', label: 'Pending Review', icon: Clock },
    { value: 'approved', label: 'Approved', icon: CheckCircle },
    { value: 'flagged', label: 'Flagged', icon: Flag }
  ];

  useEffect(() => {
    fetchAnonymousSettings();
    fetchAnonymousFeedback();
  }, [userId, filter]);

  const fetchAnonymousSettings = async () => {
    try {
      const response = await api.get('/feedback/anonymous/settings');
      setAnonymousSettings(response.data.settings || anonymousSettings);
    } catch (error) {
      console.error('Error fetching anonymous settings:', error);
    }
  };

  const fetchAnonymousFeedback = async () => {
    try {
      setLoading(true);
      const params = {
        anonymous: true,
        status: filter !== 'all' ? filter : undefined,
        userId
      };

      const response = await api.get('/feedback/anonymous', { params });
      setAnonymousFeedback(response.data.feedback || []);
      setPendingReviews(response.data.pendingReviews || []);
    } catch (error) {
      console.error('Error fetching anonymous feedback:', error);
      // Mock data for development
      setAnonymousFeedback(generateMockAnonymousFeedback());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnonymousFeedback = () => {
    return [
      {
        _id: '1',
        content:
          'Great job on the project presentation. Your technical explanations were clear and well-structured.',
        toUser: { firstName: 'Sarah', lastName: 'Johnson' },
        fromUser: null, // Anonymous
        isAnonymous: true,
        status: 'approved',
        rating: 5,
        category: 'skills',
        tags: ['Presentation', 'Technical Skills'],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        reviewerCount: 3,
        flagged: false,
        adminNotes: '',
        identityRevealed: false
      },
      {
        _id: '2',
        content:
          "I think there could be improvement in communication during team meetings. Sometimes ideas aren't clearly expressed.",
        toUser: { firstName: 'Mike', lastName: 'Chen' },
        fromUser: null,
        isAnonymous: true,
        status: 'pending',
        rating: 3,
        category: 'communication',
        tags: ['Communication', 'Team Meetings'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        reviewerCount: 1,
        flagged: false,
        adminNotes: '',
        identityRevealed: false
      },
      {
        _id: '3',
        content: 'This feedback seems inappropriate and unprofessional.',
        toUser: { firstName: 'Emily', lastName: 'Davis' },
        fromUser: null,
        isAnonymous: true,
        status: 'flagged',
        rating: 2,
        category: 'values',
        tags: ['Professionalism'],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        reviewerCount: 2,
        flagged: true,
        adminNotes: 'Flagged for review - potentially inappropriate language',
        identityRevealed: false
      }
    ];
  };

  const updateAnonymousSettings = async (newSettings) => {
    try {
      await api.put('/feedback/anonymous/settings', { settings: newSettings });
      setAnonymousSettings(newSettings);
      toast.success('Anonymous feedback settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error('Error updating settings:', error);
    }
  };

  const approveFeedback = async (feedbackId) => {
    try {
      await api.put(`/feedback/anonymous/${feedbackId}/approve`);
      setAnonymousFeedback((prev) =>
        prev.map((feedback) =>
          feedback._id === feedbackId ? { ...feedback, status: 'approved' } : feedback
        )
      );
      toast.success('Feedback approved');
      if (onFeedbackUpdate) onFeedbackUpdate();
    } catch (error) {
      toast.error('Failed to approve feedback');
      console.error('Error approving feedback:', error);
    }
  };

  const flagFeedback = async (feedbackId, reason) => {
    try {
      await api.put(`/feedback/anonymous/${feedbackId}/flag`, { reason });
      setAnonymousFeedback((prev) =>
        prev.map((feedback) =>
          feedback._id === feedbackId ? { ...feedback, status: 'flagged', flagged: true } : feedback
        )
      );
      toast.success('Feedback flagged for review');
      if (onFeedbackUpdate) onFeedbackUpdate();
    } catch (error) {
      toast.error('Failed to flag feedback');
      console.error('Error flagging feedback:', error);
    }
  };

  const revealIdentity = async (feedbackId) => {
    try {
      const response = await api.post(`/feedback/anonymous/${feedbackId}/reveal-identity`);
      const identity = response.data.identity;

      setIdentityAccess((prev) => ({
        ...prev,
        [feedbackId]: identity
      }));

      setAnonymousFeedback((prev) =>
        prev.map((feedback) =>
          feedback._id === feedbackId ? { ...feedback, identityRevealed: true } : feedback
        )
      );

      toast.success('Identity revealed');
    } catch (error) {
      toast.error('Failed to reveal identity');
      console.error('Error revealing identity:', error);
    }
  };

  const archiveFeedback = async (feedbackId) => {
    try {
      await api.put(`/feedback/anonymous/${feedbackId}/archive`);
      setAnonymousFeedback((prev) => prev.filter((feedback) => feedback._id !== feedbackId));
      toast.success('Feedback archived');
      if (onFeedbackUpdate) onFeedbackUpdate();
    } catch (error) {
      toast.error('Failed to archive feedback');
      console.error('Error archiving feedback:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'flagged':
        return Flag;
      default:
        return MessageSquare;
    }
  };

  const FeedbackCard = ({ feedback }) => {
    const StatusIcon = getStatusIcon(feedback.status);
    const canRevealIdentity = anonymousSettings.adminCanViewIdentity && mode === 'admin';
    const identityRevealed = identityAccess[feedback._id] || feedback.identityRevealed;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <EyeOff className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Anonymous Feedback</span>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}
              >
                <StatusIcon className="w-3 h-3 inline mr-1" />
                {feedback.status}
              </span>

              {feedback.flagged && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Flagged
                </span>
              )}
            </div>
          </div>

          {mode === 'admin' && (
            <div className="flex items-center space-x-2">
              {canRevealIdentity && !identityRevealed && (
                <Button variant="outline" size="sm" onClick={() => revealIdentity(feedback._id)}>
                  <Key className="w-4 h-4 mr-1" />
                  Reveal
                </Button>
              )}

              <div className="relative">
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                {/* Dropdown menu would go here */}
              </div>
            </div>
          )}
        </div>

        {/* Recipient Info */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>
            To: {feedback.toUser.firstName} {feedback.toUser.lastName}
          </span>

          {identityRevealed && identityAccess[feedback._id] && (
            <div className="flex items-center space-x-2 ml-4 text-orange-600">
              <Unlock className="w-4 h-4" />
              <span>
                From: {identityAccess[feedback._id].firstName}{' '}
                {identityAccess[feedback._id].lastName}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-900">{feedback.content}</p>

          {feedback.rating && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm text-gray-500">Rating:</span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {feedback.tags && feedback.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {feedback.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center space-x-4">
            <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
            <span>Category: {feedback.category}</span>
            <span>{feedback.reviewerCount} reviewers</span>
          </div>

          {mode === 'admin' && feedback.status === 'pending' && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => approveFeedback(feedback._id)}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => flagFeedback(feedback._id, 'Manual review required')}
              >
                <Flag className="w-4 h-4 mr-1" />
                Flag
              </Button>
            </div>
          )}
        </div>

        {/* Admin Notes */}
        {feedback.adminNotes && mode === 'admin' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-yellow-800">Admin Notes</div>
                <div className="text-sm text-yellow-700">{feedback.adminNotes}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SettingsPanel = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">Anonymous Feedback Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Enable Anonymous Feedback */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Enable Anonymous Feedback</div>
            <div className="text-sm text-gray-500">Allow users to submit anonymous feedback</div>
          </div>
          <button
            onClick={() =>
              updateAnonymousSettings({
                ...anonymousSettings,
                enabled: !anonymousSettings.enabled
              })
            }
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              anonymousSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                anonymousSettings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Minimum Reviewers */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Require Minimum Reviewers</div>
            <div className="text-sm text-gray-500">
              Require multiple reviewers before showing anonymous feedback
            </div>
          </div>
          <button
            onClick={() =>
              updateAnonymousSettings({
                ...anonymousSettings,
                requireMinimumReviewers: !anonymousSettings.requireMinimumReviewers
              })
            }
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              anonymousSettings.requireMinimumReviewers ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                anonymousSettings.requireMinimumReviewers ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Minimum Reviewer Count */}
        {anonymousSettings.requireMinimumReviewers && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Reviewer Count
            </label>
            <select
              value={anonymousSettings.minimumReviewerCount}
              onChange={(e) =>
                updateAnonymousSettings({
                  ...anonymousSettings,
                  minimumReviewerCount: parseInt(e.target.value)
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {[2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count} reviewers
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Admin Can View Identity */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Admin Identity Access</div>
            <div className="text-sm text-gray-500">
              Allow admins to reveal anonymous feedback authors
            </div>
          </div>
          <button
            onClick={() =>
              updateAnonymousSettings({
                ...anonymousSettings,
                adminCanViewIdentity: !anonymousSettings.adminCanViewIdentity
              })
            }
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              anonymousSettings.adminCanViewIdentity ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                anonymousSettings.adminCanViewIdentity ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto Approval */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Auto Approval</div>
            <div className="text-sm text-gray-500">Automatically approve anonymous feedback</div>
          </div>
          <button
            onClick={() =>
              updateAnonymousSettings({
                ...anonymousSettings,
                autoApproval: !anonymousSettings.autoApproval
              })
            }
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              anonymousSettings.autoApproval ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                anonymousSettings.autoApproval ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const filteredFeedback = anonymousFeedback.filter((feedback) => {
    if (filter === 'all') return true;
    return feedback.status === filter;
  });

  if (showSettings) {
    return <SettingsPanel />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Anonymous Feedback</h2>
            <p className="text-gray-600">
              {mode === 'admin'
                ? 'Manage anonymous feedback submissions'
                : 'View anonymous feedback'}
            </p>
          </div>
        </div>

        {mode === 'admin' && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {pendingReviews.length} pending review{pendingReviews.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {filters.map((filterOption) => {
          const Icon = filterOption.icon;
          return (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                filter === filterOption.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{filterOption.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading anonymous feedback...</p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="text-center py-8">
            <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Anonymous Feedback</h3>
            <p className="text-gray-500">
              {filter === 'all'
                ? 'No anonymous feedback has been submitted yet'
                : `No ${filter} anonymous feedback found`}
            </p>
          </div>
        ) : (
          filteredFeedback.map((feedback) => (
            <FeedbackCard key={feedback._id} feedback={feedback} />
          ))
        )}
      </div>
    </div>
  );
}
