const express = require('express');
const {
  registerSuperAdmin,
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  changePassword,
  getUsersWithSensitiveInfo,
  updateUserLocation
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/register-super-admin', registerSuperAdmin);
router.post('/login', loginUser);

// Protected routes
router.use(protect);
router.get('/me', getUserProfile);
router.post('/logout', logoutUser);
router.post('/change-password', changePassword);
router.post('/update-location', updateUserLocation);

// Super admin only routes
router.post('/register', authorize('super-admin'), registerUser);
router.get('/users-with-sensitive-info', authorize('super-admin'), getUsersWithSensitiveInfo);

module.exports = router; 