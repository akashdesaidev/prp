import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ReviewCycleDetailsModal({
  isOpen,
  onClose,
  cycle,
  onUpdate,
  onDelete,
  onEdit,
  canEdit
}) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen && cycle) {
      fetchCycleStats();
    }
  }, [isOpen, cycle]);

  const fetchCycleStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/review-cycles/${cycle._id}/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching cycle stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await onUpdate(cycle._id, { status: newStatus });
      onClose();
    } catch (error) {
      toast.error('Failed to update cycle status');
    }
  };

  const handleClone = async () => {
    try {
      const clonedData = {
        name: `${cycle.name} (Copy)`,
        type: cycle.type,
        gracePeriodDays: cycle.gracePeriodDays,
        reviewTypes: cycle.reviewTypes,
        questions: cycle.questions,
        startDate: null, // User will need to set new dates
        endDate: null
      };

      await api.post('/review-cycles', clonedData);
      toast.success('Review cycle cloned successfully');
      onClose();
      window.location.reload(); // Refresh to show new cycle
    } catch (error) {
      toast.error('Failed to clone review cycle');
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this review cycle? This action cannot be undone.'
      )
    ) {
      try {
        await onDelete(cycle._id);
        onClose();
      } catch (error) {
        toast.error('Failed to delete review cycle');
      }
    }
  };

  if (!isOpen || !cycle) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      'grace-period': { color: 'bg-yellow-100 text-yellow-800', label: 'Grace Period' },
      closed: { color: 'bg-blue-100 text-blue-800', label: 'Closed' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-semibold text-gray-900">{cycle.name}</h3>
            {getStatusBadge(cycle.status)}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cycle Type</label>
                <div className="mt-1 capitalize text-gray-900">{cycle.type.replace('-', ' ')}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <div className="mt-1 text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Grace Period</label>
                <div className="mt-1 text-gray-900">{cycle.gracePeriodDays} days</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <div className="mt-1 text-gray-900">{formatDate(cycle.createdAt)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Review Types</label>
                <div className="mt-1 space-y-1">
                  {Object.entries(cycle.reviewTypes || {}).map(([type, enabled]) => (
                    <div key={type} className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                      <span
                        className={`text-sm capitalize ${enabled ? 'text-gray-900' : 'text-gray-500'}`}
                      >
                        {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Participation Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Total Participants</p>
                      <p className="text-2xl font-semibold text-blue-900">
                        {stats.participants.total}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Submitted</p>
                      <p className="text-2xl font-semibold text-green-900">
                        {stats.participants.submitted}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-900">Pending</p>
                      <p className="text-2xl font-semibold text-yellow-900">
                        {stats.participants.pending}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-900">Not Submitted</p>
                      <p className="text-2xl font-semibold text-red-900">
                        {stats.participants.notSubmitted}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-700 mb-1">
                  <span>Completion Progress</span>
                  <span>{stats.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Questions */}
          {cycle.questions && cycle.questions.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Review Questions</h4>
              <div className="space-y-3">
                {cycle.questions
                  .sort((a, b) => a.order - b.order)
                  .map((question, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{question.question}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                              {question.category}
                            </span>
                            {question.requiresRating && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Rating Required
                              </span>
                            )}
                            {question.isRequired && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onEdit(cycle)}
                  className="flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>

                <Button variant="outline" onClick={handleClone} className="flex items-center">
                  <Copy className="h-4 w-4 mr-2" />
                  Clone
                </Button>

                {cycle.status === 'draft' && (
                  <Button
                    variant="outline"
                    onClick={() => handleDelete()}
                    className="flex items-center text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {canEdit && (
              <>
                {cycle.status === 'draft' && (
                  <Button onClick={() => handleStatusChange('active')}>Activate Cycle</Button>
                )}

                {cycle.status === 'active' && (
                  <Button variant="outline" onClick={() => handleStatusChange('grace-period')}>
                    End Cycle
                  </Button>
                )}

                {cycle.status === 'grace-period' && (
                  <Button variant="outline" onClick={() => handleStatusChange('closed')}>
                    Close Cycle
                  </Button>
                )}
              </>
            )}

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
