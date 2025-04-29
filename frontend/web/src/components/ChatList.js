import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Divider, 
  IconButton, 
  TextField,
  InputAdornment,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { format } from 'timeago.js';
import { useAuth } from '../contexts/AuthContext';

const ChatList = ({ 
  chats, 
  activeChat, 
  setActiveChat, 
  loading, 
  notification, 
  setNotification 
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    // For group chats, search in group name
    if (chat.isGroupChat) {
      return chat.chatName.toLowerCase().includes(search.toLowerCase());
    }
    
    // For one-on-one chats, search in the other user's name
    const chatUser = chat.users.find(u => u._id !== user._id);
    return chatUser?.name.toLowerCase().includes(search.toLowerCase());
  });

  // Get chat name
  const getChatName = (chat) => {
    if (chat.isGroupChat) {
      return chat.chatName;
    }
    
    const chatUser = chat.users.find(u => u._id !== user._id);
    return chatUser?.name || 'Unknown User';
  };

  // Get chat avatar
  const getChatAvatar = (chat) => {
    if (chat.isGroupChat) {
      return chat.groupAvatar || null;
    }
    
    const chatUser = chat.users.find(u => u._id !== user._id);
    return chatUser?.profilePic || null;
  };

  // Get latest message
  const getLatestMessage = (chat) => {
    if (!chat.latestMessage) {
      return 'No messages yet';
    }
    
    const message = chat.latestMessage;
    
    if (message.content) {
      return message.content.length > 30 
        ? `${message.content.substring(0, 30)}...` 
        : message.content;
    }
    
    if (message.attachments && message.attachments.length > 0) {
      return 'Sent an attachment';
    }
    
    return 'New message';
  };

  // Get notification count for a chat
  const getNotificationCount = (chatId) => {
    return notification.filter(n => n.chat._id === chatId).length;
  };

  // Handle chat selection
  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    
    // Remove notifications for this chat
    setNotification(notification.filter(n => n.chat._id !== chat._id));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Chats</Typography>
        <IconButton>
          <AddIcon />
        </IconButton>
      </Box>
      
      {/* Search */}
      <Box sx={{ px: 2, pb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Divider />
      
      {/* Chat list */}
      {filteredChats.length > 0 ? (
        <List sx={{ overflow: 'auto', flexGrow: 1 }}>
          {filteredChats.map(chat => (
            <React.Fragment key={chat._id}>
              <ListItem 
                button 
                alignItems="flex-start"
                selected={activeChat?._id === chat._id}
                onClick={() => handleChatSelect(chat)}
                sx={{ 
                  py: 1.5,
                  backgroundColor: activeChat?._id === chat._id ? 'action.selected' : 'inherit',
                  '&:hover': {
                    backgroundColor: activeChat?._id === chat._id ? 'action.selected' : 'action.hover',
                  }
                }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={getNotificationCount(chat._id)}
                    color="primary"
                    overlap="circular"
                    invisible={getNotificationCount(chat._id) === 0}
                  >
                    <Avatar src={getChatAvatar(chat)} alt={getChatName(chat)}>
                      {getChatName(chat).charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle1"
                      component="span"
                      fontWeight={chat.unreadCount > 0 ? 'bold' : 'normal'}
                    >
                      {getChatName(chat)}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" display="flex" flexDirection="column">
                      <Typography
                        variant="body2"
                        component="span"
                        noWrap
                        sx={{
                          fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal',
                          color: chat.unreadCount > 0 ? 'text.primary' : 'text.secondary',
                        }}
                      >
                        {getLatestMessage(chat)}
                      </Typography>
                      <Typography variant="caption" component="span" color="text.secondary">
                        {chat.latestMessage ? format(chat.latestMessage.createdAt) : ''}
                      </Typography>
                    </Box>
                  }
                />
                <Box>
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
          <Typography variant="body2" color="text.secondary">
            {search ? 'No chats found' : 'No chats yet'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChatList; 