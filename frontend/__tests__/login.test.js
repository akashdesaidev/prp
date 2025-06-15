import { render, screen } from '@testing-library/react';
import LoginPage from '../app/login/page';
import { AuthContext } from '../context/AuthContext';

// Mock AuthContext provider
const MockAuthProvider = ({ children }) => {
  const mockAuthValue = {
    login: jest.fn(),
    logout: jest.fn(),
    user: null,
    loading: false
  };

  return <AuthContext.Provider value={mockAuthValue}>{children}</AuthContext.Provider>;
};

describe('Login Page', () => {
  it('renders email and password inputs', () => {
    render(
      <MockAuthProvider>
        <LoginPage />
      </MockAuthProvider>
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
