import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socketInstance = null;

    if (user) {
      // Initialize socket connection
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: {
          token: localStorage.getItem('token')
        }
      });

      // Setup event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        
        // Send user data to server
        socketInstance.emit('setup', user);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      socketInstance.on('online users', (users) => {
        setOnlineUsers(users);
      });

      socketInstance.on('user online', ({ userId, online }) => {
        if (online) {
          setOnlineUsers((prev) => {
            if (!prev.includes(userId)) {
              return [...prev, userId];
            }
            return prev;
          });
        } else {
          setOnlineUsers((prev) => prev.filter((id) => id !== userId));
        }
      });

      setSocket(socketInstance);
    }

    // Cleanup function
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]);

  const value = {
    socket,
    connected,
    onlineUsers,
    isUserOnline: (userId) => onlineUsers.includes(userId),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 