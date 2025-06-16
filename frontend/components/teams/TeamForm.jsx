'use client';
import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Users, Building2, Crown, User } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

export default function TeamForm({ open, onClose, initial }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    lead: ''
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      loadSelectData();
    }
  }, [open]);

  useEffect(() => {
    if (initial) {
      setFormData({
        name: initial.name || '',
        description: initial.description || '',
        department: initial.department?._id || '',
        lead: initial.lead?._id || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        department: '',
        lead: ''
      });
    }
    setErrors({});
  }, [initial, open]);

  // Filter users based on selected department
  useEffect(() => {
    if (formData.department && users.length > 0) {
      const deptUsers = users.filter(
        (user) =>
          user.department?._id === formData.department ||
          user.roles?.includes('manager') ||
          user.roles?.includes('admin')
      );
      setFilteredUsers(deptUsers);
    } else {
      setFilteredUsers(users);
    }
  }, [formData.department, users]);

  const loadSelectData = async () => {
    setDataLoading(true);
    try {
      const [deptRes, userRes] = await Promise.all([api.get('/departments'), api.get('/users')]);
      setDepartments(deptRes.data);
      setUsers(userRes.data);
    } catch (e) {
      console.error('Failed to load select data', e);
      toast.error('Failed to load form data');
    } finally {
      setDataLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Team name must be less than 50 characters';
    }

    if (!formData.department) {
      newErrors.department = 'Department selection is required';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Reset lead if department changes
      if (field === 'department' && prev.department !== value) {
        newData.lead = '';
      }

      return newData;
    });

    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        department: formData.department,
        lead: formData.lead || null
      };

      if (isEdit) {
        await api.patch(`/teams/${initial._id}`, payload);
      } else {
        await api.post('/teams', payload);
      }

      onClose(true); // success - trigger refresh
    } catch (err) {
      console.error('Failed to save team', err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing during save
    onClose(false);
  };

  if (!open) return null;

  const selectedDepartment = departments.find((d) => d._id === formData.department);
  const selectedLead = filteredUsers.find((u) => u._id === formData.lead);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEdit ? 'Edit Team' : 'Add New Team'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEdit ? 'Update team information' : 'Create a new team within a department'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {dataLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Loading form data...</p>
            </div>
          )}

          {!dataLoading && (
            <>
              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Frontend Team, DevOps Team, Marketing Squad"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                      errors.name
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    disabled={loading}
                    maxLength={50}
                  />
                  <div className="absolute right-3 top-3 text-xs text-gray-400">
                    {formData.name.length}/50
                  </div>
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="w-4 h-4 mr-1">⚠</span>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Department and Team Lead Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                        errors.department
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      disabled={loading}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠</span>
                      {errors.department}
                    </p>
                  )}
                  {selectedDepartment && (
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedDepartment.description || 'No description available'}
                    </p>
                  )}
                </div>

                {/* Team Lead */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Lead (Optional)
                  </label>
                  <div className="relative">
                    <Crown className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.lead}
                      onChange={(e) => handleChange('lead', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors hover:border-gray-400"
                      disabled={loading || !formData.department}
                    >
                      <option value="">No lead assigned</option>
                      {filteredUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} - {user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!formData.department && (
                    <p className="mt-1 text-xs text-gray-500">
                      Select a department first to choose a team lead
                    </p>
                  )}
                  {selectedLead && (
                    <p className="mt-1 text-xs text-gray-500">
                      Role: {selectedLead.roles?.join(', ') || 'Employee'}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Description (Optional)
                </label>
                <div className="relative">
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe the team's purpose, responsibilities, and goals..."
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none ${
                      errors.description
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    disabled={loading}
                    maxLength={500}
                  />
                  <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                    {formData.description.length}/500
                  </div>
                </div>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="w-4 h-4 mr-1">⚠</span>
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Team Summary Preview */}
              {formData.name && formData.department && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Team Preview
                  </h4>
                  <div className="text-sm text-purple-700 space-y-1">
                    <p>
                      <strong>Name:</strong> {formData.name}
                    </p>
                    <p>
                      <strong>Department:</strong> {selectedDepartment?.name}
                    </p>
                    <p>
                      <strong>Lead:</strong>{' '}
                      {selectedLead
                        ? `${selectedLead.firstName} ${selectedLead.lastName}`
                        : 'No lead assigned'}
                    </p>
                    {formData.description && (
                      <p>
                        <strong>Description:</strong> {formData.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || dataLoading} className="min-w-[100px]">
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? 'Update Team' : 'Create Team'}
                </div>
              )}
            </Button>
          </div>
        </form>

        {/* Preview (for editing) */}
        {isEdit && initial && (
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Team Info</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Name:</strong> {initial.name}
                </p>
                <p>
                  <strong>Department:</strong> {initial.department?.name}
                </p>
                <p>
                  <strong>Lead:</strong>{' '}
                  {initial.lead ? `${initial.lead.firstName} ${initial.lead.lastName}` : 'No lead'}
                </p>
                {initial.description && (
                  <p>
                    <strong>Description:</strong> {initial.description}
                  </p>
                )}
                <p>
                  <strong>Created:</strong> {new Date(initial.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
