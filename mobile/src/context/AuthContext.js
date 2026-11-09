import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredToken, getStoredUser, clearAuthSession, getApiBaseUrl } from '../config/api';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiBase, setApiBase] = useState('http://localhost:3000/api/v1');

  // Load session on startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await getStoredToken();
        const storedUser = await getStoredUser();
        const currentUrl = await getApiBaseUrl();
        setApiBase(currentUrl);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (e) {
        console.error('Auth initialization error', e);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    setIsLoading(true);
    try {
      const res = await authService.register(formData);
      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await clearAuthSession();
    setUser(null);
    setToken(null);
  };

  const updateUserData = async (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
    await storeAuthSession(token, updated);
  };

  const role = user?.role ? user.role.toUpperCase() : 'PATIENT';
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isLoading,
        apiBase,
        login,
        register,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
