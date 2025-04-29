import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  CloudQueue as CloudIcon,
  Check as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';

const StatusIndicator = ({ status }) => {
  return (
    <Box display="flex" alignItems="center">
      {status === 'healthy' ? (
        <>
          <CheckIcon sx={{ color: 'success.main', mr: 1 }} />
          <Typography color="success.main">Healthy</Typography>
        </>
      ) : status === 'warning' ? (
        <>
          <ErrorIcon sx={{ color: 'warning.main', mr: 1 }} />
          <Typography color="warning.main">Warning</Typography>
        </>
      ) : (
        <>
          <ErrorIcon sx={{ color: 'error.main', mr: 1 }} />
          <Typography color="error.main">Error</Typography>
        </>
      )}
    </Box>
  );
};

const SystemStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    cpu: {
      usage: 0,
      status: 'healthy'
    },
    memory: {
      usage: 0,
      total: 0,
      free: 0,
      status: 'healthy'
    },
    disk: {
      usage: 0,
      total: 0,
      free: 0,
      status: 'healthy'
    },
    services: [
      { name: 'API Server', status: 'healthy', uptime: '0d 0h 0m' },
      { name: 'Database', status: 'healthy', uptime: '0d 0h 0m' },
      { name: 'Redis Cache', status: 'healthy', uptime: '0d 0h 0m' },
      { name: 'Socket Server', status: 'healthy', uptime: '0d 0h 0m' }
    ]
  });

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        // This would be a real API call in production
        // const { data } = await axios.get(`${API_URL}/api/admin/system-status`, config);
        
        // For demo purposes, we're using mock data
        setTimeout(() => {
          setSystemStatus({
            cpu: {
              usage: 32,
              status: 'healthy'
            },
            memory: {
              usage: 65,
              total: 16384, // MB
              free: 5734,   // MB
              status: 'warning'
            },
            disk: {
              usage: 78,
              total: 512000, // MB
              free: 112640,  // MB
              status: 'warning'
            },
            services: [
              { name: 'API Server', status: 'healthy', uptime: '15d 7h 22m' },
              { name: 'Database', status: 'healthy', uptime: '15d 6h 54m' },
              { name: 'Redis Cache', status: 'healthy', uptime: '15d 7h 22m' },
              { name: 'Socket Server', status: 'healthy', uptime: '15d 7h 21m' }
            ]
          });
          setLoading(false);
        }, 1500);
      } catch (err) {
        setError(err.message || 'Failed to fetch system status');
        setLoading(false);
      }
    };

    fetchSystemStatus();
  }, [user]);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* System Resource Usage */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Resources
            </Typography>
            
            <Grid container spacing={3}>
              {/* CPU */}
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <SpeedIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">CPU Usage</Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {systemStatus.cpu.usage}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemStatus.cpu.usage}
                      color={
                        systemStatus.cpu.usage > 90 
                          ? 'error' 
                          : systemStatus.cpu.usage > 70 
                            ? 'warning' 
                            : 'primary'
                      }
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Memory */}
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MemoryIcon color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">Memory Usage</Typography>
                    </Box>
                    <Typography variant="h4" color="secondary" gutterBottom>
                      {systemStatus.memory.usage}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemStatus.memory.usage}
                      color={
                        systemStatus.memory.usage > 90 
                          ? 'error' 
                          : systemStatus.memory.usage > 70 
                            ? 'warning' 
                            : 'secondary'
                      }
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Typography variant="caption">
                        Free: {formatBytes(systemStatus.memory.free * 1024 * 1024)}
                      </Typography>
                      <Typography variant="caption">
                        Total: {formatBytes(systemStatus.memory.total * 1024 * 1024)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Disk */}
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <StorageIcon sx={{ mr: 1, color: '#ff9800' }} />
                      <Typography variant="subtitle1">Disk Usage</Typography>
                    </Box>
                    <Typography variant="h4" sx={{ color: '#ff9800' }} gutterBottom>
                      {systemStatus.disk.usage}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemStatus.disk.usage}
                      color={
                        systemStatus.disk.usage > 90 
                          ? 'error' 
                          : systemStatus.disk.usage > 70 
                            ? 'warning' 
                            : 'primary'
                      }
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Typography variant="caption">
                        Free: {formatBytes(systemStatus.disk.free * 1024 * 1024)}
                      </Typography>
                      <Typography variant="caption">
                        Total: {formatBytes(systemStatus.disk.total * 1024 * 1024)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Services Status */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Services Status
            </Typography>
            
            <List>
              {systemStatus.services.map((service, index) => (
                <React.Fragment key={service.name}>
                  <ListItem>
                    <ListItemIcon>
                      <CloudIcon color={
                        service.status === 'healthy' 
                          ? 'success' 
                          : service.status === 'warning' 
                            ? 'warning' 
                            : 'error'
                      } />
                    </ListItemIcon>
                    <ListItemText 
                      primary={service.name}
                      secondary={`Uptime: ${service.uptime}`}
                    />
                    <StatusIndicator status={service.status} />
                  </ListItem>
                  {index < systemStatus.services.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemStatus; 