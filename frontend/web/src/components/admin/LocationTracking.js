import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Alert, Spinner, Badge, Form, Button } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaMap, FaUser, FaClock, FaExclamationTriangle, FaSync, FaSearch, FaLocationArrow } from 'react-icons/fa';
import { api } from '../../services/api';
import { AuthService } from '../../services/auth';
import './LocationTracking.css';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to recenter the map view
const MapCenterController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

const LocationTracking = () => {
  const [userLocations, setUserLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const intervalRef = useRef(null);

  // Check if user is authorized on mount
  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !currentUser.roles.includes('ROLE_ADMIN')) {
      setError('You are not authorized to access this page');
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchUserLocations();

    // Set up interval for periodic fetching
    intervalRef.current = setInterval(fetchUserLocations, refreshInterval * 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  // Fetch user locations from API
  const fetchUserLocations = async () => {
    try {
      const response = await api.get('/api/admin/user-locations');
      setUserLocations(response.data);
      
      // If no center is set yet, center on first user with location
      if (!mapCenter && response.data && response.data.length > 0) {
        const userWithLocation = response.data.find(user => 
          user.location && user.location.latitude && user.location.longitude
        );
        
        if (userWithLocation) {
          setMapCenter([
            userWithLocation.location.latitude,
            userWithLocation.location.longitude
          ]);
        } else {
          // Default center if no user has location
          setMapCenter([0, 0]);
          setMapZoom(2);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user locations:', err);
      setError('Failed to fetch user locations. Please try again later.');
      setLoading(false);
    }
  };

  // Format timestamp to human-readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  // Calculate time since last update
  const getTimeSinceUpdate = (timestamp) => {
    if (!timestamp) return 'Never updated';
    
    const now = new Date();
    const locationTime = new Date(timestamp);
    const diffMs = now - locationTime;
    
    // Convert to appropriate time unit
    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  // Get status badge variant based on last update time
  const getStatusVariant = (timestamp) => {
    if (!timestamp) return 'secondary';
    
    const now = new Date();
    const locationTime = new Date(timestamp);
    const diffHours = (now - locationTime) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'success';
    if (diffHours < 6) return 'info';
    if (diffHours < 24) return 'warning';
    return 'danger';
  };

  // Focus map on a specific user
  const focusOnUser = (user) => {
    if (user.location && user.location.latitude && user.location.longitude) {
      setSelectedUser(user.id);
      setMapCenter([user.location.latitude, user.location.longitude]);
      setMapZoom(15);
    }
  };

  // Custom marker icon based on how recent the location update is
  const getMarkerIcon = (timestamp) => {
    if (!timestamp) return new L.Icon.Default();
    
    const now = new Date();
    const locationTime = new Date(timestamp);
    const diffMs = now - locationTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Red for old locations (>24h), yellow for moderately old (>6h), green for recent
    let iconColor = 'green';
    if (diffHours > 24) {
      iconColor = 'red';
    } else if (diffHours > 6) {
      iconColor = 'orange';
    }
    
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${iconColor}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  // Filter users based on search term
  const filteredUsers = userLocations.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle refresh interval change
  const handleRefreshIntervalChange = (e) => {
    const newInterval = parseInt(e.target.value, 10);
    setRefreshInterval(newInterval);
    
    // Reset the interval timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchUserLocations, newInterval * 1000);
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchUserLocations();
  };

  if (error) {
    return (
      <Container className="location-tracking-container">
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" /> {error}
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="location-tracking-container d-flex justify-content-center align-items-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="location-tracking-container">
      <h4 className="mb-3">
        <FaMap className="me-2" /> User Location Tracking
      </h4>
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <Form.Select 
            style={{ width: 'auto' }} 
            value={refreshInterval}
            onChange={handleRefreshIntervalChange}
            className="me-2"
            aria-label="Refresh interval"
          >
            <option value="5">Refresh: 5 seconds</option>
            <option value="15">Refresh: 15 seconds</option>
            <option value="30">Refresh: 30 seconds</option>
            <option value="60">Refresh: 1 minute</option>
            <option value="300">Refresh: 5 minutes</option>
          </Form.Select>
          <Button variant="outline-primary" size="sm" onClick={handleManualRefresh}>
            <FaSync className="me-1" /> Refresh Now
          </Button>
        </div>
        <small className="text-muted">
          {userLocations.length} users, last updated: {new Date().toLocaleTimeString()}
        </small>
      </div>
      
      <div className="location-dashboard">
        <Card className="user-list-card">
          <Card.Header>
            <div className="d-flex align-items-center">
              <FaUser className="me-2" /> 
              <span>Users</span>
            </div>
            <Form.Control
              type="search"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
              className="mt-2"
              aria-label="Search users"
            />
          </Card.Header>
          <div className="user-list">
            {filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-muted">
                No users found matching the search term.
              </div>
            ) : (
              filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className={`user-item ${selectedUser === user.id ? 'selected' : ''}`}
                  onClick={() => focusOnUser(user)}
                >
                  <div className="user-avatar">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div className="user-details">
                    <h6>{user.name}</h6>
                    <div className="user-status">
                      <FaClock className="me-1" size={10} />
                      <span>{getTimeSinceUpdate(user.location?.timestamp)}</span>
                      {user.location?.timestamp && (
                        <Badge 
                          bg={getStatusVariant(user.location.timestamp)} 
                          className="ms-2"
                        >
                          {getStatusVariant(user.location.timestamp) === 'success' ? 'Online' : 
                           getStatusVariant(user.location.timestamp) === 'info' ? 'Recent' :
                           getStatusVariant(user.location.timestamp) === 'warning' ? 'Away' : 'Offline'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {user.location && (
                    <FaLocationArrow 
                      color="#3f51b5" 
                      size={14} 
                      className="ms-2" 
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
        
        <Card className="map-card">
          <MapContainer
            center={mapCenter || [0, 0]}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterController center={mapCenter} zoom={mapZoom} />
            
            {userLocations.map(user => (
              user.location && user.location.latitude && user.location.longitude ? (
                <Marker
                  key={user.id}
                  position={[user.location.latitude, user.location.longitude]}
                  icon={getMarkerIcon(user.location.timestamp)}
                >
                  <Popup className="location-popup">
                    <h6>{user.name}</h6>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Last updated:</strong> {formatTimestamp(user.location.timestamp)}</p>
                    <p><strong>Coordinates:</strong> {user.location.latitude.toFixed(6)}, {user.location.longitude.toFixed(6)}</p>
                    {user.location.address && (
                      <p><strong>Address:</strong> {user.location.address}</p>
                    )}
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        </Card>
      </div>
    </Container>
  );
};

export default LocationTracking; 