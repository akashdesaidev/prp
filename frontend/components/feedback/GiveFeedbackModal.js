import { useState, useEffect } from 'react';
import { X, Star, Tag, Users, Send, Edit3 } from 'lucide-react';
import { Button } from '../ui/button';
import RichTextFeedbackComposer from './RichTextFeedbackComposer';
import SkillMatrixIntegration from './SkillMatrixIntegration';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export default function GiveFeedbackModal({ isOpen, onClose, onSubmit, recipientId = null }) {
  const [formData, setFormData] = useState({
    toUserId: recipientId || '',
    content: '',
    rating: 0,
    type: 'public',
    category: 'skills',
    tags: [],
    isAnonymous: false
  });

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [useEnhancedEditor, setUseEnhancedEditor] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (recipientId) {
      setFormData((prev) => ({ ...prev, toUserId: recipientId }));
    }
  }, [recipientId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: {
          search: searchTerm,
          limit: 50,
          excludeSelf: true
        }
      });
      console.log('Users response:', response.data);
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
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

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.name === 'tagInput') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.toUserId) {
      newErrors.toUserId = 'Please select a recipient';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Please provide feedback content';
    }

    if (formData.content.trim().length < 10) {
      newErrors.content = 'Feedback must be at least 10 characters long';
    }

    if (formData.rating && (formData.rating < 1 || formData.rating > 10)) {
      newErrors.rating = 'Rating must be between 1 and 10';
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
      setSubmitting(true);
      await api.post('/feedback', formData);

      toast.success('Feedback submitted successfully');

      // Reset form
      setFormData({
        toUserId: recipientId || '',
        content: '',
        rating: 0,
        type: 'public',
        category: 'skills',
        tags: [],
        isAnonymous: false
      });

      if (onSubmit) {
        onSubmit();
      }

      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const RatingComponent = ({ value, onChange }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <button
            key={rating}
            type="button"
            className="w-6 h-6 transition-colors cursor-pointer hover:scale-110"
            onMouseEnter={() => setHoverRating(rating)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onChange(rating)}
          >
            <Star
              className={`w-full h-full ${
                rating <= (hoverRating || value) ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 font-medium">
          {value || hoverRating || 0}/10
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  const selectedUser = users.find((user) => user._id === formData.toUserId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Give Feedback</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Recipient Selection */}
          {!recipientId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Give feedback to *
              </label>
              <div className="relative">
                <select
                  value={formData.toUserId}
                  onChange={(e) => handleInputChange('toUserId', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 pr-10 ${
                    errors.toUserId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a person... ({users.length} users loaded)</option>
                  {users.map((user) => {
                    console.log('Rendering user:', user);
                    return (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} - {user.department || 'No Department'}
                      </option>
                    );
                  })}
                </select>
                <Users className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.toUserId && <p className="text-red-500 text-xs mt-1">{errors.toUserId}</p>}
            </div>
          )}

          {/* Selected User Display */}
          {selectedUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {selectedUser.firstName[0]}
                    {selectedUser.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedUser.role} • {selectedUser.department}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Feedback *</label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Provide specific, constructive feedback..."
              rows={5}
              className={`w-full border rounded-md px-3 py-2 text-sm resize-vertical ${
                errors.content ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.content && <p className="text-red-500 text-xs">{errors.content}</p>}
              <p className="text-xs text-gray-500 ml-auto">{formData.content.length} characters</p>
            </div>
          </div>

          {/* Rating (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (Optional)
            </label>
            <RatingComponent
              value={formData.rating}
              onChange={(rating) => handleInputChange('rating', rating)}
            />
          </div>

          {/* Feedback Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="skills">Skills</option>
                <option value="values">Company Values</option>
                <option value="initiatives">Initiatives</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Optional)</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                name="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a skill or topic tag..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                <Tag className="w-4 h-4" />
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={formData.isAnonymous}
              onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isAnonymous" className="text-sm text-gray-700">
              Submit this feedback anonymously
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
