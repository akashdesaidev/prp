'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function TeamMemberManager({ team, onTeamUpdate }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Check if user can manage team members
  const canManageMembers = user && ['admin', 'hr', 'manager'].includes(user.role);

  useEffect(() => {
    if (team && team.members) {
      setMembers(team.members);
    }
  }, [team]);

  useEffect(() => {
    if (showAddModal) {
      fetchAvailableUsers();
    }
  }, [showAddModal]);

  const fetchAvailableUsers = async () => {
    try {
      const { data } = await api.get('/users');
      const memberIds = members.map((m) => m._id);
      const available = data.filter((u) => !memberIds.includes(u._id) && u.isActive);
      setAvailableUsers(available);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/teams/${team._id}/members`, {
        userId: selectedUserId
      });

      setMembers(data.members || []);

      if (onTeamUpdate) {
        onTeamUpdate(data);
      }

      setShowAddModal(false);
      setSelectedUserId('');
    } catch (err) {
      console.error('Failed to add member:', err);
      alert('Failed to add team member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.delete(`/teams/${team._id}/members/${userId}`);

      setMembers(data.members || []);

      if (onTeamUpdate) {
        onTeamUpdate(data);
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('Failed to remove team member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!team) {
    return <div>Loading team data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Team Members ({members.length})</h2>
          {canManageMembers && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              disabled={loading}
            >
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="p-6">
        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No team members yet.</p>
            {canManageMembers && <p className="text-sm mt-2">Click "Add Member" to get started.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  {member.role && <p className="text-xs text-gray-400 capitalize">{member.role}</p>}
                </div>
                {canManageMembers && (
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-sm font-medium"
                    disabled={loading}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a user...</option>
                {availableUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUserId('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={!selectedUserId || loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
