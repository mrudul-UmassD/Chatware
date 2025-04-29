import * as Location from 'expo-location';
import { api } from './api';
import { encryptionService } from './EncryptionService';
import { ROLES } from '../config';

class LocationService {
  constructor() {
    this.locationSubscription = null;
    this.initialized = false;
    this.locationUpdateInterval = 5 * 60 * 1000; // 5 minutes
    this.lastKnownLocation = null;
  }

  // Initialize location tracking service
  async initialize(user) {
    try {
      if (this.initialized) {
        return true;
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Location permission denied');
        return false;
      }

      // Start location tracking if permissions granted
      await this.startLocationTracking(user);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize location service:', error);
      return false;
    }
  }

  // Start tracking user location
  async startLocationTracking(user) {
    try {
      // Clear any existing subscription
      this.stopLocationTracking();

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      this.lastKnownLocation = initialLocation.coords;
      
      // Send initial location to server (encrypted)
      await this.sendLocationUpdate(user, initialLocation.coords);

      // Set up location tracking
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 100, // update every 100 meters
          timeInterval: this.locationUpdateInterval,
        },
        async (location) => {
          this.lastKnownLocation = location.coords;
          await this.sendLocationUpdate(user, location.coords);
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  // Stop tracking user location
  stopLocationTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  // Send encrypted location update to server
  async sendLocationUpdate(user, coords) {
    try {
      // Encrypt location data - use a server public key
      // This ensures only the server can decrypt the location
      const locationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date().toISOString(),
      };
      
      // Stringify and encrypt location data
      const locationJson = JSON.stringify(locationData);
      const encryptedLocation = encryptionService.encryptMessage(
        locationJson, 
        'SERVER_ID' // In a real implementation, use server's public key
      );
      
      // Send encrypted location to server
      await api.post('/api/user/location', {
        encryptedLocation,
        userId: user._id,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending location update:', error);
      return false;
    }
  }

  // Get current location (for user's own reference)
  async getCurrentLocation() {
    try {
      if (this.lastKnownLocation) {
        return this.lastKnownLocation;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      this.lastKnownLocation = location.coords;
      return location.coords;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Check if user has super admin permissions to view locations
  canViewUserLocations(user) {
    return user && user.role === ROLES.SUPER_ADMIN;
  }

  // Get locations of all users (super admin only)
  async getAllUserLocations(user) {
    try {
      if (!this.canViewUserLocations(user)) {
        throw new Error('Unauthorized: Only super admins can view user locations');
      }
      
      const response = await api.get('/api/admin/user-locations');
      return response.data;
    } catch (error) {
      console.error('Error fetching user locations:', error);
      return [];
    }
  }
}

export const locationService = new LocationService(); 