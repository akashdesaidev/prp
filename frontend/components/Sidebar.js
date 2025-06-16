'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Building2,
  Users,
  Upload,
  Home,
  Target,
  Clock,
  BarChart3,
  MessageSquare,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const getNavigationItems = (role) => {
  const baseItems = [
    { href: '/', label: 'Dashboard', icon: Home, roles: ['admin', 'hr', 'manager', 'employee'] },
    { href: '/okrs', label: 'OKRs', icon: Target, roles: ['admin', 'hr', 'manager', 'employee'] },
    {
      href: '/time-tracking',
      label: 'Time Tracking',
      icon: Clock,
      roles: ['admin', 'hr', 'manager', 'employee']
    },
    {
      href: '/reviews',
      label: 'Review Cycles',
      icon: ClipboardList,
      roles: ['admin', 'hr', 'manager']
    },
    {
      href: '/reviews/my-reviews',
      label: 'My Reviews',
      icon: FileText,
      roles: ['employee', 'manager']
    },
    {
      href: '/feedback',
      label: 'Feedback',
      icon: MessageSquare,
      roles: ['admin', 'hr', 'manager', 'employee']
    }
  ];

  const adminItems = [
    { href: '/org', label: 'Organization', icon: Building2, roles: ['admin', 'hr'] },
    { href: '/users', label: 'User Management', icon: Users, roles: ['admin', 'hr'] },
    { href: '/departments', label: 'Departments', icon: Building2, roles: ['admin', 'hr'] },
    { href: '/teams', label: 'Teams', icon: Users, roles: ['admin', 'hr', 'manager'] },
    { href: '/import', label: 'Bulk Import', icon: Upload, roles: ['admin', 'hr'] },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'hr', 'manager'] }
  ];

  const settingsItems = [
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
      roles: ['admin', 'hr', 'manager', 'employee']
    },
    { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'hr'] }
  ];

  return [...baseItems, ...adminItems, ...settingsItems].filter((item) =>
    item.roles.includes(role)
  );
};

// Create a context for mobile menu state
const MobileMenuContext = React.createContext();

export const MobileMenuProvider = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <MobileMenuContext.Provider value={{ isMobileMenuOpen, toggleMobileMenu, closeMobileMenu }}>
      {children}
    </MobileMenuContext.Provider>
  );
};

export const useMobileMenu = () => {
  const context = React.useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within a MobileMenuProvider');
  }
  return context;
};

// Navigation Items Component
function NavigationItems({ navigationItems, pathname, onItemClick, isCollapsed = false }) {
  return (
    <nav className="space-y-1">
      {navigationItems.map(({ href, label, icon: Icon }) => {
        // More precise route matching to avoid conflicts
        const isActive = (() => {
          // Exact match
          if (pathname === href) return true;

          // Don't highlight parent routes when child routes are active
          if (href === '/reviews' && pathname.startsWith('/reviews/')) return false;

          // For other routes, check if pathname starts with href + '/'
          if (href !== '/' && pathname.startsWith(href + '/')) return true;

          return false;
        })();

        return (
          <Link
            key={href}
            href={href}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
            title={isCollapsed ? label : ''}
          >
            <Icon
              className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
            />
            {!isCollapsed && <span>{label}</span>}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {label}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// Mobile Menu Component
function MobileMenu({ isOpen, onClose, navigationItems, pathname, user }) {
  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onClose} />

      {/* Mobile Menu */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 z-50 md:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">PRP</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <NavigationItems
              navigationItems={navigationItems}
              pathname={pathname}
              onItemClick={onClose}
            />
          </div>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Main Sidebar Component
export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration and localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
    setIsHydrated(true);
  }, []);

  // Get mobile menu context with proper error handling
  const mobileMenuContext = useMobileMenu();
  const { isMobileMenuOpen, closeMobileMenu } = mobileMenuContext || {
    isMobileMenuOpen: false,
    closeMobileMenu: () => {}
  };

  if (!user) return null;

  const navigationItems = getNavigationItems(user.role);

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
  };

  // Prevent layout shift during hydration
  const sidebarWidth = !isHydrated ? 'w-64' : isCollapsed ? 'min-w-24' : 'min-w-64';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col ${sidebarWidth} transition-all duration-300 border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 h-screen sticky top-0 overflow-y-auto`}
      >
        {/* Collapse Toggle Button */}
        <div className="relative">
          <button
            onClick={toggleSidebar}
            className="absolute right-0 top-6 z-10 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="h-3 w-3 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-white" />
            </div>
            {(!isCollapsed || !isHydrated) && (
              <span className="text-xl font-semibold text-gray-900 dark:text-white">PRP</span>
            )}
          </div>

          {/* Navigation */}
          <NavigationItems
            navigationItems={navigationItems}
            pathname={pathname}
            onItemClick={() => {}}
            isCollapsed={isHydrated && isCollapsed}
          />
        </div>
      </aside>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        navigationItems={navigationItems}
        pathname={pathname}
        user={user}
      />
    </>
  );
}
