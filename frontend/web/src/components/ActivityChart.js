import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

const ActivityChart = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // This would fetch actual activity data from backend
    // For now we're just simulating the loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Box height={300} display="flex" justifyContent="center" alignItems="center">
      <Typography>
        Activity chart will be displayed here.
        In a real implementation, this would use a charting library like Chart.js or Recharts.
      </Typography>
    </Box>
  );
};

export default ActivityChart; 