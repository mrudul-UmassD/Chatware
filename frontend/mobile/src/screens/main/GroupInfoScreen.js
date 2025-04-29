import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { 
  Avatar, 
  Button, 
  Divider, 
  IconButton, 
  Menu, 
  Dialog, 
  Portal, 
  TextInput,
  ActivityIndicator
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

const GroupInfoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { chatId } = route.params;
  const { user } = useAuth();
  const { setSelectedChat } = useChat();
  
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [addMemberDialogVisible, setAddMemberDialogVisible] = useState(false);
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchGroupInfo();
  }, [chatId]);

  const fetchGroupInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/chat/${chatId}`);
      setGroupInfo(response.data);
      setMembers(response.data.users);
      setNewGroupName(response.data.chatName);
      
      // Check if current user is admin
      const isUserAdmin = response.data.groupAdmin.some(
        admin => admin._id === user._id
      );
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error('Error fetching group info:', error);
      Alert.alert('Error', 'Failed to load group information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroupPic = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUpdateLoading(true);
        
        const imageUri = result.assets[0].uri;
        const imageUriParts = imageUri.split('.');
        const imageFileType = imageUriParts[imageUriParts.length - 1];
        
        const formData = new FormData();
        formData.append('chatId', chatId);
        formData.append('groupPic', {
          uri: imageUri,
          name: `group-pic-${Date.now()}.${imageFileType}`,
          type: `image/${imageFileType}`,
        });
        
        await api.put('/api/chat/group/picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        fetchGroupInfo();
      }
    } catch (error) {
      console.error('Error updating group picture:', error);
      Alert.alert('Error', 'Failed to update group picture');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleRenameGroup = async () => {
    if (!newGroupName.trim() || newGroupName.trim() === groupInfo.chatName) {
      setRenameDialogVisible(false);
      return;
    }
    
    try {
      setUpdateLoading(true);
      await api.put('/api/chat/group/rename', {
        chatId: chatId,
        chatName: newGroupName.trim(),
      });
      
      fetchGroupInfo();
      setRenameDialogVisible(false);
    } catch (error) {
      console.error('Error renaming group:', error);
      Alert.alert('Error', 'Failed to rename group');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const response = await api.get('/api/user');
      
      // Filter users not already in the group
      const filteredUsers = response.data.filter(
        u => !members.some(member => member._id === u._id) && 
        u.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddToGroup = async (userId) => {
    try {
      setUpdateLoading(true);
      await api.put('/api/chat/group/add', {
        chatId: chatId,
        userId: userId,
      });
      
      fetchGroupInfo();
      setAddMemberDialogVisible(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding user to group:', error);
      Alert.alert('Error', 'Failed to add user to group');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleRemoveFromGroup = async (userId) => {
    Alert.alert(
      'Remove User',
      'Are you sure you want to remove this user from the group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdateLoading(true);
              await api.put('/api/chat/group/remove', {
                chatId: chatId,
                userId: userId,
              });
              
              fetchGroupInfo();
            } catch (error) {
              console.error('Error removing user from group:', error);
              Alert.alert('Error', 'Failed to remove user from group');
            } finally {
              setUpdateLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdateLoading(true);
              await api.put('/api/chat/group/leave', {
                chatId: chatId,
              });
              
              setSelectedChat(null);
              navigation.navigate('Chats');
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group');
              setUpdateLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderMemberItem = ({ item }) => {
    const isItemAdmin = groupInfo?.groupAdmin.some(admin => admin._id === item._id);
    const isSelf = item._id === user._id;
    
    return (
      <View style={styles.memberItem}>
        <Avatar.Image
          size={50}
          source={
            item.pic ? { uri: item.pic } : require('../../assets/avatar-placeholder.png')
          }
          style={styles.userAvatar}
        />
        <View style={styles.memberInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.memberName}>{item.name}</Text>
            {isSelf && <Text style={styles.selfLabel}> (You)</Text>}
            {isItemAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberEmail}>{item.email}</Text>
        </View>
        
        {isAdmin && !isSelf && (
          <IconButton
            icon="account-remove"
            color="#ff6b6b"
            size={20}
            onPress={() => handleRemoveFromGroup(item._id)}
          />
        )}
      </View>
    );
  };

  const renderSearchResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleAddToGroup(item._id)}
    >
      <Avatar.Image
        size={40}
        source={
          item.pic ? { uri: item.pic } : require('../../assets/avatar-placeholder.png')
        }
        style={styles.searchResultAvatar}
      />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultEmail}>{item.email}</Text>
      </View>
      <IconButton icon="plus" color="#3f51b5" size={20} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Group Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {updateLoading ? (
              <View style={styles.avatarLoader}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <>
                <Avatar.Image
                  size={100}
                  source={
                    groupInfo?.groupPic 
                      ? { uri: groupInfo.groupPic } 
                      : require('../../assets/group-placeholder.png')
                  }
                />
                {isAdmin && (
                  <TouchableOpacity 
                    style={styles.editAvatarButton}
                    onPress={handleUpdateGroupPic}
                  >
                    <Ionicons name="camera" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
          
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName}>{groupInfo?.chatName}</Text>
            {isAdmin && (
              <IconButton
                icon="pencil"
                size={20}
                color="#3f51b5"
                onPress={() => setRenameDialogVisible(true)}
              />
            )}
          </View>
          
          <Text style={styles.memberCount}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Text>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Group Actions */}
        <View style={styles.actionsContainer}>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setAddMemberDialogVisible(true)}
            >
              <View style={styles.actionIconContainer}>
                <MaterialIcons name="person-add" size={24} color="#3f51b5" />
              </View>
              <Text style={styles.actionText}>Add Member</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLeaveGroup}
          >
            <View style={[styles.actionIconContainer, styles.dangerAction]}>
              <MaterialCommunityIcons name="exit-to-app" size={24} color="#ff6b6b" />
            </View>
            <Text style={styles.dangerActionText}>Leave Group</Text>
          </TouchableOpacity>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Members List */}
        <View style={styles.membersContainer}>
          <Text style={styles.sectionTitle}>Members</Text>
          
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            contentContainerStyle={styles.membersList}
          />
        </View>
      </ScrollView>
      
      {/* Rename Dialog */}
      <Portal>
        <Dialog
          visible={renameDialogVisible}
          onDismiss={() => setRenameDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Rename Group</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleRenameGroup} 
              loading={updateLoading}
              disabled={updateLoading || !newGroupName.trim() || newGroupName.trim() === groupInfo?.chatName}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Add Member Dialog */}
      <Portal>
        <Dialog
          visible={addMemberDialogVisible}
          onDismiss={() => {
            setAddMemberDialogVisible(false);
            setSearchQuery('');
            setSearchResults([]);
          }}
          style={styles.dialog}
        >
          <Dialog.Title>Add Member</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Search Users"
              value={searchQuery}
              onChangeText={handleSearchUsers}
              mode="outlined"
              right={<TextInput.Icon icon="magnify" />}
            />
            
            {searching ? (
              <ActivityIndicator style={styles.searchLoader} />
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResultItem}
                keyExtractor={(item) => item._id}
                style={styles.searchResultsList}
                ListEmptyComponent={
                  searchQuery ? (
                    <Text style={styles.noResultsText}>No users found</Text>
                  ) : null
                }
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setAddMemberDialogVisible(false);
              setSearchQuery('');
              setSearchResults([]);
            }}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatarLoader: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3f51b5',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  memberCount: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#ddd',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8eaf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerAction: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 14,
    color: '#555',
  },
  dangerActionText: {
    fontSize: 14,
    color: '#ff6b6b',
  },
  membersContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  membersList: {
    paddingBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  userAvatar: {
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  selfLabel: {
    fontSize: 14,
    color: '#777',
  },
  adminBadge: {
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  adminText: {
    fontSize: 12,
    color: '#3f51b5',
  },
  memberEmail: {
    fontSize: 14,
    color: '#777',
  },
  dialog: {
    maxHeight: '80%',
  },
  searchResultsList: {
    maxHeight: 300,
    marginTop: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultAvatar: {
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchResultEmail: {
    fontSize: 14,
    color: '#777',
  },
  searchLoader: {
    marginTop: 20,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },
});

export default GroupInfoScreen; 