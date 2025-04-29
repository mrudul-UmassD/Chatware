const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');

// Optional modules with fallbacks
let colors;
try {
  colors = require('colors');
  colors.enable(); // Enable colors
} catch (err) {
  // Create a simple colors object if the module is not available
  colors = {
    bold: (text) => text,
    yellow: {
      bold: (text) => text
    },
    red: {
      bold: (text) => text
    },
    cyan: {
      underline: (text) => text
    }
  };
  console.log('Colors module not found. Running without colored output.');
}

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import socket handlers
let socketHandlers;
try {
  socketHandlers = require('./socketHandlers');
} catch (err) {
  console.error('Socket handlers module not found:', err.message);
  // Provide a simple fallback function
  socketHandlers = (io) => {
    console.log('Using default socket handlers');
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  };
}

// Import routes with error handling
const importRoute = (routePath) => {
  try {
    return require(routePath);
  } catch (err) {
    console.error(`Failed to load route: ${routePath}`, err.message);
    // Return a simple router as fallback
    const router = express.Router();
    router.get('/', (req, res) => {
      res.status(503).json({ error: `${routePath.split('/').pop()} routes unavailable` });
    });
    return router;
  }
};

const authRoutes = importRoute('./routes/auth');
const userRoutes = importRoute('./routes/users');
const chatRoutes = importRoute('./routes/chats');
const messageRoutes = importRoute('./routes/messages');

// Create Express app
const app = express();

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Server error',
    message: err.message
  });
};

// Connect to database
try {
  connectDB();
} catch (err) {
  console.error('Database connection error:', err.message);
  // Continue anyway to allow the API to partially work
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000'
}));

// Use Morgan for request logging in development mode
if (process.env.NODE_ENV === 'development') {
  try {
    app.use(morgan('dev'));
  } catch (err) {
    console.log('Morgan logger not available, continuing without request logging');
  }
}

// Static files for uploads
const uploadsDir = process.env.UPLOAD_PATH || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, uploadsDir)));

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync(uploadsDir)){
  console.log(`Creating uploads directory: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Add error handler
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize socket handlers
socketHandlers(io);

// Get port from environment variables
const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = { app, server }; 