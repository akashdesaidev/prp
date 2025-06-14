'use client';

import React from 'react';
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
  ClipboardList
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

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const navigationItems = getNavigationItems(user.role);

  return (
    <aside className="hidden relative md:block w-64 border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900 dark:text-white">PRP</span>
        </div>

        <nav className="space-y-1">
          {navigationItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
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
    </aside>
  );
}
