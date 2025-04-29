import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  IconButton, 
  Divider,
  CircularProgress,
  List,
  ListItem,
  Badge
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Videocam as VideocamIcon,
  Call as CallIcon
} from '@mui/icons-material';
import { format } from 'timeago.js';
import { useAuth } from '../contexts/AuthContext';
import MessageInput from './MessageInput';

const ChatWindow = ({ 
  chat, 
  messages, 
  loading, 
  isTyping, 
  sendMessage, 
  handleTyping, 
  openUserProfile,
  setActiveChat
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [showActions, setShowActions] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get chat name
  const getChatName = () => {
    if (chat.isGroupChat) {
      return chat.chatName;
    }
    
    const chatUser = chat.users.find(u => u._id !== user._id);
    return chatUser?.name || 'Unknown User';
  };

  // Get chat avatar
  const getChatAvatar = () => {
    if (chat.isGroupChat) {
      return chat.groupAvatar || null;
    }
    
    const chatUser = chat.users.find(u => u._id !== user._id);
    return chatUser?.profilePic || null;
  };

  // Get chat user for profile view
  const getChatUser = () => {
    if (!chat.isGroupChat) {
      return chat.users.find(u => u._id !== user._id);
    }
    return null;
  };

  // Check if user is online
  const isUserOnline = () => {
    if (chat.isGroupChat) return false;
    
    const chatUser = chat.users.find(u => u._id !== user._id);
    return chatUser?.status === 'online';
  };

  // Check if message is from current user
  const isMessageFromUser = (msg) => {
    return msg.sender._id === user._id;
  };

  // Format message time
  const formatMessageTime = (createdAt) => {
    const date = new Date(createdAt);
    const today = new Date();
    
    // If today, show time only
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within last 7 days, show day and time
    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date and time
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle send message
  const handleSendMessage = (content, attachments) => {
    sendMessage(content, attachments);
  };

  // Handle back button
  const handleBackClick = () => {
    setActiveChat(null);
  };

  // Handle profile click
  const handleProfileClick = () => {
    const chatUser = getChatUser();
    if (chatUser) {
      openUserProfile(chatUser);
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}
    >
      {/* Chat Header */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 1.5, 
          display: 'flex', 
          alignItems: 'center', 
          borderRadius: 0,
          zIndex: 1
        }}
      >
        <IconButton 
          sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 1 }}
          onClick={handleBackClick}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: !chat.isGroupChat ? 'pointer' : 'default',
            flex: 1
          }}
          onClick={!chat.isGroupChat ? handleProfileClick : undefined}
        >
          <Badge
            variant="dot"
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{ 
              '& .MuiBadge-badge': { 
                backgroundColor: isUserOnline() ? '#44b700' : 'transparent',
                border: '2px solid white',
                width: 12,
                height: 12,
                borderRadius: '50%'
              }
            }}
            invisible={!isUserOnline()}
          >
            <Avatar 
              src={getChatAvatar()} 
              alt={getChatName()}
              sx={{ width: 40, height: 40, mr: 1.5 }}
            >
              {getChatName().charAt(0)}
            </Avatar>
          </Badge>
          
          <Box>
            <Typography variant="subtitle1">
              {getChatName()}
            </Typography>
            
            {isTyping ? (
              <Typography variant="caption" color="text.secondary">
                Typing...
              </Typography>
            ) : isUserOnline() ? (
              <Typography variant="caption" color="text.secondary">
                Online
              </Typography>
            ) : chat.isGroupChat ? (
              <Typography variant="caption" color="text.secondary">
                {chat.users.length} members
              </Typography>
            ) : null}
          </Box>
        </Box>
        
        <Box>
          {!chat.isGroupChat && (
            <>
              <IconButton>
                <CallIcon />
              </IconButton>
              <IconButton>
                <VideocamIcon />
              </IconButton>
            </>
          )}
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Paper>
      
      <Divider />
      
      {/* Messages */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          p: 2,
          bgcolor: '#f5f5f5'
        }}
      >
        {messages.length === 0 ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            height="100%"
          >
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start a conversation!
            </Typography>
          </Box>
        ) : (
          <List>
            {messages.map((message) => (
              <ListItem
                key={message._id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMessageFromUser(message) ? 'flex-end' : 'flex-start',
                  py: 0.5
                }}
              >
                <Box
                  sx={{
                    maxWidth: '75%',
                    bgcolor: isMessageFromUser(message) ? 'primary.light' : 'white',
                    color: isMessageFromUser(message) ? 'white' : 'text.primary',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    position: 'relative',
                    boxShadow: 1
                  }}
                >
                  {!isMessageFromUser(message) && chat.isGroupChat && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 'bold',
                        display: 'block',
                        mb: 0.5
                      }}
                    >
                      {message.sender.name}
                    </Typography>
                  )}
                  
                  {message.content && (
                    <Typography variant="body2">
                      {message.content}
                    </Typography>
                  )}
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <Box>
                      {/* Attachment previews would go here */}
                      <Typography variant="caption">
                        Attachment ({message.attachments.length})
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      textAlign: 'right',
                      mt: 0.5,
                      opacity: 0.7,
                      fontSize: '0.7rem'
                    }}
                  >
                    {formatMessageTime(message.createdAt)}
                  </Typography>
                </Box>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>
      
      {/* Message Input */}
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <MessageInput 
          onSendMessage={handleSendMessage} 
          onTyping={handleTyping}
        />
      </Box>
    </Box>
  );
};

export default ChatWindow; 