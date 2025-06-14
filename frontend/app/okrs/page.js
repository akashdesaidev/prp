'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Target, TrendingUp, Calendar, User } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import CreateOKRModal from '../../components/okrs/CreateOKRModal';

export default function OKRsPage() {
  const { user } = useAuth();
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchOKRs();
  }, [filter]);

  const fetchOKRs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/okrs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOkrs(data);
      }
    } catch (error) {
      console.error('Error fetching OKRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchOKRs(); // Refresh the OKRs list
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'active':
        return 'bg-primary-100 text-primary-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'company':
        return 'bg-purple-100 text-purple-800';
      case 'department':
        return 'bg-blue-100 text-blue-800';
      case 'team':
        return 'bg-green-100 text-green-800';
      case 'individual':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (keyResults) => {
    if (!keyResults || keyResults.length === 0) return 0;
    const totalScore = keyResults.reduce((sum, kr) => sum + (kr.score || 1), 0);
    return Math.round((totalScore / (keyResults.length * 10)) * 100);
  };

  const canCreateOKR = ['admin', 'hr', 'manager'].includes(user?.role);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OKRs</h1>
            <p className="text-gray-600">Objectives and Key Results</p>
          </div>
          {canCreateOKR && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create OKR
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'active', 'completed', 'draft'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* OKRs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : okrs.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No OKRs found</h3>
            <p className="text-gray-600 mb-4">
              {canCreateOKR
                ? 'Get started by creating your first OKR.'
                : 'No OKRs have been assigned to you yet.'}
            </p>
            {canCreateOKR && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create OKR
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {okrs.map((okr) => (
              <div
                key={okr._id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{okr.title}</h3>
                    {okr.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{okr.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 ml-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(okr.status)}`}
                    >
                      {okr.status}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(okr.type)}`}
                    >
                      {okr.type}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">
                      {calculateProgress(okr.keyResults)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(okr.keyResults)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Key Results Count */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{okr.keyResults?.length || 0} Key Results</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>
                      {okr.assignedTo?.firstName} {okr.assignedTo?.lastName}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                {(okr.startDate || okr.endDate) && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {okr.startDate && new Date(okr.startDate).toLocaleDateString()} -{' '}
                      {okr.endDate && new Date(okr.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create OKR Modal */}
      <CreateOKRModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </ProtectedRoute>
  );
}
