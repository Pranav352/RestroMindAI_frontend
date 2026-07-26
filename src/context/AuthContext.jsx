import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me/');
      setUser(response.data);
      localStorage.setItem('user_info', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      logoutLocal();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_info');
    if (token) {
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
        // Refresh user info in the background to ensure sync
        fetchCurrentUser();
      } else {
        fetchCurrentUser();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (tokens, userData) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    if (userData) {
      localStorage.setItem('user_info', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setUser(null);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await api.post('/api/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        console.error('Failed to blacklist token on logout:', error);
      }
    }
    logoutLocal();
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
