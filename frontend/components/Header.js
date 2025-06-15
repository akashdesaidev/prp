'use client';

import React, { useState } from 'react';
import { Menu, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import NotificationBell from './notifications/NotificationBell';
import { useMobileMenu } from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get mobile menu context with proper error handling
  const mobileMenuContext = useMobileMenu();
  const { toggleMobileMenu } = mobileMenuContext || { toggleMobileMenu: () => {} };

  // Don't show header for unauthenticated users (they see the landing page)
  if (!user) return null;

  return (
    <header className="h-14 w-full border-b border-gray-200 bg-white px-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center gap-2 text-lg font-semibold">
        {/* Mobile menu toggle - only visible on mobile */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Desktop title - hidden on mobile when menu button is shown */}
        <span className="hidden md:block">PRP Dashboard</span>

        {/* Mobile title - shown on mobile */}
        <span className="md:hidden">PRP</span>
      </div>

      <div className="flex items-center space-x-4">
        <NotificationBell />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>

                  {(user?.role === 'admin' || user?.role === 'hr') && (
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
