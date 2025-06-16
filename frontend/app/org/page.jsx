'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  UserCheck,
  TrendingUp,
  Eye,
  LayoutGrid,
  Network,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

// Dynamically import OrgChart to avoid SSR issues with ReactFlow
const OrgChart = dynamic(() => import('../../components/org/EnhancedOrgChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600">Loading organization chart...</p>
      </div>
    </div>
  )
});

export default function OrgPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    departments: 0,
    teams: 0,
    employees: 0,
    managers: 0
  });
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'grid'
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchOrgStats();
  }, []);

  const fetchOrgStats = async () => {
    try {
      const [deptResponse, teamResponse, userResponse] = await Promise.all([
        api.get('/departments'),
        api.get('/teams'),
        api.get('/users')
      ]);

      const users = userResponse.data || [];
      const managers = users.filter(
        (user) => user.role === 'manager' || user.role === 'admin' || user.role === 'hr'
      );

      setStats({
        departments: deptResponse.data?.length || 0,
        teams: teamResponse.data?.length || 0,
        employees: users.length,
        managers: managers.length
      });
    } catch (error) {
      console.error('Error fetching org stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Organization Overview</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Departments',
      value: stats.departments,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      description: 'Active departments'
    },
    {
      title: 'Teams',
      value: stats.teams,
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      description: 'Working teams'
    },
    {
      title: 'Employees',
      value: stats.employees,
      icon: UserCheck,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      description: 'Total workforce'
    },
    {
      title: 'Managers',
      value: stats.managers,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      description: 'Leadership roles'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Simple Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-md">
                  <Network className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Organization Overview</h1>
                  <p className="text-gray-600">Company structure and relationships</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex bg-white rounded-md p-1 border border-gray-200">
                <button
                  onClick={() => setViewMode('chart')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm ${
                    viewMode === 'chart'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Network className="h-4 w-4" />
                  Chart View
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm ${
                    viewMode === 'grid'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grid View
                </button>
              </div>

              <button
                onClick={() => router.push('/departments')}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-md text-sm"
              >
                <Plus className="h-4 w-4" />
                Manage Structure
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white rounded-md p-4 border border-gray-200 hover:border-gray-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-md ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.textColor}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? <div className="h-6 w-12 bg-gray-200 rounded"></div> : stat.value}
                  </p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          {/* Content Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-600" />
                <h2 className="text-base font-medium text-gray-900">
                  {viewMode === 'chart' ? 'Organization Chart' : 'Department Grid View'}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {viewMode === 'chart' && (
                  <button
                    onClick={() => setIsLocked(!isLocked)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${
                      isLocked
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                  </button>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                  Live
                </div>
              </div>
            </div>
          </div>

          {/* Chart Content */}
          <div className="p-6">
            {viewMode === 'chart' ? (
              <OrgChart />
            ) : (
              <div className="text-center py-20">
                <LayoutGrid className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Grid View</h3>
                <p className="text-gray-600 mb-6">
                  Coming soon - Alternative grid layout for organization data
                </p>
                <button
                  onClick={() => setViewMode('chart')}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Network className="h-4 w-4" />
                  Switch to Chart View
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Manage Departments',
              description: 'Create and organize departments',
              icon: Building2,
              href: '/departments'
            },
            {
              title: 'Manage Teams',
              description: 'Set up teams within departments',
              icon: Users,
              href: '/teams'
            },
            {
              title: 'User Management',
              description: 'Add and manage employees',
              icon: UserCheck,
              href: '/users'
            }
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
