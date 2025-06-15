'use client';
import { useState, useEffect } from 'react';
import {
  X,
  Target,
  Calendar,
  User,
  Building,
  Users,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Clock,
  Tag
} from 'lucide-react';
import { Button } from '../ui/button';
import OKRProgressTracker from './OKRProgressTracker';

export default function OKRDetailModal({ isOpen, onClose, okr, onUpdate }) {
  const [activeTab, setActiveTab] = useState('progress');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !okr) return null;

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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'company':
        return <Building className="h-5 w-5 text-purple-600" />;
      case 'department':
        return <Users className="h-5 w-5 text-indigo-600" />;
      case 'team':
        return <Users className="h-5 w-5 text-green-600" />;
      case 'individual':
        return <User className="h-5 w-5 text-orange-600" />;
      default:
        return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  const calculateProgress = (keyResults) => {
    if (!keyResults || keyResults.length === 0) return 0;
    const totalScore = keyResults.reduce((sum, kr) => sum + (kr.score || 1), 0);
    return Math.round((totalScore / (keyResults.length * 10)) * 100);
  };

  const progress = calculateProgress(okr.keyResults);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex h-full">
        <div className="ml-auto w-full max-w-6xl bg-white shadow-xl">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                {getTypeIcon(okr.type)}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{okr.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
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
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* OKR Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Left Column - OKR Info */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Description */}
                    {okr.description && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                        <p className="text-sm text-gray-700">{okr.description}</p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-medium text-gray-900">Details</h3>

                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Assigned to:</span>
                        <span className="font-medium text-gray-900">
                          {okr.assignedTo?.firstName} {okr.assignedTo?.lastName}
                        </span>
                      </div>

                      {okr.endDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Due date:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(okr.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Progress:</span>
                        <span className="font-medium text-gray-900">{progress}%</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Key Results:</span>
                        <span className="font-medium text-gray-900">
                          {okr.keyResults?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Hierarchy */}
                    {okr.parentOkrId && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Hierarchy</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowUp className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Parent:</span>
                          <span className="font-medium text-gray-900 truncate">
                            {okr.parentOkrId.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${getTypeColor(okr.parentOkrId.type)}`}
                          >
                            {okr.parentOkrId.type}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {okr.tags && okr.tags.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {okr.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-100"
                            >
                              <Tag className="h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Progress Tracking */}
                  <div className="lg:col-span-2">
                    <OKRProgressTracker okr={okr} onUpdate={onUpdate} />
                  </div>
                </div>

                {/* Key Results Overview */}
                {okr.keyResults && okr.keyResults.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Key Results Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {okr.keyResults.map((kr, index) => {
                        const krProgress = kr.targetValue
                          ? Math.min(((kr.currentValue || 0) / kr.targetValue) * 100, 100)
                          : (kr.score || 1) * 10;

                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 text-sm">{kr.title}</h4>
                              <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                                {kr.score}/10
                              </span>
                            </div>
                            {kr.description && (
                              <p className="text-xs text-gray-600 mb-3">{kr.description}</p>
                            )}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Progress</span>
                                <span>{krProgress.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    krProgress >= 80
                                      ? 'bg-emerald-500'
                                      : krProgress >= 60
                                        ? 'bg-yellow-500'
                                        : krProgress >= 40
                                          ? 'bg-orange-500'
                                          : 'bg-red-500'
                                  }`}
                                  style={{ width: `${krProgress}%` }}
                                />
                              </div>
                              {kr.targetValue && (
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Current: {kr.currentValue || 0}</span>
                                  <span>Target: {kr.targetValue}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
