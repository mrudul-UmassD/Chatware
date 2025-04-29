const { User } = require('../models/User');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin/Super Admin)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private (Admin/Super Admin/Self)
 */
const updateUser = async (req, res) => {
  try {
    // Check if user is updating own profile or is admin/super-admin
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    const isSelf = req.user._id.toString() === req.params.id;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
      });
    }
    
    const { name, email, bio, role } = req.body;
    
    // Only admin/super-admin can update role
    if (role && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update role',
      });
    }
    
    // Allow only super-admin to set super-admin role
    if (role === 'super-admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can assign super admin role',
      });
    }
    
    const userToUpdate = await User.findById(req.params.id);
    
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Update fields
    if (name) userToUpdate.name = name;
    if (email) userToUpdate.email = email;
    if (bio) userToUpdate.bio = bio;
    if (role && isAdmin) userToUpdate.role = role;
    
    const updatedUser = await userToUpdate.save();
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        profilePic: updatedUser.profilePic,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update user profile picture
 * @route   PUT /api/users/:id/profile-pic
 * @access  Private (Admin/Super Admin/Self)
 */
const updateProfilePic = async (req, res) => {
  try {
    // Check if user is updating own profile or is admin/super-admin
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    const isSelf = req.user._id.toString() === req.params.id;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
      });
    }
    
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Update profile picture
    user.profilePic = req.file.filename;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (Super Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    // Only super admin can delete users
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete users',
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete yourself',
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private
 */
const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};
    
    const users = await User.find({ ...keyword, _id: { $ne: req.user._id } }).select('-password');
    
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateProfilePic,
  deleteUser,
  searchUsers,
}; 