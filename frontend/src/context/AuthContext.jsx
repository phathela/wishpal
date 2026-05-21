import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('wishpal_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data.user || response.data);
    } catch (error) {
      localStorage.removeItem('wishpal_token');
      localStorage.removeItem('wishpal_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('wishpal_token', token);
    localStorage.setItem('wishpal_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (email, password, role, username) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      role,
      username,
    });
    const { token, user: userData } = response.data;
    localStorage.setItem('wishpal_token', token);
    localStorage.setItem('wishpal_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('wishpal_token');
    localStorage.removeItem('wishpal_user');
    setUser(null);
  };

  const weesBalance = user?.weesBalance ?? 0;

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    weesBalance,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
