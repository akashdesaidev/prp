import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import BulkImport from '../components/users/BulkImport';

// Mock window.alert
global.alert = jest.fn();

beforeEach(() => {
  alert.mockClear();
});

test('parses CSV and shows preview table', async () => {
  const csvContent = 'email,firstName,lastName\nuser@example.com,John,Doe';
  const file = new File([csvContent], 'users.csv', { type: 'text/csv' });

  render(<BulkImport />);

  const fileInput = screen.getByTestId('file-input');
  fireEvent.change(fileInput, { target: { files: [file] } });

  await waitFor(() => {
    expect(screen.getByText('Import 1 users')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
  });
});
