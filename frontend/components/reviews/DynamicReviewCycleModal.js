import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Users,
  Settings,
  AlertTriangle,
  Plus,
  Trash2,
  GripVertical,
  MessageSquare,
  Hash
} from 'lucide-react';
import { Button } from '../ui/button';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export default function DynamicReviewCycleModal({ isOpen, onClose, onSubmit }) {
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
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(true);

  // Dynamic question templates - can be fetched from backend or configured
  const defaultQuestionTemplates = [
    {
      category: 'overall',
      text: 'How would you rate your overall performance this period?',
      type: 'rating_text',
      required: true,
      description: 'Overall performance assessment'
    },
    {
      category: 'goals',
      text: 'What are your key achievements this period?',
      type: 'text',
      required: true,
      description: 'List major accomplishments and milestones'
    },
    {
      category: 'skills',
      text: 'What areas would you like to improve?',
      type: 'text',
      required: true,
      description: 'Identify development opportunities'
    },
    {
      category: 'skills',
      text: 'Rate your technical/professional skills',
      type: 'rating_text',
      required: true,
      description: 'Assess competency levels'
    },
    {
      category: 'values',
      text: 'How well did you demonstrate company values?',
      type: 'rating_text',
      required: true,
      description: 'Alignment with organizational values'
    },
    {
      category: 'initiatives',
      text: 'Describe any initiatives you led or contributed to',
      type: 'text',
      required: false,
      description: 'Leadership and contribution activities'
    },
    {
      category: 'goals',
      text: 'What are your goals for the next period?',
      type: 'text',
      required: true,
      description: 'Future objectives and plans'
    },
    {
      category: 'overall',
      text: 'Any additional feedback or comments?',
      type: 'text',
      required: false,
      description: 'Open feedback and suggestions'
    },
    {
      category: 'skills',
      text: 'Rate your collaboration and teamwork',
      type: 'rating_text',
      required: true,
      description: 'Team interaction and collaboration'
    },
    {
      category: 'skills',
      text: 'Rate your communication skills',
      type: 'rating_text',
      required: true,
      description: 'Verbal and written communication effectiveness'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchQuestionTemplates();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
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
    setErrors({});
  };

  const fetchQuestionTemplates = async () => {
    try {
      // Try to fetch from backend first
      const response = await api.get('/review-templates/questions');
      setQuestionTemplates(response.data.templates || defaultQuestionTemplates);
    } catch (error) {
      console.log('Using default question templates');
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
      id: Date.now() + Math.random(), // Unique ID
      text: template.text,
      type: template.type,
      category: template.category,
      required: template.required,
      description: template.description || '',
      order: formData.questions.length + 1
    };

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    toast.success('Question added');
  };

  const addCustomQuestion = () => {
    const newQuestion = {
      id: Date.now() + Math.random(),
      text: '',
      type: 'text',
      category: 'overall',
      required: true,
      description: '',
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
    toast.success('Question removed');
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
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      resetForm();
    } catch (error) {
      console.error('Error creating review cycle:', error);
      toast.error('Failed to create review cycle');
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
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Dynamic Review Cycle</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure questions dynamically for your review cycle
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
                <MessageSquare className="h-5 w-5" />
                <span>Dynamic Review Questions</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {formData.questions.length} questions
                </span>
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
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Add from Templates</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addCustomQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Question
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {questionTemplates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addQuestionFromTemplate(template)}
                      className="text-left p-4 bg-white border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {template.type === 'rating' || template.type === 'rating_text' ? (
                            <Hash className="h-4 w-4 text-blue-600" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">{template.text}</div>
                          <div className="text-xs text-gray-500 mb-2">{template.description}</div>
                          <div className="flex items-center space-x-2 text-xs">
                            <span
                              className={`px-2 py-1 rounded-full ${
                                template.category === 'overall'
                                  ? 'bg-purple-100 text-purple-700'
                                  : template.category === 'skills'
                                    ? 'bg-blue-100 text-blue-700'
                                    : template.category === 'goals'
                                      ? 'bg-green-100 text-green-700'
                                      : template.category === 'values'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {template.category}
                            </span>
                            <span className="text-gray-500">{template.type}</span>
                            {template.required && (
                              <span className="text-red-600 font-medium">Required</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Questions */}
            <div className="space-y-4">
              {formData.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center space-y-2 pt-2">
                      <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                      <div className="flex flex-col space-y-1">
                        <button
                          type="button"
                          onClick={() => moveQuestion(question.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <GripVertical className="h-4 w-4 rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(question.id, 'down')}
                          disabled={index === formData.questions.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <GripVertical className="h-4 w-4 -rotate-90" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Text *
                        </label>
                        <textarea
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                          placeholder="Enter question text..."
                          rows="2"
                          className={`w-full border rounded-md px-3 py-2 text-sm resize-vertical ${
                            errors[`question_${index}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`question_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`question_${index}`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={question.description || ''}
                          onChange={(e) =>
                            updateQuestion(question.id, 'description', e.target.value)
                          }
                          placeholder="Add context or guidance for this question..."
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Response Type
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          >
                            <option value="text">Text Response</option>
                            <option value="rating">Rating Only (1-10)</option>
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
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          >
                            <option value="overall">Overall</option>
                            <option value="skills">Skills</option>
                            <option value="values">Values</option>
                            <option value="initiatives">Initiatives</option>
                            <option value="goals">Goals</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-4 pt-6">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`required_${question.id}`}
                              checked={question.required}
                              onChange={(e) =>
                                updateQuestion(question.id, 'required', e.target.checked)
                              }
                              className="h-4 w-4 text-blue-600"
                            />
                            <label
                              htmlFor={`required_${question.id}`}
                              className="text-sm text-gray-700"
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
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {formData.questions.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No questions added yet</h3>
                  <p className="text-sm mb-4">
                    Use the question builder above to add dynamic questions for your review cycle
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowQuestionBuilder(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Question
                  </Button>
                </div>
              )}
            </div>

            {errors.questions && <p className="text-red-500 text-sm">{errors.questions}</p>}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || formData.questions.length === 0}>
              {loading
                ? 'Creating...'
                : `Create Review Cycle (${formData.questions.length} questions)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
