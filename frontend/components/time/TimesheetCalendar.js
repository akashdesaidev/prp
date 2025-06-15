'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function TimesheetCalendar({ onDateSelect, onEntryClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeEntries, setTimeEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  useEffect(() => {
    fetchTimeEntries();
  }, [currentDate]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const response = await api.get('/time-entries', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });

      // Group entries by date
      const entriesMap = {};
      (response.data || []).forEach((entry) => {
        const date = entry.date.split('T')[0];
        if (!entriesMap[date]) {
          entriesMap[date] = [];
        }
        entriesMap[date].push(entry);
      });

      setTimeEntries(entriesMap);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getTotalHoursForDate = (date) => {
    const dateStr = formatDate(date);
    const entries = timeEntries[dateStr] || [];
    return entries.reduce((sum, entry) => sum + entry.hoursSpent, 0);
  };

  const getHoursColor = (hours) => {
    if (hours === 0) return 'bg-gray-100 text-gray-400';
    if (hours < 4) return 'bg-red-100 text-red-600';
    if (hours < 6) return 'bg-yellow-100 text-yellow-600';
    if (hours < 8) return 'bg-blue-100 text-blue-600';
    if (hours <= 10) return 'bg-green-100 text-green-600';
    return 'bg-purple-100 text-purple-600';
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };

  const handleDateClick = (date) => {
    if (isFutureDate(date)) return;

    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleViewEntries = (date, e) => {
    e.stopPropagation();
    const dateStr = formatDate(date);
    const entries = timeEntries[dateStr] || [];

    if (onEntryClick) {
      onEntryClick(entries, date);
    }
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timesheet Calendar
          </h3>
          <div className="text-sm text-gray-600">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)} className="p-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth(1)} className="p-2">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-100 rounded"></div>
          <span className="text-gray-600">No time</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 rounded"></div>
          <span className="text-gray-600">&lt; 4h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-100 rounded"></div>
          <span className="text-gray-600">4-6h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 rounded"></div>
          <span className="text-gray-600">6-8h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span className="text-gray-600">8-10h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-100 rounded"></div>
          <span className="text-gray-600">&gt; 10h</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500 border-b border-gray-200"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2 h-20"></div>;
          }

          const totalHours = getTotalHoursForDate(date);
          const dateStr = formatDate(date);
          const entries = timeEntries[dateStr] || [];
          const isSelected = selectedDate && formatDate(selectedDate) === dateStr;
          const isHovered = hoveredDate && formatDate(hoveredDate) === dateStr;

          return (
            <div
              key={dateStr}
              className={`
                relative p-2 h-20 border border-gray-200 cursor-pointer transition-all duration-200
                ${isToday(date) ? 'ring-2 ring-primary-500' : ''}
                ${isSelected ? 'bg-primary-50 border-primary-300' : ''}
                ${isHovered ? 'bg-gray-50' : ''}
                ${isWeekend(date) ? 'bg-gray-25' : ''}
                ${isFutureDate(date) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
              `}
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {/* Date number */}
              <div
                className={`text-sm font-medium ${isToday(date) ? 'text-primary-600' : 'text-gray-900'}`}
              >
                {date.getDate()}
              </div>

              {/* Hours indicator */}
              {totalHours > 0 && (
                <div
                  className={`
                  absolute top-1 right-1 px-1 py-0.5 rounded text-xs font-medium
                  ${getHoursColor(totalHours)}
                `}
                >
                  {totalHours}h
                </div>
              )}

              {/* Entry count indicator */}
              {entries.length > 0 && (
                <div className="absolute bottom-1 left-1 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">{entries.length}</span>
                </div>
              )}

              {/* View entries button */}
              {entries.length > 0 && (isHovered || isSelected) && (
                <button
                  onClick={(e) => handleViewEntries(date, e)}
                  className="absolute bottom-1 right-1 p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
                  title="View entries"
                >
                  <Eye className="h-3 w-3 text-gray-600" />
                </button>
              )}

              {/* Loading indicator */}
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h4>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{getTotalHoursForDate(selectedDate)}h logged</span>
            </div>
          </div>

          {timeEntries[formatDate(selectedDate)]?.length > 0 ? (
            <div className="space-y-2">
              {timeEntries[formatDate(selectedDate)].map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="font-medium">{entry.okrId?.title || 'Unknown OKR'}</span>
                    <span className="text-gray-500">({entry.category.replace('_', ' ')})</span>
                  </div>
                  <span className="font-medium">{entry.hoursSpent}h</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No time entries for this date</p>
          )}
        </div>
      )}
    </div>
  );
}
