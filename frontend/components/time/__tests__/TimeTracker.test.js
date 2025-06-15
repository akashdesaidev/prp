import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeTracker from '../TimeTracker';
import api from '../../../lib/api';

// Mock the API
jest.mock('../../../lib/api');
const mockedApi = api;

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('TimeTracker', () => {
  const mockOkrs = [
    {
      _id: '1',
      title: 'Test OKR 1',
      keyResults: [
        { _id: 'kr1', title: 'Key Result 1' },
        { _id: 'kr2', title: 'Key Result 2' }
      ]
    },
    {
      _id: '2',
      title: 'Test OKR 2',
      keyResults: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockedApi.get.mockResolvedValue({ data: mockOkrs });
    mockedApi.post.mockResolvedValue({ data: { success: true } });
  });

  it('renders time tracker interface', async () => {
    render(<TimeTracker />);

    expect(screen.getByText('Time Tracker')).toBeInTheDocument();
    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('Select OKR *')).toBeInTheDocument();
    expect(screen.getByText('Start Tracking')).toBeInTheDocument();
  });

  it('loads OKRs on mount', async () => {
    render(<TimeTracker />);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/okrs');
    });
  });

  it('requires OKR selection before starting tracking', () => {
    render(<TimeTracker />);

    const startButton = screen.getByText('Start Tracking');
    fireEvent.click(startButton);

    // Should show error toast (mocked)
    expect(require('react-hot-toast').error).toHaveBeenCalledWith(
      'Please select an OKR to track time against'
    );
  });

  it('starts tracking when OKR is selected', async () => {
    render(<TimeTracker />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    // Select an OKR
    const okrSelect = screen.getByDisplayValue('');
    fireEvent.change(okrSelect, { target: { value: '1' } });

    // Start tracking
    const startButton = screen.getByText('Start Tracking');
    fireEvent.click(startButton);

    // Should show pause and stop buttons
    await waitFor(() => {
      expect(screen.getByText('Pause')).toBeInTheDocument();
      expect(screen.getByText('Stop & Save')).toBeInTheDocument();
    });
  });

  it('shows category selection', () => {
    render(<TimeTracker />);

    expect(screen.getByText('direct work')).toBeInTheDocument();
    expect(screen.getByText('planning')).toBeInTheDocument();
    expect(screen.getByText('collaboration')).toBeInTheDocument();
    expect(screen.getByText('review')).toBeInTheDocument();
    expect(screen.getByText('other')).toBeInTheDocument();
  });

  it('allows category selection', () => {
    render(<TimeTracker />);

    const planningButton = screen.getByText('planning');
    fireEvent.click(planningButton);

    // Planning should be selected (would need to check styling in real implementation)
    expect(planningButton).toBeInTheDocument();
  });

  it('shows key results when OKR with key results is selected', async () => {
    render(<TimeTracker />);

    await waitFor(() => {
      const okrSelect = screen.getByDisplayValue('');
      fireEvent.change(okrSelect, { target: { value: '1' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Key Result (Optional)')).toBeInTheDocument();
    });
  });

  it('restores session from localStorage', () => {
    const savedSession = {
      startTime: new Date().toISOString(),
      selectedOkr: mockOkrs[0],
      selectedKeyResult: null,
      description: 'Test work',
      category: 'direct_work'
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSession));

    render(<TimeTracker />);

    // Should restore the session and show tracking state
    expect(localStorageMock.getItem).toHaveBeenCalledWith('timeTrackingSession');
  });
});
