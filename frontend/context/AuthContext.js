'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getAccessToken,
  isTokenExpired,
  refreshAccessToken,
  clearTokens,
  setTokens
} from '../lib/token';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserFromToken = useCallback(async () => {
    let token = getAccessToken();
    if (token && isTokenExpired(token)) {
      token = await refreshAccessToken();
    }
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // For now, we'll use mock user data since we don't have full user info in JWT
        // In a real app, you might fetch user details from API
        setUser({
          id: decoded.id,
          role: decoded.role,
          firstName: 'John', // Mock data
          lastName: 'Doe', // Mock data
          email: 'john.doe@example.com' // Mock data
        });
      } catch (err) {
        clearTokens();
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    syncUserFromToken();
  }, [syncUserFromToken]);

  const login = ({ accessToken, refreshToken }) => {
    setTokens({ accessToken, refreshToken });
    syncUserFromToken();
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
