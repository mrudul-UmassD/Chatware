const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateProfilePic,
  deleteUser,
  searchUsers,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

// Set up multer storage for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile/');
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `user-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// File filter for profile pictures
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for all authenticated users
router.get('/search', searchUsers);
router.get('/:id', getUserById);

// Routes for admin or super admin
router.get('/', authorize('admin', 'super-admin'), getAllUsers);

// Routes that allow users to modify their own profile or admins to modify any
router.put('/:id', updateUser);
router.put(
  '/:id/profile-pic',
  upload.single('profilePic'),
  updateProfilePic
);

// Routes only for super admin
router.delete('/:id', authorize('super-admin'), deleteUser);

module.exports = router; 