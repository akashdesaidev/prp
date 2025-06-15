'use client';
import { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ReviewCycleManagement({ cycleId, onUpdate }) {
  const [cycle, setCycle] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (cycleId) {
      fetchCycleDetails();
      fetchParticipants();
      fetchAvailableUsers();
    }
  }, [cycleId]);

  const fetchCycleDetails = async () => {
    try {
      const response = await api.get(`/review-cycles/${cycleId}`);
      setCycle(response.data);
    } catch (error) {
      console.error('Error fetching cycle details:', error);
      toast.error('Failed to load cycle details');
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await api.get(`/review-cycles/${cycleId}/participants`);
      setParticipants(response.data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users');
      setAvailableUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddParticipants = async () => {
    try {
      await api.post(`/review-cycles/${cycleId}/participants`, {
        userIds: selectedUsers
      });

      toast.success('Participants added successfully');
      setSelectedUsers([]);
      setShowAddParticipant(false);
      fetchParticipants();
      onUpdate && onUpdate();
    } catch (error) {
      toast.error('Failed to add participants');
    }
  };

  const handleRemoveParticipant = async (userId) => {
    try {
      await api.delete(`/review-cycles/${cycleId}/participants/${userId}`);
      toast.success('Participant removed successfully');
      fetchParticipants();
      onUpdate && onUpdate();
    } catch (error) {
      toast.error('Failed to remove participant');
    }
  };

  const handleSendReminders = async () => {
    try {
      await api.post(`/review-cycles/${cycleId}/send-reminders`);
      toast.success('Reminders sent successfully');
    } catch (error) {
      toast.error('Failed to send reminders');
    }
  };

  const handleUpdateCycleStatus = async (status) => {
    try {
      await api.put(`/review-cycles/${cycleId}`, { status });
      toast.success('Cycle status updated successfully');
      fetchCycleDetails();
      onUpdate && onUpdate();
    } catch (error) {
      toast.error('Failed to update cycle status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'grace-period':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const calculateCompletionRate = () => {
    if (participants.length === 0) return 0;
    const completed = participants.filter((p) => p.status === 'submitted').length;
    return Math.round((completed / participants.length) * 100);
  };

  const getDaysRemaining = () => {
    if (!cycle?.endDate) return null;
    const endDate = new Date(cycle.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cycle Not Found</h3>
        <p className="text-gray-600">The requested review cycle could not be found.</p>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();
  const completionRate = calculateCompletionRate();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{cycle.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}
              >
                {cycle.status}
              </span>
              <span className="text-sm text-gray-500">
                {cycle.type} • {participants.length} participants
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cycle.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendReminders}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send Reminders
              </Button>
            )}

            {cycle.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => handleUpdateCycleStatus('active')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Activate Cycle
              </Button>
            )}

            {cycle.status === 'active' && daysRemaining <= 0 && (
              <Button
                size="sm"
                onClick={() => handleUpdateCycleStatus('closed')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Close Cycle
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">{participants.length}</div>
                <div className="text-sm text-blue-600">Participants</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">{completionRate}%</div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-900">
                  {daysRemaining !== null ? (daysRemaining > 0 ? daysRemaining : 0) : '-'}
                </div>
                <div className="text-sm text-yellow-600">Days Left</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-purple-900">
                  {new Date(cycle.endDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-purple-600">End Date</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'participants', label: 'Participants', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === id
                  ? 'border-primary-500 text-primary-600'
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
            {/* Progress Overview */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Completion Progress</h3>
              <div className="bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{participants.filter((p) => p.status === 'submitted').length} completed</span>
                <span>{participants.filter((p) => p.status === 'pending').length} pending</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {participants
                  .filter((p) => p.submittedAt)
                  .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                  .slice(0, 5)
                  .map((participant, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {participant.user?.firstName} {participant.user?.lastName} completed their
                          review
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(participant.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Participants</h3>
              <Button
                onClick={() => setShowAddParticipant(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Participants
              </Button>
            </div>

            {/* Add Participants Modal */}
            {showAddParticipant && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Add New Participants</h4>
                <div className="space-y-3">
                  <div className="max-h-48 overflow-y-auto space-y-2">
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
                      disabled={selectedUsers.length === 0}
                      size="sm"
                    >
                      Add Selected ({selectedUsers.length})
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
              </div>
            )}

            {/* Participants List */}
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {participant.user?.firstName?.[0]}
                        {participant.user?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {participant.user?.firstName} {participant.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{participant.user?.email}</p>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveParticipant(participant.userId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cycle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{cycle.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-sm text-gray-900">{cycle.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(cycle.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(cycle.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grace Period
                  </label>
                  <p className="text-sm text-gray-900">{cycle.gracePeriodDays} days</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}
                  >
                    {cycle.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-red-900">Delete Review Cycle</h4>
                    <p className="text-sm text-red-700">
                      This action cannot be undone. All review data will be permanently deleted.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
