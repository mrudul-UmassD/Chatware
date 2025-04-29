const { Chat } = require('../models/Chat');
const { User } = require('../models/User');
const { Message } = require('../models/Message');

/**
 * @desc    Create or access a one-on-one chat
 * @route   POST /api/chats
 * @access  Private
 */
const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'UserId param not sent with request',
      });
    }

    // Check if chat exists between current user and specified user
    let chat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', '-password')
      .populate('latestMessage');

    // Populate sender in latestMessage if it exists
    chat = await User.populate(chat, {
      path: 'latestMessage.sender',
      select: 'name email profilePic',
    });

    if (chat.length > 0) {
      res.status(200).json({
        success: true,
        chat: chat[0],
      });
    } else {
      // Create a new chat if none exists
      const otherUser = await User.findById(userId);
      
      if (!otherUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      
      const chatData = {
        chatName: req.user.name + ', ' + otherUser.name,
        isGroupChat: false,
        users: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findById(createdChat._id).populate(
        'users',
        '-password'
      );

      res.status(201).json({
        success: true,
        chat: fullChat,
      });
    }
  } catch (error) {
    console.error('Access chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all chats for a user
 * @route   GET /api/chats
 * @access  Private
 */
const fetchChats = async (req, res) => {
  try {
    let chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
      isActive: true,
    })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'name email profilePic',
    });

    res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error('Fetch chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a group chat
 * @route   POST /api/chats/group
 * @access  Private
 */
const createGroupChat = async (req, res) => {
  try {
    const { name, users, description } = req.body;

    if (!name || !users) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Parse users string to array if needed
    let userArray = users;
    if (typeof users === 'string') {
      userArray = JSON.parse(users);
    }

    // Add current user to group
    userArray.push(req.user._id.toString());

    // Ensure we have at least 3 users for a group chat
    if (userArray.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'More than 2 users are required to create a group chat',
      });
    }

    // Create the group chat
    const groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,
      users: userArray,
      groupAdmin: req.user._id,
      description: description || '',
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(201).json({
      success: true,
      chat: fullGroupChat,
    });
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Rename a group chat
 * @route   PUT /api/chats/group/:id
 * @access  Private (Admin of the group)
 */
const renameGroupChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { chatName, description } = req.body;

    if (!chatName) {
      return res.status(400).json({
        success: false,
        message: 'Chat name is required',
      });
    }

    // Check if chat exists and user is admin
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: 'This is not a group chat',
      });
    }

    // Check if user is admin of the group
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update group details',
      });
    }

    // Update chat name and/or description
    chat.chatName = chatName;
    if (description) {
      chat.description = description;
    }
    
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json({
      success: true,
      chat: updatedChat,
    });
  } catch (error) {
    console.error('Rename group chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a user to a group
 * @route   PUT /api/chats/group/:id/add
 * @access  Private (Admin of the group)
 */
const addToGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Check if chat exists and user is admin
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: 'This is not a group chat',
      });
    }

    // Check if user is admin of the group
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can add users to the group',
      });
    }

    // Check if user is already in the group
    if (chat.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User already in the group',
      });
    }

    // Add user to the group
    chat.users.push(userId);
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json({
      success: true,
      chat: updatedChat,
    });
  } catch (error) {
    console.error('Add to group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Remove a user from a group
 * @route   PUT /api/chats/group/:id/remove
 * @access  Private (Admin of the group)
 */
const removeFromGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Check if chat exists and user is admin
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: 'This is not a group chat',
      });
    }

    // Check if user is admin of the group
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can remove users from the group',
      });
    }

    // Check if user is the admin - can't remove admin
    if (userId === chat.groupAdmin.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove admin from the group',
      });
    }

    // Check if user is in the group
    if (!chat.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User not in the group',
      });
    }

    // Remove user from the group
    chat.users = chat.users.filter(u => u.toString() !== userId);
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json({
      success: true,
      chat: updatedChat,
    });
  } catch (error) {
    console.error('Remove from group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Leave a group chat
 * @route   PUT /api/chats/group/:id/leave
 * @access  Private
 */
const leaveGroup = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Check if chat exists
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: 'This is not a group chat',
      });
    }

    // Check if user is in the group
    if (!chat.users.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not in this group',
      });
    }

    // If user is admin, assign a new admin or delete the group
    if (chat.groupAdmin.toString() === req.user._id.toString()) {
      if (chat.users.length > 1) {
        // Find another user to make admin
        const newAdminId = chat.users.find(
          u => u.toString() !== req.user._id.toString()
        );
        
        chat.groupAdmin = newAdminId;
        chat.users = chat.users.filter(u => u.toString() !== req.user._id.toString());
      } else {
        // If no users left, mark chat as inactive
        chat.isActive = false;
      }
    } else {
      // Regular user leaving the group
      chat.users = chat.users.filter(u => u.toString() !== req.user._id.toString());
    }

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'You have left the group',
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroupChat,
  addToGroup,
  removeFromGroup,
  leaveGroup,
}; 