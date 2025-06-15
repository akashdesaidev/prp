import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Users,
  Settings,
  AlertTriangle,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';
import { Button } from '../ui/button';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

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
    questions: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [questionTemplates, setQuestionTemplates] = useState([]);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);

  // Question templates from backend or predefined
  const defaultQuestionTemplates = [
    {
      category: 'overall',
      text: 'How would you rate your overall performance this period?',
      type: 'rating_text',
      required: true
    },
    {
      category: 'goals',
      text: 'What are your key achievements this period?',
      type: 'text',
      required: true
    },
    {
      category: 'skills',
      text: 'What areas would you like to improve?',
      type: 'text',
      required: true
    },
    {
      category: 'skills',
      text: 'Rate your technical/professional skills',
      type: 'rating_text',
      required: true
    },
    {
      category: 'values',
      text: 'How well did you demonstrate company values?',
      type: 'rating_text',
      required: true
    },
    {
      category: 'initiatives',
      text: 'Describe any initiatives you led or contributed to',
      type: 'text',
      required: false
    },
    {
      category: 'goals',
      text: 'What are your goals for the next period?',
      type: 'text',
      required: true
    },
    {
      category: 'overall',
      text: 'Any additional feedback or comments?',
      type: 'text',
      required: false
    }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchQuestionTemplates();
    }
  }, [isOpen]);

  const fetchQuestionTemplates = async () => {
    try {
      // Fetch dynamic templates from backend
      const response = await api.get('/review-templates/questions');
      const templates = response.data.data?.templates || response.data.templates || [];
      setQuestionTemplates(templates.length > 0 ? templates : defaultQuestionTemplates);
    } catch (error) {
      console.error('Failed to fetch question templates:', error);
      // Only use defaults if backend fails completely
      setQuestionTemplates(defaultQuestionTemplates);
    }
  };

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

  const addQuestionFromTemplate = (template) => {
    const newQuestion = {
      id: Date.now(), // Temporary ID
      text: template.text,
      type: template.type,
      category: template.category,
      required: template.required,
      order: formData.questions.length + 1
    };

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const addCustomQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      text: '',
      type: 'text',
      category: 'overall',
      required: true,
      order: formData.questions.length + 1
    };

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q))
    }));
  };

  const removeQuestion = (questionId) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId)
    }));
  };

  const moveQuestion = (questionId, direction) => {
    const questions = [...formData.questions];
    const index = questions.findIndex((q) => q.id === questionId);

    if (direction === 'up' && index > 0) {
      [questions[index], questions[index - 1]] = [questions[index - 1], questions[index]];
    } else if (direction === 'down' && index < questions.length - 1) {
      [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
    }

    // Update order numbers
    questions.forEach((q, i) => {
      q.order = i + 1;
    });

    setFormData((prev) => ({
      ...prev,
      questions
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

    // At least one question is required
    if (formData.questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }

    // Validate questions
    formData.questions.forEach((question, index) => {
      if (!question.text.trim()) {
        newErrors[`question_${index}`] = 'Question text is required';
      }
    });

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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                  max="14"
                  value={formData.gracePeriodDays}
                  onChange={(e) => handleInputChange('gracePeriodDays', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            {/* Emergency Warning */}
            {isStartDateSoon && !formData.isEmergency && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div className="text-sm text-yellow-800">
                  Starting within 3 days requires emergency authorization
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isEmergency"
                checked={formData.isEmergency}
                onChange={(e) => handleInputChange('isEmergency', e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="isEmergency" className="text-sm text-gray-700">
                Mark as Emergency Cycle (bypasses 3-day buffer requirement)
              </label>
            </div>
          </div>

          {/* Review Types */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
              <Users className="h-5 w-5" />
              <span>Review Types</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries({
                selfReview: 'Self Review',
                peerReview: 'Peer Review',
                managerReview: 'Manager Review',
                upwardReview: 'Upward Review'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={key}
                    checked={formData.reviewTypes[key]}
                    onChange={(e) => handleReviewTypeChange(key, e.target.checked)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor={key} className="text-sm text-gray-700">
                    {label}
                  </label>
                </div>
              ))}
            </div>
            {errors.reviewTypes && <p className="text-red-500 text-xs">{errors.reviewTypes}</p>}
          </div>

          {/* Dynamic Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
                <Settings className="h-5 w-5" />
                <span>Review Questions</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuestionBuilder(!showQuestionBuilder)}
              >
                {showQuestionBuilder ? 'Hide' : 'Show'} Question Builder
              </Button>
            </div>

            {/* Question Templates */}
            {showQuestionBuilder && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-900">Add from Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {questionTemplates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addQuestionFromTemplate(template)}
                      className="text-left p-3 bg-white border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 text-sm"
                    >
                      <div className="font-medium">{template.text}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.category} • {template.type} •{' '}
                        {template.required ? 'Required' : 'Optional'}
                      </div>
                    </button>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addCustomQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Question
                </Button>
              </div>
            )}

            {/* Current Questions */}
            <div className="space-y-3">
              {formData.questions.map((question, index) => (
                <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col space-y-1">
                      <button
                        type="button"
                        onClick={() => moveQuestion(question.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-gray-500">{index + 1}</span>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text *
                        </label>
                        <input
                          type="text"
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                          placeholder="Enter question text..."
                          className={`w-full border rounded-md px-3 py-2 text-sm ${
                            errors[`question_${index}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`question_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`question_${index}`]}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm"
                          >
                            <option value="text">Text Response</option>
                            <option value="rating">Rating Only</option>
                            <option value="rating_text">Rating + Text</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={question.category}
                            onChange={(e) =>
                              updateQuestion(question.id, 'category', e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm"
                          >
                            <option value="overall">Overall</option>
                            <option value="skills">Skills</option>
                            <option value="values">Values</option>
                            <option value="initiatives">Initiatives</option>
                            <option value="goals">Goals</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-4 pt-6">
                          <div className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              id={`required_${question.id}`}
                              checked={question.required}
                              onChange={(e) =>
                                updateQuestion(question.id, 'required', e.target.checked)
                              }
                              className="h-3 w-3 text-blue-600"
                            />
                            <label
                              htmlFor={`required_${question.id}`}
                              className="text-xs text-gray-700"
                            >
                              Required
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {formData.questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No questions added yet</p>
                  <p className="text-sm">Use the question builder above to add questions</p>
                </div>
              )}
            </div>

            {errors.questions && <p className="text-red-500 text-xs">{errors.questions}</p>}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
