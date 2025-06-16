import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Copy,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ReviewCycleDetailsModal({
  isOpen,
  onClose,
  cycle,
  onUpdate,
  onDelete,
  onEdit,
  canEdit
}) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [participants, setParticipants] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cycle) {
      fetchCycleStats();
      fetchParticipants();
      fetchAvailableUsers();
    }
  }, [isOpen, cycle]);

  const fetchCycleStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/review-cycles/${cycle._id}/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching cycle stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      // Fetch the full review cycle data with populated participants
      const response = await api.get(`/review-cycles/${cycle._id}`);
      const cycleData = response.data.data || response.data;

      if (cycleData && cycleData.participants) {
        setParticipants(cycleData.participants);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      // Fallback to cycle prop data if API call fails
      if (cycle.participants) {
        setParticipants(cycle.participants);
      }
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users');
      setAvailableUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // If users endpoint fails (403 for employees), just set empty array
      setAvailableUsers([]);
    }
  };

  const handleAddParticipants = async () => {
    try {
      setLoading(true);
      await api.post(`/review-cycles/${cycle._id}/participants`, {
        userIds: selectedUsers
      });

      toast.success('Participants added successfully');
      setSelectedUsers([]);
      setShowAddParticipant(false);

      // Refresh data
      await fetchCycleStats();
      await fetchParticipants();
      // Note: Don't call onUpdate() here as it expects (id, updates) parameters
      // The parent will refresh when the modal closes
    } catch (error) {
      toast.error('Failed to add participants');
      console.error('Error adding participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (userId) => {
    try {
      await api.delete(`/review-cycles/${cycle._id}/participants/${userId}`);
      toast.success('Participant removed successfully');

      // Refresh data
      await fetchCycleStats();
      await fetchParticipants(); // Also refresh participants list
      // Note: Don't call onUpdate() here as it expects (id, updates) parameters
    } catch (error) {
      console.error('Error removing participant:', error);

      // Handle specific error cases
      if (error.response?.status === 404) {
        toast.error('Participant not found or already removed');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to remove participants');
      } else {
        toast.error('Failed to remove participant');
      }

      // Refresh data anyway to sync with server state
      await fetchCycleStats();
      await fetchParticipants();
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      if (onUpdate) {
        await onUpdate(cycle._id, { status: newStatus });
        toast.success('Review cycle status updated successfully');
        onClose(); // Close modal after successful status change
      }
    } catch (error) {
      console.error('Error updating review cycle status:', error);
      toast.error('Failed to update review cycle status');
    }
  };

  const handleClone = async () => {
    try {
      const cloneData = {
        name: `${cycle.name} (Copy)`,
        type: cycle.type,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 37 days from now
        gracePeriodDays: cycle.gracePeriodDays,
        reviewTypes: cycle.reviewTypes,
        questions: cycle.questions || []
      };

      await api.post('/review-cycles', cloneData);
      toast.success('Review cycle cloned successfully');
      onClose();
      // Note: Don't call onUpdate() here as it expects (id, updates) parameters
      // The parent will refresh when the modal closes
    } catch (error) {
      toast.error('Failed to clone review cycle');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this review cycle?')) {
      try {
        await onDelete(cycle._id);
        onClose();
      } catch (error) {
        // Error handling is done in the parent component
      }
    }
  };

  if (!isOpen || !cycle) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      'grace-period': 'bg-yellow-100 text-yellow-800',
      closed: 'bg-green-100 text-green-800'
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig.draft}`}
      >
        {status}
      </span>
    );
  };

  const getParticipantStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'not-submitted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-semibold text-gray-900">{cycle.name}</h3>
            {getStatusBadge(cycle.status)}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Calendar },
              { id: 'participants', label: 'Participants', icon: Users },
              { id: 'questions', label: 'Questions', icon: CheckCircle }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cycle Type</label>
                    <div className="mt-1 capitalize text-gray-900">
                      {cycle.type.replace('-', ' ')}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date Range</label>
                    <div className="mt-1 text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Grace Period</label>
                    <div className="mt-1 text-gray-900">{cycle.gracePeriodDays} days</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <div className="mt-1 text-gray-900">{formatDate(cycle.createdAt)}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Review Types</label>
                    <div className="mt-1 space-y-1">
                      {Object.entries(cycle.reviewTypes || {}).map(([type, enabled]) => (
                        <div key={type} className="flex items-center">
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                          />
                          <span
                            className={`text-sm capitalize ${enabled ? 'text-gray-900' : 'text-gray-500'}`}
                          >
                            {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {stats && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Participation Statistics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-900">Total Participants</p>
                          <p className="text-2xl font-semibold text-blue-900">
                            {stats.participants.total}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-900">Submitted</p>
                          <p className="text-2xl font-semibold text-green-900">
                            {stats.participants.submitted}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-900">Pending</p>
                          <p className="text-2xl font-semibold text-yellow-900">
                            {stats.participants.pending}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-900">Not Submitted</p>
                          <p className="text-2xl font-semibold text-red-900">
                            {stats.participants.notSubmitted}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Completion Progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-700 mb-1">
                      <span>Completion Progress</span>
                      <span>{stats.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Participants</h3>
                {canEdit && (
                  <Button
                    onClick={() => setShowAddParticipant(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Participants
                  </Button>
                )}
              </div>

              {/* Add Participants Modal */}
              {showAddParticipant && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Add New Participants</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                    {availableUsers
                      .filter((user) => !participants.some((p) => p.userId === user._id))
                      .map((user) => (
                        <label key={user._id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user._id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter((id) => id !== user._id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">
                            {user.firstName} {user.lastName} ({user.email})
                          </span>
                        </label>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddParticipants}
                      disabled={selectedUsers.length === 0 || loading}
                      size="sm"
                    >
                      {loading ? 'Adding...' : `Add Selected (${selectedUsers.length})`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddParticipant(false);
                        setSelectedUsers([]);
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Participants List */}
              <div className="space-y-2">
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Participants</h3>
                    <p className="text-gray-600">Add participants to start the review process.</p>
                  </div>
                ) : (
                  participants.map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {participant.userId?.firstName?.[0] || 'U'}
                            {participant.userId?.lastName?.[0] || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {participant.userId?.firstName || 'Unknown'}{' '}
                            {participant.userId?.lastName || 'User'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {participant.userId?.email || 'No email'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getParticipantStatusColor(participant.status)}`}
                        >
                          {participant.status}
                        </span>
                        {participant.submittedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(participant.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveParticipant(participant.userId._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Review Questions</h3>
              {cycle.questions && cycle.questions.length > 0 ? (
                <div className="space-y-3">
                  {cycle.questions
                    .sort((a, b) => a.order - b.order)
                    .map((question, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{question.question}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                                {question.category}
                              </span>
                              {question.requiresRating && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Rating Required
                                </span>
                              )}
                              {question.isRequired && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions</h3>
                  <p className="text-gray-600">
                    This review cycle doesn't have any custom questions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onEdit(cycle)}
                  className="flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>

                <Button variant="outline" onClick={handleClone} className="flex items-center">
                  <Copy className="h-4 w-4 mr-2" />
                  Clone
                </Button>

                {cycle.status === 'draft' && (
                  <Button
                    variant="outline"
                    onClick={() => handleDelete()}
                    className="flex items-center text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {canEdit && (
              <>
                {cycle.status === 'draft' && (
                  <Button onClick={() => handleStatusChange('active')}>Activate Cycle</Button>
                )}

                {cycle.status === 'active' && (
                  <Button variant="outline" onClick={() => handleStatusChange('grace-period')}>
                    End Cycle
                  </Button>
                )}

                {cycle.status === 'grace-period' && (
                  <Button variant="outline" onClick={() => handleStatusChange('closed')}>
                    Close Cycle
                  </Button>
                )}
              </>
            )}

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
