import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../config';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show loading spinner while checking authentication
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect to home if not admin or super admin
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return <Navigate to="/" />;
  }

  // Render children if authenticated and has admin privileges
  return children;
};

export default AdminRoute; 