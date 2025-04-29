const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

/**
 * @desc    Register a super admin (initial setup only)
 * @route   POST /api/auth/register-super-admin
 * @access  Public (only available when no super admin exists)
 */
const registerSuperAdmin = async (req, res) => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super-admin' });
    
    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Super admin already exists',
      });
    }

    const { name, email, password } = req.body;

    // Create super admin
    const user = await User.create({
      name,
      email,
      password,
      role: 'super-admin',
      passwordChangeRequired: false // Super admin doesn't need to change password on first login
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        passwordChangeRequired: user.passwordChangeRequired
      },
      token,
    });
  } catch (error) {
    console.error('Register super admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Register a new user (admin, user)
 * @route   POST /api/auth/register
 * @access  Private (super-admin only)
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // For newly created users, the default password is the same as the username/email
    const initialPassword = password || email;

    // Create user with password change required
    const user = await User.create({
      name,
      email,
      password: initialPassword,
      role: role || 'user',
      passwordChangeRequired: true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        passwordChangeRequired: user.passwordChangeRequired
      },
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update user status to online
    user.status = 'online';
    user.lastSeen = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        status: user.status,
        passwordChangeRequired: user.passwordChangeRequired
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password and mark as no longer requiring change
    user.password = newPassword;
    user.passwordChangeRequired = false;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      passwordChangeRequired: false
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        bio: user.bio,
        status: user.status,
        passwordChangeRequired: user.passwordChangeRequired,
        location: user.location
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
  try {
    // Update user status to offline
    await User.findByIdAndUpdate(req.user._id, {
      status: 'offline',
      lastSeen: Date.now(),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all users with password info (for superadmin only)
 * @route   GET /api/auth/users-with-sensitive-info
 * @access  Private (super-admin only)
 */
const getUsersWithSensitiveInfo = async (req, res) => {
  try {
    // Only super-admin can access this endpoint
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    // Get all users including passwords (for super-admin view only)
    const users = await User.find().select('+password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users with sensitive info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update user location
 * @route   POST /api/auth/update-location
 * @access  Private
 */
const updateUserLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    const locationData = {
      latitude,
      longitude,
      address: address || '',
      lastUpdated: new Date()
    };
    
    // Update user location
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        location: locationData,
        $push: { 
          locationHistory: {
            ...locationData,
            timestamp: new Date()
          } 
        }
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: user.location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  registerSuperAdmin,
  registerUser,
  loginUser,
  changePassword,
  getUserProfile,
  logoutUser,
  getUsersWithSensitiveInfo,
  updateUserLocation
}; 