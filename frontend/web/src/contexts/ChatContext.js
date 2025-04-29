import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';
import { encryptionService } from '../services/EncryptionService';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, socket, setSocket } = useAuth();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notification, setNotification] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchAgain, setFetchAgain] = useState(false);
  
  // Initialize encryption service when user logs in
  useEffect(() => {
    const initializeEncryption = async () => {
      if (user) {
        await encryptionService.initialize(user._id);
        
        // Fetch public keys of other users
        try {
          const { data } = await api.get('/api/user/keys');
          if (data && data.keys) {
            // Store public keys
            data.keys.forEach(keyInfo => {
              if (keyInfo.userId !== user._id) {
                encryptionService.savePublicKey(keyInfo.userId, keyInfo.publicKey);
              }
            });
          }
          
          // Share our public key with the server
          await api.post('/api/user/keys', {
            publicKey: encryptionService.getPublicKey()
          });
        } catch (error) {
          console.error("Failed to fetch or share encryption keys:", error);
        }
      }
    };
    
    initializeEncryption();
  }, [user]);

  // Socket connection
  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, setSocket]);

  // Socket event listeners
  useEffect(() => {
    if (socket && user) {
      socket.emit("setup", user);
      
      socket.on("connected", () => {
        console.log("Socket connected");
      });
      
      socket.on("message received", (newMessage) => {
        // Decrypt the message if needed
        if (newMessage.content && newMessage.sender._id !== user._id) {
          try {
            const decryptedContent = encryptionService.decryptMessage(
              newMessage.content, 
              newMessage.sender._id
            );
            newMessage.content = decryptedContent;
          } catch (error) {
            console.error("Error decrypting message:", error);
          }
        }
        
        if (selectedChat && selectedChat._id === newMessage.chat._id) {
          setMessages(prev => [...prev, newMessage]);
        }
        
        // Update chat list with latest message
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat._id === newMessage.chat._id) {
              return { ...chat, latestMessage: newMessage };
            }
            return chat;
          });
          
          // Sort chats to put the one with new message at top
          return updatedChats.sort((a, b) => {
            if (a._id === newMessage.chat._id) return -1;
            if (b._id === newMessage.chat._id) return 1;
            return 0;
          });
        });
        
        // Add notification if not in the same chat
        if (!selectedChat || selectedChat._id !== newMessage.chat._id) {
          setNotification(prev => [newMessage, ...prev]);
        }
      });
    }
    
    return () => {
      if (socket) {
        socket.off("connected");
        socket.off("message received");
      }
    };
  }, [socket, user, selectedChat]);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data } = await api.get('/api/chat');
      
      // Process chats to decrypt latest messages
      const processedChats = data.map(chat => {
        if (chat.latestMessage && chat.latestMessage.content && chat.latestMessage.sender._id !== user._id) {
          try {
            const decryptedContent = encryptionService.decryptMessage(
              chat.latestMessage.content, 
              chat.latestMessage.sender._id
            );
            return {
              ...chat,
              latestMessage: {
                ...chat.latestMessage,
                content: decryptedContent
              }
            };
          } catch (error) {
            console.error("Error decrypting latest message:", error);
          }
        }
        return chat;
      });
      
      setChats(processedChats);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }, [user]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;
    
    try {
      setLoading(true);
      const { data } = await api.get(`/api/message/${selectedChat._id}`);
      
      // Decrypt messages
      const decryptedMessages = data.map(msg => {
        if (msg.content && msg.sender._id !== user._id) {
          try {
            const decryptedContent = encryptionService.decryptMessage(
              msg.content, 
              msg.sender._id
            );
            return { ...msg, content: decryptedContent };
          } catch (error) {
            console.error("Error decrypting message:", error);
            return msg;
          }
        }
        return msg;
      });
      
      setMessages(decryptedMessages);
      setLoading(false);
      
      // Mark messages as read
      if (socket) {
        socket.emit("join chat", selectedChat._id);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }, [selectedChat, socket, user]);

  // Send message
  const sendMessage = async (content, type = 'text', fileData = null) => {
    if (!content && type === 'text') return;
    
    try {
      // Encrypt the message before sending
      let encryptedContent = content;
      let encryptedFile = fileData;
      
      // Get recipient ID(s)
      const recipients = selectedChat.users.filter(u => u._id !== user._id).map(u => u._id);
      
      // For simplicity, we'll just use the first recipient for encryption
      // In a group chat scenario, you would need to encrypt for each recipient
      const recipientId = recipients[0];
      
      // Encrypt based on content type
      if (type === 'text') {
        encryptedContent = encryptionService.encryptMessage(content, recipientId);
      } else if (type === 'file' && fileData) {
        encryptedFile = encryptionService.encryptFile(fileData, recipientId);
      }
      
      const payload = {
        content: encryptedContent,
        chatId: selectedChat._id,
        type
      };
      
      if (type !== 'text' && encryptedFile) {
        payload.file = encryptedFile;
      }
      
      const { data } = await api.post('/api/message', payload);
      
      // Store unencrypted version in local state for display
      const messageToDisplay = {
        ...data,
        content // Original unencrypted content
      };
      
      setMessages(prev => [...prev, messageToDisplay]);
      
      // Update chat's latest message in the list
      setChats(prevChats => {
        const updatedChats = prevChats.map(chat => {
          if (chat._id === selectedChat._id) {
            return { ...chat, latestMessage: messageToDisplay };
          }
          return chat;
        });
        
        // Sort chats to put the one with new message at top
        return updatedChats.sort((a, b) => {
          if (a._id === selectedChat._id) return -1;
          if (b._id === selectedChat._id) return 1;
          return 0;
        });
      });
      
      // Emit socket event
      if (socket) {
        socket.emit("new message", data);
      }
      
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // Create chat
  const createChat = async (userId) => {
    try {
      const { data } = await api.post('/api/chat', { userId });
      
      if (!chats.find(c => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      
      setSelectedChat(data);
      navigate('/chat');
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // Create group chat
  const createGroupChat = async (users, name) => {
    try {
      const { data } = await api.post('/api/chat/group', {
        users: JSON.stringify(users.map(u => u._id)),
        name
      });
      
      setChats([data, ...chats]);
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // Update group chat
  const updateGroupChat = async (chatId, name, users) => {
    try {
      const { data } = await api.put('/api/chat/group', {
        chatId,
        name,
        users: JSON.stringify(users.map(u => u._id))
      });
      
      // Update chats list and selected chat
      setChats(prevChats => 
        prevChats.map(c => (c._id === data._id ? data : c))
      );
      
      if (selectedChat && selectedChat._id === data._id) {
        setSelectedChat(data);
      }
      
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // Context value
  const value = {
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    messages,
    setMessages,
    notification,
    setNotification,
    loading,
    fetchAgain,
    setFetchAgain,
    fetchChats,
    fetchMessages,
    sendMessage,
    createChat,
    createGroupChat,
    updateGroupChat
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  return useContext(ChatContext);
}; 