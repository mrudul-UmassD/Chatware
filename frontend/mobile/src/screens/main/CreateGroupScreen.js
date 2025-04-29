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
import { TextInput, Button, Avatar, Chip, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

const CreateGroupScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { setSelectedChat } = useChat();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [groupPic, setGroupPic] = useState(null);

  // Validation schema
  const validationSchema = Yup.object().shape({
    groupName: Yup.string()
      .required('Group name is required')
      .min(3, 'Group name must be at least 3 characters'),
  });

  // Fetch all users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (allUsers.length > 0) {
      if (searchQuery) {
        const filtered = allUsers.filter(
          (u) => 
            u._id !== user?._id && 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !selectedUsers.some(selected => selected._id === u._id)
        );
        setFilteredUsers(filtered);
      } else {
        setFilteredUsers(
          allUsers.filter(
            (u) => 
              u._id !== user?._id && 
              !selectedUsers.some(selected => selected._id === u._id)
          )
        );
      }
    }
  }, [searchQuery, allUsers, selectedUsers]);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/api/user');
      setAllUsers(response.data);
      setFilteredUsers(response.data.filter(u => u._id !== user?._id));
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle user selection
  const handleUserSelect = (selectedUser) => {
    setSelectedUsers([...selectedUsers, selectedUser]);
    setSearchQuery('');
  };

  // Remove user from selection
  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setGroupPic(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Create new group
  const handleCreateGroup = async (values) => {
    if (selectedUsers.length < 2) {
      Alert.alert('Error', 'Please select at least 2 users for a group');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('name', values.groupName);
      formData.append('users', JSON.stringify(selectedUsers.map(user => user._id)));
      
      if (groupPic) {
        const imageUriParts = groupPic.split('.');
        const imageFileType = imageUriParts[imageUriParts.length - 1];
        
        formData.append('groupPic', {
          uri: groupPic,
          name: `group-pic-${Date.now()}.${imageFileType}`,
          type: `image/${imageFileType}`,
        });
      }
      
      const response = await api.post('/api/chat/group', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Set as selected chat and navigate to chat detail
      setSelectedChat(response.data);
      navigation.navigate('ChatDetail', {
        chatId: response.data._id,
        name: response.data.chatName,
        isGroupChat: true,
      });
      
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render selected user item
  const renderSelectedUser = ({ item }) => (
    <Chip
      mode="outlined"
      onClose={() => handleRemoveUser(item._id)}
      style={styles.selectedUserChip}
      avatar={
        <Avatar.Image
          size={24}
          source={
            item.pic ? { uri: item.pic } : require('../../assets/avatar-placeholder.png')
          }
        />
      }
    >
      {item.name}
    </Chip>
  );

  // Render user item in search results
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <Avatar.Image
        size={40}
        source={
          item.pic ? { uri: item.pic } : require('../../assets/avatar-placeholder.png')
        }
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <MaterialIcons name="add-circle-outline" size={24} color="#3f51b5" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Formik
          initialValues={{ groupName: '' }}
          validationSchema={validationSchema}
          onSubmit={handleCreateGroup}
        >
          {({ handleChange, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              {/* Group Image */}
              <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                {groupPic ? (
                  <Image source={{ uri: groupPic }} style={styles.groupImage} />
                ) : (
                  <View style={styles.groupImagePlaceholder}>
                    <Ionicons name="people" size={50} color="#ccc" />
                    <Text style={styles.imagePlaceholderText}>Add Group Image</Text>
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* Group Name Input */}
              <TextInput
                label="Group Name"
                value={values.groupName}
                onChangeText={handleChange('groupName')}
                style={styles.input}
                mode="outlined"
                error={touched.groupName && errors.groupName}
              />
              {touched.groupName && errors.groupName && (
                <Text style={styles.errorText}>{errors.groupName}</Text>
              )}

              {/* Selected Users */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Selected Members</Text>
                <Text style={styles.memberCount}>
                  {selectedUsers.length} selected
                </Text>
              </View>

              {selectedUsers.length > 0 ? (
                <FlatList
                  data={selectedUsers}
                  renderItem={renderSelectedUser}
                  keyExtractor={(item) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedUsersList}
                />
              ) : (
                <Text style={styles.noSelectionText}>
                  Select at least 2 users to create a group
                </Text>
              )}

              {/* User Search */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Add Members</Text>
              </View>

              <TextInput
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                mode="outlined"
                left={<TextInput.Icon icon="magnify" />}
              />

              {/* User List */}
              {usersLoading ? (
                <ActivityIndicator style={styles.loader} color="#3f51b5" />
              ) : (
                <View style={styles.userListContainer}>
                  <FlatList
                    data={filteredUsers}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.userList}
                    ListEmptyComponent={
                      <Text style={styles.noUsersText}>
                        No users found matching your search
                      </Text>
                    }
                    nestedScrollEnabled
                    scrollEnabled={false}
                  />
                </View>
              )}

              {/* Create Button */}
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.createButton}
                loading={loading}
                disabled={loading || selectedUsers.length < 2}
              >
                Create Group
              </Button>
            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    width: '100%',
  },
  imageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  groupImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  groupImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  cameraIconContainer: {
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
  input: {
    marginBottom: 5,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  memberCount: {
    fontSize: 14,
    color: '#888',
  },
  selectedUsersList: {
    paddingVertical: 10,
  },
  selectedUserChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  noSelectionText: {
    color: '#888',
    textAlign: 'center',
    paddingVertical: 10,
  },
  searchInput: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  userListContainer: {
    maxHeight: 300,
  },
  userList: {
    paddingBottom: 10,
  },
  userItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  userAvatar: {
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    color: '#777',
  },
  noUsersText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 20,
  },
  loader: {
    marginVertical: 20,
  },
  createButton: {
    marginTop: 20,
    backgroundColor: '#3f51b5',
  },
});

export default CreateGroupScreen; 