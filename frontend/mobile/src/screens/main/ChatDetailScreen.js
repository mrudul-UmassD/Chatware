import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { Avatar, IconButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { DEFAULT_AVATAR, MESSAGE_TYPES } from '../../config';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

const ChatDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, name, isGroupChat } = route.params;
  const flatListRef = useRef(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  
  const { user } = useAuth();
  const { socket } = useSocket();
  const {
    selectedChat,
    setSelectedChat,
    messages,
    chatLoading,
    fetchMessages,
    sendMessage,
    isTyping,
  } = useChat();
  
  useEffect(() => {
    // Set header title
    navigation.setOptions({ title: name });
    
    // Fetch messages and set selected chat
    const fetchData = async () => {
      try {
        // Fetch chat details if not already selected
        if (!selectedChat || selectedChat._id !== chatId) {
          // Ideally, you would fetch the full chat details here
          // For now, we'll work with what we have from params
          setSelectedChat({
            _id: chatId,
            chatName: name,
            isGroupChat,
          });
        }
        
        // Fetch messages
        await fetchMessages(chatId);
      } catch (error) {
        console.error('Error fetching chat data:', error);
      }
    };
    
    fetchData();
    
    // Clean up
    return () => {
      // If needed, perform cleanup when leaving the screen
    };
  }, [chatId, navigation, name]);
  
  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !chatId) return;
    socket.emit('typing', chatId);
  };
  
  const handleStopTyping = () => {
    if (!socket || !chatId) return;
    socket.emit('stop typing', chatId);
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      if (selectedFile) {
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', {
          uri: selectedFile.uri,
          type: selectedFile.type || 'application/octet-stream',
          name: selectedFile.name || 'file',
        });
        formData.append('content', message.trim());
        formData.append('chatId', chatId);
        formData.append('messageType', fileType);
        
        await sendMessage(message.trim(), chatId, fileType, formData);
      } else {
        await sendMessage(message.trim(), chatId);
      }
      
      // Clear input after sending
      setMessage('');
      setSelectedFile(null);
      handleStopTyping();
      
      // Scroll to bottom
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle file attachment
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          name: asset.fileName || `${asset.type}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
        });
        setFileType(asset.type === 'video' ? MESSAGE_TYPES.VIDEO : MESSAGE_TYPES.IMAGE);
        setShowAttachmentOptions(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };
  
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync();
      
      if (result.type === 'success') {
        setSelectedFile({
          uri: result.uri,
          type: result.mimeType || 'application/octet-stream',
          name: result.name,
        });
        setFileType(MESSAGE_TYPES.FILE);
        setShowAttachmentOptions(false);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };
  
  // Render message item
  const renderMessageItem = ({ item }) => {
    const isSender = item.sender._id === user._id;
    const messageTime = format(new Date(item.createdAt), 'h:mm a');
    
    return (
      <View
        style={[
          styles.messageContainer,
          isSender ? styles.sentMessageContainer : styles.receivedMessageContainer,
        ]}
      >
        {!isSender && !isGroupChat && (
          <Avatar.Image
            size={30}
            source={{ uri: item.sender.profilePic || DEFAULT_AVATAR }}
            style={styles.messageAvatar}
          />
        )}
        
        <View
          style={[
            styles.messageBubble,
            isSender ? styles.sentMessageBubble : styles.receivedMessageBubble,
          ]}
        >
          {isGroupChat && !isSender && (
            <Text style={styles.senderName}>{item.sender.name}</Text>
          )}
          
          {renderMessageContent(item)}
          
          <Text style={styles.messageTime}>{messageTime}</Text>
        </View>
      </View>
    );
  };
  
  // Render different message content types
  const renderMessageContent = (message) => {
    switch (message.messageType) {
      case MESSAGE_TYPES.IMAGE:
        return (
          <Image
            source={{ uri: message.fileUrl }}
            style={styles.imageMessage}
            resizeMode="cover"
          />
        );
      case MESSAGE_TYPES.VIDEO:
        return (
          <View style={styles.videoContainer}>
            <Ionicons name="videocam" size={30} color="#fff" />
            <Text style={styles.videoText}>Video</Text>
          </View>
        );
      case MESSAGE_TYPES.FILE:
        return (
          <View style={styles.fileContainer}>
            <Ionicons name="document-outline" size={24} color="#3f51b5" />
            <Text style={styles.fileName}>{message.fileName || 'File'}</Text>
          </View>
        );
      default:
        return <Text style={styles.messageText}>{message.content}</Text>;
    }
  };
  
  // Render file preview
  const renderFilePreview = () => {
    if (!selectedFile) return null;
    
    return (
      <View style={styles.filePreviewContainer}>
        {fileType === MESSAGE_TYPES.IMAGE ? (
          <Image
            source={{ uri: selectedFile.uri }}
            style={styles.filePreview}
            resizeMode="cover"
          />
        ) : fileType === MESSAGE_TYPES.VIDEO ? (
          <View style={styles.videoPreview}>
            <Ionicons name="videocam" size={24} color="#fff" />
            <Text style={styles.videoPreviewText}>Video</Text>
          </View>
        ) : (
          <View style={styles.documentPreview}>
            <Ionicons name="document-outline" size={24} color="#3f51b5" />
            <Text style={styles.documentPreviewText} numberOfLines={1}>
              {selectedFile.name}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.removeFileButton}
          onPress={() => setSelectedFile(null)}
        >
          <Ionicons name="close-circle" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {chatLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3f51b5" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubText}>Start the conversation</Text>
            </View>
          }
        />
      )}
      
      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>Someone is typing...</Text>
        </View>
      )}
      
      {selectedFile && renderFilePreview()}
      
      {showAttachmentOptions && (
        <View style={styles.attachmentOptions}>
          <TouchableOpacity
            style={styles.attachmentOption}
            onPress={handlePickImage}
          >
            <View style={[styles.attachmentIcon, { backgroundColor: '#4caf50' }]}>
              <Ionicons name="image-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.attachmentText}>Image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.attachmentOption}
            onPress={handlePickDocument}
          >
            <View style={[styles.attachmentIcon, { backgroundColor: '#2196f3' }]}>
              <Ionicons name="document-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.attachmentText}>Document</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowAttachmentOptions(!showAttachmentOptions)}
        >
          <Ionicons
            name={showAttachmentOptions ? 'close' : 'attach'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
          onFocus={() => setShowAttachmentOptions(false)}
          onBlur={handleStopTyping}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, (!message.trim() && !selectedFile) && styles.disabledButton]}
          onPress={handleSendMessage}
          disabled={(!message.trim() && !selectedFile) || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flexGrow: 1,
    padding: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    maxWidth: '80%',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
  },
  receivedMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginRight: 5,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    minWidth: 80,
  },
  sentMessageBubble: {
    backgroundColor: '#3f51b5',
  },
  receivedMessageBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  typingContainer: {
    padding: 5,
    backgroundColor: '#f5f5f5',
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  attachButton: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3f51b5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#c5cae9',
  },
  attachmentOptions: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  attachmentOption: {
    alignItems: 'center',
    marginRight: 20,
  },
  attachmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  attachmentText: {
    fontSize: 12,
    color: '#666',
  },
  filePreviewContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filePreview: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  videoPreview: {
    width: 60,
    height: 60,
    borderRadius: 5,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    flex: 1,
  },
  documentPreviewText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeFileButton: {
    marginLeft: 10,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  videoContainer: {
    width: 200,
    height: 150,
    backgroundColor: '#333',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  videoText: {
    color: '#fff',
    marginTop: 5,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  fileName: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
});

export default ChatDetailScreen; 