const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroupChat,
  addToGroup,
  removeFromGroup,
  leaveGroup,
} = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');

// Set up multer storage for group profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/groups/');
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `group-${req.params.chatId}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// File filter for group pictures
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
router.post('/', accessChat);
router.get('/', fetchChats);
router.post('/group', createGroupChat);
router.put('/group/:chatId', renameGroupChat);
router.put('/group/:chatId/add', addToGroup);
router.put('/group/:chatId/remove', removeFromGroup);
router.put('/group/:chatId/leave', leaveGroup);

module.exports = router; 