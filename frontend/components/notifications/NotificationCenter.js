import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  Check,
  Clock,
  AlertCircle,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const NotificationCenter = ({ isOpen, onClose, isPageView = false }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if ((isOpen || isPageView) && user) {
      fetchNotifications();
    }
  }, [isOpen, isPageView, user]);

  // Handle scroll indicators
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;

      // Show scroll top indicator if not at top
      setShowScrollTop(scrollTop > 20);

      // Show scroll bottom indicator if not at bottom
      setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 20);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();

      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [notifications]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      console.log('Notification API response:', response.data); // Debug log
      // Handle the nested data structure from backend
      const notificationData = response.data.data || response.data;
      setNotifications(notificationData.notifications || []);
      setUnreadCount(notificationData.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === notificationId ? { ...notif, isRead: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'review_reminder':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'feedback_received':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'cycle_created':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'deadline_approaching':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'urgent') return 'border-l-red-500 bg-red-50';
    if (priority === 'high') return 'border-l-orange-500 bg-orange-50';

    switch (type) {
      case 'review_reminder':
        return 'border-l-blue-500 bg-blue-50';
      case 'feedback_received':
        return 'border-l-green-500 bg-green-50';
      case 'cycle_created':
        return 'border-l-purple-500 bg-purple-50';
      case 'deadline_approaching':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return notificationDate.toLocaleDateString();
  };

  // Render content only (for page view)
  const renderNotificationContent = () => (
    <>
      {loading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item p-4 border-l-4 ${getNotificationColor(notification.type, notification.priority)} ${
                !notification.isRead ? 'bg-opacity-100' : 'bg-opacity-50'
              } transition-colors duration-200 hover:bg-opacity-75`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm font-medium ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="ml-2 p-1 hover:bg-white hover:bg-opacity-50 rounded"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                  </div>
                  <p
                    className={`text-sm mt-1 ${
                      !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                    }`}
                  >
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        onClick={onClose}
                      >
                        View →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // For page view, return content directly
  if (isPageView) {
    return (
      <div className="h-full flex flex-col relative">
        {/* Page view header */}
        {unreadCount > 0 && (
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
            <span className="text-sm text-gray-600">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Scrollable content with indicators */}
        <div className="flex-1 overflow-hidden relative">
          {/* Scroll top indicator */}
          {showScrollTop && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white to-transparent h-8 flex items-center justify-center">
              <button
                onClick={scrollToTop}
                className="bg-white shadow-md rounded-full p-1 hover:bg-gray-50 transition-colors"
                title="Scroll to top"
              >
                <ChevronUp className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}

          <div ref={scrollContainerRef} className="h-full overflow-y-auto notification-scroll">
            {renderNotificationContent()}
          </div>

          {/* Scroll bottom indicator */}
          {showScrollBottom && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white to-transparent h-8 flex items-center justify-center">
              <button
                onClick={scrollToBottom}
                className="bg-white shadow-md rounded-full p-1 hover:bg-gray-50 transition-colors"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="flex-shrink-0 p-3 bg-gray-50 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                {notifications.length > 5 && ' • Scroll to see more'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modal view (original behavior)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose} />

      {/* Notification Panel */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800">
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Notifications List - Fixed height with scroll and indicators */}
        <div className="flex-1 overflow-hidden relative">
          {/* Scroll top indicator */}
          {showScrollTop && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white to-transparent h-6 flex items-center justify-center">
              <button
                onClick={scrollToTop}
                className="bg-white shadow-sm rounded-full p-1 hover:bg-gray-50 transition-colors"
                title="Scroll to top"
              >
                <ChevronUp className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          )}

          <div ref={scrollContainerRef} className="h-full overflow-y-auto notification-scroll">
            {renderNotificationContent()}
          </div>

          {/* Scroll bottom indicator */}
          {showScrollBottom && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white to-transparent h-6 flex items-center justify-center">
              <button
                onClick={scrollToBottom}
                className="bg-white shadow-sm rounded-full p-1 hover:bg-gray-50 transition-colors"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Footer with scroll indicator */}
        {notifications.length > 0 && (
          <div className="flex-shrink-0 p-3 bg-gray-50 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                {notifications.length > 5 && ' • Scroll to see more'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
