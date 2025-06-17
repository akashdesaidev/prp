import { useState, useEffect, useCallback, useMemo, memo } from 'react';
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

function ReviewCycleDetailsModal({ isOpen, onClose, cycle, onUpdate, onDelete, onEdit, canEdit }) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [participants, setParticipants] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Stable fetch functions
  const fetchCycleStats = useCallback(async () => {
    if (!cycle?._id) return;

    try {
      setLoading(true);
      const response = await api.get(`/review-cycles/${cycle._id}/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching cycle stats:', error);
    } finally {
      setLoading(false);
    }
  }, [cycle?._id]);

  const fetchParticipants = useCallback(async () => {
    if (!cycle?._id) return;

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
  }, [cycle?._id, cycle?.participants]);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setAvailableUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  }, []);

  // Effect to fetch data when modal opens and cycle changes
  useEffect(() => {
    if (isOpen && cycle) {
      fetchCycleStats();
      fetchParticipants();
      fetchAvailableUsers();
    }
  }, [isOpen, cycle, fetchCycleStats, fetchParticipants, fetchAvailableUsers]);

  // Stable handlers
  const handleAddParticipants = useCallback(async () => {
    try {
      await api.post(`/review-cycles/${cycle._id}/participants`, {
        userIds: selectedUsers
      });

      toast.success('Participants added successfully');
      setSelectedUsers([]);
      setShowAddParticipant(false);
      fetchParticipants();
    } catch (error) {
      toast.error('Failed to add participants');
    }
  }, [cycle?._id, selectedUsers, fetchParticipants]);

  const handleRemoveParticipant = useCallback(
    async (userId) => {
      try {
        await api.delete(`/review-cycles/${cycle._id}/participants/${userId}`);
        toast.success('Participant removed successfully');
        fetchParticipants();
      } catch (error) {
        toast.error('Failed to remove participant');
      }
    },
    [cycle?._id, fetchParticipants]
  );

  const handleClone = useCallback(async () => {
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
  }, [cycle, onClose]);

  const handleDelete = useCallback(async () => {
    if (window.confirm('Are you sure you want to delete this review cycle?')) {
      try {
        await onDelete(cycle._id);
        onClose();
      } catch (error) {
        // Error handling is done in the parent component
      }
    }
  }, [onDelete, cycle?._id, onClose]);

  // Memoized computed values
  const statusBadgeConfig = useMemo(
    () => ({
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      'grace-period': 'bg-yellow-100 text-yellow-800',
      closed: 'bg-green-100 text-green-800'
    }),
    []
  );

  const getStatusBadge = useCallback(
    (status) => {
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeConfig[status] || statusBadgeConfig.draft}`}
        >
          {status}
        </span>
      );
    },
    [statusBadgeConfig]
  );

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const getParticipantStatusColor = useCallback((status) => {
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
  }, []);

  // Memoized filtered users
  const filteredAvailableUsers = useMemo(() => {
    return availableUsers.filter(
      (user) => !participants.some((p) => (p.userId._id || p.userId) === user._id)
    );
  }, [availableUsers, participants]);

  // Memoized stats calculations
  const calculatedStats = useMemo(() => {
    if (!participants.length) {
      return {
        totalParticipants: 0,
        submittedCount: 0,
        pendingCount: 0,
        completionRate: 0
      };
    }

    const submittedCount = participants.filter((p) => p.status === 'submitted').length;
    const pendingCount = participants.filter((p) => p.status === 'pending').length;
    const completionRate = Math.round((submittedCount / participants.length) * 100);

    return {
      totalParticipants: participants.length,
      submittedCount,
      pendingCount,
      completionRate
    };
  }, [participants]);

  if (!isOpen || !cycle) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{cycle.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(cycle.status)}
              <span className="text-sm text-gray-500">
                {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button variant="outline" size="sm" onClick={() => onEdit(cycle)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleClone}>
                  <Copy className="h-4 w-4 mr-1" />
                  Clone
                </Button>
                {cycle.status === 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {['overview', 'participants', 'questions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab cycle={cycle} stats={calculatedStats} formatDate={formatDate} />
            )}

            {activeTab === 'participants' && (
              <ParticipantsTab
                participants={participants}
                availableUsers={filteredAvailableUsers}
                showAddParticipant={showAddParticipant}
                selectedUsers={selectedUsers}
                canEdit={canEdit}
                getParticipantStatusColor={getParticipantStatusColor}
                onShowAddParticipant={setShowAddParticipant}
                onSelectedUsersChange={setSelectedUsers}
                onAddParticipants={handleAddParticipants}
                onRemoveParticipant={handleRemoveParticipant}
              />
            )}

            {activeTab === 'questions' && <QuestionsTab cycle={cycle} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoized sub-components to prevent unnecessary re-renders
const OverviewTab = memo(function OverviewTab({ cycle, stats, formatDate }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cycle Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <div className="mt-1 text-gray-900 capitalize">{cycle.type}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Grace Period</label>
            <div className="mt-1 text-gray-900">{cycle.gracePeriodDays} days</div>
          </div>
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
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">{stats.totalParticipants}</div>
                <div className="text-sm text-blue-600">Participants</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">{stats.completionRate}%</div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-900">{stats.pendingCount}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-purple-900">
                  {formatDate(cycle.endDate)}
                </div>
                <div className="text-sm text-purple-600">End Date</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const ParticipantsTab = memo(function ParticipantsTab({
  participants,
  availableUsers,
  showAddParticipant,
  selectedUsers,
  canEdit,
  getParticipantStatusColor,
  onShowAddParticipant,
  onSelectedUsersChange,
  onAddParticipants,
  onRemoveParticipant
}) {
  return (
    <div className="space-y-6">
      {/* Add Participants Section */}
      {canEdit && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Participants</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShowAddParticipant(!showAddParticipant)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Participants
          </Button>
        </div>
      )}

      {showAddParticipant && canEdit && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Add New Participants</h4>
          <div className="space-y-3">
            <select
              multiple
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
              value={selectedUsers}
              onChange={(e) =>
                onSelectedUsersChange(
                  Array.from(e.target.selectedOptions, (option) => option.value)
                )
              }
            >
              {availableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button size="sm" onClick={onAddParticipants} disabled={selectedUsers.length === 0}>
                Add Selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => onShowAddParticipant(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="space-y-3">
        {participants.map((participant) => (
          <div
            key={participant._id || participant.userId}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-gray-900">
                  {participant.userId?.firstName || participant.firstName || 'Unknown'}{' '}
                  {participant.userId?.lastName || participant.lastName || 'User'}
                </p>
                <p className="text-sm text-gray-500">
                  {participant.userId?.email || participant.email || 'No email'}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getParticipantStatusColor(
                  participant.status
                )}`}
              >
                {participant.status || 'pending'}
              </span>
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveParticipant(participant.userId?._id || participant.userId)}
                className="text-red-600 hover:text-red-700"
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const QuestionsTab = memo(function QuestionsTab({ cycle }) {
  return (
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
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No questions configured for this review cycle.</p>
        </div>
      )}
    </div>
  );
});

export default memo(ReviewCycleDetailsModal);
