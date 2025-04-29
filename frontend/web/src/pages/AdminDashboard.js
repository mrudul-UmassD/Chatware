import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  Forum as ForumIcon,
  InsertDriveFile as FileIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

// Components
import LocationTracking from '../components/admin/LocationTracking';
import ActivityChart from '../components/ActivityChart';
import SystemStatus from '../components/admin/SystemStatus';

// Custom Tab Panel
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    diskUsage: 0,
    recentUsers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        // Fetch admin stats
        const { data } = await axios.get(`${API_URL}/api/admin/stats`, config);
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="admin dashboard tabs"
          >
            <Tab label="Overview" />
            <Tab label="User Tracking" />
            <Tab label="System Status" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {/* Overview Tab */}
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} md={6} lg={3}>
              <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, backgroundColor: '#e3f2fd' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <PeopleIcon fontSize="large" sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h3" component="div">
                    {stats.totalUsers}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  {stats.activeUsers} active now
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, backgroundColor: '#f3e5f5' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Total Chats
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <ForumIcon fontSize="large" sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h3" component="div">
                    {stats.totalChats}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, backgroundColor: '#e8f5e9' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Total Messages
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <FileIcon fontSize="large" sx={{ mr: 1, color: '#4caf50' }} />
                  <Typography variant="h3" component="div">
                    {stats.totalMessages}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, backgroundColor: '#fff3e0' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Storage Used
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <StorageIcon fontSize="large" sx={{ mr: 1, color: '#ff9800' }} />
                  <Typography variant="h3" component="div">
                    {formatBytes(stats.diskUsage)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* User Activity Chart */}
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  User Activity
                </Typography>
                <ActivityChart />
              </Paper>
            </Grid>

            {/* Recent Users */}
            <Grid item xs={12} md={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Users
                  </Typography>
                  <List>
                    {stats.recentUsers && stats.recentUsers.length > 0 ? (
                      stats.recentUsers.map((user) => (
                        <ListItem key={user._id}>
                          <ListItemAvatar>
                            <Avatar src={user.profilePic} alt={user.name}>
                              {user.name.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={user.name} 
                            secondary={`Last seen: ${new Date(user.lastActive).toLocaleString()}`} 
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No recent users" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* User Tracking Tab */}
          <LocationTracking />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* System Status Tab */}
          <SystemStatus />
        </TabPanel>
      </Container>
    </Box>
  );
};

export default AdminDashboard; 