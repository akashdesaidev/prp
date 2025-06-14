'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import ReviewCyclesTable from '../../components/reviews/ReviewCyclesTable';
import CreateReviewCycleModal from '../../components/reviews/CreateReviewCycleModal';
import ReviewCycleStats from '../../components/reviews/ReviewCycleStats';
import { Button } from '../../components/ui/button';
import { Plus, Filter, Download } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviewCycles, setReviewCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchReviewCycles();
    fetchStats();
  }, [filters]);

  const fetchReviewCycles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/review-cycles', { params: filters });
      setReviewCycles(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch review cycles');
      console.error('Error fetching review cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/review-cycles/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateCycle = async (cycleData) => {
    try {
      await api.post('/review-cycles', cycleData);
      toast.success('Review cycle created successfully');
      setShowCreateModal(false);
      fetchReviewCycles();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create review cycle');
    }
  };

  const handleUpdateCycle = async (id, updates) => {
    try {
      await api.patch(`/review-cycles/${id}`, updates);
      toast.success('Review cycle updated successfully');
      fetchReviewCycles();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update review cycle');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/review-cycles/export', {
        responseType: 'blob',
        params: filters
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `review-cycles-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Review cycles exported successfully');
    } catch (error) {
      toast.error('Failed to export review cycles');
    }
  };

  const canCreateCycle = user?.role === 'admin' || user?.role === 'hr';

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review Cycles</h1>
            <p className="text-gray-600 mt-1">
              Manage performance review cycles and track completion status
            </p>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleExport} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            {canCreateCycle && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Cycle
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <ReviewCycleStats stats={stats} />

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="grace-period">Grace Period</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              >
                <option value="all">All Types</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="annual">Annual</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.limit}
                onChange={(e) =>
                  setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })
                }
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Review Cycles Table */}
        <ReviewCyclesTable
          reviewCycles={reviewCycles}
          loading={loading}
          onUpdate={handleUpdateCycle}
          canEdit={canCreateCycle}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Create Review Cycle Modal */}
        {showCreateModal && (
          <CreateReviewCycleModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateCycle}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
