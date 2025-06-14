'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'employee', label: 'Employee', description: 'Basic user access' },
  { value: 'manager', label: 'Manager', description: 'Team management access' },
  { value: 'hr', label: 'HR', description: 'HR management access' },
  { value: 'admin', label: 'Admin', description: 'Full system access' }
];

export default function UserRoleManager({ user, onRoleUpdate, currentUserRole }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);

  const handleRoleUpdate = async () => {
    if (selectedRole === user.role) {
      toast.error('Please select a different role');
      return;
    }

    try {
      setIsUpdating(true);
      const response = await api.patch(`/users/${user._id}/role`, {
        role: selectedRole
      });

      if (response.data.user) {
        onRoleUpdate(response.data.user);
        toast.success('User role updated successfully');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.error || 'Failed to update role');
      setSelectedRole(user.role); // Reset to original role
    } finally {
      setIsUpdating(false);
    }
  };

  const canAssignRole = (role) => {
    // Only admins can assign admin role
    if (role === 'admin' && currentUserRole !== 'admin') {
      return false;
    }
    return true;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'hr':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Role Management</h3>
          <p className="text-sm text-gray-500">
            Manage {user.firstName} {user.lastName}'s role and permissions
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}
        >
          Current: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLES.map((role) => (
          <div
            key={role.value}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedRole === role.value
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            } ${!canAssignRole(role.value) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (canAssignRole(role.value)) {
                setSelectedRole(role.value);
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={selectedRole === role.value}
                onChange={() => {
                  if (canAssignRole(role.value)) {
                    setSelectedRole(role.value);
                  }
                }}
                disabled={!canAssignRole(role.value)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{role.label}</h4>
                  {!canAssignRole(role.value) && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Admin Only
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{role.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={() => setSelectedRole(user.role)} disabled={isUpdating}>
          Reset
        </Button>
        <Button onClick={handleRoleUpdate} disabled={isUpdating || selectedRole === user.role}>
          {isUpdating ? 'Updating...' : 'Update Role'}
        </Button>
      </div>
    </div>
  );
}
