import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptionService } from '../services/EncryptionService';

// Create context
const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [chatLoading, setChatLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket();
  
  // Initialize encryption service when user logs in
  useEffect(() => {
    const initializeEncryption = async () => {
      if (user && user._id) {
        await encryptionService.initialize(user._id);
        
        // Fetch public keys of other users for encryption
        try {
          const response = await api.get('/api/user/public-keys');
          if (response.data && response.data.length) {
            response.data.forEach(userKey => {
              if (userKey.userId !== user._id && userKey.publicKey) {
                encryptionService.savePublicKey(userKey.userId, userKey.publicKey);
              }
            });
          }
        } catch (error) {
          console.error('Failed to fetch public keys:', error);
        }
        
        // Share our public key with server
        try {
          await api.post('/api/user/public-key', {
            userId: user._id,
            publicKey: encryptionService.getPublicKey(),
          });
        } catch (error) {
          console.error('Failed to share public key:', error);
        }
      }
    };
    
    initializeEncryption();
  }, [user]);
  
  // Setup socket events for chat functionality
  useEffect(() => {
    if (socket && user) {
      socket.on('message received', (newMessageReceived) => {
        // Check if the message is for the current chat
        if (selectedChat && selectedChat._id === newMessageReceived.chat._id) {
          // If message is encrypted, decrypt it
          if (newMessageReceived.encrypted && newMessageReceived.content) {
            try {
              const senderId = newMessageReceived.sender._id;
              const decryptedContent = encryptionService.decryptMessage(
                newMessageReceived.content, 
                senderId
              );
              newMessageReceived.content = decryptedContent;
            } catch (error) {
              console.error('Failed to decrypt received message:', error);
              newMessageReceived.content = '[Encrypted Message]';
            }
          }
          
          // Add new message to current chat
          setMessages(prev => [...prev, newMessageReceived]);
        } else {
          // Update unread messages count for chats
          setUnreadMessages(prev => {
            const chatId = newMessageReceived.chat._id;
            return {
              ...prev,
              [chatId]: (prev[chatId] || 0) + 1
            };
          });
        }
        
        // Update chat list with new message
        setChats(prev => {
          // Check if this chat already exists in the list
          const chatExists = prev.some(c => c._id === newMessageReceived.chat._id);
          
          // Decrypt message for display in chat list
          let displayContent = newMessageReceived.content;
          if (newMessageReceived.encrypted && displayContent) {
            try {
              const senderId = newMessageReceived.sender._id;
              displayContent = encryptionService.decryptMessage(displayContent, senderId);
            } catch (error) {
              displayContent = '[Encrypted Message]';
            }
          }
          
          // Create modified message for display
          const updatedMessage = {
            ...newMessageReceived,
            content: displayContent
          };
          
          if (chatExists) {
            // Update existing chat
            return prev.map(c => c._id === newMessageReceived.chat._id 
              ? { ...c, latestMessage: updatedMessage } 
              : c);
          } else {
            // Add new chat to the list
            return [{ ...newMessageReceived.chat, latestMessage: updatedMessage }, ...prev];
          }
        });
      });
      
      socket.on('typing', (chatId) => {
        if (selectedChat && selectedChat._id === chatId) {
          setIsTyping(true);
        }
      });
      
      socket.on('stop typing', (chatId) => {
        if (selectedChat && selectedChat._id === chatId) {
          setIsTyping(false);
        }
      });
      
      return () => {
        socket.off('message received');
        socket.off('typing');
        socket.off('stop typing');
      };
    }
  }, [socket, selectedChat, user]);
  
  // Fetch chats for current user
  const fetchChats = useCallback(async () => {
    if (!user) return;
    
    try {
      setChatLoading(true);
      const { data } = await api.get('/api/chat');
      
      // Process chats to decrypt latest messages
      const processedChats = data.map(chat => {
        if (chat.latestMessage && chat.latestMessage.encrypted && chat.latestMessage.content) {
          try {
            const senderId = chat.latestMessage.sender._id;
            const decryptedContent = encryptionService.decryptMessage(
              chat.latestMessage.content,
              senderId
            );
            return {
              ...chat,
              latestMessage: {
                ...chat.latestMessage,
                content: decryptedContent
              }
            };
          } catch (error) {
            return {
              ...chat,
              latestMessage: {
                ...chat.latestMessage,
                content: '[Encrypted Message]'
              }
            };
          }
        }
        return chat;
      });
      
      setChats(processedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setChatLoading(false);
    }
  }, [user]);
  
  // Fetch messages for a chat
  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    
    try {
      setMessageLoading(true);
      const response = await api.get(`/api/message/${chatId}`);
      
      // Decrypt messages
      const decryptedMessages = response.data.map(message => {
        if (message.encrypted && message.content) {
          // Decrypt message content
          try {
            const senderId = message.sender._id;
            const decryptedContent = encryptionService.decryptMessage(message.content, senderId);
            return { ...message, content: decryptedContent };
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            return { ...message, content: '[Encrypted Message]' };
          }
        }
        return message;
      });
      
      setMessages(decryptedMessages);
      
      // Clear notifications for this chat
      setUnreadMessages(prev => ({
        ...prev,
        [chatId]: 0
      }));
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessageLoading(false);
    }
  }, []);
  
  // Send message
  const sendMessage = useCallback(async (content, chatId, messageType = 'text', formData = null) => {
    if ((!content && !formData) || !chatId) return;
    
    try {
      let recipients = [];
      
      // Determine message recipients for encryption
      if (selectedChat) {
        if (selectedChat.isGroupChat) {
          // In a group chat, encrypt for all users except self
          recipients = selectedChat.users
            .filter(u => u._id !== user._id)
            .map(u => u._id);
        } else {
          // In one-on-one chat, encrypt for the other user
          const otherUser = selectedChat.users.find(u => u._id !== user._id);
          if (otherUser) {
            recipients = [otherUser._id];
          }
        }
      }
      
      // Send with file
      if (formData) {
        // For file messages, encrypt the text content if present
        if (content) {
          let encryptedContent = content;
          
          // Encrypt for first recipient (keep simple for now)
          // In a production app, you might encrypt individually for each recipient
          // or use a shared group key
          if (recipients.length > 0) {
            encryptedContent = encryptionService.encryptMessage(content, recipients[0]);
          }
          
          formData.append('content', encryptedContent);
          formData.append('encrypted', 'true');
        }
        
        const { data } = await api.post('/api/message', formData);
        
        // Store unencrypted version in our local state
        const localMessage = {
          ...data,
          content // Use the original content for display
        };
        
        setMessages(prev => [...prev, localMessage]);
        
        // Update chat list with new message
        setChats(prev => 
          prev.map(c => c._id === chatId 
            ? { ...c, latestMessage: localMessage } 
            : c)
        );
        
        return data;
      } 
      // Send text only
      else {
        // Encrypt the message content
        let encryptedContent = content;
        
        // In a real app, you'd encrypt individually for each recipient
        // or use a shared group key for efficiency
        if (recipients.length > 0) {
          encryptedContent = encryptionService.encryptMessage(content, recipients[0]);
        }
        
        const { data } = await api.post('/api/message', {
          content: encryptedContent,
          chatId,
          messageType,
          encrypted: true
        });
        
        // Store unencrypted version in our local state for display
        const localMessage = {
          ...data,
          content // Use the original content for display
        };
        
        setMessages(prev => [...prev, localMessage]);
        
        // Update chat list with new message
        setChats(prev => 
          prev.map(c => c._id === chatId 
            ? { ...c, latestMessage: localMessage } 
            : c)
        );
        
        return data;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [selectedChat, user]);
  
  // Access or create a one-on-one chat
  const createChat = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      const { data } = await api.post('/api/chat', { userId });
      setChats(prev => {
        // Check if chat already exists in list
        const exists = prev.some(c => c._id === data._id);
        if (!exists) {
          return [data, ...prev];
        }
        return prev;
      });
      return data;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }, []);
  
  // Create a group chat
  const createGroupChat = useCallback(async (users, name, groupPic = null) => {
    if (!users || users.length < 2 || !name) return;
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('users', JSON.stringify(users));
      
      if (groupPic) {
        formData.append('groupPic', {
          uri: groupPic,
          type: 'image/jpeg',
          name: 'group-pic.jpg'
        });
      }
      
      const { data } = await api.post('/api/chat/group', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setChats(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  }, []);
  
  // Initial fetch of chats
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [fetchChats, user]);
  
  const value = {
    selectedChat,
    setSelectedChat,
    chats,
    messages,
    unreadMessages,
    chatLoading,
    messageLoading,
    isTyping,
    fetchChats,
    fetchMessages,
    sendMessage,
    createChat,
    createGroupChat
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}; 