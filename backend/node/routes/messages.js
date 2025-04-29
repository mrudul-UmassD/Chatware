const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  sendMessage,
  getMessages,
  deleteMessage,
  addReaction,
  getUnreadCount,
} = require('../controllers/messageController');
const { protect } = require('../middlewares/auth');

// Set up multer storage for message attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine subdirectory based on file type
    let uploadDir = 'uploads/files/';
    
    const mimeType = file.mimetype;
    if (mimeType.startsWith('image/')) {
      uploadDir = 'uploads/images/';
    } else if (mimeType.startsWith('video/')) {
      uploadDir = 'uploads/videos/';
    } else if (mimeType.startsWith('audio/')) {
      uploadDir = 'uploads/audios/';
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `msg-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
    );
  },
});

// File filter for message attachments
const fileFilter = (req, file, cb) => {
  // Allow images, videos, audio, and common document types
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|avi|mp3|wav|ogg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter,
});

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for all authenticated users
router.post('/', upload.single('file'), sendMessage);
router.get('/unread', getUnreadCount);
router.get('/:chatId', getMessages);
router.delete('/:id', deleteMessage);
router.post('/:id/reactions', addReaction);

module.exports = router; 