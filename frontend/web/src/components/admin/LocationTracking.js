import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MyLocation as LocationIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';
import './LocationTracking.css';

const LocationTracking = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocations, setUserLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Fetch user locations when component mounts
  useEffect(() => {
    fetchUserLocations();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(userLocations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = userLocations.filter(
        userLocation => 
          userLocation.name.toLowerCase().includes(query) ||
          userLocation.email.toLowerCase().includes(query) ||
          userLocation.location.address.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, userLocations]);

  const fetchUserLocations = async () => {
    try {
      setLoading(true);
      
      // In a real app, you would fetch this data from an API
      // const config = {
      //   headers: {
      //     Authorization: `Bearer ${user.token}`,
      //   },
      // };
      // const { data } = await axios.get(`${API_URL}/api/admin/user-locations`, config);
      
      // For demo purposes, we'll use mock data
      setTimeout(() => {
        const mockData = [
          {
            _id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            profilePic: '',
            location: {
              coordinates: [40.7128, -74.0060], // [latitude, longitude]
              address: 'New York, NY, USA',
              lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
            },
            device: {
              type: 'Mobile',
              browser: 'Chrome',
              os: 'Android'
            },
            online: true
          },
          {
            _id: '2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            profilePic: '',
            location: {
              coordinates: [34.0522, -118.2437], // [latitude, longitude]
              address: 'Los Angeles, CA, USA',
              lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
            },
            device: {
              type: 'Desktop',
              browser: 'Firefox',
              os: 'Windows'
            },
            online: true
          },
          {
            _id: '3',
            name: 'Bob Johnson',
            email: 'bob.johnson@example.com',
            profilePic: '',
            location: {
              coordinates: [51.5074, -0.1278], // [latitude, longitude]
              address: 'London, UK',
              lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
            },
            device: {
              type: 'Tablet',
              browser: 'Safari',
              os: 'iOS'
            },
            online: false
          },
          {
            _id: '4',
            name: 'Sarah Williams',
            email: 'sarah.williams@example.com',
            profilePic: '',
            location: {
              coordinates: [48.8566, 2.3522], // [latitude, longitude]
              address: 'Paris, France',
              lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
            },
            device: {
              type: 'Mobile',
              browser: 'Safari',
              os: 'iOS'
            },
            online: true
          },
          {
            _id: '5',
            name: 'Michael Brown',
            email: 'michael.brown@example.com',
            profilePic: '',
            location: {
              coordinates: [35.6762, 139.6503], // [latitude, longitude]
              address: 'Tokyo, Japan',
              lastUpdated: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
            },
            device: {
              type: 'Desktop',
              browser: 'Chrome',
              os: 'macOS'
            },
            online: false
          }
        ];
        
        setUserLocations(mockData);
        setFilteredUsers(mockData);
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error('Error fetching user locations:', err);
      setError(err.message || 'Failed to fetch user locations');
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleRefresh = () => {
    fetchUserLocations();
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box className="location-tracking-container">
      <Grid container spacing={3}>
        {/* User List */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} className="user-list-card">
            <Box className="card-header">
              <Typography variant="h6">User Locations</Typography>
              <Box display="flex" alignItems="center">
                <TextField
                  size="small"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mr: 1 }}
                />
                <IconButton onClick={handleRefresh} size="small">
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Box>
            
            <Divider />
            
            <List className="user-list">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((userLocation) => (
                  <React.Fragment key={userLocation._id}>
                    <ListItem className={`user-list-item ${userLocation.online ? 'online' : 'offline'}`}>
                      <ListItemAvatar>
                        <Avatar src={userLocation.profilePic} alt={userLocation.name}>
                          {userLocation.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={userLocation.name}
                        secondary={
                          <Box component="span" display="flex" flexDirection="column">
                            <Typography variant="body2" component="span">
                              {userLocation.location.address}
                            </Typography>
                            <Typography variant="caption" component="span" display="flex" alignItems="center">
                              <TimeIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                              {formatTimeAgo(userLocation.location.lastUpdated)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box className="user-status-indicator"></Box>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No users found" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        {/* Map */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} className="map-container">
            <Box className="map-placeholder" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
              <LocationIcon style={{ fontSize: 60, color: '#3f51b5', marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>
                Map Visualization
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                In a real application, this area would display an interactive map showing user locations.
                <br />
                You could use Google Maps, Mapbox, or Leaflet to implement this functionality.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LocationTracking; 