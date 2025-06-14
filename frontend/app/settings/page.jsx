'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import AISettings from '../../components/settings/AISettings';
import { Settings, Sparkles, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ai');

  // Only admin and HR can access settings
  if (!['admin', 'hr'].includes(user?.role)) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access settings.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const tabs = [
    {
      id: 'ai',
      name: 'AI Configuration',
      icon: Sparkles,
      description: 'Configure AI services and API keys'
    },
    {
      id: 'general',
      name: 'General',
      icon: Settings,
      description: 'General application settings'
    },
    {
      id: 'users',
      name: 'User Management',
      icon: User,
      description: 'User and role management settings'
    }
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500">Manage your application configuration</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'ai' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900">AI Configuration</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure AI services for review suggestions, sentiment analysis, and automated
                    scoring.
                  </p>
                </div>
                <AISettings />
              </div>
            )}

            {activeTab === 'general' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure general application settings and preferences.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                  <p className="text-gray-600">
                    General settings will be available in a future update.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900">User Management Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure user registration, roles, and permissions.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                  <p className="text-gray-600">
                    User management settings will be available in a future update.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
