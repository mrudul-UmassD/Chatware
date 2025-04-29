import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Avatar, 
  Box, 
  Button, 
  TextField, 
  Divider, 
  Tab, 
  Tabs, 
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  PhotoCamera as CameraIcon,
  LockOutlined as LockIcon,
  DeleteOutlined as DeleteIcon
} from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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

const UserProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  
  useEffect(() => {
    if (user?.profilePic) {
      setProfileImage(user.profilePic);
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleProfileUpdate = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `${API_URL}/api/users/profile`,
        {
          name: values.name,
          email: values.email,
          bio: values.bio,
        },
        config
      );

      // Update user in context
      updateUser(data);
      
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });

    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.put(
        `${API_URL}/api/users/password`,
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
        config
      );
      
      resetForm();
      
      setSnackbar({
        open: true,
        message: 'Password changed successfully',
        severity: 'success'
      });

    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to change password',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setLoading(true);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        `${API_URL}/api/users/upload-image`,
        formData,
        config
      );

      setProfileImage(data.profilePic);
      
      // Update user in context
      updateUser({ ...user, profilePic: data.profilePic });
      
      setSnackbar({
        open: true,
        message: 'Profile picture updated successfully',
        severity: 'success'
      });

    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to upload image',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.delete(`${API_URL}/api/users/profile`, config);
      
      // Log out the user
      logout();
      
      setSnackbar({
        open: true,
        message: 'Account deleted successfully',
        severity: 'success'
      });

    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete account',
        severity: 'error'
      });
      setDeleteDialog(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Paper elevation={3} sx={{ p: 0, overflow: 'hidden' }}>
          {/* User Profile Header */}
          <Box
            sx={{
              p: 3,
              backgroundColor: 'primary.main',
              color: 'white',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <Box 
              sx={{ 
                position: 'relative', 
                width: 120, 
                height: 120, 
                margin: '0 auto' 
              }}
            >
              <Avatar
                src={profileImage}
                alt={user.name}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  border: '4px solid white',
                  margin: '0 auto'
                }}
              />
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-image-upload"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="profile-image-upload">
                <IconButton
                  component="span"
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0, 
                    backgroundColor: 'white',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  <CameraIcon color="primary" />
                </IconButton>
              </label>
            </Box>
            
            <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
              {user.name}
            </Typography>
            <Typography variant="body1">
              {user.email}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Joined: {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="profile tabs"
              centered
            >
              <Tab label="Profile" />
              <Tab label="Security" />
              <Tab label="Account" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <TabPanel value={activeTab} index={0}>
            <Formik
              initialValues={{
                name: user.name || '',
                email: user.email || '',
                bio: user.bio || '',
              }}
              validationSchema={Yup.object({
                name: Yup.string().required('Name is required'),
                email: Yup.string().email('Invalid email format').required('Email is required'),
                bio: Yup.string(),
              })}
              onSubmit={handleProfileUpdate}
            >
              {({ values, handleChange, handleBlur, touched, errors, isSubmitting }) => (
                <Form>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Personal Information
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="name"
                        name="name"
                        label="Full Name"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="email"
                        name="email"
                        label="Email Address"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="bio"
                        name="bio"
                        label="Bio"
                        multiline
                        rows={4}
                        value={values.bio}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.bio && Boolean(errors.bio)}
                        helperText={touched.bio && errors.bio}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        disabled={isSubmitting || loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Formik
              initialValues={{
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              }}
              validationSchema={Yup.object({
                currentPassword: Yup.string().required('Current password is required'),
                newPassword: Yup.string()
                  .min(8, 'Password must be at least 8 characters')
                  .required('New password is required'),
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
                  .required('Confirm password is required'),
              })}
              onSubmit={handlePasswordChange}
            >
              {({ values, handleChange, handleBlur, touched, errors, isSubmitting }) => (
                <Form>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Change Password
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="currentPassword"
                        name="currentPassword"
                        label="Current Password"
                        type="password"
                        value={values.currentPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.currentPassword && Boolean(errors.currentPassword)}
                        helperText={touched.currentPassword && errors.currentPassword}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="newPassword"
                        name="newPassword"
                        label="New Password"
                        type="password"
                        value={values.newPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.newPassword && Boolean(errors.newPassword)}
                        helperText={touched.newPassword && errors.newPassword}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="confirmPassword"
                        name="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                        helperText={touched.confirmPassword && errors.confirmPassword}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<LockIcon />}
                        disabled={isSubmitting || loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Change Password'}
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Account Settings
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Danger Zone
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Deleting your account will permanently remove all your data. This action cannot be undone.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteDialog(true)}
                    >
                      Delete Account
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteAccount} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfile; 