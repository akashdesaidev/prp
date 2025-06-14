import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsDashboard from '../AnalyticsDashboard';

// Mock the AuthContext
const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  role: 'admin'
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AnalyticsDashboard', () => {
  const mockDateRange = {
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  };

  const mockSummaryData = {
    summary: {
      teams: {
        total: 5,
        totalMembers: 25,
        avgOkrScore: 7.5,
        avgFeedbackRating: 8.2
      },
      feedback: {
        total: 150,
        sentiment: {
          positive: 100,
          neutral: 35,
          negative: 15
        }
      },
      period: {
        days: 30
      }
    },
    teamAnalytics: [
      {
        teamId: '1',
        teamName: 'Engineering',
        departmentName: 'Technology',
        memberCount: 8,
        metrics: {
          avgOkrScore: 8.5,
          avgFeedbackRating: 8.8
        }
      }
    ],
    feedbackTrends: [
      {
        month: '2023-12',
        count: 50,
        avgRating: 8.0
      }
    ]
  };

  beforeEach(() => {
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AnalyticsDashboard dateRange={mockDateRange} userRole="admin" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // Check for loading skeleton
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4);
  });

  it('renders error state when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Failed to fetch analytics summary'));

    render(<AnalyticsDashboard dateRange={mockDateRange} userRole="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch analytics summary')).toBeInTheDocument();
    });
  });

  it('renders dashboard with data successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSummaryData })
    });

    render(<AnalyticsDashboard dateRange={mockDateRange} userRole="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Total Teams')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Avg OKR Score')).toBeInTheDocument();
      expect(screen.getByText('7.5')).toBeInTheDocument();
    });
  });

  it('displays sentiment breakdown correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSummaryData })
    });

    render(<AnalyticsDashboard dateRange={mockDateRange} userRole="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Feedback Sentiment Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Positive')).toBeInTheDocument();
      expect(screen.getByText('100 (66.7%)')).toBeInTheDocument();
    });
  });

  it('displays top performing teams when data is available', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSummaryData })
    });

    render(<AnalyticsDashboard dateRange={mockDateRange} userRole="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Top Performing Teams')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Technology • 8 members')).toBeInTheDocument();
    });
  });

  it('handles retry functionality on error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSummaryData })
    });

    render(<AnalyticsDashboard dateRange={mockDateRange} userRole="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Total Teams')).toBeInTheDocument();
    });
  });

  it('makes API call with correct parameters', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockSummaryData })
    });

    render(<AnalyticsDashboard dateRange={mockDateRange} userRole="admin" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/analytics/summary', {
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      });
    });
  });

  it('displays no data message when summary data is null', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null })
    });

    render(<AnalyticsDashboard dateRange={mockDateRange} userRole="admin" />);

    await waitFor(() => {
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
      expect(
        screen.getByText("There's no analytics data available for the selected period.")
      ).toBeInTheDocument();
    });
  });
});
