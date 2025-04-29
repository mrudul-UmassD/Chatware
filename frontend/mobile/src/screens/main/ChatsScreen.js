import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Searchbar, Button, FAB, Avatar, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { DEFAULT_AVATAR } from '../../config';
import { format } from 'date-fns';

const ChatsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { chats, loading, fetchChats, setSelectedChat, unreadCount } = useChat();
  const { isUserOnline } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  
  useEffect(() => {
    fetchChats();
    
    // Add header button for creating new group
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateGroup')}
          style={{ marginRight: 10 }}
        >
          <Ionicons name="people" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  
  useEffect(() => {
    if (chats) {
      setFilteredChats(
        chats.filter((chat) => {
          const chatName = chat.isGroupChat
            ? chat.chatName.toLowerCase()
            : getSenderData(chat)?.name.toLowerCase();
          return chatName.includes(searchQuery.toLowerCase());
        })
      );
    }
  }, [chats, searchQuery]);
  
  const getSenderData = (chat) => {
    if (!user) return null;
    const otherUser = chat.users.find((u) => u._id !== user._id);
    return otherUser || { name: 'Unknown User', profilePic: DEFAULT_AVATAR };
  };
  
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    navigation.navigate('ChatDetail', {
      chatId: chat._id,
      name: chat.isGroupChat ? chat.chatName : getSenderData(chat)?.name,
      isGroupChat: chat.isGroupChat,
    });
  };
  
  const renderChatItem = ({ item }) => {
    const senderData = getSenderData(item);
    const isOnline = !item.isGroupChat && isUserOnline(senderData?._id);
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleSelectChat(item)}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={50}
            source={
              item.isGroupChat
                ? item.groupPic
                  ? { uri: item.groupPic }
                  : require('../../assets/group-avatar.png')
                : senderData?.profilePic
                  ? { uri: senderData.profilePic }
                  : require('../../assets/default-avatar.png')
            }
          />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {item.isGroupChat ? item.chatName : senderData?.name}
            </Text>
            {item.latestMessage && (
              <Text style={styles.timestamp}>
                {format(new Date(item.latestMessage.createdAt), 'h:mm a')}
              </Text>
            )}
          </View>
          
          <View style={styles.messagePreview}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.latestMessage
                ? item.isGroupChat && item.latestMessage.sender.name !== user.name
                  ? `${item.latestMessage.sender.name}: ${item.latestMessage.content}`
                  : item.latestMessage.content
                : 'No messages yet'}
            </Text>
            
            {unreadCount[item._id] > 0 && (
              <Badge style={styles.unreadBadge}>{unreadCount[item._id]}</Badge>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search chats..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#666"
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3f51b5" />
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No chats yet</Text>
          <Text style={styles.emptySubText}>
            Start a conversation or create a group
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item._id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.chatList}
        />
      )}
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Users')}
        color="#fff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 10,
    elevation: 2,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    textAlign: 'center',
  },
  chatList: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#3f51b5',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3f51b5',
  },
});

export default ChatsScreen; 