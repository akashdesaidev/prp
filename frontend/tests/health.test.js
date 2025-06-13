import { render, screen, waitFor } from '@testing-library/react';
import axiosMock from 'axios';
import HealthPage from '../app/page';

jest.mock('axios', () => {
  const actualAxios = jest.requireActual('axios');
  const mockInstance = {
    get: jest.fn(),
    interceptors: { request: { use: jest.fn() } }
  };
  return {
    __esModule: true,
    default: {
      create: () => mockInstance,
      ...mockInstance
    }
  };
});

describe('Health check integration', () => {
  it('displays healthy status from backend', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { status: 'ok' } });

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText(/status: ok/i)).toBeInTheDocument();
    });
  });
});
