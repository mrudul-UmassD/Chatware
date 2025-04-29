import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AuthService } from '../services/auth';

// Create context
const AuthContext = createContext();

// Context provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check for existing authentication on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const isAuth = await AuthService.isAuthenticated();
        if (isAuth) {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError(err.message || 'Authentication check failed');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AuthService.login(email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Register function
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AuthService.register(userData);
      return data;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Register super admin
  const registerSuperAdmin = useCallback(async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AuthService.registerSuperAdmin(name, email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || 'Super admin setup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await AuthService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Update profile
  const updateProfile = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AuthService.updateProfile(userData);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    registerSuperAdmin,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: !!user
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 