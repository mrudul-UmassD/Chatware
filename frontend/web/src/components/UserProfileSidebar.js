import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';
import { format } from 'timeago.js';

const UserProfileSidebar = ({ user, onClose }) => {
  if (!user) return null;
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <Box sx={{ width: 320, p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
        <IconButton
          sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ pt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            src={user.profilePic}
            alt={user.name}
            sx={{ width: 100, height: 100, border: '4px solid white', mb: 2 }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            {user.name}
          </Typography>
          <Typography variant="body2">
            {user.status === 'online' ? 'Online' : `Last seen ${format(user.lastSeen || new Date())}`}
          </Typography>
        </Box>
      </Box>
      
      {/* Info */}
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Info
        </Typography>
        
        <List dense>
          {user.email && (
            <ListItem>
              <ListItemIcon>
                <EmailIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Email"
                secondary={user.email}
              />
            </ListItem>
          )}
          
          {user.phone && (
            <ListItem>
              <ListItemIcon>
                <PhoneIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Phone"
                secondary={user.phone}
              />
            </ListItem>
          )}
          
          {user.bio && (
            <>
              <Divider sx={{ my: 1 }} />
              <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Bio
                </Typography>
                <Typography variant="body2">
                  {user.bio}
                </Typography>
              </ListItem>
            </>
          )}
          
          <Divider sx={{ my: 1 }} />
          
          <ListItem>
            <ListItemText 
              primary="Joined"
              secondary={formatDate(user.createdAt)}
            />
          </ListItem>
        </List>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Media
          </Typography>
          
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
              mb: 2
            }}
          >
            {/* This would display shared media between users */}
            <Box sx={{ bgcolor: '#f5f5f5', height: 70, borderRadius: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                No media
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Actions */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button 
            size="small" 
            startIcon={<PersonAddIcon />}
            variant="outlined"
            fullWidth
            sx={{ mr: 1 }}
          >
            Add Friend
          </Button>
          <Button
            size="small"
            startIcon={<NotificationsOffIcon />}
            variant="outlined"
            fullWidth
            sx={{ ml: 1 }}
          >
            Mute
          </Button>
        </Box>
        
        <Button
          size="small"
          startIcon={<BlockIcon />}
          color="error"
          variant="outlined"
          fullWidth
          sx={{ mb: 1 }}
        >
          Block User
        </Button>
        
        <Button
          size="small"
          startIcon={<DeleteIcon />}
          color="error"
          variant="outlined"
          fullWidth
        >
          Delete Chat
        </Button>
      </Box>
    </Box>
  );
};

export default UserProfileSidebar; 