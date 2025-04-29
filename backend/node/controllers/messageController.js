const { Message } = require('../models/Message');
const { Chat } = require('../models/Chat');
const { User } = require('../models/User');

/**
 * @desc    Send a new message
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const { content, chatId, messageType = 'text' } = req.body;
    
    // File details from multer middleware (if it's a file message)
    const file = req.file;
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required',
      });
    }
    
    // For text messages, content is required
    if (messageType === 'text' && !content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }
    
    // For file messages, file is required
    if (messageType !== 'text' && !file) {
      return res.status(400).json({
        success: false,
        message: 'File is required for non-text messages',
      });
    }
    
    // Create message data
    const messageData = {
      sender: req.user._id,
      content: content || '',
      chat: chatId,
      messageType,
    };
    
    // Add file details if it's a file message
    if (file) {
      messageData.fileUrl = `/uploads/${file.filename}`;
      messageData.fileName = file.originalname;
      messageData.fileSize = file.size;
    }
    
    // Create message
    let message = await Message.create(messageData);
    
    // Populate message with sender and chat details
    message = await Message.findById(message._id)
      .populate({
        path: 'sender',
        select: 'name profilePic email',
      })
      .populate({
        path: 'chat',
      });
    
    // Populate chat with users
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name email profilePic',
    });
    
    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
    });
    
    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all messages for a chat
 * @route   GET /api/messages/:chatId
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Find chat and verify user is a member
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }
    
    // Check if user is a member of the chat
    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat',
      });
    }
    
    // Get messages
    const messages = await Message.find({ chat: chatId, isDeleted: false })
      .populate('sender', 'name profilePic email')
      .populate('reactions.user', 'name profilePic')
      .sort({ createdAt: 1 });
    
    // Mark messages as read by current user
    await Message.updateMany(
      {
        chat: chatId,
        readBy: { $ne: req.user._id },
        sender: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      }
    );
    
    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a message
 * @route   DELETE /api/messages/:id
 * @access  Private (Message sender only)
 */
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }
    
    // Verify user is the message sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages',
      });
    }
    
    // Soft delete message
    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.fileUrl = null;
    message.fileName = null;
    message.fileSize = null;
    
    await message.save();
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a reaction to a message
 * @route   POST /api/messages/:id/reactions
 * @access  Private
 */
const addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    
    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required',
      });
    }
    
    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }
    
    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      reaction => 
        reaction.user.toString() === req.user._id.toString() && 
        reaction.emoji === emoji
    );
    
    if (existingReaction) {
      // Remove existing reaction (toggle)
      message.reactions = message.reactions.filter(
        reaction => 
          !(reaction.user.toString() === req.user._id.toString() && 
          reaction.emoji === emoji)
      );
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        emoji,
      });
    }
    
    await message.save();
    
    // Populate user details in reactions
    const updatedMessage = await Message.findById(id)
      .populate('sender', 'name profilePic email')
      .populate('reactions.user', 'name profilePic');
    
    res.status(200).json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get unread message count
 * @route   GET /api/messages/unread
 * @access  Private
 */
const getUnreadCount = async (req, res) => {
  try {
    // Find chats where user is a member
    const userChats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    });
    
    const chatIds = userChats.map(chat => chat._id);
    
    // Count unread messages in each chat
    const unreadCounts = await Promise.all(
      chatIds.map(async (chatId) => {
        const count = await Message.countDocuments({
          chat: chatId,
          readBy: { $ne: req.user._id },
          sender: { $ne: req.user._id },
          isDeleted: false,
        });
        
        return {
          chatId,
          count,
        };
      })
    );
    
    // Calculate total unread count
    const totalUnread = unreadCounts.reduce((acc, curr) => acc + curr.count, 0);
    
    res.status(200).json({
      success: true,
      totalUnread,
      unreadCounts,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  deleteMessage,
  addReaction,
  getUnreadCount,
}; 