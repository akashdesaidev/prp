'use client';
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Save,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function WeeklyTimesheet() {
  const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
  const [timeEntries, setTimeEntries] = useState({});
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [weeklyTargets, setWeeklyTargets] = useState({});

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const categories = ['direct_work', 'planning', 'collaboration', 'review', 'other'];

  useEffect(() => {
    fetchData();
  }, [currentWeek]);

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  function getWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function formatDisplayDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const weekStart = formatDate(currentWeek);
      const weekEnd = formatDate(new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000));

      const [entriesResponse, okrsResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/time-entries?startDate=${weekStart}&endDate=${weekEnd}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        ),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/okrs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (entriesResponse.ok) {
        const entries = await entriesResponse.json();
        const entriesMap = {};

        entries.forEach((entry) => {
          const key = `${entry.okrId._id}-${entry.date}-${entry.category}`;
          entriesMap[key] = entry;
        });

        setTimeEntries(entriesMap);
      }

      if (okrsResponse.ok) {
        const okrsData = await okrsResponse.json();
        setOkrs(okrsData);

        // Calculate weekly targets (example: 40 hours distributed across OKRs)
        const targets = {};
        okrsData.forEach((okr) => {
          targets[okr._id] = 8; // Default 8 hours per week per OKR
        });
        setWeeklyTargets(targets);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load timesheet data');
    } finally {
      setLoading(false);
    }
  };

  const getEntryKey = (okrId, date, category) => {
    return `${okrId}-${formatDate(date)}-${category}`;
  };

  const getEntryValue = (okrId, date, category) => {
    const key = getEntryKey(okrId, date, category);
    return timeEntries[key]?.hoursSpent || '';
  };

  const updateEntry = async (okrId, date, category, hours, description = '') => {
    const key = getEntryKey(okrId, date, category);
    const existingEntry = timeEntries[key];

    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');

      const payload = {
        okrId,
        date: formatDate(date),
        hoursSpent: parseFloat(hours) || 0,
        category,
        description: description || `${category.replace('_', ' ')} work`
      };

      let response;
      if (existingEntry) {
        // Update existing entry
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/time-entries/${existingEntry._id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        );
      } else {
        // Create new entry
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/time-entries`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const updatedEntry = await response.json();
        setTimeEntries((prev) => ({
          ...prev,
          [key]: updatedEntry
        }));
        toast.success('Time entry updated');
      } else {
        throw new Error('Failed to save entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to save time entry');
    } finally {
      setSaving(false);
    }
  };

  const getTotalHoursForDay = (date) => {
    let total = 0;
    okrs.forEach((okr) => {
      categories.forEach((category) => {
        const hours = getEntryValue(okr._id, date, category);
        if (hours) total += parseFloat(hours);
      });
    });
    return total;
  };

  const getTotalHoursForOKR = (okrId) => {
    let total = 0;
    getWeekDates(currentWeek).forEach((date) => {
      categories.forEach((category) => {
        const hours = getEntryValue(okrId, date, category);
        if (hours) total += parseFloat(hours);
      });
    });
    return total;
  };

  const getTotalHoursForWeek = () => {
    let total = 0;
    getWeekDates(currentWeek).forEach((date) => {
      total += getTotalHoursForDay(date);
    });
    return total;
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + direction * 7);
    setCurrentWeek(newWeek);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'direct_work':
        return 'bg-blue-50 border-blue-200';
      case 'planning':
        return 'bg-purple-50 border-purple-200';
      case 'collaboration':
        return 'bg-green-50 border-green-200';
      case 'review':
        return 'bg-orange-50 border-orange-200';
      case 'other':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const isOverAllocated = (date) => {
    const total = getTotalHoursForDay(date);
    return total > 8; // Assuming 8 hours is the daily limit
  };

  const isUnderAllocated = (okrId) => {
    const total = getTotalHoursForOKR(okrId);
    const target = weeklyTargets[okrId] || 0;
    return total < target * 0.8; // Less than 80% of target
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Weekly Timesheet</h2>
              <p className="text-sm text-gray-600">
                Week of {formatDisplayDate(currentWeek)} -{' '}
                {formatDisplayDate(new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek(-1)}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(getStartOfWeek(new Date()))}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek(1)}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary-50 rounded-lg p-3">
            <div className="text-sm text-primary-600 font-medium">Total Hours</div>
            <div className="text-2xl font-bold text-primary-900">
              {getTotalHoursForWeek().toFixed(1)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600 font-medium">Target Hours</div>
            <div className="text-2xl font-bold text-green-900">40.0</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-sm text-orange-600 font-medium">Utilization</div>
            <div className="text-2xl font-bold text-orange-900">
              {((getTotalHoursForWeek() / 40) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-purple-600 font-medium">Active OKRs</div>
            <div className="text-2xl font-bold text-purple-900">{okrs.length}</div>
          </div>
        </div>
      </div>

      {/* Timesheet Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 font-medium text-gray-900 min-w-[200px]">
                OKR / Category
              </th>
              {getWeekDates(currentWeek).map((date, index) => (
                <th key={index} className="text-center p-4 font-medium text-gray-900 min-w-[100px]">
                  <div className="flex flex-col items-center">
                    <div className="text-sm">{weekDays[index]}</div>
                    <div className="text-xs text-gray-500">{formatDisplayDate(date)}</div>
                    {isOverAllocated(date) && (
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                    )}
                  </div>
                </th>
              ))}
              <th className="text-center p-4 font-medium text-gray-900 min-w-[80px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {okrs.map((okr) => (
              <React.Fragment key={okr._id}>
                {/* OKR Header Row */}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td className="p-4 font-medium text-gray-900" colSpan={9}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded">
                          {okr.type}
                        </span>
                        <span>{okr.title}</span>
                        {isUnderAllocated(okr._id) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getTotalHoursForOKR(okr._id).toFixed(1)}h /{' '}
                        {parseFloat(weeklyTargets[okr._id] || 0).toFixed(1)}h target
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Category Rows */}
                {categories.map((category) => (
                  <tr
                    key={`${okr._id}-${category}`}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-4 pl-8">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getCategoryColor(category).split(' ')[0].replace('bg-', 'bg-').replace('-50', '-400')}`}
                        ></div>
                        <span className="text-sm text-gray-700 capitalize">
                          {category.replace('_', ' ')}
                        </span>
                      </div>
                    </td>

                    {getWeekDates(currentWeek).map((date, dayIndex) => {
                      const cellKey = `${okr._id}-${formatDate(date)}-${category}`;
                      const value = getEntryValue(okr._id, date, category);
                      const isEditing = editingCell === cellKey;

                      return (
                        <td key={dayIndex} className="p-2 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="24"
                              value={value}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                if (
                                  newValue === '' ||
                                  (parseFloat(newValue) >= 0 && parseFloat(newValue) <= 24)
                                ) {
                                  updateEntry(okr._id, date, category, newValue);
                                }
                              }}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              className="w-16 px-2 py-1 text-center border border-primary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() => setEditingCell(cellKey)}
                              className={`w-16 h-8 mx-auto flex items-center justify-center rounded cursor-pointer transition-colors ${
                                value ? getCategoryColor(category) : 'hover:bg-gray-100'
                              } ${value ? 'border' : 'border border-transparent hover:border-gray-300'}`}
                            >
                              {value ? (
                                <span className="text-sm font-medium">{value}</span>
                              ) : (
                                <Plus className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td className="p-4 text-center font-medium">
                      {categories
                        .reduce((total, cat) => {
                          if (cat === category) {
                            return getWeekDates(currentWeek).reduce((catTotal, date) => {
                              const hours = getEntryValue(okr._id, date, category);
                              return catTotal + (parseFloat(hours) || 0);
                            }, 0);
                          }
                          return total;
                        }, 0)
                        .toFixed(1)}
                      h
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* Daily Totals Row */}
            <tr className="bg-gray-100 border-t-2 border-gray-300 font-medium">
              <td className="p-4 text-gray-900">Daily Totals</td>
              {getWeekDates(currentWeek).map((date, index) => {
                const total = getTotalHoursForDay(date);
                return (
                  <td
                    key={index}
                    className={`p-4 text-center ${
                      total > 8 ? 'text-red-600' : total < 6 ? 'text-yellow-600' : 'text-green-600'
                    }`}
                  >
                    {total.toFixed(1)}h
                  </td>
                );
              })}
              <td className="p-4 text-center text-primary-600 font-bold">
                {getTotalHoursForWeek().toFixed(1)}h
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span>Over 8h/day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span>Under target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span>On track</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Click any cell to edit • Auto-saves on change</span>
          </div>
        </div>
      </div>
    </div>
  );
}
