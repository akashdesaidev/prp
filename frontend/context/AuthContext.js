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

        // Fetch full user details from API
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.data);
          } else {
            // Fallback to JWT data if API call fails
            setUser({
              id: decoded.id,
              role: decoded.role,
              firstName: decoded.firstName || 'User',
              lastName: decoded.lastName || '',
              email: decoded.email || 'user@example.com'
            });
          }
        } catch (apiError) {
          console.error('Failed to fetch user details:', apiError);
          // Fallback to JWT data
          setUser({
            id: decoded.id,
            role: decoded.role,
            firstName: decoded.firstName || 'User',
            lastName: decoded.lastName || '',
            email: decoded.email || 'user@example.com'
          });
        }
      } catch (err) {
        console.error('Token decode error:', err);
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
export { AuthContext };
