import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  InputAdornment,
  Grid,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import AuthService from '../services/auth';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [tabValue, setTabValue] = useState(0);
  const [sensitiveUsers, setSensitiveUsers] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});
  const [error, setError] = useState('');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    
    // Only fetch sensitive data if user is super-admin
    if (user && user.role === 'super-admin') {
      fetchSensitiveUserData();
    }
  }, [user]);

  // Fetch regular user data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        setFilteredUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sensitive user data (for superadmin only)
  const fetchSensitiveUserData = async () => {
    try {
      const result = await AuthService.getUsersWithSensitiveInfo();
      if (result.success) {
        setSensitiveUsers(result.data);
        
        // Initialize password visibility state
        const passwordVisibility = {};
        result.data.forEach(user => {
          passwordVisibility[user._id] = false;
        });
        setShowPasswords(passwordVisibility);
      }
    } catch (error) {
      console.error('Error fetching sensitive user data:', error);
      setError('Failed to fetch sensitive user data');
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Toggle password visibility for a specific user
  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open dialog to add a new user
  const handleAddUser = () => {
    setEditMode(false);
    setCurrentUser(null);
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
    setOpenDialog(true);
  };

  // Open dialog to edit a user
  const handleEditUser = (user) => {
    setEditMode(true);
    setCurrentUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && currentUser) {
        // Update existing user
        const response = await fetch(`${API_URL}/api/users/${currentUser._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(userFormData),
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update users list
          setUsers((prevUsers) =>
            prevUsers.map((u) => (u._id === currentUser._id ? data.user : u))
          );
        }
      } else {
        // Create new user
        const result = await AuthService.register(userFormData);
        
        if (result.success) {
          // Add to users list
          setUsers((prevUsers) => [...prevUsers, result.user]);
        }
      }
      
      // Close dialog and refresh data
      setOpenDialog(false);
      fetchUsers();
      if (user && user.role === 'super-admin') {
        fetchSensitiveUserData();
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`${API_URL}/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Remove user from list
          setUsers((prevUsers) => prevUsers.filter((u) => u._id !== userId));
          fetchSensitiveUserData();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Failed to delete user');
      }
    }
  };

  // Reset user password to email/username
  const handleResetPassword = async (userId, email) => {
    if (window.confirm(`Are you sure you want to reset this user's password to their email?`)) {
      try {
        const response = await fetch(`${API_URL}/api/users/${userId}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ newPassword: email }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('Password has been reset successfully.');
          fetchSensitiveUserData();
        }
      } catch (error) {
        console.error('Error resetting password:', error);
        setError('Failed to reset password');
      }
    }
  };

  const getRoleChip = (role) => {
    switch (role) {
      case 'admin':
        return <Chip icon={<AdminIcon />} label="Admin" color="primary" />;
      case 'superadmin':
        return <Chip icon={<AdminIcon />} label="Super Admin" color="secondary" />;
      default:
        return <Chip icon={<UserIcon />} label="User" />;
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'active':
        return <Chip icon={<CheckCircleIcon />} label="Active" color="success" />;
      case 'blocked':
        return <Chip icon={<BlockIcon />} label="Blocked" color="error" />;
      default:
        return <Chip label={status} />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Paper
          sx={{ p: 2, mb: 3, bgcolor: '#f8d7da', color: '#721c24' }}
          elevation={1}
        >
          {error}
        </Paper>
      )}

      <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            User Management
          </Typography>
        </Grid>
        <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleAddUser}
          >
            Add User
          </Button>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', mb: 3 }} elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs">
            <Tab label="User Management" />
            {user && user.role === 'super-admin' && (
              <Tab label="Sensitive Information" />
            )}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Search Users"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, email, or role"
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={
                            user.role === 'super-admin'
                              ? 'error'
                              : user.role === 'admin'
                              ? 'warning'
                              : 'primary'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status || 'offline'}
                          color={user.status === 'online' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleEditUser(user)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={user.role === 'super-admin'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {user && user.role === 'super-admin' && (
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              User Sensitive Information
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Password</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Password Change Required</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sensitiveUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {showPasswords[user._id] ? user.password : '••••••••'}
                            <IconButton
                              size="small"
                              onClick={() => togglePasswordVisibility(user._id)}
                            >
                              {showPasswords[user._id] ? (
                                <VisibilityOffIcon fontSize="small" />
                              ) : (
                                <VisibilityIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {user.location ? (
                            <Tooltip title={`Lat: ${user.location.latitude}, Lng: ${user.location.longitude}`}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationIcon color="primary" sx={{ mr: 1 }} />
                                {user.location.address || 'Location available'}
                              </Box>
                            </Tooltip>
                          ) : (
                            'No location data'
                          )}
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={user.passwordChangeRequired}
                                disabled
                              />
                            }
                            label=""
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Reset password to email">
                            <IconButton
                              color="warning"
                              onClick={() => handleResetPassword(user._id, user.email)}
                            >
                              <LockIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        )}
      </Paper>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit User' : 'Add New User'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Name"
              type="text"
              fullWidth
              variant="outlined"
              value={userFormData.name}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="dense"
              name="email"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={userFormData.email}
              onChange={handleInputChange}
              required
            />
            {!editMode && (
              <TextField
                margin="dense"
                name="password"
                label="Password (Optional - defaults to email if empty)"
                type="password"
                fullWidth
                variant="outlined"
                value={userFormData.password}
                onChange={handleInputChange}
                helperText="If left blank, the user's email will be used as the initial password."
              />
            )}
            <FormControl fullWidth margin="dense">
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={userFormData.role}
                onChange={handleInputChange}
                label="Role"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="super-admin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editMode ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 