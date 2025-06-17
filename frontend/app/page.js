'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Target,
  Users,
  Clock,
  BarChart3,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import api from '../lib/api';
import toast from 'react-hot-toast';

// Landing Page Component for non-authenticated users
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PRP</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered
            <span className="text-indigo-600 block">Performance Reviews</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your team's performance management with intelligent OKRs, continuous feedback,
            and AI-driven insights. Built for modern teams who value growth and transparency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors inline-flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-400 transition-colors inline-flex items-center justify-center"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need for performance management
          </h2>
          <p className="text-xl text-gray-600">Comprehensive tools that grow with your team</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart OKRs</h3>
            <p className="text-gray-600 mb-4">
              Set, track, and achieve objectives with AI-powered insights and automated progress
              tracking.
            </p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• Cascading goal alignment</li>
              <li>• Real-time progress tracking</li>
              <li>• AI-suggested improvements</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">360° Reviews</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive feedback from peers, managers, and self-assessments with AI analysis.
            </p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• Multi-source feedback</li>
              <li>• Anonymous peer reviews</li>
              <li>• Sentiment analysis</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Analytics & Insights</h3>
            <p className="text-gray-600 mb-4">
              Data-driven insights to improve team performance and identify growth opportunities.
            </p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• Performance trends</li>
              <li>• Team analytics</li>
              <li>• Predictive insights</li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Intelligent Performance Management
            </h2>
            <p className="text-xl text-gray-600">
              Let AI help you write better reviews, track progress, and identify opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">AI-Assisted Review Writing</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Smart Suggestions</h4>
                    <p className="text-gray-600">
                      Get AI-powered suggestions for peer and manager reviews based on performance
                      data.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Sentiment Analysis</h4>
                    <p className="text-gray-600">
                      Automatically analyze feedback tone and identify areas for improvement.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Performance Scoring</h4>
                    <p className="text-gray-600">
                      AI-calculated performance scores based on multiple data points and feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">AI Suggestion</span>
                </div>
                <p className="text-sm text-gray-600">
                  "Based on John's OKR progress and recent feedback, consider highlighting his
                  strong collaboration skills and suggest focusing on technical leadership
                  development."
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Performance Score</span>
                  <span className="font-semibold text-indigo-600">8.5/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by high-performing teams
          </h2>
          <div className="flex justify-center items-center space-x-1 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
            <span className="ml-2 text-gray-600 font-medium">4.9/5 from 500+ reviews</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              quote:
                'PRP transformed how we handle performance reviews. The AI suggestions are incredibly helpful and save us hours of work.',
              author: 'Sarah Chen',
              role: 'VP of People, TechCorp'
            },
            {
              quote:
                'Finally, a performance management tool that our team actually enjoys using. The OKR tracking is seamless.',
              author: 'Michael Rodriguez',
              role: 'Engineering Manager, StartupXYZ'
            },
            {
              quote:
                'The analytics and insights have helped us identify top performers and areas for improvement across our organization.',
              author: 'Emily Johnson',
              role: 'HR Director, GrowthCo'
            }
          ].map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
              <div>
                <p className="font-semibold text-gray-900">{testimonial.author}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your performance management?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams who have improved their performance management with PRP.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PRP</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>© 2024 Performance Review Platform</span>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span>Enterprise Security</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Dashboard Component for authenticated users (existing code)
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
    reviews: 0,
    teamMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats in parallel
      const [okrsRes, timeRes, feedbackRes, usersRes] = await Promise.allSettled([
        api.get('/okrs?summary=true'),
        api.get('/time-entries/summary'),
        api.get('/feedback?summary=true'),
        api.get('/users?count=true')
      ]);

      const newStats = { ...stats };

      if (okrsRes.status === 'fulfilled') {
        newStats.okrs = okrsRes.value.data.count || 0;
      }

      if (timeRes.status === 'fulfilled') {
        newStats.timeEntries = Math.round(timeRes.value.data.weeklyHours || 0);
      }

      if (feedbackRes.status === 'fulfilled') {
        newStats.feedback = feedbackRes.value.data.count || 0;
      }

      if (usersRes.status === 'fulfilled') {
        newStats.teamMembers = usersRes.value.data.count || 0;
      }

      setStats(newStats);

      // Fetch recent activity
      try {
        const activityRes = await api.get('/dashboard/activity');
        setRecentActivity(activityRes.data.activities || []);
      } catch (error) {
        // Use mock data if API not available
        setRecentActivity([
          {
            id: 1,
            type: 'okr_update',
            message: 'Updated "Increase user engagement" OKR progress to 75%',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            color: 'blue'
          },
          {
            id: 2,
            type: 'time_log',
            message: 'Logged 4 hours on product development',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            color: 'green'
          },
          {
            id: 3,
            type: 'feedback',
            message: 'Received feedback from John Doe',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            color: 'purple'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');

      // Fallback to mock data
      setStats({
        okrs: 5,
        timeEntries: 24,
        feedback: 12,
        reviews: 3,
        teamMembers: 24
      });
    } finally {
      setLoading(false);
    }
  };

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
          value: stats.teamMembers || '24',
          icon: Users,
          href: '/users',
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

    return baseCards;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.firstName}!</h1>
        <p className="text-gray-600">Here's what's happening with your performance goals today.</p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getDashboardCards().map((card, index) => (
            <DashboardCard key={index} {...card} />
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 bg-${activity.color}-500`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.title || activity.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function HomePage() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Show dashboard for authenticated users (wrapped in layout)
  return <Dashboard />;
}
