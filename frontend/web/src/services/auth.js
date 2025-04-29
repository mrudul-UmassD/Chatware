import axios from 'axios';
import { API_URL } from '../config';

// Helper to get Authorization header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const AuthService = {
  // Login user
  login: async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'An error occurred during login'
      );
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const config = getAuthHeader();
      const { data } = await axios.post(
        `${API_URL}/api/auth/register`, 
        userData, 
        config
      );
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'An error occurred during registration'
      );
    }
  },

  // Logout user
  logout: async () => {
    try {
      const config = getAuthHeader();
      await axios.post(`${API_URL}/api/auth/logout`, {}, config);
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove local storage items even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user);
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const config = getAuthHeader();
      const { data } = await axios.put(
        `${API_URL}/api/users/${userData._id || 'me'}`,
        userData,
        config
      );
      
      if (data.success && data.user) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'An error occurred during profile update'
      );
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const config = getAuthHeader();
      const { data } = await axios.post(
        `${API_URL}/api/auth/change-password`,
        { currentPassword, newPassword },
        config
      );
      
      if (data.success) {
        // Update stored user data to reflect password change requirement
        const user = AuthService.getCurrentUser();
        if (user) {
          user.passwordChangeRequired = false;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'An error occurred while changing password'
      );
    }
  },

  // Update user location
  updateLocation: async (locationData) => {
    try {
      const config = getAuthHeader();
      const { data } = await axios.post(
        `${API_URL}/api/auth/update-location`,
        locationData,
        config
      );
      
      if (data.success) {
        // Update stored user data with new location
        const user = AuthService.getCurrentUser();
        if (user) {
          user.location = data.location;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'An error occurred while updating location'
      );
    }
  },

  // Get all users with sensitive info (for superadmin only)
  getUsersWithSensitiveInfo: async () => {
    try {
      const config = getAuthHeader();
      const { data } = await axios.get(
        `${API_URL}/api/auth/users-with-sensitive-info`,
        config
      );
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'An error occurred while fetching user data'
      );
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email
      });
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'An error occurred during password reset request'
      );
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/reset-password/${token}`,
        { password }
      );
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'An error occurred during password reset'
      );
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/verify-email/${token}`);
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'An error occurred during email verification'
      );
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/refresh-token`, {
        refreshToken: localStorage.getItem('refreshToken')
      });
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'An error occurred during token refresh'
      );
    }
  }
};

export default AuthService; 