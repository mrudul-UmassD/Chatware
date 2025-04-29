import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';
import SuperAdminSetup from './pages/SuperAdminSetup';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import PasswordChangeRequired from './components/PasswordChangeRequired';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  const { user, loading } = useAuth();
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);

  // Check if password change is required
  useEffect(() => {
    if (user && user.passwordChangeRequired) {
      setShowPasswordChangeDialog(true);
    } else {
      setShowPasswordChangeDialog(false);
    }
  }, [user]);

  // Handle successful password change
  const handlePasswordChangeSuccess = () => {
    setShowPasswordChangeDialog(false);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Password change dialog */}
      {user && showPasswordChangeDialog && (
        <PasswordChangeRequired 
          open={showPasswordChangeDialog}
          user={user}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}
      <SocketProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/setup" element={<SuperAdminSetup />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          
          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <SuperAdminRoute>
                <UserManagement />
              </SuperAdminRoute>
            }
          />
          
          {/* Not found route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App; 