'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { Target, Users, Clock, BarChart3, TrendingUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function DashboardCard({ title, value, icon: Icon, href, description, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <Link href={href} className="block">
      <div
        className={`p-6 rounded-lg border-2 hover:shadow-md transition-shadow ${colorClasses[color]}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </Link>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    okrs: 0,
    timeEntries: 0,
    feedback: 0,
    reviews: 0
  });

  useEffect(() => {
    // Mock data for now - in real app, fetch from API
    setStats({
      okrs: 5,
      timeEntries: 24,
      feedback: 12,
      reviews: 3
    });
  }, []);

  const getDashboardCards = () => {
    const baseCards = [
      {
        title: 'Active OKRs',
        value: stats.okrs,
        icon: Target,
        href: '/okrs',
        description: 'Objectives & Key Results',
        color: 'blue'
      },
      {
        title: 'Time Logged',
        value: `${stats.timeEntries}h`,
        icon: Clock,
        href: '/time-tracking',
        description: 'This week',
        color: 'green'
      }
    ];

    if (user?.role === 'admin' || user?.role === 'hr') {
      baseCards.push(
        {
          title: 'Team Members',
          value: '24',
          icon: Users,
          href: '/org',
          description: 'Active employees',
          color: 'purple'
        },
        {
          title: 'Analytics',
          value: 'View',
          icon: BarChart3,
          href: '/analytics',
          description: 'Performance insights',
          color: 'orange'
        }
      );
    }

    if (user?.role === 'manager') {
      baseCards.push({
        title: 'Team Performance',
        value: '85%',
        icon: TrendingUp,
        href: '/analytics',
        description: 'Team OKR completion',
        color: 'purple'
      });
    }

    baseCards.push({
      title: 'Feedback',
      value: stats.feedback,
      icon: CheckCircle,
      href: '/feedback',
      description: 'Received this month',
      color: 'orange'
    });

    return baseCards;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.firstName}!</h1>
        <p className="text-gray-600">Here's what's happening with your performance goals today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getDashboardCards().map((card, index) => (
          <DashboardCard key={index} {...card} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/okrs" className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
            <Target className="h-5 w-5 text-blue-600 mr-3" />
            <span className="font-medium">Update OKR Progress</span>
          </Link>
          <Link
            href="/time-tracking"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
          >
            <Clock className="h-5 w-5 text-green-600 mr-3" />
            <span className="font-medium">Log Time</span>
          </Link>
          <Link
            href="/feedback"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
          >
            <CheckCircle className="h-5 w-5 text-purple-600 mr-3" />
            <span className="font-medium">Give Feedback</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-gray-600">
              Updated "Increase user engagement" OKR progress to 75%
            </span>
            <span className="text-gray-400 ml-auto">2 hours ago</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-600">Logged 4 hours on product development</span>
            <span className="text-gray-400 ml-auto">1 day ago</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            <span className="text-gray-600">Received feedback from John Doe</span>
            <span className="text-gray-400 ml-auto">2 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
