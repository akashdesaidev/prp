'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  X,
  Check,
  Clock,
  AlertCircle,
  User,
  Building,
  Mail
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function PeerReviewNomination({
  reviewCycleId,
  revieweeId,
  maxNominations = 5,
  onNominationsChange
}) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchExistingNominations();
  }, [reviewCycleId]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, nominations]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: {
          active: true,
          exclude: revieweeId // Don't include the reviewee
        }
      });
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingNominations = async () => {
    try {
      const response = await api.get(
        `/review-submissions/nominations?reviewCycleId=${reviewCycleId}`
      );
      setNominations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching nominations:', error);
      // Don't show error toast as this might be expected for new cycles
    }
  };

  const filterUsers = () => {
    let filtered = users.filter((user) => {
      // Exclude already nominated users
      const isNominated = nominations.some((nom) => nom.userId === user._id);
      if (isNominated) return false;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.department?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      return true;
    });

    setFilteredUsers(filtered);
  };

  const handleNominate = (user) => {
    if (nominations.length >= maxNominations) {
      toast.error(`Maximum ${maxNominations} nominations allowed`);
      return;
    }

    const newNomination = {
      userId: user._id,
      user: user,
      status: 'pending',
      nominatedAt: new Date().toISOString(),
      reason: ''
    };

    const updatedNominations = [...nominations, newNomination];
    setNominations(updatedNominations);

    if (onNominationsChange) {
      onNominationsChange(updatedNominations);
    }

    toast.success(`${user.firstName} ${user.lastName} nominated for peer review`);
  };

  const handleRemoveNomination = (userId) => {
    const updatedNominations = nominations.filter((nom) => nom.userId !== userId);
    setNominations(updatedNominations);

    if (onNominationsChange) {
      onNominationsChange(updatedNominations);
    }

    toast.success('Nomination removed');
  };

  const handleReasonChange = (userId, reason) => {
    const updatedNominations = nominations.map((nom) =>
      nom.userId === userId ? { ...nom, reason } : nom
    );
    setNominations(updatedNominations);

    if (onNominationsChange) {
      onNominationsChange(updatedNominations);
    }
  };

  const handleSubmitNominations = async () => {
    try {
      setSubmitting(true);

      const payload = {
        reviewCycleId,
        peerUserIds: nominations.map((nom) => nom.userId)
      };

      await api.post('/review-submissions/nominate-peers', payload);
      toast.success('Peer nominations submitted successfully');

      // Update status to submitted
      const updatedNominations = nominations.map((nom) => ({
        ...nom,
        status: 'submitted'
      }));
      setNominations(updatedNominations);

      if (onNominationsChange) {
        onNominationsChange(updatedNominations);
      }
    } catch (error) {
      console.error('Error submitting nominations:', error);
      toast.error(error.response?.data?.error || 'Failed to submit nominations');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'submitted':
        return <Clock className="h-3 w-3" />;
      case 'approved':
        return <Check className="h-3 w-3" />;
      case 'rejected':
        return <X className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const canSubmit = nominations.length > 0 && nominations.every((nom) => nom.reason?.trim());
  const hasSubmitted = nominations.some((nom) => nom.status === 'submitted');

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Peer Review Nominations
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Nominate colleagues who can provide valuable feedback on your performance
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {nominations.length} / {maxNominations} nominations
        </div>
      </div>

      {/* Current Nominations */}
      {nominations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Your Nominations</h4>
          <div className="space-y-3">
            {nominations.map((nomination) => (
              <div
                key={nomination.userId}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-gray-900">
                      {nomination.user.firstName} {nomination.user.lastName}
                    </h5>
                    <Badge className={`text-xs ${getStatusColor(nomination.status)}`}>
                      {getStatusIcon(nomination.status)}
                      <span className="ml-1 capitalize">{nomination.status}</span>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {nomination.user.email}
                    </span>
                    {nomination.user.department && (
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {nomination.user.department}
                      </span>
                    )}
                  </div>

                  {nomination.status === 'pending' && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Reason for nomination (required)
                      </label>
                      <textarea
                        value={nomination.reason}
                        onChange={(e) => handleReasonChange(nomination.userId, e.target.value)}
                        placeholder="Why would this person provide valuable feedback?"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 resize-none"
                        rows={2}
                      />
                    </div>
                  )}

                  {nomination.reason && nomination.status !== 'pending' && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">
                        <strong>Reason:</strong> {nomination.reason}
                      </p>
                    </div>
                  )}
                </div>

                {nomination.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveNomination(nomination.userId)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Submit Button */}
          {!hasSubmitted && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                onClick={handleSubmitNominations}
                disabled={!canSubmit || submitting}
                className="w-full"
              >
                {submitting ? 'Submitting...' : 'Submit Nominations'}
              </Button>
              {!canSubmit && nominations.length > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Please provide reasons for all nominations before submitting
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Nominations */}
      {nominations.length < maxNominations && !hasSubmitted && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Add Nominations</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUserSelector(!showUserSelector)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {showUserSelector ? 'Hide' : 'Add Peer'}
            </Button>
          </div>

          {showUserSelector && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* User List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {searchTerm ? 'No users found matching your search' : 'No users available'}
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.department && (
                            <p className="text-xs text-gray-500">{user.department}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleNominate(user)}
                        disabled={nominations.length >= maxNominations}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Nominate
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {nominations.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No nominations yet</h3>
          <p className="text-gray-600 mb-4">
            Start by nominating colleagues who can provide valuable feedback
          </p>
          <Button onClick={() => setShowUserSelector(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Nomination
          </Button>
        </div>
      )}
    </div>
  );
}
