'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  User,
  LayoutGrid,
  List,
  Eye,
  ArrowUp,
  ArrowDown,
  Users,
  Building
} from 'lucide-react';
import { X } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import CreateOKRModal from '../../components/okrs/CreateOKRModal';
import OKRDetailModal from '../../components/okrs/OKRDetailModal';
import OKRHierarchyView from '../../components/okrs/OKRHierarchyView';
import OKRSearchFilter from '../../components/okrs/OKRSearchFilter';
import { Button } from '../../components/ui/button';

export default function OKRsPage() {
  const { user } = useAuth();
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOkr, setSelectedOkr] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'hierarchy'
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOKRs();
  }, [filters]);

  const fetchOKRs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
      });

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
    fetchOKRs();
    setShowCreateModal(false);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleOkrSelect = (okr) => {
    setSelectedOkr(okr);
    setShowDetailModal(true);
  };

  const handleProgressUpdate = () => {
    fetchOKRs(); // Refresh the OKRs list
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'company':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'department':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'team':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'individual':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'company':
        return <Building className="h-4 w-4 text-purple-600" />;
      case 'department':
        return <Users className="h-4 w-4 text-indigo-600" />;
      case 'team':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'individual':
        return <User className="h-4 w-4 text-orange-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const calculateProgress = (keyResults) => {
    if (!keyResults || keyResults.length === 0) return 0;
    const totalScore = keyResults.reduce((sum, kr) => sum + (kr.score || 1), 0);
    return Math.round((totalScore / (keyResults.length * 10)) * 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressRing = (progress) => {
    const circumference = 2 * Math.PI * 16; // radius = 16
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-200"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={
              progress >= 80
                ? 'text-emerald-500'
                : progress >= 60
                  ? 'text-yellow-500'
                  : progress >= 40
                    ? 'text-orange-500'
                    : 'text-red-500'
            }
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">{progress}%</span>
        </div>
      </div>
    );
  };

  const canCreateOKR = ['admin', 'hr', 'manager'].includes(user?.role);

  // Find parent and children OKRs
  const findParentOKR = (okrId) => {
    return okrs.find((okr) => okr._id === okrId);
  };

  const findChildrenOKRs = (parentId) => {
    return okrs.filter((okr) => okr.parentOkrId?._id === parentId);
  };

  const renderOKRCard = (okr) => {
    const progress = calculateProgress(okr.keyResults);
    const parentOKR = okr.parentOkrId ? findParentOKR(okr.parentOkrId._id) : null;
    const childrenOKRs = findChildrenOKRs(okr._id);

    return (
      <div
        key={okr._id}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 cursor-pointer group h-full flex flex-col"
        onClick={() => handleOkrSelect(okr)}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getTypeIcon(okr.type)}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors truncate">
                {okr.title}
              </h3>
              <div className="h-10 flex items-start">
                {okr.description ? (
                  <p className="text-sm text-gray-600 line-clamp-2">{okr.description}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No description</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 ml-4 flex-shrink-0">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(okr.status)} text-center`}
            >
              {okr.status}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(okr.type)} text-center`}
            >
              {okr.type}
            </span>
          </div>
        </div>

        {/* Parent/Children Relationships */}
        {(parentOKR || childrenOKRs.length > 0) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            {parentOKR && (
              <div className="flex items-center gap-2 mb-2">
                <ArrowUp className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">Parent:</span>
                <span className="text-xs font-medium text-gray-800 truncate">
                  {parentOKR.title || okr.parentOkrId.title}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${getTypeColor(parentOKR?.type || okr.parentOkrId.type)}`}
                >
                  {parentOKR?.type || okr.parentOkrId.type}
                </span>
              </div>
            )}
            {childrenOKRs.length > 0 && (
              <div className="flex items-center gap-2">
                <ArrowDown className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">Children:</span>
                <span className="text-xs font-medium text-gray-800">
                  {childrenOKRs.length} linked OKR{childrenOKRs.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <div className="flex items-center gap-2">{getProgressRing(progress)}</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Key Results */}
        <div className="mb-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Key Results</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {okr.keyResults?.length || 0} KRs
            </span>
          </div>
          <div className="h-20 overflow-hidden">
            {okr.keyResults && okr.keyResults.length > 0 ? (
              <div className="space-y-2">
                {okr.keyResults.slice(0, 2).map((kr, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0"></div>
                    <span className="text-gray-700 line-clamp-1 flex-1 min-w-0">{kr.title}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                      {kr.score}/10
                    </span>
                  </div>
                ))}
                {okr.keyResults.length > 2 && (
                  <div className="text-xs text-gray-500 pl-4">
                    +{okr.keyResults.length - 2} more key results
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">No key results defined</div>
            )}
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>
              {okr.assignedTo?.firstName} {okr.assignedTo?.lastName}
            </span>
          </div>
          {okr.endDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(okr.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {okr.tags && okr.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {okr.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-100"
              >
                {tag}
              </span>
            ))}
            {okr.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">
                +{okr.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderOKRList = (okr) => {
    const progress = calculateProgress(okr.keyResults);
    const parentOKR = okr.parentOkrId ? findParentOKR(okr.parentOkrId._id) : null;
    const childrenOKRs = findChildrenOKRs(okr._id);

    return (
      <div
        key={okr._id}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer group"
        onClick={() => handleOkrSelect(okr)}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">{getTypeIcon(okr.type)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {okr.title}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(okr.type)}`}
              >
                {okr.type}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(okr.status)}`}
              >
                {okr.status}
              </span>
            </div>

            {okr.description && (
              <p className="text-sm text-gray-600 line-clamp-1 mb-2">{okr.description}</p>
            )}

            {/* Hierarchy Info */}
            {(parentOKR || childrenOKRs.length > 0) && (
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {parentOKR && (
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    <span>Parent: {parentOKR.title || okr.parentOkrId.title}</span>
                  </div>
                )}
                {childrenOKRs.length > 0 && (
                  <div className="flex items-center gap-1">
                    <ArrowDown className="h-3 w-3" />
                    <span>{childrenOKRs.length} children</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{progress}%</div>
              <div className="text-xs text-gray-500">Progress</div>
            </div>

            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{okr.keyResults?.length || 0}</div>
              <div className="text-xs text-gray-500">Key Results</div>
            </div>

            <div className="w-24">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">OKRs</h1>
            <p className="text-gray-600 mt-1">
              Objectives and Key Results - Track your goals and progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'hierarchy'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                title="Hierarchy View"
              >
                <Target className="h-4 w-4" />
              </button>
            </div>

            {canCreateOKR && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create OKR
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <OKRSearchFilter onFiltersChange={handleFiltersChange} />

        {/* Content */}
        <div className="w-full">
          {viewMode === 'hierarchy' ? (
            <OKRHierarchyView selectedOkrId={selectedOkr?._id} onOkrSelect={handleOkrSelect} />
          ) : (
            <>
              {loading ? (
                <div
                  className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'grid-cols-1 gap-3'}`}
                >
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
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
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No OKRs found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {Object.keys(filters).length > 0
                      ? 'Try adjusting your filters to see more results.'
                      : canCreateOKR
                        ? 'Get started by creating your first OKR and building your goal hierarchy.'
                        : 'No OKRs have been assigned to you yet. Check back later or contact your manager.'}
                  </p>
                  {canCreateOKR && Object.keys(filters).length === 0 && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 mx-auto bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create Your First OKR
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr' : 'space-y-3'}`}
                >
                  {okrs.map((okr) =>
                    viewMode === 'grid' ? renderOKRCard(okr) : renderOKRList(okr)
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Create OKR Modal */}
        <CreateOKRModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* OKR Detail Modal */}
        <OKRDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          okr={selectedOkr}
          onUpdate={handleProgressUpdate}
        />
      </div>
    </ProtectedRoute>
  );
}
