'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Target, Users, Building, User } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';

export default function OKRHierarchyView({ selectedOkrId, onOkrSelect }) {
  const [hierarchyData, setHierarchyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const response = await api.get('/okrs/hierarchy');
      console.log('🌳 Hierarchy API response:', response.data);

      // Handle the backend response structure which is { company: [], department: [], team: [], individual: [] }
      let hierarchyArray = [];
      if (response.data && typeof response.data === 'object') {
        // Flatten the hierarchy structure from backend
        const { company = [], department = [], team = [], individual = [] } = response.data;
        hierarchyArray = [...company, ...department, ...team, ...individual];
      } else if (Array.isArray(response.data)) {
        hierarchyArray = response.data;
      }

      console.log('🌳 Processed hierarchy array:', hierarchyArray);
      setHierarchyData(hierarchyArray);

      // Auto-expand company and department level OKRs
      const autoExpand = new Set();
      hierarchyArray.forEach((okr) => {
        if (okr.type === 'company' || okr.type === 'department') {
          autoExpand.add(okr._id);
        }
      });
      setExpandedNodes(autoExpand);
    } catch (error) {
      console.error('Error fetching OKR hierarchy:', error);
      setHierarchyData([]); // Ensure it's always an array on error
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (okrId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(okrId)) {
      newExpanded.delete(okrId);
    } else {
      newExpanded.add(okrId);
    }
    setExpandedNodes(newExpanded);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'company':
        return <Building className="h-4 w-4 text-purple-600" />;
      case 'department':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'team':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'individual':
        return <User className="h-4 w-4 text-orange-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'company':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'department':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'team':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'individual':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateProgress = (keyResults) => {
    if (!keyResults || keyResults.length === 0) return 0;
    const totalScore = keyResults.reduce((sum, kr) => sum + (kr.score || 1), 0);
    return Math.round((totalScore / (keyResults.length * 10)) * 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const buildHierarchyTree = (okrs, parentId = null) => {
    // Ensure okrs is an array
    if (!Array.isArray(okrs)) {
      console.warn('🚨 buildHierarchyTree called with non-array:', okrs);
      return [];
    }

    return okrs
      .filter((okr) => {
        // Handle different parentOkrId formats
        let okrParentId = null;

        if (okr.parentOkrId) {
          // If parentOkrId is an object, get its _id
          if (typeof okr.parentOkrId === 'object' && okr.parentOkrId._id) {
            okrParentId = okr.parentOkrId._id;
          } else if (typeof okr.parentOkrId === 'string') {
            okrParentId = okr.parentOkrId;
          }
        }

        // Debug logging
        console.log(`🔍 Filtering OKR "${okr.title}":`, {
          okrParentId,
          parentId,
          matches: okrParentId === parentId,
          parentOkrId: okr.parentOkrId,
          parentOkrIdType: typeof okr.parentOkrId
        });

        return okrParentId === parentId;
      })
      .map((okr) => ({
        ...okr,
        children: buildHierarchyTree(okrs, okr._id)
      }));
  };

  const renderOKRNode = (okr, level = 0) => {
    const hasChildren = okr.children && okr.children.length > 0;
    const isExpanded = expandedNodes.has(okr._id);
    const isSelected = selectedOkrId === okr._id;
    const progress = calculateProgress(okr.keyResults);

    return (
      <div key={okr._id} className="select-none">
        <div
          className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
            isSelected
              ? 'bg-primary-50 border-2 border-primary-200'
              : 'hover:bg-gray-50 border border-transparent'
          }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => onOkrSelect && onOkrSelect(okr)}
        >
          {/* Expand/Collapse Button */}
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(okr._id);
                }}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-gray-600" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-3 h-3"></div>
            )}
          </div>

          {/* Type Icon */}
          <div className="flex-shrink-0">{getTypeIcon(okr.type)}</div>

          {/* OKR Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">{okr.title}</h4>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(okr.type)}`}
              >
                {okr.type}
              </span>
            </div>

            {okr.description && (
              <p className="text-sm text-gray-600 line-clamp-1 mb-2">{okr.description}</p>
            )}

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 font-medium">{progress}%</span>
            </div>
          </div>

          {/* Key Results Count */}
          <div className="flex-shrink-0 text-xs text-gray-500">
            {okr.keyResults?.length || 0} KRs
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">{okr.children.map((child) => renderOKRNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">OKR Hierarchy</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 p-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  console.log('🌲 Hierarchy data:', hierarchyData);

  // Since the backend already builds the hierarchy with children,
  // we just need to filter for root-level items (no parentOkrId)
  const safeHierarchyData = Array.isArray(hierarchyData) ? hierarchyData : [];
  const hierarchyTree = safeHierarchyData.filter((okr) => !okr.parentOkrId);
  console.log('🌲 Root level OKRs:', hierarchyTree);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">OKR Hierarchy</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedNodes(new Set(hierarchyData.map((okr) => okr._id)))}
          >
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExpandedNodes(new Set())}>
            Collapse All
          </Button>
        </div>
      </div>

      {hierarchyTree.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No OKRs Found</h4>
          <p className="text-gray-600">Create your first OKR to get started.</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {hierarchyTree.map((okr) => renderOKRNode(okr))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { type: 'company', label: 'Company' },
            { type: 'department', label: 'Department' },
            { type: 'team', label: 'Team' },
            { type: 'individual', label: 'Individual' }
          ].map(({ type, label }) => (
            <div key={type} className="flex items-center gap-2">
              {getTypeIcon(type)}
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
