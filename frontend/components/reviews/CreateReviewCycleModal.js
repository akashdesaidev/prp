import { useState } from 'react';
import { X, Calendar, Users, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

export default function CreateReviewCycleModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'quarterly',
    startDate: '',
    endDate: '',
    gracePeriodDays: 3,
    isEmergency: false,
    reviewTypes: {
      selfReview: true,
      peerReview: true,
      managerReview: true,
      upwardReview: false
    },
    questions: [
      {
        question: 'How would you rate your overall performance this period?',
        category: 'overall',
        requiresRating: true,
        isRequired: true,
        order: 1
      },
      {
        question: 'What are your key achievements this period?',
        category: 'goals',
        requiresRating: false,
        isRequired: true,
        order: 2
      },
      {
        question: 'What areas would you like to improve?',
        category: 'skills',
        requiresRating: false,
        isRequired: true,
        order: 3
      }
    ]
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

      if (start >= end) {
        newErrors.endDate = 'End date must be after start date';
      }

      if (start < today.setHours(0, 0, 0, 0)) {
        newErrors.startDate = 'Start date cannot be in the past';
      }

      // Check 3-day buffer requirement for non-emergency cycles
      if (!formData.isEmergency && start < threeDaysFromNow) {
        newErrors.startDate =
          'Review cycle must start at least 3 days from now (or mark as emergency)';
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
      await onSubmit(formData);
    } catch (error) {
      console.error('Error creating review cycle:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Check if start date is within 3 days to show emergency warning
  const isStartDateSoon =
    formData.startDate &&
    new Date(formData.startDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Review Cycle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
              <Settings className="h-5 w-5" />
              <span>Basic Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="annual">Annual</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
              <Calendar className="h-5 w-5" />
              <span>Schedule</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                )}
              </div>

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
            </div>

            {/* Emergency Cycle Option */}
            {isStartDateSoon && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800">
                      Short Notice Review Cycle
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This review cycle starts within 3 days. Mark as emergency to proceed.
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
                      <p className="text-xs text-yellow-600 mt-1">
                        Emergency cycles bypass the 3-day advance notice requirement
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Review Types */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
              <Users className="h-5 w-5" />
              <span>Review Types</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  key: 'selfReview',
                  label: 'Self Assessment',
                  desc: 'Employee reviews themselves'
                },
                { key: 'peerReview', label: 'Peer Review', desc: 'Colleagues review each other' },
                {
                  key: 'managerReview',
                  label: 'Manager Review',
                  desc: 'Manager reviews direct reports'
                },
                {
                  key: 'upwardReview',
                  label: 'Upward Review',
                  desc: 'Reports review their manager'
                }
              ].map((type) => (
                <div key={type.key} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={type.key}
                    checked={formData.reviewTypes[type.key]}
                    onChange={(e) => handleReviewTypeChange(type.key, e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <label htmlFor={type.key} className="text-sm font-medium text-gray-900">
                      {type.label}
                    </label>
                    <p className="text-xs text-gray-500">{type.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {errors.reviewTypes && <p className="text-red-500 text-xs">{errors.reviewTypes}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Review Cycle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
