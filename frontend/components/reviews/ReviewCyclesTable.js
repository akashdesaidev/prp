import { useState } from 'react';
import { Eye, Edit, Users, Calendar, ChevronLeft, ChevronRight, Trash2, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import ReviewCycleDetailsModal from './ReviewCycleDetailsModal';
import EditReviewCycleModal from './EditReviewCycleModal';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ReviewCyclesTable({
  reviewCycles,
  loading,
  onUpdate,
  canEdit,
  filters,
  onFiltersChange
}) {
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);

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

  const getTypeBadge = (type) => {
    const typeConfig = {
      quarterly: { color: 'bg-blue-100 text-blue-800', label: 'Quarterly' },
      'half-yearly': { color: 'bg-purple-100 text-purple-800', label: 'Half-Yearly' },
      annual: { color: 'bg-indigo-100 text-indigo-800', label: 'Annual' },
      custom: { color: 'bg-orange-100 text-orange-800', label: 'Custom' }
    };

    const config = typeConfig[type] || typeConfig.custom;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCompletionRate = (cycle) => {
    if (!cycle.participants || cycle.participants.length === 0) return 0;

    const submitted = cycle.participants.filter((p) => p.status === 'submitted').length;
    return Math.round((submitted / cycle.participants.length) * 100);
  };

  const handleStatusChange = async (cycleId, newStatus) => {
    if (onUpdate) {
      await onUpdate(cycleId, { status: newStatus });
    }
  };

  const handleViewDetails = (cycle) => {
    setSelectedCycle(cycle);
    setShowDetailsModal(true);
  };

  const handleEdit = (cycle) => {
    setEditingCycle(cycle);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (cycleId, updateData) => {
    try {
      await onUpdate(cycleId, updateData);
      setShowEditModal(false);
      setEditingCycle(null);
      toast.success('Review cycle updated successfully');
    } catch (error) {
      toast.error('Failed to update review cycle');
      throw error;
    }
  };

  const handleDelete = async (cycleId) => {
    try {
      await api.delete(`/review-cycles/${cycleId}`);
      toast.success('Review cycle deleted successfully');
      // Refresh the list
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete review cycle');
      throw error;
    }
  };

  const handleClone = async (cycle) => {
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
      // Refresh the list
      window.location.reload();
    } catch (error) {
      toast.error('Failed to clone review cycle');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Review Cycles</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviewCycles.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">No review cycles found</p>
                    <p className="text-sm">Get started by creating your first review cycle.</p>
                  </td>
                </tr>
              ) : (
                reviewCycles.map((cycle) => (
                  <tr key={cycle._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cycle.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(cycle.type)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(cycle.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>
                          {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                        </span>
                        {cycle.gracePeriodDays > 0 && (
                          <span className="text-xs text-gray-400">
                            +{cycle.gracePeriodDays} grace days
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {cycle.participants?.length || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${getCompletionRate(cycle)}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-500">
                          {getCompletionRate(cycle)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Details */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(cycle)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {canEdit && (
                          <>
                            {/* Edit */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cycle)}
                              title="Edit Cycle"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {/* Clone */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClone(cycle)}
                              title="Clone Cycle"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>

                            {/* Delete (only for draft cycles) */}
                            {cycle.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      'Are you sure you want to delete this review cycle? This action cannot be undone.'
                                    )
                                  ) {
                                    handleDelete(cycle._id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                                title="Delete Cycle"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Status Change Buttons */}
                            {cycle.status === 'draft' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(cycle._id, 'active')}
                              >
                                Activate
                              </Button>
                            )}

                            {cycle.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(cycle._id, 'grace-period')}
                              >
                                End Cycle
                              </Button>
                            )}

                            {cycle.status === 'grace-period' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(cycle._id, 'closed')}
                              >
                                Close
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {reviewCycles.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(filters.page - 1) * filters.limit + 1} to{' '}
              {Math.min(filters.page * filters.limit, reviewCycles.length)} of {reviewCycles.length}{' '}
              results
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, page: filters.page - 1 })}
                disabled={filters.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="text-sm text-gray-500">Page {filters.page}</span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, page: filters.page + 1 })}
                disabled={reviewCycles.length < filters.limit}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <ReviewCycleDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCycle(null);
          // Refresh the parent data when modal closes
          if (onUpdate) {
            // Call a refresh by triggering a re-fetch in the parent
            window.dispatchEvent(new CustomEvent('refreshReviewCycles'));
          }
        }}
        cycle={selectedCycle}
        onUpdate={onUpdate}
        onDelete={handleDelete}
        onEdit={handleEdit}
        canEdit={canEdit}
      />

      {/* Edit Modal */}
      <EditReviewCycleModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCycle(null);
        }}
        onSubmit={handleEditSubmit}
        cycle={editingCycle}
      />
    </>
  );
}
