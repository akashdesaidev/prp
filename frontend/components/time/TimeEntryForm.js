'use client';
import { useState, useEffect } from 'react';
import { Clock, Plus, Save, X, Calendar, Target, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function TimeEntryForm({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  selectedDate = null,
  selectedOkr = null
}) {
  const [formData, setFormData] = useState({
    okrId: selectedOkr?._id || '',
    keyResultId: '',
    date: selectedDate || new Date().toISOString().split('T')[0],
    hoursSpent: '',
    description: '',
    category: 'direct_work'
  });

  const [okrs, setOkrs] = useState([]);
  const [keyResults, setKeyResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});
  const [quickTimeOptions] = useState([0.5, 1, 1.5, 2, 2.5, 3, 4, 6, 8]);

  useEffect(() => {
    if (isOpen) {
      fetchOKRs();
      if (initialData) {
        setFormData({
          ...initialData,
          date: initialData.date?.split('T')[0] || formData.date
        });
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (formData.okrId) {
      fetchKeyResults(formData.okrId);
    } else {
      setKeyResults([]);
      setFormData((prev) => ({ ...prev, keyResultId: '' }));
    }
  }, [formData.okrId]);

  const fetchOKRs = async () => {
    try {
      setLoadingData(true);
      const response = await api.get('/okrs');
      setOkrs(response.data || []);
    } catch (error) {
      console.error('Error fetching OKRs:', error);
      toast.error('Failed to load OKRs');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchKeyResults = async (okrId) => {
    try {
      const okr = okrs.find((o) => o._id === okrId);
      setKeyResults(okr?.keyResults || []);
    } catch (error) {
      console.error('Error fetching key results:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.okrId) {
      newErrors.okrId = 'Please select an OKR';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    if (!formData.hoursSpent || parseFloat(formData.hoursSpent) <= 0) {
      newErrors.hoursSpent = 'Please enter valid hours (greater than 0)';
    } else if (parseFloat(formData.hoursSpent) > 24) {
      newErrors.hoursSpent = 'Hours cannot exceed 24 per day';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Please provide a description of your work';
    }

    // Check if date is not in the future
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (selectedDate > today) {
      newErrors.date = 'Cannot log time for future dates';
    }

    // Check if date is not too far in the past (e.g., more than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (selectedDate < thirtyDaysAgo) {
      newErrors.date = 'Cannot log time for dates older than 30 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        hoursSpent: parseFloat(formData.hoursSpent),
        keyResultId: formData.keyResultId || undefined
      };

      if (initialData?._id) {
        await api.put(`/time-entries/${initialData._id}`, payload);
        toast.success('Time entry updated successfully!');
      } else {
        await api.post('/time-entries', payload);
        toast.success('Time entry logged successfully!');
      }

      onSuccess && onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast.error(error.response?.data?.error || 'Failed to save time entry');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      okrId: selectedOkr?._id || '',
      keyResultId: '',
      date: selectedDate || new Date().toISOString().split('T')[0],
      hoursSpent: '',
      description: '',
      category: 'direct_work'
    });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleQuickTimeSelect = (hours) => {
    handleInputChange('hoursSpent', hours.toString());
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'direct_work':
        return '🎯';
      case 'planning':
        return '📋';
      case 'collaboration':
        return '🤝';
      case 'review':
        return '👀';
      case 'other':
        return '📝';
      default:
        return '⏰';
    }
  };

  const getCategoryDescription = (category) => {
    switch (category) {
      case 'direct_work':
        return 'Working directly on objectives and key results';
      case 'planning':
        return 'Planning, strategizing, and preparation work';
      case 'collaboration':
        return 'Meetings, discussions, and team collaboration';
      case 'review':
        return 'Reviews, feedback sessions, and evaluations';
      case 'other':
        return 'Other work related to this OKR';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {initialData ? 'Edit Time Entry' : 'Log Time Entry'}
                </h2>
                <p className="text-sm text-gray-600">
                  Track time spent on your objectives and key results
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OKR Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="inline h-4 w-4 mr-1" />
                  Objective & Key Result *
                </label>
                <select
                  value={formData.okrId}
                  onChange={(e) => handleInputChange('okrId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.okrId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select an OKR</option>
                  {okrs.map((okr) => (
                    <option key={okr._id} value={okr._id}>
                      {okr.title} ({okr.type})
                    </option>
                  ))}
                </select>
                {errors.okrId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.okrId}
                  </p>
                )}
              </div>

              {/* Key Result Selection (Optional) */}
              {keyResults.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Key Result (Optional)
                  </label>
                  <select
                    value={formData.keyResultId}
                    onChange={(e) => handleInputChange('keyResultId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">General work on this OKR</option>
                    {keyResults.map((kr, index) => (
                      <option key={index} value={kr._id || index}>
                        {kr.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.date ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.date}
                    </p>
                  )}
                </div>

                {/* Hours Spent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hours Spent *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={formData.hoursSpent}
                    onChange={(e) => handleInputChange('hoursSpent', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.hoursSpent ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 2.5"
                    required
                  />
                  {errors.hoursSpent && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.hoursSpent}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Time Selection
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickTimeOptions.map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => handleInputChange('hoursSpent', hours.toString())}
                      className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                        parseFloat(formData.hoursSpent) === hours
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {parseFloat(hours).toFixed(1)}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Category *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['direct_work', 'planning', 'collaboration', 'review', 'other'].map(
                    (category) => (
                      <label
                        key={category}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.category === category
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={formData.category === category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getCategoryIcon(category)}</span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </div>
                            <div className="text-xs text-gray-600">
                              {getCategoryDescription(category)}
                            </div>
                          </div>
                        </div>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows="4"
                  placeholder="Describe what you worked on, what you accomplished, any blockers, etc."
                  required
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Be specific about your accomplishments and any challenges faced.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 flex items-center gap-2" disabled={loading}>
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : initialData ? 'Update Entry' : 'Log Time'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
