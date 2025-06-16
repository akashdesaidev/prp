'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const TimeTrackerContext = createContext();

export const useTimeTracker = () => {
  const context = useContext(TimeTrackerContext);
  if (!context) {
    throw new Error('useTimeTracker must be used within a TimeTrackerProvider');
  }
  return context;
};

export const TimeTrackerProvider = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedOkr, setSelectedOkr] = useState(null);
  const [selectedKeyResult, setSelectedKeyResult] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('direct_work');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const intervalRef = useRef(null);
  const notificationRef = useRef(null);

  // Utility functions
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (!isTracking) return 'text-gray-600';
    if (elapsedTime > 4 * 60 * 60 * 1000) return 'text-red-600'; // Over 4 hours
    if (elapsedTime > 2 * 60 * 60 * 1000) return 'text-orange-600'; // Over 2 hours
    return 'text-green-600';
  };

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('globalTimeTrackingSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setIsTracking(true);
        setStartTime(new Date(session.startTime));
        setSelectedOkr(session.selectedOkr);
        setSelectedKeyResult(session.selectedKeyResult);
        setDescription(session.description);
        setCategory(session.category);

        // Calculate elapsed time from saved start time
        const elapsed = Date.now() - new Date(session.startTime).getTime();
        setElapsedTime(elapsed);
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem('globalTimeTrackingSession');
      }
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (notificationRef.current) {
        clearTimeout(notificationRef.current);
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (isTracking && startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime.getTime();
        setElapsedTime(elapsed);

        // Update localStorage with current elapsed time
        const session = {
          startTime: startTime.toISOString(),
          selectedOkr,
          selectedKeyResult,
          description,
          category,
          elapsedTime: elapsed
        };
        localStorage.setItem('globalTimeTrackingSession', JSON.stringify(session));
      }, 1000);

      // Set up periodic notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        notificationRef.current = setTimeout(
          () => {
            new Notification('Time Tracker', {
              body: `You've been tracking time for ${formatTime(elapsedTime)}`,
              icon: '/favicon.ico'
            });
          },
          30 * 60 * 1000
        ); // 30 minutes
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (notificationRef.current) {
        clearTimeout(notificationRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (notificationRef.current) {
        clearTimeout(notificationRef.current);
      }
    };
  }, [isTracking, startTime, selectedOkr, selectedKeyResult, description, category]);

  const startTracking = (okr, keyResult = null, desc = '', cat = 'direct_work') => {
    if (!okr) {
      toast.error('Please select an OKR to track time against');
      return false;
    }

    const now = new Date();
    setStartTime(now);
    setIsTracking(true);
    setElapsedTime(0);
    setSelectedOkr(okr);
    setSelectedKeyResult(keyResult);
    setDescription(desc);
    setCategory(cat);

    // Save session to localStorage
    const session = {
      startTime: now.toISOString(),
      selectedOkr: okr,
      selectedKeyResult: keyResult,
      description: desc,
      category: cat,
      elapsedTime: 0
    };
    localStorage.setItem('globalTimeTrackingSession', JSON.stringify(session));

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    toast.success('Time tracking started!');
    return true;
  };

  const pauseTracking = () => {
    setIsTracking(false);
    localStorage.removeItem('globalTimeTrackingSession');

    if (notificationRef.current) {
      clearTimeout(notificationRef.current);
    }

    toast('Time tracking paused', {
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#ffffff'
      }
    });
  };

  const stopTracking = () => {
    if (elapsedTime < 60000) {
      // Less than 1 minute
      toast.error('Minimum tracking time is 1 minute');
      return false;
    }

    setIsTracking(false);
    setShowSaveDialog(true);
    localStorage.removeItem('globalTimeTrackingSession');
    return true;
  };

  const saveTimeEntry = async (finalDescription = null) => {
    try {
      const hours = elapsedTime / (1000 * 60 * 60); // Convert to hours

      const payload = {
        okrId: selectedOkr._id,
        keyResultId: selectedKeyResult?._id,
        date: new Date().toISOString().split('T')[0],
        hoursSpent: Math.round(hours * 100) / 100, // Round to 2 decimal places
        description:
          finalDescription ||
          description ||
          `${category.replace('_', ' ')} work on ${selectedOkr.title}`,
        category
      };

      await api.post('/time-entries', payload);

      toast.success(`Time entry saved: ${formatTime(elapsedTime)}`);

      // Reset tracker
      resetTracker();
      return true;
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast.error('Failed to save time entry');
      return false;
    }
  };

  const resetTracker = () => {
    setStartTime(null);
    setElapsedTime(0);
    setSelectedOkr(null);
    setSelectedKeyResult(null);
    setDescription('');
    setCategory('direct_work');
    setShowSaveDialog(false);
    setIsTracking(false);
    localStorage.removeItem('globalTimeTrackingSession');
  };

  const updateDescription = (newDescription) => {
    setDescription(newDescription);
  };

  const value = {
    // State
    isTracking,
    startTime,
    elapsedTime,
    selectedOkr,
    selectedKeyResult,
    description,
    category,
    showSaveDialog,

    // Actions
    startTracking,
    pauseTracking,
    stopTracking,
    saveTimeEntry,
    resetTracker,
    updateDescription,
    setShowSaveDialog,

    // Utilities
    formatTime,
    getTimerColor
  };

  return <TimeTrackerContext.Provider value={value}>{children}</TimeTrackerContext.Provider>;
};
