'use client';
import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  Target,
  Users,
  Settings,
  Mail,
  Share2,
  Eye,
  Plus,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdvancedTimeReporting() {
  const [reports, setReports] = useState([]);
  const [customReports, setCustomReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  const [filters, setFilters] = useState({
    dateRange: 'month',
    startDate: '',
    endDate: '',
    okrIds: [],
    categories: [],
    teamMembers: [],
    departments: []
  });

  const [reportBuilder, setReportBuilder] = useState({
    name: '',
    description: '',
    type: 'summary',
    metrics: [],
    groupBy: 'date',
    filters: {},
    visualizations: [],
    schedule: null
  });

  const predefinedReports = [
    {
      id: 'time_summary',
      name: 'Time Summary Report',
      description: 'Overview of time allocation across all activities',
      type: 'summary',
      icon: Clock,
      metrics: ['total_hours', 'category_breakdown', 'okr_distribution']
    },
    {
      id: 'productivity_analysis',
      name: 'Productivity Analysis',
      description: 'Deep dive into productivity patterns and trends',
      type: 'analysis',
      icon: TrendingUp,
      metrics: ['productivity_score', 'peak_hours', 'efficiency_trends']
    },
    {
      id: 'okr_progress',
      name: 'OKR Progress Report',
      description: 'Time allocation and progress towards objectives',
      type: 'progress',
      icon: Target,
      metrics: ['okr_hours', 'progress_rate', 'completion_forecast']
    },
    {
      id: 'team_utilization',
      name: 'Team Utilization Report',
      description: 'Team-wide time utilization and workload analysis',
      type: 'team',
      icon: Users,
      metrics: ['team_hours', 'utilization_rate', 'workload_balance']
    },
    {
      id: 'category_breakdown',
      name: 'Category Breakdown',
      description: 'Detailed breakdown by work categories',
      type: 'breakdown',
      icon: PieChart,
      metrics: ['category_hours', 'category_trends', 'category_efficiency']
    }
  ];

  const availableMetrics = [
    { id: 'total_hours', name: 'Total Hours', category: 'basic' },
    { id: 'billable_hours', name: 'Billable Hours', category: 'basic' },
    { id: 'focus_time', name: 'Focus Time', category: 'productivity' },
    { id: 'collaboration_time', name: 'Collaboration Time', category: 'productivity' },
    { id: 'meeting_time', name: 'Meeting Time', category: 'productivity' },
    { id: 'productivity_score', name: 'Productivity Score', category: 'analysis' },
    { id: 'efficiency_rate', name: 'Efficiency Rate', category: 'analysis' },
    { id: 'utilization_rate', name: 'Utilization Rate', category: 'analysis' },
    { id: 'okr_progress', name: 'OKR Progress', category: 'goals' },
    { id: 'goal_alignment', name: 'Goal Alignment', category: 'goals' },
    { id: 'team_collaboration', name: 'Team Collaboration', category: 'team' },
    { id: 'workload_balance', name: 'Workload Balance', category: 'team' }
  ];

  const visualizationTypes = [
    { id: 'bar_chart', name: 'Bar Chart', icon: BarChart3 },
    { id: 'pie_chart', name: 'Pie Chart', icon: PieChart },
    { id: 'line_chart', name: 'Line Chart', icon: TrendingUp },
    { id: 'table', name: 'Data Table', icon: FileText }
  ];

  useEffect(() => {
    fetchReports();
    fetchCustomReports();
  }, []);

  const fetchReports = async () => {
    try {
      setReports(predefinedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchCustomReports = async () => {
    try {
      const response = await api.get('/time-entries/custom-reports');
      setCustomReports(response.data || []);
    } catch (error) {
      console.error('Error fetching custom reports:', error);
      setCustomReports([]);
    }
  };

  const generateReport = async (reportConfig) => {
    try {
      setLoading(true);

      // Mock data for demo
      const mockData = {
        summary: {
          totalHours: 156.5,
          billableHours: 142.0,
          focusTime: 98.5,
          collaborationTime: 44.0,
          productivityScore: 78,
          utilizationRate: 91
        },
        categoryBreakdown: {
          direct_work: 65,
          planning: 15,
          collaboration: 12,
          review: 5,
          other: 3
        },
        okrProgress: [
          { name: 'Launch Mobile App', hours: 45, progress: 78, target: 60 },
          { name: 'Improve UX', hours: 32, progress: 65, target: 50 }
        ]
      };

      setReportData(mockData);
      setSelectedReport(reportConfig);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const scheduleReport = async (scheduleConfig) => {
    try {
      await api.post('/time-entries/schedule-report', {
        reportConfig: selectedReport,
        schedule: scheduleConfig,
        filters
      });

      toast.success('Report scheduled successfully!');
      setShowScheduler(false);
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast.error('Failed to schedule report');
    }
  };

  const saveCustomReport = async () => {
    try {
      const response = await api.post('/time-entries/custom-reports', reportBuilder);

      setCustomReports([...customReports, response.data]);
      setShowReportBuilder(false);
      setReportBuilder({
        name: '',
        description: '',
        type: 'summary',
        metrics: [],
        groupBy: 'date',
        filters: {},
        visualizations: [],
        schedule: null
      });

      toast.success('Custom report saved!');
    } catch (error) {
      console.error('Error saving custom report:', error);
      toast.error('Failed to save custom report');
    }
  };

  const renderReportList = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Standard Reports</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => generateReport(report)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">{report.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                <div className="flex flex-wrap gap-1">
                  {report.metrics.slice(0, 3).map((metric) => (
                    <span
                      key={metric}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {metric.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Custom Reports</h3>
            <Button onClick={() => setShowReportBuilder(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Custom Report
            </Button>
          </div>
        </div>

        {customReports.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Reports</h3>
            <p className="text-gray-600 mb-4">
              Create custom reports tailored to your specific needs.
            </p>
            <Button onClick={() => setShowReportBuilder(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Report
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {customReports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => generateReport(report)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{report.name}</h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Custom
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {report.metrics?.length || 0} metrics
                  </span>
                  <Button variant="outline" size="sm">
                    Generate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReportData = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{selectedReport.name}</h3>
              <p className="text-gray-600">{selectedReport.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowScheduler(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Schedule
              </Button>
              <Button
                onClick={() => exportReport('pdf')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button
                onClick={() => exportReport('csv')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Generated on {new Date().toLocaleDateString()} • Period: {filters.dateRange} •
            {Object.keys(filters).filter((key) => filters[key] && filters[key].length > 0).length}{' '}
            filters applied
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.summary?.totalHours || 0}h
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Focus Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.summary?.focusTime || 0}h
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Productivity Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.summary?.productivityScore || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Utilization Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.summary?.utilizationRate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {reportData.categoryBreakdown && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Time by Category</h4>
            <div className="space-y-4">
              {Object.entries(reportData.categoryBreakdown).map(([category, percentage]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-3 flex-1 ml-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportData.okrProgress && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">OKR Progress</h4>
            <div className="space-y-4">
              {reportData.okrProgress.map((okr, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{okr.name}</h5>
                    <span className="text-sm text-gray-600">{okr.hours}h logged</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">{okr.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        okr.progress >= 80
                          ? 'bg-green-500'
                          : okr.progress >= 60
                            ? 'bg-blue-500'
                            : okr.progress >= 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                      }`}
                      style={{ width: `${okr.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReportBuilder = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Create Custom Report</h3>
            <Button variant="outline" size="sm" onClick={() => setShowReportBuilder(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
              <input
                type="text"
                value={reportBuilder.name}
                onChange={(e) => setReportBuilder({ ...reportBuilder, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter report name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={reportBuilder.description}
                onChange={(e) =>
                  setReportBuilder({ ...reportBuilder, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Describe what this report shows"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Metrics</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableMetrics.map((metric) => (
                <label
                  key={metric.id}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={reportBuilder.metrics.includes(metric.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReportBuilder({
                          ...reportBuilder,
                          metrics: [...reportBuilder.metrics, metric.id]
                        });
                      } else {
                        setReportBuilder({
                          ...reportBuilder,
                          metrics: reportBuilder.metrics.filter((m) => m !== metric.id)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{metric.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{metric.category}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visualizations</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {visualizationTypes.map((viz) => {
                const Icon = viz.icon;
                return (
                  <label
                    key={viz.id}
                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={reportBuilder.visualizations.includes(viz.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReportBuilder({
                            ...reportBuilder,
                            visualizations: [...reportBuilder.visualizations, viz.id]
                          });
                        } else {
                          setReportBuilder({
                            ...reportBuilder,
                            visualizations: reportBuilder.visualizations.filter((v) => v !== viz.id)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-900">{viz.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
            <select
              value={reportBuilder.groupBy}
              onChange={(e) => setReportBuilder({ ...reportBuilder, groupBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="date">Date</option>
              <option value="category">Category</option>
              <option value="okr">OKR</option>
              <option value="team_member">Team Member</option>
              <option value="department">Department</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowReportBuilder(false)}>
            Cancel
          </Button>
          <Button
            onClick={saveCustomReport}
            disabled={!reportBuilder.name || reportBuilder.metrics.length === 0}
          >
            Save Report
          </Button>
        </div>
      </div>
    </div>
  );

  const renderScheduler = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Schedule Report</h3>
            <Button variant="outline" size="sm" onClick={() => setShowScheduler(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Recipients</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter email addresses (comma separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowScheduler(false)}>
            Cancel
          </Button>
          <Button onClick={() => scheduleReport({})}>Schedule Report</Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary-600" />
            Advanced Time Reports
          </h2>
          <p className="text-gray-600">Generate comprehensive time tracking reports and insights</p>
        </div>

        {selectedReport && (
          <Button
            onClick={() => {
              setSelectedReport(null);
              setReportData(null);
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Back to Reports
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <Button
            onClick={() => selectedReport && generateReport(selectedReport)}
            disabled={!selectedReport}
            className="flex items-center gap-2 mt-6"
          >
            <Filter className="h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </div>

      {selectedReport && reportData ? renderReportData() : renderReportList()}

      {showReportBuilder && renderReportBuilder()}
      {showScheduler && renderScheduler()}
    </div>
  );
}
