'use client';
import { useState, useEffect } from 'react';
import { Target, Clock, Save, Plus, Trash2, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function TimeAllocationPlanner() {
  const [okrs, setOkrs] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalWeeklyHours, setTotalWeeklyHours] = useState(40);
  const [planningPeriod, setPlanningPeriod] = useState('week');
  const [showAddAllocation, setShowAddAllocation] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const [okrsResponse, allocationsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/okrs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-allocations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (okrsResponse.ok) {
        const okrsData = await okrsResponse.json();
        setOkrs(okrsData);
      }

      if (allocationsResponse.ok) {
        const allocationsData = await allocationsResponse.json();
        setAllocations(allocationsData);
      } else {
        // If no allocations exist, create default ones
        const defaultAllocations = okrs.map((okr) => ({
          okrId: okr._id,
          okrTitle: okr.title,
          weeklyHours: 0,
          priority: 'medium',
          category: 'direct_work',
          isActive: true
        }));
        setAllocations(defaultAllocations);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load allocation data');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationChange = (index, field, value) => {
    const newAllocations = [...allocations];
    newAllocations[index] = {
      ...newAllocations[index],
      [field]: value
    };
    setAllocations(newAllocations);
  };

  const addAllocation = () => {
    const newAllocation = {
      okrId: '',
      okrTitle: '',
      weeklyHours: 0,
      priority: 'medium',
      category: 'direct_work',
      isActive: true,
      isNew: true
    };
    setAllocations([...allocations, newAllocation]);
    setShowAddAllocation(false);
  };

  const removeAllocation = (index) => {
    const newAllocations = allocations.filter((_, i) => i !== index);
    setAllocations(newAllocations);
  };

  const saveAllocations = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');

      // Validate allocations
      const totalAllocated = allocations.reduce(
        (sum, alloc) => sum + (parseFloat(alloc.weeklyHours) || 0),
        0
      );

      if (totalAllocated > totalWeeklyHours) {
        toast.error(
          `Total allocation (${totalAllocated}h) exceeds available hours (${totalWeeklyHours}h)`
        );
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-allocations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          allocations: allocations.filter((alloc) => alloc.okrId && alloc.weeklyHours > 0),
          totalWeeklyHours,
          planningPeriod
        })
      });

      if (response.ok) {
        toast.success('Time allocations saved successfully!');
        fetchData(); // Refresh data
      } else {
        throw new Error('Failed to save allocations');
      }
    } catch (error) {
      console.error('Error saving allocations:', error);
      toast.error('Failed to save time allocations');
    } finally {
      setSaving(false);
    }
  };

  const getTotalAllocated = () => {
    return allocations.reduce((sum, alloc) => sum + (parseFloat(alloc.weeklyHours) || 0), 0);
  };

  const getRemainingHours = () => {
    return totalWeeklyHours - getTotalAllocated();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'direct_work':
        return '🎯';
      case 'planning':
        return '📋';
      case 'collaboration':
        return '🤝';
      case 'review':
        return '👀';
      case 'other':
        return '📝';
      default:
        return '⏰';
    }
  };

  const generateRecommendations = () => {
    const recommendations = [];
    const totalAllocated = getTotalAllocated();

    if (totalAllocated < totalWeeklyHours * 0.8) {
      recommendations.push({
        type: 'underutilized',
        message:
          'You have unallocated time. Consider adding more focus areas or increasing existing allocations.',
        action: 'Add more allocations'
      });
    }

    if (totalAllocated > totalWeeklyHours) {
      recommendations.push({
        type: 'overallocated',
        message: "You've allocated more time than available. Consider reducing some allocations.",
        action: 'Reduce allocations'
      });
    }

    const highPriorityHours = allocations
      .filter((alloc) => alloc.priority === 'high')
      .reduce((sum, alloc) => sum + (parseFloat(alloc.weeklyHours) || 0), 0);

    if (highPriorityHours < totalAllocated * 0.6) {
      recommendations.push({
        type: 'priority',
        message: 'Consider allocating more time to high-priority objectives.',
        action: 'Increase high-priority time'
      });
    }

    return recommendations;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recommendations = generateRecommendations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Time Allocation Planner</h2>
              <p className="text-sm text-gray-600">
                Plan and manage your weekly time allocation across OKRs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Weekly Hours:</label>
              <input
                type="number"
                min="1"
                max="80"
                value={totalWeeklyHours}
                onChange={(e) => setTotalWeeklyHours(parseInt(e.target.value) || 40)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button onClick={saveAllocations} disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Plan'}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-primary-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" />
              <div>
                <div className="text-sm text-primary-600 font-medium">Total Allocated</div>
                <div className="text-xl font-bold text-primary-900">
                  {getTotalAllocated().toFixed(1)}h
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-lg p-4 ${getRemainingHours() >= 0 ? 'bg-green-50' : 'bg-red-50'}`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <div
                  className={`text-sm font-medium ${getRemainingHours() >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  Remaining
                </div>
                <div
                  className={`text-xl font-bold ${getRemainingHours() >= 0 ? 'text-green-900' : 'text-red-900'}`}
                >
                  {getRemainingHours().toFixed(1)}h
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm text-blue-600 font-medium">Utilization</div>
                <div className="text-xl font-bold text-blue-900">
                  {((getTotalAllocated() / totalWeeklyHours) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-sm text-purple-600 font-medium">Active OKRs</div>
                <div className="text-xl font-bold text-purple-900">
                  {allocations.filter((alloc) => alloc.isActive && alloc.weeklyHours > 0).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Time Allocations</h3>
            <Button onClick={addAllocation} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Allocation
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">OKR</th>
                <th className="text-left p-4 font-medium text-gray-900">Category</th>
                <th className="text-left p-4 font-medium text-gray-900">Priority</th>
                <th className="text-left p-4 font-medium text-gray-900">Weekly Hours</th>
                <th className="text-left p-4 font-medium text-gray-900">Daily Avg</th>
                <th className="text-left p-4 font-medium text-gray-900">% of Total</th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allocations.map((allocation, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-4">
                    <select
                      value={allocation.okrId}
                      onChange={(e) => {
                        const selectedOkr = okrs.find((okr) => okr._id === e.target.value);
                        handleAllocationChange(index, 'okrId', e.target.value);
                        handleAllocationChange(index, 'okrTitle', selectedOkr?.title || '');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select OKR</option>
                      {okrs.map((okr) => (
                        <option key={okr._id} value={okr._id}>
                          {okr.title} ({okr.type})
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-4">
                    <select
                      value={allocation.category}
                      onChange={(e) => handleAllocationChange(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="direct_work">🎯 Direct Work</option>
                      <option value="planning">📋 Planning</option>
                      <option value="collaboration">🤝 Collaboration</option>
                      <option value="review">👀 Review</option>
                      <option value="other">📝 Other</option>
                    </select>
                  </td>

                  <td className="p-4">
                    <select
                      value={allocation.priority}
                      onChange={(e) => handleAllocationChange(index, 'priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </td>

                  <td className="p-4">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="40"
                      value={allocation.weeklyHours}
                      onChange={(e) => handleAllocationChange(index, 'weeklyHours', e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center"
                    />
                  </td>

                  <td className="p-4 text-gray-600">
                    {((parseFloat(allocation.weeklyHours) || 0) / 5).toFixed(1)}h
                  </td>

                  <td className="p-4 text-gray-600">
                    {getTotalAllocated() > 0
                      ? (
                          ((parseFloat(allocation.weeklyHours) || 0) / getTotalAllocated()) *
                          100
                        ).toFixed(0)
                      : 0}
                    %
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(allocation.priority)}`}
                      >
                        {allocation.priority}
                      </span>
                      {allocation.isActive && (
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={allocation.isActive}
                          onChange={(e) =>
                            handleAllocationChange(index, 'isActive', e.target.checked)
                          }
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Active</span>
                      </label>
                      <button
                        onClick={() => removeAllocation(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.type === 'overallocated'
                    ? 'bg-red-50 border-red-400'
                    : rec.type === 'underutilized'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-blue-50 border-blue-400'
                }`}
              >
                <p className="text-sm text-gray-700">{rec.message}</p>
                <button className="text-xs text-primary-600 hover:text-primary-700 mt-2 font-medium">
                  {rec.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Allocation Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocation Visualization</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>0h</span>
            <span>{parseFloat(totalWeeklyHours).toFixed(1)}h</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
            {
              allocations
                .filter((alloc) => alloc.weeklyHours > 0)
                .reduce(
                  (acc, alloc, index) => {
                    const percentage = (parseFloat(alloc.weeklyHours) / totalWeeklyHours) * 100;
                    const colors = [
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-purple-500',
                      'bg-orange-500',
                      'bg-red-500'
                    ];
                    const color = colors[index % colors.length];

                    acc.elements.push(
                      <div
                        key={index}
                        className={`h-full ${color} flex items-center justify-center text-white text-xs font-medium`}
                        style={{ width: `${percentage}%` }}
                        title={`${alloc.okrTitle}: ${parseFloat(alloc.weeklyHours).toFixed(1)}h`}
                      >
                        {percentage > 10 ? `${parseFloat(alloc.weeklyHours).toFixed(1)}h` : ''}
                      </div>
                    );

                    return acc;
                  },
                  { elements: [] }
                ).elements
            }
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allocations
              .filter((alloc) => alloc.weeklyHours > 0)
              .map((alloc, index) => {
                const colors = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-purple-500',
                  'bg-orange-500',
                  'bg-red-500'
                ];
                const color = colors[index % colors.length];

                return (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className="text-sm text-gray-700 truncate">
                      {alloc.okrTitle} ({parseFloat(alloc.weeklyHours).toFixed(1)}h)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
