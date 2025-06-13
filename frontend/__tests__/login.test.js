import { render, screen } from '@testing-library/react';
import LoginPage from '../app/login/page';

describe('Login Page', () => {
  it('renders email and password inputs', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
