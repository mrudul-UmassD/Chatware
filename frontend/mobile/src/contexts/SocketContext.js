import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config';

// Create context
const SocketContext = createContext();

// Context provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  // Setup socket connection
  useEffect(() => {
    if (!user) return;

    // Initialize socket
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        userId: user._id,
      },
    });

    // Socket events
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('users-online', (users) => {
      setOnlineUsers(users);
    });

    // Cleanup on unmount
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [user]);

  // Check if a user is online
  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      return onlineUsers.includes(userId);
    },
    [onlineUsers]
  );

  // Context value
  const value = {
    socket,
    connected,
    onlineUsers,
    isUserOnline,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 