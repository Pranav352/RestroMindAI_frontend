import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTenantId, setActiveTenantIdState] = useState(() => localStorage.getItem('active_tenant_id') || null);

  const setActiveTenantId = (id) => {
    if (id) {
      localStorage.setItem('active_tenant_id', id);
      setActiveTenantIdState(id);
    } else {
      localStorage.removeItem('active_tenant_id');
      setActiveTenantIdState(null);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me/');
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('user_info', JSON.stringify(userData));
      
      // If owner, fetch their restaurant to set active tenant
      if (userData.role === 'owner') {
        try {
          const restResponse = await api.get('/api/restaurants/');
          if (restResponse.data && restResponse.data.length > 0) {
            setActiveTenantId(restResponse.data[0].id);
          }
        } catch (restError) {
          console.error('Failed to fetch owner restaurants:', restError);
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      if (error.response && error.response.status === 401) {
        logoutLocal();
      }
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
      if (userData.role === 'owner') {
        fetchCurrentUser(); // To fetch and set tenant ID
      }
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('active_tenant_id');
    setUser(null);
    setActiveTenantIdState(null);
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
    activeTenantId,
    setActiveTenantId,
    login,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
