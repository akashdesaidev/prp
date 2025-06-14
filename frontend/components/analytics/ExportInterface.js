'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import {
  Download,
  FileText,
  Table,
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ExportInterface({ dateRange, userRole }) {
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    includeTeamData: true,
    includeFeedbackData: true,
    includeOkrData: true,
    includeSentimentAnalysis: true,
    includeUserDetails: userRole === 'admin' || userRole === 'hr'
  });

  const handleExport = async (exportType) => {
    try {
      setLoading(true);
      setExportStatus(null);

      const token = localStorage.getItem('accessToken');
      const requestData = {
        type: exportType,
        dateRange,
        options: exportOptions
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/analytics/export`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `analytics-export-${Date.now()}.${exportOptions.format}`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus({ type: 'success', message: 'Export completed successfully!' });
    } catch (error) {
      setExportStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (option, value) => {
    setExportOptions((prev) => ({
      ...prev,
      [option]: value
    }));
  };

  const exportTypes = [
    {
      id: 'team-performance',
      title: 'Team Performance Report',
      description:
        'Detailed team analytics including OKR scores, feedback ratings, and performance metrics',
      icon: Table,
      estimatedSize: '50-200 KB'
    },
    {
      id: 'feedback-trends',
      title: 'Feedback Trends Report',
      description: 'Time-based feedback analysis with sentiment trends and rating patterns',
      icon: FileText,
      estimatedSize: '20-100 KB'
    },
    {
      id: 'complete-analytics',
      title: 'Complete Analytics Export',
      description: 'Full analytics dataset including all metrics, trends, and detailed breakdowns',
      icon: Download,
      estimatedSize: '100-500 KB'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Export Analytics Data</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>
            {dateRange.startDate} to {dateRange.endDate}
          </span>
        </div>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Export Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportOptions.format === 'csv'}
                  onChange={(e) => handleOptionChange('format', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">CSV</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={exportOptions.format === 'json'}
                  onChange={(e) => handleOptionChange('format', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">JSON</span>
              </label>
            </div>
          </div>

          {/* Data Inclusion Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Include Data</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTeamData}
                  onChange={(e) => handleOptionChange('includeTeamData', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Team Performance Data</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeFeedbackData}
                  onChange={(e) => handleOptionChange('includeFeedbackData', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Feedback Data</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeOkrData}
                  onChange={(e) => handleOptionChange('includeOkrData', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">OKR Data</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSentimentAnalysis}
                  onChange={(e) => handleOptionChange('includeSentimentAnalysis', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Sentiment Analysis</span>
              </label>
              {(userRole === 'admin' || userRole === 'hr') && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeUserDetails}
                    onChange={(e) => handleOptionChange('includeUserDetails', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">User Details (Admin/HR only)</span>
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Status */}
      {exportStatus && (
        <Card
          className={`border-l-4 ${
            exportStatus.type === 'success'
              ? 'border-green-500 bg-green-50'
              : 'border-red-500 bg-red-50'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {exportStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  exportStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {exportStatus.message}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportTypes.map((exportType) => {
          const Icon = exportType.icon;
          return (
            <Card key={exportType.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{exportType.title}</h3>
                    <p className="text-xs text-gray-500">{exportType.estimatedSize}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{exportType.description}</p>

                <button
                  onClick={() => handleExport(exportType.id)}
                  disabled={loading}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>{loading ? 'Exporting...' : 'Export'}</span>
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Export Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Export Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>CSV Format:</strong> Best for spreadsheet applications (Excel, Google
                Sheets). Includes headers and is optimized for data analysis.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>JSON Format:</strong> Best for technical analysis or importing into other
                systems. Preserves data structure and relationships.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Data Privacy:</strong> Exported data includes only information you have
                permission to view. Personal identifiable information is excluded unless explicitly
                authorized.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>File Size:</strong> Large exports may take longer to process. Consider
                filtering by date range for better performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
