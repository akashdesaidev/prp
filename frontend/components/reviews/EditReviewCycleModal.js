import { useState, useEffect } from 'react';
import { X, Calendar, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

export default function EditReviewCycleModal({ isOpen, onClose, onSubmit, cycle }) {
  const [formData, setFormData] = useState({
    name: '',
    endDate: '',
    gracePeriodDays: 3,
    status: 'draft',
    isEmergency: false,
    reviewTypes: {
      selfReview: true,
      peerReview: true,
      managerReview: true,
      upwardReview: false
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cycle) {
      setFormData({
        name: cycle.name || '',
        endDate: cycle.endDate ? new Date(cycle.endDate).toISOString().split('T')[0] : '',
        gracePeriodDays: cycle.gracePeriodDays || 3,
        status: cycle.status || 'draft',
        isEmergency: cycle.isEmergency || false,
        reviewTypes: cycle.reviewTypes || {
          selfReview: true,
          peerReview: true,
          managerReview: true,
          upwardReview: false
        }
      });
      setErrors({});
    }
  }, [isOpen, cycle]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleReviewTypeChange = (type, checked) => {
    setFormData((prev) => ({
      ...prev,
      reviewTypes: {
        ...prev.reviewTypes,
        [type]: checked
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Review cycle name is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.endDate && cycle) {
      const end = new Date(formData.endDate);
      const start = new Date(cycle.startDate);

      if (start >= end) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    // At least one review type must be selected
    const selectedTypes = Object.values(formData.reviewTypes).some(Boolean);
    if (!selectedTypes) {
      newErrors.reviewTypes = 'At least one review type must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(cycle._id, formData);
    } catch (error) {
      console.error('Error updating review cycle:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !cycle) return null;

  const canEditStatus = cycle.status === 'draft';
  const canEditDates = cycle.status === 'draft' || cycle.status === 'active';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Review Cycle</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
              <Calendar className="h-5 w-5" />
              <span>Basic Information</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Q1 2024 Performance Review"
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {canEditDates && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 ${
                    errors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grace Period (Days)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.gracePeriodDays}
                onChange={(e) =>
                  handleInputChange('gracePeriodDays', parseInt(e.target.value) || 0)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            {canEditStatus && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="grace-period">Grace Period</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Emergency Cycle Option */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-yellow-800">
                        Emergency Cycle Settings
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Emergency cycles bypass the 3-day advance notice requirement.
                      </p>
                      <div className="mt-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.isEmergency}
                            onChange={(e) => handleInputChange('isEmergency', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium text-yellow-800">
                            Mark as Emergency Cycle
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Review Types */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
              <Settings className="h-5 w-5" />
              <span>Review Types</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.reviewTypes.selfReview}
                  onChange={(e) => handleReviewTypeChange('selfReview', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Self Review</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.reviewTypes.peerReview}
                  onChange={(e) => handleReviewTypeChange('peerReview', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Peer Review</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.reviewTypes.managerReview}
                  onChange={(e) => handleReviewTypeChange('managerReview', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Manager Review</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.reviewTypes.upwardReview}
                  onChange={(e) => handleReviewTypeChange('upwardReview', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Upward Review</span>
              </label>
            </div>

            {errors.reviewTypes && (
              <p className="text-red-500 text-xs mt-1">{errors.reviewTypes}</p>
            )}
          </div>

          {/* Non-editable Information */}
          {cycle && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Read-only Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 capitalize">{cycle.type.replace('-', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-500">Start Date:</span>
                  <span className="ml-2">{new Date(cycle.startDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Participants:</span>
                  <span className="ml-2">{cycle.participants?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2">{new Date(cycle.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Cycle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
