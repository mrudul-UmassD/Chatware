import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get API URL from environment variables or constants
// For mobile development, we need to handle different scenarios
// - Android emulator: use 10.0.2.2 instead of localhost
// - iOS simulator: use localhost
// - Physical device: use actual IP address
const getBaseUrl = () => {
  const envApiUrl = Constants.expoConfig?.extra?.apiUrl;
  
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Default URLs based on platform when no environment variable is present
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000'; // Android emulator uses 10.0.2.2 to access host machine
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:5000'; // iOS simulator can use localhost
  } else {
    return 'http://localhost:5000'; // Default fallback
  }
};

const API_URL = getBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to inject the authentication token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error accessing token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh or logout
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Only attempt token refresh for 401 errors and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/token`, {
            refreshToken
          });
          
          if (response.data?.token) {
            // Save the new token
            await AsyncStorage.setItem('token', response.data.token);
            
            // Update the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return axios(originalRequest);
          }
        }
        
        // If refresh token doesn't exist or is invalid, logout
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        
        // We can't redirect here like in web, but we can set a flag for the app to check
        await AsyncStorage.setItem('auth_error', 'true');
      } catch (err) {
        // If token refresh fails, logout
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        await AsyncStorage.setItem('auth_error', 'true');
      }
    }
    
    return Promise.reject(error);
  }
);

export { api, API_URL }; 