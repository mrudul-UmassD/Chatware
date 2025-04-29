const { Message } = require('./models/Message');
const { Chat } = require('./models/Chat');
const { User } = require('./models/User');

/**
 * Socket.io event handlers
 */

const socketHandlers = (io) => {
  // Handle user connections
  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);
    
    // Setup user for socket communication
    socket.on('setup', (userData) => {
      // Create a room for the user using their ID
      socket.join(userData._id);
      console.log(`User joined their room: ${userData._id}`);
      socket.emit('connected');
    });

    // Join a chat room
    socket.on('join chat', (room) => {
      socket.join(room);
      console.log(`User joined room: ${room}`);
    });

    // Handle typing indicators
    socket.on('typing', (room) => {
      socket.to(room).emit('typing', room);
    });

    // Handle typing stopped
    socket.on('stop typing', (room) => {
      socket.to(room).emit('stop typing', room);
    });

    // Handle new messages
    socket.on('new message', (newMessage) => {
      const chat = newMessage.chat;
      
      if (!chat.users) {
        console.log('Chat users not defined');
        return;
      }
      
      // Send message to all users in the chat except the sender
      chat.users.forEach(user => {
        if (user._id !== newMessage.sender._id) {
          socket.to(user._id).emit('message received', newMessage);
        }
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = socketHandlers; 