'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Sparkles, TestTube, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AISettings() {
  const [settings, setSettings] = useState({
    openaiApiKey: '',
    geminiApiKey: '',
    hasOpenAI: false,
    hasGemini: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showKeys, setShowKeys] = useState({
    openai: false,
    gemini: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/ai');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching AI settings:', error);
      toast.error('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleShowKey = (keyType) => {
    setShowKeys((prev) => ({
      ...prev,
      [keyType]: !prev[keyType]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/settings/ai', {
        openaiApiKey: settings.openaiApiKey,
        geminiApiKey: settings.geminiApiKey
      });

      if (response.data.success) {
        toast.success('AI settings validated successfully');
        setTestResults(response.data.data.testResults);
      }
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const response = await api.post('/settings/ai/test');

      if (response.data.success) {
        setTestResults(response.data.data);
        toast.success('AI connection test completed');
      }
    } catch (error) {
      console.error('Error testing AI connection:', error);
      toast.error('Failed to test AI connection');
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (hasKey, testResult) => {
    if (testResult === true) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </span>
      );
    } else if (testResult === false) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    } else if (hasKey) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Tested
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Not Configured
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Sparkles className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">AI Service Configuration</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure API keys for AI-powered features like review suggestions and sentiment
            analysis.
          </p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* OpenAI Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="openai-key" className="text-sm font-medium text-gray-700">
                OpenAI API Key
              </label>
              {getStatusBadge(settings.hasOpenAI, testResults?.openai)}
            </div>
            <div className="relative">
              <input
                id="openai-key"
                type={showKeys.openai ? 'text' : 'password'}
                value={settings.openaiApiKey}
                onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                placeholder={settings.hasOpenAI ? 'Current key configured' : 'sk-...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('openai')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Used for review suggestions, self-assessment summaries, and sentiment analysis.
            </p>
          </div>

          {/* Gemini Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="gemini-key" className="text-sm font-medium text-gray-700">
                Google Gemini API Key
              </label>
              {getStatusBadge(settings.hasGemini, testResults?.gemini)}
            </div>
            <div className="relative">
              <input
                id="gemini-key"
                type={showKeys.gemini ? 'text' : 'password'}
                value={settings.geminiApiKey}
                onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                placeholder={settings.hasGemini ? 'Current key configured' : 'Enter Gemini API key'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('gemini')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKeys.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">Fallback service when OpenAI is unavailable.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Validating...' : 'Save & Validate'}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              <TestTube className="w-4 h-4 mr-2" />
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Connection Test Results</h4>
              <div className="space-y-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>OpenAI:</span>
                    {testResults.openai ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        Failed
                      </span>
                    )}
                  </div>
                  {testResults.errors?.openai && (
                    <p className="text-xs text-red-600 ml-4">Error: {testResults.errors.openai}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Gemini:</span>
                    {testResults.gemini ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        Failed
                      </span>
                    )}
                  </div>
                  {testResults.errors?.gemini && (
                    <p className="text-xs text-red-600 ml-4">Error: {testResults.errors.gemini}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Production Note</p>
                <p>
                  In a production environment, API keys should be managed through secure
                  configuration services (AWS Secrets Manager, Azure Key Vault, etc.) and require
                  service restart to take effect. This interface is for demonstration purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
