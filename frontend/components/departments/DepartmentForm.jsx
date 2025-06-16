'use client';
import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Building2, FileText, Crown } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../ui/button';

import toast from 'react-hot-toast';

export default function DepartmentForm({ open, onClose, initial }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const isEdit = Boolean(initial);

  useEffect(() => {
    if (initial) {
      setFormData({
        name: initial.name || '',
        description: initial.description || '',
        managerId: initial.managerId || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        managerId: ''
      });
    }
    setErrors({});
  }, [initial, open]);

  useEffect(() => {
    if (open) {
      fetchManagers();
    }
  }, [open]);

  const fetchManagers = async () => {
    try {
      setLoadingManagers(true);
      const response = await api.get('/users?role=manager');
      setManagers(response.data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Failed to load managers');
    } finally {
      setLoadingManagers(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Department name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Department name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

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
        managerId: formData.managerId || null
      };

      if (isEdit) {
        await api.patch(`/departments/${initial._id}`, payload);
      } else {
        await api.post('/departments', payload);
      }

      onClose(true); // success - trigger refresh
    } catch (err) {
      console.error('Failed to save department', err);
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEdit ? 'Edit Department' : 'Add New Department'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEdit
                  ? 'Update department information'
                  : 'Create a new department for your organization'}
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
          {/* Department Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Engineering, Marketing, Sales"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the department's role and responsibilities..."
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
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

          {/* Department Manager */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Crown className="inline h-4 w-4 mr-1" />
              Department Manager (Optional)
            </label>
            <select
              value={formData.managerId}
              onChange={(e) => handleChange('managerId', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.managerId
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              disabled={loading || loadingManagers}
            >
              <option value="">No manager assigned</option>
              {managers.map((manager) => (
                <option key={manager._id} value={manager._id}>
                  {manager.firstName} {manager.lastName} - {manager.email}
                </option>
              ))}
            </select>
            {loadingManagers && (
              <p className="mt-1 text-sm text-gray-500 flex items-center">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Loading managers...
              </p>
            )}
            {errors.managerId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <span className="w-4 h-4 mr-1">⚠</span>
                {errors.managerId}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Select a manager to oversee this department
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[100px]">
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? 'Update' : 'Create'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
