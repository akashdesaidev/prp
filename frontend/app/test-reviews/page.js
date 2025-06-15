'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

export default function TestReviewsPage() {
  const [data, setData] = useState({
    activeCycles: [],
    mySubmissions: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch active cycles
      const cyclesResponse = await api.get('/review-cycles', {
        params: { status: 'active' }
      });

      // Fetch my submissions
      const submissionsResponse = await api.get('/review-submissions/my-submissions');

      setData({
        activeCycles: cyclesResponse.data.data || [],
        mySubmissions: submissionsResponse.data.reviews || [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || error.message
      }));
    }
  };

  const createTestCycle = async () => {
    try {
      const testCycle = {
        name: 'Test Review Cycle',
        type: 'quarterly',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        reviewTypes: {
          selfReview: true,
          peerReview: true,
          managerReview: true,
          upwardReview: false
        },
        questions: [
          {
            category: 'overall',
            question: 'How would you rate your overall performance this period?',
            requiresRating: true,
            ratingScale: 10,
            isRequired: true,
            order: 1
          },
          {
            category: 'skills',
            question: 'What are your key strengths?',
            requiresRating: false,
            isRequired: true,
            order: 2
          }
        ]
      };

      await api.post('/review-cycles', testCycle);
      alert('Test cycle created! Refresh to see it.');
      fetchData();
    } catch (error) {
      console.error('Error creating test cycle:', error);
      alert('Error creating test cycle: ' + (error.response?.data?.message || error.message));
    }
  };

  const activateTestCycle = async (cycleId) => {
    try {
      await api.put(`/review-cycles/${cycleId}`, { status: 'active' });
      alert('Cycle activated! Refresh to see submissions.');
      fetchData();
    } catch (error) {
      console.error('Error activating cycle:', error);
      alert('Error activating cycle: ' + (error.response?.data?.message || error.message));
    }
  };

  if (data.loading) {
    return (
      <ProtectedRoute>
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Review System Test</h1>
          <p className="text-gray-600">Debug page for review system</p>
        </div>

        {data.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-600">{data.error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Cycles */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Active Review Cycles</h2>
              <button
                onClick={createTestCycle}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Create Test Cycle
              </button>
            </div>

            {data.activeCycles.length === 0 ? (
              <p className="text-gray-500">No active cycles</p>
            ) : (
              <div className="space-y-2">
                {data.activeCycles.map((cycle) => (
                  <div key={cycle._id} className="border border-gray-100 rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{cycle.name}</h3>
                        <p className="text-sm text-gray-600">Status: {cycle.status}</p>
                        <p className="text-sm text-gray-600">
                          Questions: {cycle.questions?.length || 0}
                        </p>
                      </div>
                      {cycle.status === 'draft' && (
                        <button
                          onClick={() => activateTestCycle(cycle._id)}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Submissions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">My Review Submissions</h2>

            {data.mySubmissions.length === 0 ? (
              <p className="text-gray-500">No review submissions</p>
            ) : (
              <div className="space-y-2">
                {data.mySubmissions.map((submission) => (
                  <div key={submission._id} className="border border-gray-100 rounded p-3">
                    <h3 className="font-medium">{submission.reviewType} Review</h3>
                    <p className="text-sm text-gray-600">
                      For: {submission.revieweeId?.firstName} {submission.revieweeId?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">Cycle: {submission.reviewCycleId?.name}</p>
                    <p className="text-sm text-gray-600">Status: {submission.status}</p>
                    <p className="text-sm text-gray-600">
                      Responses: {submission.responses?.length || 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium mb-2">Debug Info</h3>
          <pre className="text-xs text-gray-600 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    </ProtectedRoute>
  );
}
