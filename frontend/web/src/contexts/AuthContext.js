import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return response.data;
      } else {
        setError(response.data.message || 'Login failed');
        return null;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred during login';
      setError(errorMessage);
      return null;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        await axios.post(
          `${API_URL}/api/auth/logout`, 
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Even if the API call fails, clear local state
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const registerSuperAdmin = async (name, email, password) => {
    try {
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/register-super-admin`, {
        name,
        email,
        password
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return response.data;
      } else {
        setError(response.data.message || 'Registration failed');
        return null;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred during registration';
      setError(errorMessage);
      return null;
    }
  };

  const registerUser = async (name, email, password, role = 'user') => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to register a user');
        return null;
      }
      
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        {
          name,
          email,
          password,
          role
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        return response.data;
      } else {
        setError(response.data.message || 'User registration failed');
        return null;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred during user registration';
      setError(errorMessage);
      return null;
    }
  };

  const updateProfile = async (userId, userData) => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to update profile');
        return null;
      }
      
      const response = await axios.put(
        `${API_URL}/api/users/${userId}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // If updating the current user, update the local state
        if (user && user._id === userId) {
          setUser(response.data.user);
        }
        return response.data;
      } else {
        setError(response.data.message || 'Profile update failed');
        return null;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred during profile update';
      setError(errorMessage);
      return null;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    registerSuperAdmin,
    registerUser,
    updateProfile,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 