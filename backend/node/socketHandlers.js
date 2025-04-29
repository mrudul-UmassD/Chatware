const { Message } = require('./models/Message');
const { Chat } = require('./models/Chat');
const { User } = require('./models/User');

/**
 * Setup socket handlers for real-time communication
 * @param {object} io - Socket.io instance
 */
const setupSocketHandlers = (io) => {
  // Map of online users (userId -> socketId)
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user connecting
    socket.on('setup', (userData) => {
      if (!userData || !userData._id) return;
      
      // Add user to online users
      onlineUsers.set(userData._id, socket.id);
      socket.join(userData._id);
      
      // Broadcast user's online status
      io.emit('user online', { userId: userData._id, online: true });
      
      // Send list of online users to the connected user
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit('online users', onlineUserIds);
      
      console.log(`User setup complete: ${userData._id}`);
    });

    // Handle joining a chat room
    socket.on('join chat', (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    // Handle typing indicator
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', chatId);
    });

    // Handle stop typing indicator
    socket.on('stop typing', (chatId) => {
      socket.to(chatId).emit('stop typing', chatId);
    });

    // Handle new message
    socket.on('new message', async (messageData) => {
      try {
        const { chat, sender } = messageData;
        
        if (!chat || !chat.users || !sender) {
          return console.error('Invalid message data');
        }

        // Emit the message to all users in the chat
        chat.users.forEach((user) => {
          if (user._id === sender._id) return;
          socket.to(user._id).emit('message received', messageData);
        });
        
        console.log(`New message sent in chat: ${chat._id}`);
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    });

    // Handle video/audio call requests
    socket.on('call user', ({ userToCall, signalData, from, callType }) => {
      const userSocketId = onlineUsers.get(userToCall);
      if (userSocketId) {
        io.to(userSocketId).emit('call incoming', {
          signal: signalData,
          from,
          callType
        });
      }
    });

    // Handle call acceptance
    socket.on('answer call', ({ to, signal }) => {
      const userSocketId = onlineUsers.get(to);
      if (userSocketId) {
        io.to(userSocketId).emit('call accepted', { signal });
      }
    });

    // Handle call rejection
    socket.on('reject call', ({ to }) => {
      const userSocketId = onlineUsers.get(to);
      if (userSocketId) {
        io.to(userSocketId).emit('call rejected');
      }
    });

    // Handle call end
    socket.on('end call', ({ to }) => {
      const userSocketId = onlineUsers.get(to);
      if (userSocketId) {
        io.to(userSocketId).emit('call ended');
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Find user by socket id and remove from online users
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }

      if (disconnectedUserId) {
        onlineUsers.delete(disconnectedUserId);
        // Broadcast user's offline status
        io.emit('user online', { userId: disconnectedUserId, online: false });
      }
    });
  });
};

module.exports = { setupSocketHandlers }; 