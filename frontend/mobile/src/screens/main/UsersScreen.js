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
import { Searchbar, Avatar, Chip, Button, FAB } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { DEFAULT_AVATAR, ROLES } from '../../config';

const UsersScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { createChat } = useChat();
  const { isUserOnline } = useSocket();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Fetch users on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );
  
  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users');
      // Filter out current user
      const filteredResponse = response.data.filter(u => u._id !== user?._id);
      setUsers(filteredResponse);
      setFilteredUsers(filteredResponse);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter users by search query and role
  useEffect(() => {
    if (users) {
      let result = [...users];
      
      // Filter by search query
      if (searchQuery) {
        result = result.filter(
          user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filter by selected role
      if (selectedRole) {
        result = result.filter(user => user.role === selectedRole);
      }
      
      setFilteredUsers(result);
    }
  }, [searchQuery, selectedRole, users]);
  
  // Start a chat with a user
  const handleStartChat = async (userId) => {
    try {
      setLoading(true);
      const chat = await createChat(userId);
      navigation.navigate('ChatDetail', {
        chatId: chat._id,
        name: chat.isGroupChat ? chat.chatName : chat.users.find(u => u._id !== user._id)?.name,
        isGroupChat: chat.isGroupChat,
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // View user profile
  const handleViewProfile = (selectedUser) => {
    navigation.navigate('UserProfile', {
      userId: selectedUser._id,
      name: selectedUser.name,
    });
  };
  
  // Render role filter chips
  const renderRoleFilters = () => {
    const roles = [
      { key: ROLES.USER, label: 'Users' },
      { key: ROLES.ADMIN, label: 'Admins' },
      { key: ROLES.SUPER_ADMIN, label: 'Super Admins' },
    ];
    
    return (
      <View style={styles.chipsContainer}>
        {roles.map(role => (
          <Chip
            key={role.key}
            selected={selectedRole === role.key}
            onPress={() => setSelectedRole(selectedRole === role.key ? null : role.key)}
            style={[
              styles.chip,
              selectedRole === role.key && styles.selectedChip,
            ]}
            textStyle={selectedRole === role.key ? styles.selectedChipText : null}
          >
            {role.label}
          </Chip>
        ))}
      </View>
    );
  };
  
  // Render user item
  const renderUserItem = ({ item }) => {
    const isOnline = isUserOnline(item._id);
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleViewProfile(item)}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={50}
            source={
              item.profilePic
                ? { uri: item.profilePic }
                : require('../../assets/default-avatar.png')
            }
          />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.name}</Text>
            {item.role === ROLES.ADMIN && (
              <Chip compact style={styles.adminChip}>Admin</Chip>
            )}
            {item.role === ROLES.SUPER_ADMIN && (
              <Chip compact style={styles.superAdminChip}>Super Admin</Chip>
            )}
          </View>
          
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleStartChat(item._id)}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#3f51b5" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search users..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#666"
      />
      
      {renderRoleFilters()}
      
      {loading && users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3f51b5" />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubText}>
            {searchQuery
              ? `Try a different search term or filter`
              : `There are no users to display`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.usersList}
          refreshing={loading}
          onRefresh={fetchUsers}
        />
      )}
      
      {/* Only show FAB if user is an admin */}
      {(user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) && (
        <FAB
          style={styles.fab}
          icon="account-plus"
          onPress={() => navigation.navigate('CreateUser')}
          color="#fff"
        />
      )}
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
  chipsContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#eee',
  },
  selectedChip: {
    backgroundColor: '#3f51b5',
  },
  selectedChipText: {
    color: '#fff',
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
  usersList: {
    flexGrow: 1,
    paddingBottom: 70, // For FAB
  },
  userItem: {
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
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  adminChip: {
    backgroundColor: '#e1f5fe',
    height: 22,
  },
  superAdminChip: {
    backgroundColor: '#ffe0b2',
    height: 22,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8eaf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3f51b5',
  },
});

export default UsersScreen; 