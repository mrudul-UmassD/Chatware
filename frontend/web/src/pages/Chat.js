import React, { useState, useEffect, useRef } from 'react';
import { Box, Grid, Typography, CircularProgress, Drawer } from '@mui/material';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

// Components
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import UserProfileSidebar from '../components/UserProfileSidebar';

const Chat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [fetchAgain, setFetchAgain] = useState(false);
  const [notification, setNotification] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const socket = useRef();
  const typingTimeoutRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    if (!user) return;

    socket.current = io(API_URL);
    socket.current.emit('setup', user);
    socket.current.on('connected', () => setSocketConnected(true));
    socket.current.on('typing', () => setIsTyping(true));
    socket.current.on('stop typing', () => setIsTyping(false));

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [user]);

  // Fetch all chats
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(`${API_URL}/api/chats`, config);
        setChats(data);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user, fetchAgain]);

  // Handle new message notifications
  useEffect(() => {
    if (!socket.current) return;

    socket.current.on('message received', (newMessage) => {
      if (
        !activeChat || // If no chat is selected OR
        activeChat._id !== newMessage.chat._id // If the message is not from the current chat
      ) {
        // Add notification
        if (!notification.includes(newMessage)) {
          setNotification([newMessage, ...notification]);
          // Update chat list to show the latest message
          setFetchAgain(!fetchAgain);
        }
      } else {
        // Add message to current chat
        setMessages([...messages, newMessage]);
      }
    });
  }, [activeChat, messages, notification, fetchAgain]);

  // Fetch messages when activeChat changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) return;
      
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(`${API_URL}/api/messages/${activeChat._id}`, config);
        setMessages(data);
        
        // Join the chat room
        socket.current.emit('join chat', activeChat._id);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [activeChat, user]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socketConnected || !activeChat) return;

    if (!typing) {
      setTyping(true);
      socket.current.emit('typing', activeChat._id);
    }

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout
    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit('stop typing', activeChat._id);
      setTyping(false);
    }, 3000);
  };

  // Handle sending message
  const sendMessage = async (content, attachments = []) => {
    if (!content.trim() && attachments.length === 0) return;
    
    try {
      // Stop typing indicator
      socket.current.emit('stop typing', activeChat._id);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const messageData = {
        content,
        chatId: activeChat._id,
        attachments
      };

      const { data } = await axios.post(`${API_URL}/api/messages`, messageData, config);
      
      // Update messages locally
      setMessages([...messages, data]);
      
      // Send the message via socket
      socket.current.emit('new message', data);
      
      // Update chat list to show the latest message
      setFetchAgain(!fetchAgain);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle opening user profile
  const openUserProfile = (user) => {
    setSelectedProfile(user);
    setProfileOpen(true);
  };

  // Handle closing user profile
  const closeUserProfile = () => {
    setProfileOpen(false);
    setSelectedProfile(null);
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6">Please login to access the chat.</Typography>
      </Box>
    );
  }

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Chat List sidebar */}
        <Grid item xs={12} md={4} lg={3} sx={{ 
          height: '100%', 
          borderRight: '1px solid #e0e0e0',
          display: { xs: activeChat ? 'none' : 'block', md: 'block' }
        }}>
          <ChatList 
            chats={chats} 
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            loading={loading}
            fetchAgain={fetchAgain}
            setFetchAgain={setFetchAgain}
            notification={notification}
            setNotification={setNotification}
          />
        </Grid>
        
        {/* Chat Window */}
        <Grid item xs={12} md={8} lg={9} sx={{ 
          height: '100%',
          display: { xs: activeChat ? 'block' : 'none', md: 'block' } 
        }}>
          {activeChat ? (
            <ChatWindow 
              chat={activeChat}
              messages={messages}
              loading={loading}
              isTyping={isTyping}
              sendMessage={sendMessage}
              handleTyping={handleTyping}
              openUserProfile={openUserProfile}
              setActiveChat={setActiveChat}
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography variant="h6" color="textSecondary">
                Select a chat to start messaging
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* User Profile Drawer */}
      <Drawer
        anchor="right"
        open={profileOpen}
        onClose={closeUserProfile}
      >
        {selectedProfile && (
          <UserProfileSidebar 
            user={selectedProfile} 
            onClose={closeUserProfile} 
          />
        )}
      </Drawer>
    </Box>
  );
};

export default Chat; 