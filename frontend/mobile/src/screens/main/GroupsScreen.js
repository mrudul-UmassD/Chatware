import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Searchbar, Avatar, Chip, FAB } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

const GroupsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { setSelectedChat } = useChat();
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch groups on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );
  
  // Fetch groups data
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/chat/groups');
      setGroups(response.data);
      setFilteredGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter groups by search query
  useEffect(() => {
    if (groups) {
      if (searchQuery) {
        const filtered = groups.filter(group =>
          group.chatName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredGroups(filtered);
      } else {
        setFilteredGroups(groups);
      }
    }
  }, [searchQuery, groups]);
  
  // Enter a group chat
  const handleOpenGroupChat = (group) => {
    setSelectedChat(group);
    navigation.navigate('ChatDetail', {
      chatId: group._id,
      name: group.chatName,
      isGroupChat: true,
    });
  };
  
  // Create a new group
  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };
  
  // Render group item
  const renderGroupItem = ({ item }) => {
    // Get member count
    const memberCount = item.users.length;
    // Check if user is admin of this group
    const isAdmin = item.groupAdmin && item.groupAdmin._id === user?._id;
    
    return (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => handleOpenGroupChat(item)}
      >
        <Avatar.Image
          size={60}
          source={
            item.groupPic
              ? { uri: item.groupPic }
              : require('../../assets/group-avatar.png')
          }
          style={styles.groupAvatar}
        />
        
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{item.chatName}</Text>
            {isAdmin && <Chip compact style={styles.adminChip}>Admin</Chip>}
          </View>
          
          <View style={styles.groupMetadata}>
            <View style={styles.memberInfo}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.memberCount}>{memberCount} members</Text>
            </View>
            
            {item.latestMessage && (
              <View style={styles.messagePreview}>
                <Text style={styles.latestMessageSender}>
                  {item.latestMessage.sender._id === user?._id
                    ? 'You'
                    : item.latestMessage.sender.name}:
                </Text>
                <Text style={styles.latestMessageContent} numberOfLines={1}>
                  {item.latestMessage.content}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };
  
  // Render empty state if no groups
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-circle-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No groups found</Text>
      <Text style={styles.emptySubText}>
        {searchQuery
          ? 'Try a different search term'
          : 'Create a new group to get started'}
      </Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search groups..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#666"
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3f51b5" />
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item._id}
          renderItem={renderGroupItem}
          contentContainerStyle={styles.groupsList}
          ListEmptyComponent={renderEmptyState}
          refreshing={loading}
          onRefresh={fetchGroups}
        />
      )}
      
      <FAB
        style={styles.fab}
        icon="account-group-outline"
        onPress={handleCreateGroup}
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
  groupsList: {
    flexGrow: 1,
    paddingBottom: 70, // For FAB
  },
  groupItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  groupAvatar: {
    marginRight: 15,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  adminChip: {
    backgroundColor: '#e1f5fe',
    height: 22,
  },
  groupMetadata: {
    marginTop: 5,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestMessageSender: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginRight: 4,
  },
  latestMessageContent: {
    fontSize: 14,
    color: '#777',
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3f51b5',
  },
});

export default GroupsScreen; 