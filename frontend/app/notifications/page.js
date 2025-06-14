'use client';

import React, { useState } from 'react';
import { Bell, Settings } from 'lucide-react';
import NotificationCenter from '../../components/notifications/NotificationCenter';
import NotificationPreferences from '../../components/notifications/NotificationPreferences';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('notifications');

  const tabs = [
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      component: NotificationCenter
    },
    {
      id: 'preferences',
      name: 'Preferences',
      icon: Settings,
      component: NotificationPreferences
    }
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-600">Manage your notifications and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'notifications' ? (
              <div className="max-w-4xl">
                <NotificationCenter isOpen={true} onClose={() => {}} />
              </div>
            ) : (
              <NotificationPreferences />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
